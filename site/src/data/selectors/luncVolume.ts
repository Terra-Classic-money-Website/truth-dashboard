import type { LuncVolumeSnapshot, TimeWindow } from "../contracts";
import { formatPercentFraction, formatValue } from "../format";

type VolumePoint =
  LuncVolumeSnapshot["data"]["series"]["volume24hUsd"]["points"][number];

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});

const dayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toUtcDate(dateString: string) {
  return new Date(`${dateString}T00:00:00Z`);
}

function formatMonthLabel(dateString: string) {
  return monthFormatter.format(toUtcDate(dateString));
}

function formatDayLabel(dateString: string) {
  return dayFormatter.format(toUtcDate(dateString));
}

function formatPoint(point: VolumePoint) {
  return `${formatDayLabel(point.t)} (${formatValue({ value: point.v, unit: "usd" })})`;
}

function mean(values: number[]) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function standardDeviation(values: number[]) {
  if (!values.length) return 0;
  const average = mean(values);
  return Math.sqrt(
    mean(values.map((value) => Math.pow(value - average, 2))),
  );
}

function percentChange(current: number, previous: number) {
  return previous === 0 ? null : (current - previous) / Math.abs(previous);
}

function linearSlope(points: VolumePoint[]) {
  if (points.length < 2) return 0;
  const xMean = (points.length - 1) / 2;
  const yMean = mean(points.map((point) => point.v));
  let numerator = 0;
  let denominator = 0;

  points.forEach((point, index) => {
    const xDelta = index - xMean;
    numerator += xDelta * (point.v - yMean);
    denominator += xDelta * xDelta;
  });

  return denominator === 0 ? 0 : numerator / denominator;
}

function filterPointsByWindow(
  points: VolumePoint[],
  window: TimeWindow | undefined,
  coverageEnd: string,
) {
  if (!window?.days) return points;

  const end = toUtcDate(coverageEnd);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - window.days + 1);

  return points.filter((point) => {
    const pointDate = toUtcDate(point.t);
    return pointDate >= start && pointDate <= end;
  });
}

function summarizePoints(points: VolumePoint[]) {
  const values = points.map((point) => point.v);
  const peak = points.reduce((best, point) =>
    point.v > best.v ? point : best,
  );
  const low = points.reduce((best, point) =>
    point.v < best.v ? point : best,
  );

  return {
    average: mean(values),
    median: median(values),
    volatility: standardDeviation(values),
    peak,
    low,
  };
}

function getMonthKey(dateString: string) {
  const date = toUtcDate(dateString);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getQuarterKey(dateString: string) {
  const date = toUtcDate(dateString);
  const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
  return `${date.getUTCFullYear()}-Q${quarter}`;
}

function aggregatePoints(
  points: VolumePoint[],
  getKey: (dateString: string) => string,
  formatLabel: (dateString: string) => string,
) {
  const groups = new Map<string, VolumePoint[]>();

  points.forEach((point) => {
    const key = getKey(point.t);
    const existing = groups.get(key) ?? [];
    existing.push(point);
    groups.set(key, existing);
  });

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, groupPoints]) => {
      const stats = summarizePoints(groupPoints);
      return {
        key,
        label: formatLabel(groupPoints[0].t),
        points: groupPoints,
        ...stats,
      };
    });
}

function buildChangePoints(points: VolumePoint[]) {
  return points.slice(1).map((point, index) => {
    const previous = points[index];
    const delta = point.v - previous.v;
    return {
      date: point.t,
      delta,
      pct: percentChange(point.v, previous.v),
    };
  });
}

function buildMaxDrawdown(points: VolumePoint[]) {
  let runningPeak = points[0];
  let maxDrawdown = {
    drawdownPct: 0,
    from: runningPeak.t,
    to: runningPeak.t,
    recovered: true,
  };

  points.forEach((point, index) => {
    if (point.v > runningPeak.v) {
      runningPeak = point;
      return;
    }

    const drawdownPct = percentChange(point.v, runningPeak.v) ?? 0;
    if (drawdownPct < maxDrawdown.drawdownPct) {
      maxDrawdown = {
        drawdownPct,
        from: runningPeak.t,
        to: point.t,
        recovered: points
          .slice(index + 1)
          .some((futurePoint) => futurePoint.v >= runningPeak.v),
      };
    }
  });

  return maxDrawdown;
}

export function selectLuncVolume(
  snapshot: LuncVolumeSnapshot,
  windowId?: string,
) {
  const selectedWindow = snapshot.timeWindows.find(
    (window) => window.id === windowId,
  );
  const sourceSeries = snapshot.data.series.volume24hUsd;
  const filteredPoints = filterPointsByWindow(
    sourceSeries.points,
    selectedWindow,
    snapshot.coverage.end,
  );
  const points = filteredPoints.length ? filteredPoints : sourceSeries.points;
  const latest = points[points.length - 1];
  const previous = points[points.length - 2] ?? null;
  const summary = summarizePoints(points);
  const dailyChange = previous
    ? percentChange(latest.v, previous.v)
    : null;
  const currentVsAverage = percentChange(latest.v, summary.average);
  const currentVsPeak = percentChange(latest.v, summary.peak.v) ?? 0;
  const stability =
    summary.average === 0 ? 0 : summary.volatility / summary.average;
  const slope = linearSlope(points);
  const recentCount = Math.min(30, points.length);
  const recentPoints = points.slice(-recentCount);
  const priorPoints = points.slice(
    Math.max(0, points.length - recentCount * 2),
    points.length - recentCount,
  );
  const recentAverage = mean(recentPoints.map((point) => point.v));
  const priorAverage = priorPoints.length
    ? mean(priorPoints.map((point) => point.v))
    : null;
  const recentChange =
    priorAverage === null ? null : percentChange(recentAverage, priorAverage);
  const highVolumeDays = points.filter(
    (point) => point.v >= summary.median * 2,
  );
  const lowVolumeDays = points.filter(
    (point) => point.v <= summary.median * 0.5,
  );

  const monthlyGroups = aggregatePoints(
    points,
    getMonthKey,
    formatMonthLabel,
  );
  const quarterlyGroups = aggregatePoints(
    points,
    getQuarterKey,
    (dateString) => {
      const date = toUtcDate(dateString);
      const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
      return `${date.getUTCFullYear()} Q${quarter}`;
    },
  );

  const monthlyRows = monthlyGroups
    .map((group, index) => ({
      month: group.label,
      average: group.average,
      median: group.median,
      change:
        index > 0
          ? percentChange(group.average, monthlyGroups[index - 1].average)
          : null,
      volatility: group.volatility,
      peakDay: formatPoint(group.peak),
    }))
    .reverse();

  const quarterlyRows = quarterlyGroups
    .map((group, index) => ({
      quarter: group.label,
      average: group.average,
      change:
        index > 0
          ? percentChange(group.average, quarterlyGroups[index - 1].average)
          : null,
      peakDay: formatPoint(group.peak),
      lowDay: formatPoint(group.low),
      days: group.points.length,
    }))
    .reverse();

  const changes = buildChangePoints(points);
  const positiveChanges = changes.filter((change) => change.delta > 0);
  const negativeChanges = changes.filter((change) => change.delta < 0);
  const largestIncrease = positiveChanges.length
    ? positiveChanges.reduce((best, change) =>
        change.delta > best.delta ? change : best,
      )
    : null;
  const largestDecrease = negativeChanges.length
    ? negativeChanges.reduce((best, change) =>
        change.delta < best.delta ? change : best,
      )
    : null;
  const maxDrawdown = buildMaxDrawdown(points);
  const topDays = [...points]
    .sort((a, b) => b.v - a.v)
    .slice(0, 5)
    .map((point) => ({ label: formatDayLabel(point.t), value: point.v }));
  const bottomDays = [...points]
    .sort((a, b) => a.v - b.v)
    .slice(0, 5)
    .map((point) => ({ label: formatDayLabel(point.t), value: point.v }));

  const thresholds = [
    {
      label: `≥ 2× median (${formatValue({ value: summary.median * 2, unit: "usd" })})`,
      matches: highVolumeDays,
    },
    {
      label: `≥ 3× median (${formatValue({ value: summary.median * 3, unit: "usd" })})`,
      matches: points.filter((point) => point.v >= summary.median * 3),
    },
    {
      label: `≤ 0.5× median (${formatValue({ value: summary.median * 0.5, unit: "usd" })})`,
      matches: lowVolumeDays,
    },
  ].map((threshold) => ({
    threshold: threshold.label,
    days: threshold.matches.length,
    share: threshold.matches.length / points.length,
    latestSeen: threshold.matches.length
      ? formatDayLabel(threshold.matches[threshold.matches.length - 1].t)
      : "—",
  }));

  const weekdayBuckets = Array.from({ length: 7 }, () => [] as number[]);
  points.forEach((point) => {
    weekdayBuckets[toUtcDate(point.t).getUTCDay()].push(point.v);
  });
  const weekdayValues = weekdayBuckets
    .filter((values) => values.length)
    .map((values) => mean(values));
  const weekdayMin = Math.min(...weekdayValues);
  const weekdayMax = Math.max(...weekdayValues);
  const weekdayProfile = weekdayBuckets.map((values, index) => ({
    day: weekdayNames[index],
    average: values.length ? mean(values) : null,
    isMin: values.length ? mean(values) === weekdayMin : false,
    isMax: values.length ? mean(values) === weekdayMax : false,
  }));

  const highlights = [
    `Current volume is ${formatPercentFraction(currentVsPeak)} from the range peak of ${formatValue({ value: summary.peak.v, unit: "usd" })} on ${formatDayLabel(summary.peak.t)}.`,
    `The latest day is ${formatPercentFraction(currentVsAverage)} vs the selected-range average of ${formatValue({ value: summary.average, unit: "usd" })}.`,
    recentChange === null
      ? `The latest ${recentCount} days average ${formatValue({ value: recentAverage, unit: "usd" })}.`
      : `The latest ${recentCount} days average ${formatValue({ value: recentAverage, unit: "usd" })}, ${formatPercentFraction(recentChange)} vs the preceding ${priorPoints.length} days.`,
    `The daily linear trend is ${formatValue({ value: slope, unit: "usd" })} per day across the selected range.`,
    `${highVolumeDays.length} of ${points.length} days (${formatPercentFraction(highVolumeDays.length / points.length)}) reached at least 2× the range median; ${lowVolumeDays.length} stayed at or below 0.5×.`,
  ];

  const kpiSnapshot = [
    {
      id: "kpi.currentVolume",
      label: "Current 24h volume",
      value: latest.v,
      unit: "usd",
      asOf: latest.t,
      note: "Most recent day",
    },
    {
      id: "kpi.rangePeak",
      label: "Peak in range",
      value: summary.peak.v,
      unit: "usd",
      asOf: summary.peak.t,
      note: formatDayLabel(summary.peak.t),
    },
    {
      id: "kpi.drawdown",
      label: "Current vs peak",
      value: currentVsPeak,
      unit: "percent",
      asOf: latest.t,
      note: "Latest vs range peak",
    },
    {
      id: "kpi.medianDaily",
      label: "Median daily volume",
      value: summary.median,
      unit: "usd",
      asOf: latest.t,
      note: `${points.length} observations`,
    },
    {
      id: "kpi.trendSlope",
      label: "Daily trend slope",
      value: slope,
      unit: "usd",
      asOf: latest.t,
      note: "USD / day · linear fit",
    },
    {
      id: "kpi.stability",
      label: "Range stability",
      value: stability,
      unit: "percent",
      asOf: latest.t,
      note: "stdev / mean",
    },
  ];

  const kpiTiles = [
    {
      id: "kpi.latest24hVolumeUsd" as const,
      label: "Latest 24h volume",
      sublabel: "Most recent day",
      value: latest.v,
      unit: "usd" as const,
      delta:
        dailyChange === null
          ? null
          : { value: dailyChange, unit: "percent", vs: "prev_period" },
    },
    {
      id: "kpi.maxVolumeUsdInRange" as const,
      label: "Max volume (range)",
      sublabel: "Peak day in range",
      value: summary.peak.v,
      unit: "usd" as const,
      delta: null,
    },
    {
      id: "kpi.avgVolumeUsdInRange" as const,
      label: "Avg volume (range)",
      sublabel: "Average daily volume",
      value: summary.average,
      unit: "usd" as const,
      delta: null,
    },
  ];

  return {
    header: {
      title: snapshot.title,
      subtitle: snapshot.subtitle ?? "",
    },
    windows: snapshot.timeWindows,
    series: [
      {
        label: "24h volume",
        unit: "usd",
        cadence: snapshot.coverage.cadence,
        points,
      },
    ],
    kpiTiles,
    insights: {
      highlights,
      kpiSnapshot,
      monthlyRows,
      quarterlyRows,
      extremes: {
        topDays,
        bottomDays,
        largestIncrease,
        largestDecrease,
        maxDrawdown,
      },
      thresholds,
      weekdayProfile,
      method: {
        source: snapshot.sources[0]?.label ?? "CoinGecko",
        metricDefinition:
          "Daily 24h trading volume in USD as reported for Terra Classic (LUNC).",
        dataWindow: `${formatDayLabel(points[0].t)} → ${formatDayLabel(latest.t)} · ${points.length} daily observations`,
        notes: [
          "Metrics are recalculated from the selected range and include isolated volume spikes.",
          "The activity tracker uses the selected-range median so outliers do not define the baseline.",
        ],
      },
    },
  };
}
