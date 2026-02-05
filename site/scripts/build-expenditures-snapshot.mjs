import fs from "fs";
import path from "path";

const root = path.resolve("/workspaces/truth-dashboard/site");
const rawDir = path.join(root, "src/data/raw");
const outputPath = path.join(
  root,
  "src/data/snapshots/expenditures.snapshot.json",
);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }
    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") {
        i += 1;
      }
      row.push(cell);
      cell = "";
      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      continue;
    }
    cell += ch;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    if (row.some((value) => value.trim() !== "")) {
      rows.push(row);
    }
  }

  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((values) => {
    const out = {};
    headers.forEach((header, idx) => {
      out[header] = (values[idx] ?? "").trim();
    });
    return out;
  });
}

function normalizeKey(value) {
  return value.toLowerCase().trim().replace(/\s+/g, "_");
}

function getField(row, aliases) {
  const normalized = new Map();
  Object.keys(row).forEach((key) => normalized.set(normalizeKey(key), row[key]));
  for (const alias of aliases) {
    const value = normalized.get(normalizeKey(alias));
    if (typeof value !== "undefined") {
      return value;
    }
  }
  return undefined;
}

function toDateOnly(value) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function toNumber(value) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function sumNullable(values) {
  const present = values.filter((value) => value !== null);
  if (!present.length) return null;
  return present.reduce((acc, current) => acc + current, 0);
}

function clampNumber(value) {
  if (value === null) return null;
  return Number(value.toFixed(6));
}

const balancesCsv = fs.readFileSync(
  path.join(rawDir, "cp_history_weekly_clean.csv"),
  "utf8",
);
const totalsCsv = fs.readFileSync(
  path.join(rawDir, "spend_weekly_totals.csv"),
  "utf8",
);
const mappingCsv = fs.readFileSync(
  path.join(rawDir, "spend_mapping.csv"),
  "utf8",
);

const balanceRows = parseCsv(balancesCsv);
const totalRows = parseCsv(totalsCsv);
const mappingRows = parseCsv(mappingCsv);

const balancesWeekly = balanceRows
  .map((row) => ({
    t: toDateOnly(getField(row, ["date_utc", "date", "week"])) ?? "",
    lunc: toNumber(getField(row, ["lunc", "uluna"])),
    ustc: toNumber(getField(row, ["ustc", "uusd"])),
  }))
  .filter((row) => row.t !== "")
  .sort((a, b) => a.t.localeCompare(b.t));

if (balancesWeekly.length === 0) {
  throw new Error("No rows found in cp_history_weekly_clean.csv");
}

const balancesByDate = new Map();
balancesWeekly.forEach((row) => balancesByDate.set(row.t, row));

const groups = new Map();
const ensureGroup = (markerTime, dropTime) => {
  const current = groups.get(markerTime);
  if (current) {
    if (!current.dropTime && dropTime) {
      current.dropTime = dropTime;
    }
    return current;
  }
  const created = {
    markerTime,
    dropTime,
    combinedImpactPct: null,
    lowConfidence: false,
    proposals: [],
  };
  groups.set(markerTime, created);
  return created;
};

totalRows.forEach((row) => {
  const markerTime = toDateOnly(getField(row, ["marker_time", "markerTime"]));
  if (!markerTime) return;
  const dropTime = toDateOnly(getField(row, ["drop_time", "dropTime"]));
  const denomRaw = (getField(row, ["denom", "currency"]) ?? "").toUpperCase();
  const denom = denomRaw === "USTC" ? "USTC" : denomRaw === "LUNC" ? "LUNC" : "";
  if (!denom) return;

  const amount = toNumber(getField(row, ["total_amount", "amount"])) ?? 0;
  const explicitPreBalance = toNumber(getField(row, ["pre_balance", "preBalance"]));
  const preBalanceFromSeries =
    denom === "LUNC"
      ? balancesByDate.get(markerTime)?.lunc ?? null
      : balancesByDate.get(markerTime)?.ustc ?? null;
  const preBalance = explicitPreBalance ?? preBalanceFromSeries;
  const postBalance =
    dropTime === null
      ? null
      : denom === "LUNC"
        ? balancesByDate.get(dropTime)?.lunc ?? null
        : balancesByDate.get(dropTime)?.ustc ?? null;
  const observedDelta =
    preBalance !== null && postBalance !== null ? postBalance - preBalance : null;
  const impactPctRaw = toNumber(getField(row, ["impact_pct", "impactPct"]));
  const impactPct =
    impactPctRaw ??
    (preBalance && preBalance !== 0 ? (amount / preBalance) * 100 : null);

  const group = ensureGroup(markerTime, dropTime);
  const outflow = {
    amount,
    preBalance,
    impactPct: clampNumber(impactPct),
    observedDelta: clampNumber(observedDelta),
  };
  if (denom === "LUNC") {
    group.lunc = outflow;
  } else {
    group.ustc = outflow;
  }
});

mappingRows.forEach((row) => {
  const markerTime = toDateOnly(getField(row, ["marker_time", "markerTime"]));
  if (!markerTime) return;
  const dropTime = toDateOnly(getField(row, ["drop_time", "dropTime"]));
  const spendTime = toDateOnly(getField(row, ["spend_time", "spendTime"]));
  const denomRaw = (getField(row, ["denom", "currency"]) ?? "").toUpperCase();
  const denom = denomRaw === "USTC" ? "USTC" : denomRaw === "LUNC" ? "LUNC" : "";
  if (!denom) return;

  const lowConfidenceValue =
    (getField(row, ["low_confidence", "lowConfidence", "low_conf"]) ?? "").toLowerCase();
  const lowConfidence =
    lowConfidenceValue === "1" ||
    lowConfidenceValue === "true" ||
    lowConfidenceValue === "yes";

  const amount = toNumber(getField(row, ["amount", "total_amount"])) ?? 0;
  const preBalance = toNumber(getField(row, ["pre_balance", "preBalance"]));
  const postBalance = toNumber(getField(row, ["post_balance", "postBalance"]));
  const observedWeeklyDelta = toNumber(
    getField(row, ["observed_weekly_delta", "observedDelta"]),
  );
  const residualVsExpected = toNumber(
    getField(row, ["residual_vs_expected", "residual"]),
  );

  const group = ensureGroup(markerTime, dropTime);
  group.lowConfidence = group.lowConfidence || lowConfidence;
  group.proposals.push({
    title: getField(row, ["title"]) ?? "Untitled",
    recipient: getField(row, ["recipient"]) ?? "—",
    denom,
    amount,
    spendTime,
    observedWeeklyDelta: clampNumber(observedWeeklyDelta),
    residualVsExpected: clampNumber(residualVsExpected),
    preBalance: clampNumber(preBalance),
    postBalance: clampNumber(postBalance),
    lowConfidence,
  });

  if (denom === "LUNC" && !group.lunc) {
    const impliedImpact =
      preBalance && preBalance !== 0 ? (amount / preBalance) * 100 : null;
    group.lunc = {
      amount,
      preBalance: clampNumber(preBalance),
      impactPct: clampNumber(impliedImpact),
      observedDelta: clampNumber(observedWeeklyDelta),
    };
  }
  if (denom === "USTC" && !group.ustc) {
    const impliedImpact =
      preBalance && preBalance !== 0 ? (amount / preBalance) * 100 : null;
    group.ustc = {
      amount,
      preBalance: clampNumber(preBalance),
      impactPct: clampNumber(impliedImpact),
      observedDelta: clampNumber(observedWeeklyDelta),
    };
  }
});

const outflowsWeekly = Array.from(groups.values())
  .sort((a, b) => a.markerTime.localeCompare(b.markerTime))
  .map((group) => {
    group.proposals.sort((a, b) => {
      const at = a.spendTime ?? "";
      const bt = b.spendTime ?? "";
      return at.localeCompare(bt);
    });
    const luncImpact = group.lunc?.impactPct ?? null;
    const ustcImpact = group.ustc?.impactPct ?? null;
    const combinedImpactPct = clampNumber(sumNullable([luncImpact, ustcImpact]));
    return {
      ...group,
      combinedImpactPct,
      lunc: group.lunc
        ? {
            ...group.lunc,
            amount: clampNumber(group.lunc.amount) ?? 0,
          }
        : undefined,
      ustc: group.ustc
        ? {
            ...group.ustc,
            amount: clampNumber(group.ustc.amount) ?? 0,
          }
        : undefined,
    };
  });

const snapshot = {
  schemaVersion: "1.0.0",
  dashboardId: "community-pool",
  title: "Expenditures and investments",
  subtitle: "Weekly community pool balances with spend intervals anchored at pre-drop marker weeks.",
  generatedAt: new Date().toISOString().slice(0, 10),
  coverage: {
    start: balancesWeekly[0].t,
    end: balancesWeekly[balancesWeekly.length - 1].t,
    cadence: "weekly",
  },
  sources: [
    {
      id: "cp_history_weekly_clean",
      label: "Canonical weekly community pool balances",
      type: "csv",
    },
    {
      id: "spend_weekly_totals",
      label: "Canonical weekly spend buckets (marker anchored)",
      type: "csv",
    },
    {
      id: "spend_mapping",
      label: "Spend mapping enrichment for proposal-level tooltip details",
      type: "csv",
    },
  ],
  notes: [],
  timeWindows: [
    { id: "1Y", label: "1Y", weeks: 53 },
    { id: "2Y", label: "2Y", weeks: 105 },
    { id: "3Y", label: "3Y", weeks: 157 },
    { id: "ALL", label: "ALL", weeks: null },
  ],
  data: {
    series: {
      balancesWeekly,
      outflowsWeekly,
    },
    method: {
      markerRule: "Spend markers are anchored at marker_time and represent marker_time -> drop_time intervals.",
      filterRule: "Analysis window filters outflows strictly by marker_time (inclusive bounds).",
      notes: [
        "Multiple proposals in the same marker week are aggregated into a single marker object.",
        "Combined impact is computed as the sum of available denom impacts.",
      ],
    },
  },
};

fs.writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Updated snapshot: ${outputPath}`);
