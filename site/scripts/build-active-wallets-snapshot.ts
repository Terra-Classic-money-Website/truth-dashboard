import fs from "fs";
import path from "path";

const root = path.resolve("/workspaces/truth-dashboard/site");
const rawPath = path.join(root, "src/data/raw/active-wallets.monthly.json");
const snapshotPath = path.join(
  root,
  "src/data/snapshots/active-wallets.snapshot.json",
);

type RawRow = {
  month: string;
  activeWallets: number | null;
  note?: string;
};

type Point = { periodEnd: string; v: number };

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function formatMonthLabel(date: Date, withYear = true) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: withYear ? "2-digit" : undefined,
  });
  return formatter.format(date);
}

function monthEnd(month: string) {
  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0));
  return lastDay;
}

function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function stdDev(values: number[]) {
  if (!values.length) return 0;
  const avg = mean(values);
  const variance =
    values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function linearRegressionSlope(values: number[]) {
  if (values.length < 2) return 0;
  const n = values.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  for (let i = 0; i < n; i += 1) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }
  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return 0;
  return (n * sumXY - sumX * sumY) / denominator;
}

const raw = JSON.parse(fs.readFileSync(rawPath, "utf8")) as RawRow[];
const filtered = raw.filter((row) => typeof row.activeWallets === "number");
if (!filtered.length) {
  throw new Error("Active wallets dataset has no numeric values.");
}

const points: Point[] = filtered.map((row) => ({
  periodEnd: monthEnd(row.month).toISOString().slice(0, 10),
  v: row.activeWallets as number,
}));

points.sort((a, b) => a.periodEnd.localeCompare(b.periodEnd));

const coverageStart = points[0].periodEnd;
const coverageEnd = points[points.length - 1].periodEnd;
const latestPoint = points[points.length - 1];
const prevPoint = points[points.length - 2] ?? null;
const latestDate = new Date(`${latestPoint.periodEnd}T00:00:00Z`);
const latestLabel = formatMonthLabel(latestDate);
const firstDate = new Date(`${coverageStart}T00:00:00Z`);
const endDate = new Date(`${coverageEnd}T00:00:00Z`);

const latestDelta =
  prevPoint && prevPoint.v !== 0
    ? {
        value: (latestPoint.v - prevPoint.v) / prevPoint.v,
        unit: "percent",
        vs: "prev_period",
      }
    : null;

const maxPoint = points.reduce((acc, point) =>
  point.v > acc.v ? point : acc,
);

const last12 = points.slice(-12);
const last12Values = last12.map((point) => point.v);
const roll12Avg = mean(last12Values);
const trendSlope = linearRegressionSlope(last12Values);
const stability = roll12Avg !== 0 ? stdDev(last12Values) / roll12Avg : 0;

const drawdownPct = maxPoint.v
  ? (latestPoint.v - maxPoint.v) / maxPoint.v
  : 0;

const getMonthLabel = (periodEnd: string) =>
  formatMonthLabel(new Date(`${periodEnd}T00:00:00Z`));

const insightsHighlights = (() => {
  const highlights: string[] = [];
  const peakLabel = getMonthLabel(maxPoint.periodEnd);
  const drawdown = `${(drawdownPct * 100).toFixed(1)}%`;
  highlights.push(
    `Activity is down ${drawdown} from the peak (peak: ${peakLabel}, ${numberFormatter.format(maxPoint.v)}).`,
  );
  highlights.push(
    `Over the last 12 months, the trend slope is ${numberFormatter.format(Math.round(trendSlope))} wallets/month (smoothed).`,
  );
  if (latestDelta) {
    const direction = latestDelta.value >= 0 ? "increase" : "decline";
    highlights.push(
      `The last month shows ${direction} with MoM change of ${(latestDelta.value * 100).toFixed(1)}%.`,
    );
  }
  const yearBack = points[points.length - 13];
  if (yearBack && yearBack.v !== 0) {
    const yoy = (latestPoint.v - yearBack.v) / yearBack.v;
    highlights.push(
      `Year-over-year change is ${(yoy * 100).toFixed(1)}% (vs ${getMonthLabel(yearBack.periodEnd)}).`,
    );
  }
  const monthsBelow25k = points.filter((point) => point.v < 25000).length;
  highlights.push(
    `The network spent ${monthsBelow25k} months below 25,000 active wallets.`,
  );
  return highlights;
})();

const yearGroups = new Map<string, Point[]>();
for (const point of points) {
  const year = point.periodEnd.slice(0, 4);
  const group = yearGroups.get(year) ?? [];
  group.push(point);
  yearGroups.set(year, group);
}

const yearRows = Array.from(yearGroups.entries())
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([year, group], index, array) => {
    const values = group.map((point) => point.v);
    const avgMonthly = mean(values);
    const med = median(values);
    const volatility = stdDev(values);
    const cv = avgMonthly !== 0 ? volatility / avgMonthly : 0;
    const prev = array[index - 1];
    const prevAvg = prev ? mean(prev[1].map((point) => point.v)) : 0;
    const yoy = prevAvg !== 0 ? (avgMonthly - prevAvg) / prevAvg : 0;
    return {
      year,
      avgMonthly,
      median: med,
      yoy,
      volatility,
      cv,
    };
  });

const quarterGroups = new Map<string, Point[]>();
for (const point of points) {
  const date = new Date(`${point.periodEnd}T00:00:00Z`);
  const year = date.getUTCFullYear();
  const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
  const key = `${year} Q${quarter}`;
  const group = quarterGroups.get(key) ?? [];
  group.push(point);
  quarterGroups.set(key, group);
}

const quarterRows = Array.from(quarterGroups.entries())
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([quarter, group], index, array) => {
    const values = group.map((point) => point.v);
    const avg = mean(values);
    const best = group.reduce((acc, point) => (point.v > acc.v ? point : acc));
    const worst = group.reduce((acc, point) => (point.v < acc.v ? point : acc));
    const prev = array[index - 1];
    const prevAvg = prev ? mean(prev[1].map((point) => point.v)) : 0;
    const qoq = prevAvg !== 0 ? (avg - prevAvg) / prevAvg : 0;
    return {
      quarter,
      avg,
      qoq,
      bestMonth: `${getMonthLabel(best.periodEnd)} (${numberFormatter.format(best.v)})`,
      worstMonth: `${getMonthLabel(worst.periodEnd)} (${numberFormatter.format(worst.v)})`,
    };
  });

const sortedByValue = [...points].sort((a, b) => b.v - a.v);
const topMonths = sortedByValue.slice(0, 5).map((point) => ({
  label: getMonthLabel(point.periodEnd),
  value: point.v,
}));
const bottomMonths = [...points]
  .sort((a, b) => a.v - b.v)
  .slice(0, 5)
  .map((point) => ({
    label: getMonthLabel(point.periodEnd),
    value: point.v,
  }));

let maxIncrease = { label: getMonthLabel(points[1]?.periodEnd ?? coverageEnd), abs: 0, pct: 0 };
let maxDecrease = { label: getMonthLabel(points[1]?.periodEnd ?? coverageEnd), abs: 0, pct: 0 };
for (let i = 1; i < points.length; i += 1) {
  const prev = points[i - 1];
  const curr = points[i];
  const delta = curr.v - prev.v;
  const pct = prev.v !== 0 ? delta / prev.v : 0;
  if (delta > maxIncrease.abs) {
    maxIncrease = { label: getMonthLabel(curr.periodEnd), abs: delta, pct };
  }
  if (delta < maxDecrease.abs) {
    maxDecrease = { label: getMonthLabel(curr.periodEnd), abs: delta, pct };
  }
}

let peakVal = points[0].v;
let peakDate = points[0].periodEnd;
let maxDrawdown = 0;
let drawdownFrom = peakDate;
let drawdownTo = peakDate;
let drawdownPeakVal = peakVal;
for (const point of points) {
  if (point.v > peakVal) {
    peakVal = point.v;
    peakDate = point.periodEnd;
  }
  const drawdown = peakVal !== 0 ? point.v / peakVal - 1 : 0;
  if (drawdown < maxDrawdown) {
    maxDrawdown = drawdown;
    drawdownFrom = peakDate;
    drawdownTo = point.periodEnd;
    drawdownPeakVal = peakVal;
  }
}
const recovered = points.some(
  (point) =>
    point.periodEnd > drawdownTo && point.v >= drawdownPeakVal,
);

const thresholds = [50000, 25000, 15000];
const milestoneThresholds = thresholds
  .map((threshold) => {
    const below = points.filter((point) => point.v < threshold);
    if (!below.length) return null;
    return {
      threshold,
      firstReached: below[0].periodEnd,
      lastSeen: below[below.length - 1].periodEnd,
    };
  })
  .filter(Boolean) as { threshold: number; firstReached: string; lastSeen: string }[];

const snapshot = {
  schemaVersion: "1.0.0",
  dashboardId: "active-wallets",
  title: "Monthly Active Wallets",
  subtitle: "Static dataset bundled with the site. No runtime fetching.",
  generatedAt: new Date().toISOString().slice(0, 10),
  coverage: {
    start: coverageStart,
    end: coverageEnd,
    cadence: "monthly",
  },
  sources: [
    {
      id: "active-wallets-monthly",
      label: "Active wallets monthly dataset (offline)",
      type: "dataset",
      notes: "Bundled snapshot dataset. Null months removed.",
    },
  ],
  notes: [],
  timeWindows: [
    { id: "2y", label: "2 Years", months: 24 },
    { id: "3y", label: "3 Years", months: 36 },
    { id: "all", label: "All", months: null },
  ],
  data: {
    series: {
      mawTotal: {
        id: "maw.total",
        label: "Active wallets",
        cadence: "monthly",
        unit: "count",
        scale: 1,
        points,
      },
      mawSenders: {
        id: "maw.senders",
        label: "Senders",
        cadence: "monthly",
        unit: "count",
        scale: 1,
        points: [],
      },
      mawRecipients: {
        id: "maw.recipients",
        label: "Recipients",
        cadence: "monthly",
        unit: "count",
        scale: 1,
        points: [],
      },
    },
    kpiTiles: [
      {
        id: "kpi.mawTotal",
        label: "Monthly active wallets",
        value: latestPoint.v,
        unit: "count",
        scale: 1,
        asOf: coverageEnd,
        delta: latestDelta,
        note: "Senders + recipients",
      },
      {
        id: "kpi.senders",
        label: "Monthly senders",
        value: null,
        unit: "count",
        scale: 1,
        asOf: coverageEnd,
        delta: null,
        note: "Not available in dataset",
      },
      {
        id: "kpi.recipients",
        label: "Monthly recipients",
        value: null,
        unit: "count",
        scale: 1,
        asOf: coverageEnd,
        delta: null,
        note: "Not available in dataset",
      },
      {
        id: "kpi.retention",
        label: "Retention",
        value: null,
        unit: "percent",
        scale: 1,
        asOf: coverageEnd,
        delta: null,
        note: "Not available in dataset",
      },
    ],
    insights: {
      highlights: insightsHighlights,
      kpiSnapshot: [
        {
          id: "kpi.currentMonth",
          label: "Current month",
          value: latestPoint.v,
          unit: "count",
          asOf: coverageEnd,
          note: latestLabel,
        },
        {
          id: "kpi.allTimePeak",
          label: "All-time peak",
          value: maxPoint.v,
          unit: "count",
          asOf: maxPoint.periodEnd,
          note: getMonthLabel(maxPoint.periodEnd),
        },
        {
          id: "kpi.drawdown",
          label: "Drawdown from peak",
          value: drawdownPct,
          unit: "percent",
          asOf: coverageEnd,
          note: "Current vs peak",
        },
        {
          id: "kpi.roll12Avg",
          label: "12M rolling average",
          value: roll12Avg,
          unit: "count",
          asOf: coverageEnd,
          note: "Last 12 months",
        },
        {
          id: "kpi.trendSlope",
          label: "12M trend slope",
          value: trendSlope,
          unit: "count",
          asOf: coverageEnd,
          note: "wallets / month",
        },
        {
          id: "kpi.stability",
          label: "12M stability",
          value: stability,
          unit: "percent",
          asOf: coverageEnd,
          note: "stdev / mean",
        },
      ],
    },
    tables: {
      yearSummary: {
        id: "tbl.yearSummary",
        title: "Year Summary",
        columns: [
          { key: "year", label: "Year", type: "text" },
          { key: "avgMonthly", label: "Avg monthly wallets", type: "number", unit: "count" },
          { key: "median", label: "Median", type: "number", unit: "count" },
          { key: "yoy", label: "YoY change", type: "number", unit: "percent" },
          { key: "volatility", label: "Volatility", type: "number", unit: "count" },
          { key: "cv", label: "Coeff. of variation", type: "number", unit: "percent" },
        ],
        rows: yearRows,
      },
      quarterlySummary: {
        id: "tbl.quarterlySummary",
        title: "Quarterly Summary",
        columns: [
          { key: "quarter", label: "Quarter", type: "text" },
          { key: "avg", label: "Avg wallets", type: "number", unit: "count" },
          { key: "qoq", label: "QoQ change", type: "number", unit: "percent" },
          { key: "bestMonth", label: "Best month", type: "text" },
          { key: "worstMonth", label: "Worst month", type: "text" },
        ],
        rows: quarterRows,
      },
    },
    extremes: {
      topMonths,
      bottomMonths,
      largestMoMIncrease: maxIncrease,
      largestMoMDecrease: maxDecrease,
      drawdownRecovery: {
        drawdownPct: maxDrawdown,
        from: drawdownFrom,
        to: drawdownTo,
        recovered,
      },
    },
    milestones: {
      thresholds: milestoneThresholds,
    },
    method: {
      source: "terra-classic-fcd.publicnode.com",
      metricDefinition:
        "Monthly Active Wallets = unique addresses observed participating in on-chain transactions in that month.",
      dataWindow: `${formatMonthLabel(firstDate)} \u2192 ${formatMonthLabel(endDate)}`,
      notes: [
        "Snapshot compiled from bundled monthly dataset.",
        "Null months were excluded from the series.",
      ],
    },
  },
};

fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2) + "\n");
console.log(`Updated snapshot: ${snapshotPath}`);
