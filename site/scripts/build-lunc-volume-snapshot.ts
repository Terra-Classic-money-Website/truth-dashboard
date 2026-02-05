import fs from "fs";
import path from "path";

const root = path.resolve("/workspaces/truth-dashboard/site");
const rawPath = path.join(root, "src/data/raw/lunc-volume.timeseries.json");
const snapshotPath = path.join(
  root,
  "src/data/snapshots/lunc-volume.snapshot.json",
);

type RawPoint = { t: string; v: number };

type RawDataset = {
  schemaVersion: string;
  series: RawPoint[];
};

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function writeJson(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}

const raw = readJson<RawDataset>(rawPath);
if (!raw.series.length) {
  throw new Error("Raw LUNC volume dataset is empty.");
}

const seriesPoints = raw.series.map((point) => ({
  periodEnd: point.t,
  v: point.v,
}));

const sorted = [...seriesPoints].sort((a, b) =>
  a.periodEnd.localeCompare(b.periodEnd),
);
const coverageStart = sorted[0].periodEnd;
const coverageEnd = sorted[sorted.length - 1].periodEnd;

const latest = sorted[sorted.length - 1];
const prev = sorted[sorted.length - 2] ?? null;
const delta =
  prev && prev.v !== 0
    ? { value: (latest.v - prev.v) / prev.v, unit: "percent", vs: "prev_period" }
    : null;

const maxPoint = sorted.reduce((acc, point) =>
  point.v > acc.v ? point : acc,
);
const avg =
  sorted.reduce((sum, point) => sum + point.v, 0) / sorted.length;

const snapshot = readJson<any>(snapshotPath);
const venuesKpi = snapshot.data?.kpiTiles?.find(
  (kpi: any) => kpi.id === "kpi.venues",
);

snapshot.generatedAt = formatDate(new Date());
snapshot.coverage = {
  start: coverageStart,
  end: coverageEnd,
  cadence: "daily",
};

snapshot.timeWindows = [
  { id: "6m", label: "6M", days: 183 },
  { id: "1y", label: "1Y", days: 365 },
  { id: "2y", label: "2Y", days: 730 },
  { id: "all", label: "All", days: null },
];

snapshot.data.series.volume24hUsd.points = sorted;

snapshot.data.kpiTiles = [
  {
    id: "kpi.latest",
    label: "Latest 24h volume",
    value: latest.v,
    unit: "usd",
    asOf: latest.periodEnd,
    delta,
    note: "Most recent snapshot",
  },
  {
    id: "kpi.max",
    label: "Max volume (range)",
    value: maxPoint.v,
    unit: "usd",
    asOf: maxPoint.periodEnd,
    delta: null,
    note: "Peak day in range",
  },
  {
    id: "kpi.avg",
    label: "Avg volume (range)",
    value: avg,
    unit: "usd",
    asOf: latest.periodEnd,
    delta: null,
    note: "Average daily volume",
  },
  {
    id: "kpi.venues",
    label: "Tracked venues",
    value: venuesKpi?.value ?? 12,
    unit: "count",
    asOf: latest.periodEnd,
    delta: null,
    note: "Centralized exchanges",
  },
];

writeJson(snapshotPath, snapshot);
console.log(`Updated snapshot: ${snapshotPath}`);
