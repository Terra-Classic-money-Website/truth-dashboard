import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const snapshotPath = path.join(
  siteRoot,
  "src/data/snapshots/active-wallets.snapshot.json",
);

const importedPoints = [
  { periodEnd: "2026-04-30", v: 22_997 },
  { periodEnd: "2026-05-31", v: 29_341 },
  { periodEnd: "2026-06-30", v: 22_142 },
  { periodEnd: "2026-07-31", v: 25_893 },
  { periodEnd: "2026-08-31", v: 21_143 },
];

const generatedAt = "2026-08-28";
const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});
const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function standardDeviation(values) {
  const mean = average(values);
  return Math.sqrt(
    average(values.map((value) => (value - mean) ** 2)),
  );
}

function percentChange(current, previous) {
  return previous === 0 ? 0 : current / previous - 1;
}

function trendSlope(values) {
  const xMean = (values.length - 1) / 2;
  const yMean = average(values);
  const numerator = values.reduce(
    (sum, value, index) => sum + (index - xMean) * (value - yMean),
    0,
  );
  const denominator = values.reduce(
    (sum, _value, index) => sum + (index - xMean) ** 2,
    0,
  );
  return denominator === 0 ? 0 : numerator / denominator;
}

function formatMonth(periodEnd) {
  return monthFormatter.format(new Date(`${periodEnd}T00:00:00Z`));
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function expectedNextMonth(periodEnd) {
  const date = new Date(`${periodEnd}T00:00:00Z`);
  const nextMonth = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 2, 0),
  );
  return nextMonth.toISOString().slice(0, 10);
}

function assertContinuous(points) {
  for (let index = 1; index < points.length; index += 1) {
    const expected = expectedNextMonth(points[index - 1].periodEnd);
    if (points[index].periodEnd !== expected) {
      throw new Error(
        `Monthly series is not continuous: expected ${expected}, found ${points[index].periodEnd}.`,
      );
    }
  }
}

function groupBy(points, keyForPoint) {
  const groups = new Map();
  for (const point of points) {
    const key = keyForPoint(point);
    const values = groups.get(key) ?? [];
    values.push(point);
    groups.set(key, values);
  }
  return groups;
}

function buildYearRows(points) {
  const years = groupBy(points, (point) => point.periodEnd.slice(0, 4));
  let previousAverage = null;
  return [...years.entries()].map(([year, yearPoints]) => {
    const values = yearPoints.map((point) => point.v);
    const yearAverage = average(values);
    const volatility = standardDeviation(values);
    const row = {
      year,
      avgMonthly: yearAverage,
      median: median(values),
      yoy:
        previousAverage === null ? 0 : percentChange(yearAverage, previousAverage),
      volatility,
      cv: volatility / yearAverage,
    };
    previousAverage = yearAverage;
    return row;
  });
}

function buildQuarterRows(points) {
  const quarters = groupBy(points, (point) => {
    const month = Number(point.periodEnd.slice(5, 7));
    return `${point.periodEnd.slice(0, 4)} Q${Math.ceil(month / 3)}`;
  });
  let previousAverage = null;
  return [...quarters.entries()].map(([quarter, quarterPoints]) => {
    const quarterAverage = average(quarterPoints.map((point) => point.v));
    const bestMonth = quarterPoints.reduce((best, point) =>
      point.v > best.v ? point : best,
    );
    const worstMonth = quarterPoints.reduce((worst, point) =>
      point.v < worst.v ? point : worst,
    );
    const row = {
      quarter,
      avg: quarterAverage,
      qoq:
        previousAverage === null
          ? 0
          : percentChange(quarterAverage, previousAverage),
      bestMonth: `${formatMonth(bestMonth.periodEnd)} (${integerFormatter.format(bestMonth.v)})`,
      worstMonth: `${formatMonth(worstMonth.periodEnd)} (${integerFormatter.format(worstMonth.v)})`,
    };
    previousAverage = quarterAverage;
    return row;
  });
}

function buildExtremes(points) {
  const topMonths = [...points]
    .sort((a, b) => b.v - a.v)
    .slice(0, 5)
    .map((point) => ({ label: formatMonth(point.periodEnd), value: point.v }));
  const bottomMonths = [...points]
    .sort((a, b) => a.v - b.v)
    .slice(0, 5)
    .map((point) => ({ label: formatMonth(point.periodEnd), value: point.v }));
  const changes = points.slice(1).map((point, index) => {
    const previous = points[index];
    return {
      label: formatMonth(point.periodEnd),
      abs: point.v - previous.v,
      pct: percentChange(point.v, previous.v),
    };
  });
  const peak = points.reduce((highest, point) =>
    point.v > highest.v ? point : highest,
  );
  const latest = points.at(-1);

  return {
    topMonths,
    bottomMonths,
    largestMoMIncrease: changes.reduce((largest, change) =>
      change.abs > largest.abs ? change : largest,
    ),
    largestMoMDecrease: changes.reduce((largest, change) =>
      change.abs < largest.abs ? change : largest,
    ),
    drawdownRecovery: {
      drawdownPct: percentChange(latest.v, peak.v),
      from: peak.periodEnd,
      to: latest.periodEnd,
      recovered: latest.v >= peak.v,
    },
  };
}

function buildMilestones(points) {
  return {
    thresholds: [50_000, 25_000].map((threshold) => {
      const below = points.filter((point) => point.v < threshold);
      if (!below.length) {
        throw new Error(`No observations found below ${threshold}.`);
      }
      return {
        threshold,
        firstReached: below[0].periodEnd,
        lastSeen: below.at(-1).periodEnd,
      };
    }),
  };
}

function main() {
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
  if (snapshot.dashboardId !== "active-wallets") {
    throw new Error(`Unexpected dashboardId in ${snapshotPath}.`);
  }

  const pointsByMonth = new Map(
    snapshot.data.series.mawTotal.points.map((point) => [point.periodEnd, point]),
  );
  for (const point of importedPoints) {
    pointsByMonth.set(point.periodEnd, point);
  }
  const points = [...pointsByMonth.values()].sort((a, b) =>
    a.periodEnd.localeCompare(b.periodEnd),
  );
  assertContinuous(points);

  const latest = points.at(-1);
  const previous = points.at(-2);
  const peak = points.reduce((highest, point) =>
    point.v > highest.v ? point : highest,
  );
  const last12 = points.slice(-12).map((point) => point.v);
  const roll12Average = average(last12);
  const slope = trendSlope(last12);
  const stability = standardDeviation(last12) / roll12Average;
  const priorYearPoint = points.find(
    (point) => point.periodEnd === `${Number(latest.periodEnd.slice(0, 4)) - 1}${latest.periodEnd.slice(4)}`,
  );
  if (!priorYearPoint) {
    throw new Error(`Missing prior-year comparison for ${latest.periodEnd}.`);
  }
  const latestMoM = percentChange(latest.v, previous.v);
  const latestYoY = percentChange(latest.v, priorYearPoint.v);
  const drawdown = percentChange(latest.v, peak.v);
  const below25kMonths = points.filter((point) => point.v < 25_000).length;

  snapshot.generatedAt = generatedAt;
  snapshot.coverage.end = latest.periodEnd;
  snapshot.sources = [
    {
      id: "active-wallets-monthly",
      label: "Validated monthly active wallets dataset",
      type: "dataset",
      notes: "Bundled monthly snapshot built from validated FCD and archival RPC scan results.",
    },
  ];
  snapshot.data.series.mawTotal.points = points;

  snapshot.data.kpiTiles = snapshot.data.kpiTiles.map((tile) => {
    if (tile.id === "kpi.mawTotal") {
      return {
        ...tile,
        value: latest.v,
        asOf: latest.periodEnd,
        delta: { value: latestMoM, unit: "percent", vs: "prev_period" },
      };
    }
    return { ...tile, asOf: latest.periodEnd };
  });

  snapshot.data.insights = {
    highlights: [
      `Activity is down ${formatPercent(drawdown)} from the peak (peak: ${formatMonth(peak.periodEnd)}, ${integerFormatter.format(peak.v)}).`,
      `Over the last 12 months, the trend slope is ${integerFormatter.format(Math.round(slope))} wallets/month (smoothed).`,
      `The latest month shows ${latestMoM >= 0 ? "growth" : "decline"} with MoM change of ${formatPercent(latestMoM)}.`,
      `Year-over-year change is ${formatPercent(latestYoY)} (vs ${formatMonth(priorYearPoint.periodEnd)}).`,
      `The network spent ${below25kMonths} months below 25,000 active wallets.`,
    ],
    kpiSnapshot: [
      {
        id: "kpi.currentMonth",
        label: "Current month",
        value: latest.v,
        unit: "count",
        asOf: latest.periodEnd,
        note: formatMonth(latest.periodEnd),
      },
      {
        id: "kpi.allTimePeak",
        label: "All-time peak",
        value: peak.v,
        unit: "count",
        asOf: peak.periodEnd,
        note: formatMonth(peak.periodEnd),
      },
      {
        id: "kpi.drawdown",
        label: "Drawdown from peak",
        value: drawdown,
        unit: "percent",
        asOf: latest.periodEnd,
        note: "Current vs peak",
      },
      {
        id: "kpi.roll12Avg",
        label: "12M rolling average",
        value: roll12Average,
        unit: "count",
        asOf: latest.periodEnd,
        note: "Last 12 months",
      },
      {
        id: "kpi.trendSlope",
        label: "12M trend slope",
        value: slope,
        unit: "count",
        asOf: latest.periodEnd,
        note: "wallets / month",
      },
      {
        id: "kpi.stability",
        label: "12M stability",
        value: stability,
        unit: "percent",
        asOf: latest.periodEnd,
        note: "stdev / mean",
      },
    ],
  };

  snapshot.data.tables.yearSummary.rows = buildYearRows(points);
  snapshot.data.tables.quarterlySummary.rows = buildQuarterRows(points);
  snapshot.data.extremes = buildExtremes(points);
  snapshot.data.milestones = buildMilestones(points);
  snapshot.data.method = {
    source: "Terra Classic FCD and archival RPC endpoints",
    metricDefinition:
      "Monthly Active Wallets = unique addresses observed participating in on-chain transactions in that month.",
    dataWindow: `${formatMonth(points[0].periodEnd)} → ${formatMonth(latest.periodEnd)}`,
    notes: [
      "Snapshot compiled from the validated monthly active-wallet dataset.",
      "Months without a validated result are excluded from the series.",
    ],
  };

  fs.writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(
    `Updated ${snapshotPath} through ${formatMonth(latest.periodEnd)} (${integerFormatter.format(latest.v)} active wallets).`,
  );
}

main();
