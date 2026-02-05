import fs from "fs";
import path from "path";

const root = path.resolve("/workspaces/truth-dashboard/site");
const rawPath = path.join(
  root,
  "src/data/snapshots/lunc-volume.timeseries.json",
);
const snapshotPath = path.join(
  root,
  "src/data/snapshots/lunc-volume.snapshot.json",
);

type RawPoint = { t: string; v: number };

type RawDataset = {
  schemaVersion: string;
  seriesId: string;
  unit: string;
  points: RawPoint[];
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
if (!raw.points.length) {
  throw new Error("Raw LUNC volume dataset is empty.");
}

const seriesPoints = raw.points.map((point) => ({
  t: point.t,
  v: point.v,
}));

const sorted = [...seriesPoints].sort((a, b) => a.t.localeCompare(b.t));
const coverageStart = sorted[0].t;
const coverageEnd = sorted[sorted.length - 1].t;

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
snapshot.generatedAt = formatDate(new Date());
snapshot.coverage = {
  start: coverageStart,
  end: coverageEnd,
  cadence: "daily",
};

snapshot.timeWindows = [
  { id: "3m", label: "3M", days: 92 },
  { id: "6m", label: "6M", days: 183 },
  { id: "1y", label: "1Y", days: 365 },
];

snapshot.data = {
  series: {
    volume24hUsd: {
      points: sorted,
    },
  },
  kpiTiles: [
    {
      id: "kpi.latest24hVolumeUsd",
      label: "Latest 24h volume",
      sublabel: "Most recent day",
      value: latest.v,
      unit: "usd",
      delta,
    },
    {
      id: "kpi.maxVolumeUsdInRange",
      label: "Max volume (range)",
      sublabel: "Peak day in range",
      value: maxPoint.v,
      unit: "usd",
      delta: null,
    },
    {
      id: "kpi.avgVolumeUsdInRange",
      label: "Avg volume (range)",
      sublabel: "Average daily volume",
      value: avg,
      unit: "usd",
      delta: null,
    },
  ],
};

writeJson(snapshotPath, snapshot);
console.log(`Updated snapshot: ${snapshotPath}`);
