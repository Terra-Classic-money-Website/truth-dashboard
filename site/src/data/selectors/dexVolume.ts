import type {
  DexVolumePeriod,
  DexVolumePoint,
  DexVolumeSeries,
  DexVolumeSnapshot,
  TimeWindow,
} from "../contracts";
import { formatDateLabel, formatPercentFraction, formatValue } from "../format";

export type DexVolumeMode = "daily" | "monthly";

type TotalPoint = DexVolumePoint & {
  leadingVenue: string | null;
  activeVenues: number;
};

type SummaryGroup = {
  key: string;
  label: string;
  points: TotalPoint[];
  average: number;
  median: number;
  volatility: number;
  peak: TotalPoint;
  low: TotalPoint;
};

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

function toUtcDate(dateString: string) {
  return new Date(`${dateString}T00:00:00Z`);
}

function formatDayLabel(dateString: string) {
  return dayFormatter.format(toUtcDate(dateString));
}

function formatMonthLabel(dateString: string) {
  return monthFormatter.format(toUtcDate(dateString));
}

function formatQuarterLabel(dateString: string) {
  const date = toUtcDate(dateString);
  return `${date.getUTCFullYear()} Q${Math.floor(date.getUTCMonth() / 3) + 1}`;
}

function formatPeriodLabel(date: string, mode: DexVolumeMode) {
  return formatDateLabel(date, mode);
}

function formatPoint(point: TotalPoint) {
  return `${formatDayLabel(point.t)} (${formatValue({ value: point.v, unit: "usd" })})`;
}

function formatSignedPercent(value: number | null) {
  if (value === null) return "—";
  const formatted = formatPercentFraction(value);
  return value > 0 ? `+${formatted}` : formatted;
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
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
}

function percentChange(current: number, previous: number) {
  return previous === 0 ? null : (current - previous) / Math.abs(previous);
}

function linearSlope(points: TotalPoint[]) {
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

function getWindowCount(window: TimeWindow | undefined, mode: DexVolumeMode) {
  if (!window) return null;
  return mode === "daily" ? window.days : window.months;
}

function getSelectedDates(
  period: DexVolumePeriod,
  selectedWindow: TimeWindow | undefined,
  mode: DexVolumeMode,
) {
  const count = getWindowCount(selectedWindow, mode);
  return typeof count === "number" && count > 0
    ? period.dates.slice(-count)
    : period.dates;
}

function getPointByDate(series: DexVolumeSeries, date: string) {
  return series.points.find((point) => point.t === date) ?? { t: date, v: 0 };
}

function buildTotalSeries(series: DexVolumeSeries[], dates: string[]) {
  return dates.map((date): TotalPoint => {
    const points = series.map((venue) => getPointByDate(venue, date));
    const leadingVenue = series
      .map((venue, index) => ({ venue, value: points[index].v }))
      .sort((a, b) => b.value - a.value)[0];

    return {
      t: date,
      v: points.reduce((sum, point) => sum + point.v, 0),
      leadingVenue: leadingVenue?.value ? leadingVenue.venue.label : null,
      activeVenues: points.filter((point) => point.v > 0).length,
    };
  });
}

function sumPoints(points: TotalPoint[]) {
  return points.reduce((sum, point) => sum + point.v, 0);
}

function sumVenuePoints(series: DexVolumeSeries, dates: string[]) {
  return dates.reduce((sum, date) => sum + getPointByDate(series, date).v, 0);
}

function findPoint(points: DexVolumePoint[], date: string) {
  return points.find((point) => point.t === date) ?? { t: date, v: 0 };
}

function getMonthKey(dateString: string) {
  const date = toUtcDate(dateString);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getQuarterKey(dateString: string) {
  const date = toUtcDate(dateString);
  return `${date.getUTCFullYear()}-Q${Math.floor(date.getUTCMonth() / 3) + 1}`;
}

function groupPoints(
  points: TotalPoint[],
  getKey: (dateString: string) => string,
  formatLabel: (dateString: string) => string,
) {
  const groups = new Map<string, TotalPoint[]>();

  points.forEach((point) => {
    const key = getKey(point.t);
    const existing = groups.get(key) ?? [];
    existing.push(point);
    groups.set(key, existing);
  });

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, groupPoints]): SummaryGroup => {
      const values = groupPoints.map((point) => point.v);
      const peak = groupPoints.reduce((best, point) =>
        point.v > best.v ? point : best,
      );
      const low = groupPoints.reduce((best, point) =>
        point.v < best.v ? point : best,
      );

      return {
        key,
        label: formatLabel(groupPoints[0].t),
        points: groupPoints,
        average: mean(values),
        median: median(values),
        volatility: standardDeviation(values),
        peak,
        low,
      };
    });
}

function getSelectedDailyPoints(
  snapshot: DexVolumeSnapshot,
  selectedDates: string[],
  mode: DexVolumeMode,
) {
  const dailyPeriod = snapshot.data.periods.daily;
  const allDailyTotal = buildTotalSeries(dailyPeriod.series, dailyPeriod.dates);
  const start = selectedDates[0] ?? dailyPeriod.coverage.start;
  const end = mode === "daily"
    ? selectedDates.at(-1) ?? dailyPeriod.coverage.end
    : dailyPeriod.coverage.end;

  return allDailyTotal.filter((point) => point.t >= start && point.t <= end);
}

function buildChangePoints(points: TotalPoint[]) {
  return points.slice(1).map((point, index) => {
    const previous = points[index];
    return {
      date: point.t,
      delta: point.v - previous.v,
      pct: percentChange(point.v, previous.v),
    };
  });
}

function buildMaxDrawdown(points: TotalPoint[]) {
  const first = points[0] ?? {
    t: "",
    v: 0,
    leadingVenue: null,
    activeVenues: 0,
  };
  let runningPeak = first;
  let maxDrawdown = {
    drawdownPct: 0,
    from: first.t,
    to: first.t,
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

function getRecentWindowSize(pointCount: number) {
  return Math.min(30, Math.max(1, Math.floor(pointCount / 2)));
}

function formatPeriodRange(points: TotalPoint[], mode: DexVolumeMode) {
  if (!points.length) return "No comparable period";
  if (points.length === 1) return formatPeriodLabel(points[0].t, mode);
  return `${formatPeriodLabel(points[0].t, mode)} → ${formatPeriodLabel(points.at(-1)!.t, mode)}`;
}

export function selectDexVolume(
  snapshot: DexVolumeSnapshot,
  mode: DexVolumeMode = "monthly",
  windowId = "2y",
) {
  const period = snapshot.data.periods[mode];
  const selectedWindow = snapshot.timeWindows.find((window) => window.id === windowId);
  const dates = getSelectedDates(period, selectedWindow, mode);
  const fullSeries = period.series;
  const fullDates = period.dates;
  const fullTotal = buildTotalSeries(fullSeries, fullDates);
  const series = fullSeries.map((venue) => ({
    ...venue,
    points: dates.map((date) => findPoint(venue.points, date)),
  }));
  const total = buildTotalSeries(series, dates);
  const selectedStartIndex = Math.max(0, fullDates.length - dates.length);
  const previousTotal = fullTotal.slice(
    Math.max(0, selectedStartIndex - dates.length),
    selectedStartIndex,
  );
  const previousDates = previousTotal.map((point) => point.t);
  const latest = total[total.length - 1] ?? {
    t: period.coverage.end,
    v: 0,
    leadingVenue: null,
    activeVenues: 0,
  };
  const previous = total[total.length - 2] ?? null;
  const values = total.map((point) => point.v);
  const average = mean(values);
  const peak = total.reduce((best, point) => (point.v > best.v ? point : best), latest);
  const latestChange = previous ? percentChange(latest.v, previous.v) : null;
  const currentVsAverage = percentChange(latest.v, average);
  const currentVsPeak = percentChange(latest.v, peak.v) ?? 0;
  const selectedRangeTotal = sumPoints(total);
  const previousRangeTotal = previousTotal.length ? sumPoints(previousTotal) : null;
  const previousAverage = previousTotal.length ? mean(previousTotal.map((point) => point.v)) : null;
  const rangeChange = previousAverage === null
    ? null
    : percentChange(average, previousAverage);
  const dailyInsightPoints = getSelectedDailyPoints(snapshot, dates, mode);
  const dailyInsightValues = dailyInsightPoints.map((point) => point.v);
  const dailyInsightAverage = mean(dailyInsightValues);
  const dailyInsightMedian = median(dailyInsightValues);
  const dailyInsightVolatility = standardDeviation(dailyInsightValues);
  const dailyInsightSlope = linearSlope(dailyInsightPoints);
  const recentCount = getRecentWindowSize(dailyInsightPoints.length);
  const recent = dailyInsightPoints.slice(-recentCount);
  const priorRecent = dailyInsightPoints.slice(
    Math.max(0, dailyInsightPoints.length - recentCount * 2),
    dailyInsightPoints.length - recentCount,
  );
  const recentAverage = mean(recent.map((point) => point.v));
  const priorRecentAverage = priorRecent.length
    ? mean(priorRecent.map((point) => point.v))
    : null;
  const recentChange = priorRecentAverage === null
    ? null
    : percentChange(recentAverage, priorRecentAverage);
  const activePeriodCount = dailyInsightPoints.filter((point) => point.v > 0).length;

  const allDailyTotal = buildTotalSeries(
    snapshot.data.periods.daily.series,
    snapshot.data.periods.daily.dates,
  );
  const allMonthlyGroups = groupPoints(allDailyTotal, getMonthKey, formatMonthLabel);
  const selectedMonthlyGroups = groupPoints(dailyInsightPoints, getMonthKey, formatMonthLabel);
  const allQuarterlyGroups = groupPoints(allDailyTotal, getQuarterKey, formatQuarterLabel);
  const selectedQuarterlyGroups = groupPoints(dailyInsightPoints, getQuarterKey, formatQuarterLabel);

  const monthlyRows = selectedMonthlyGroups
    .map((group) => {
      const groupIndex = allMonthlyGroups.findIndex((item) => item.key === group.key);
      const previousGroup = groupIndex > 0 ? allMonthlyGroups[groupIndex - 1] : null;
      return {
        month: group.label,
        average: group.average,
        median: group.median,
        change: previousGroup ? percentChange(group.average, previousGroup.average) : null,
        volatility: group.volatility,
        peakDay: formatPoint(group.peak),
        days: group.points.length,
      };
    })
    .reverse();

  const quarterlyRows = selectedQuarterlyGroups
    .map((group) => {
      const groupIndex = allQuarterlyGroups.findIndex((item) => item.key === group.key);
      const previousGroup = groupIndex > 0 ? allQuarterlyGroups[groupIndex - 1] : null;
      return {
        quarter: group.label,
        average: group.average,
        change: previousGroup ? percentChange(group.average, previousGroup.average) : null,
        peakDay: formatPoint(group.peak),
        lowDay: formatPoint(group.low),
        days: group.points.length,
      };
    })
    .reverse();

  const changes = buildChangePoints(dailyInsightPoints);
  const positiveChanges = changes.filter((change) => change.delta > 0);
  const negativeChanges = changes.filter((change) => change.delta < 0);
  const largestIncrease = positiveChanges.length
    ? positiveChanges.reduce((best, change) => (change.delta > best.delta ? change : best))
    : null;
  const largestDecrease = negativeChanges.length
    ? negativeChanges.reduce((best, change) => (change.delta < best.delta ? change : best))
    : null;
  const maxDrawdown = buildMaxDrawdown(dailyInsightPoints);
  const topDays = [...dailyInsightPoints]
    .sort((a, b) => b.v - a.v)
    .slice(0, 5)
    .map((point) => ({ label: formatDayLabel(point.t), value: point.v }));
  const bottomDays = [...dailyInsightPoints]
    .sort((a, b) => a.v - b.v)
    .slice(0, 5)
    .map((point) => ({ label: formatDayLabel(point.t), value: point.v }));

  const currentVenueTotals = series.map((venue) => ({
    venue,
    value: sumVenuePoints(venue, dates),
  }));
  const previousVenueTotals = new Map(
    fullSeries.map((venue) => [venue.id, sumVenuePoints(venue, previousDates)]),
  );
  const currentActiveVenues = currentVenueTotals.filter((item) => item.value > 0).length;
  const previousActiveVenues = previousDates.length
    ? [...previousVenueTotals.values()].filter((value) => value > 0).length
    : null;
  const venueMix = currentVenueTotals
    .map(({ venue, value }) => {
      const previousValue = previousDates.length
        ? previousVenueTotals.get(venue.id) ?? 0
        : null;
      const share = selectedRangeTotal ? value / selectedRangeTotal : 0;
      const previousShare = previousRangeTotal && previousValue !== null
        ? previousValue / previousRangeTotal
        : null;
      return {
        id: venue.id,
        label: venue.label,
        color: venue.color,
        selected: value,
        previous: previousValue,
        change: previousValue === null ? null : percentChange(value, previousValue),
        share,
        previousShare,
        shareChange: previousShare === null ? null : share - previousShare,
        activePeriods: venue.points.filter((point) => point.v > 0).length,
        previousActivePeriods: previousDates.length
          ? previousDates.filter((date) => getPointByDate(venue, date).v > 0).length
          : null,
      };
    })
    .sort((a, b) => b.selected - a.selected);
  const topVenue = venueMix.find((venue) => venue.selected > 0) ?? venueMix[0] ?? null;
  const topThreeShare = venueMix.length
    ? venueMix.slice(0, 3).reduce((sum, venue) => sum + venue.selected, 0) /
      Math.max(1, selectedRangeTotal)
    : 0;
  const latestVenueTotals = series.map((venue) => ({
    venue,
    value: venue.points[venue.points.length - 1]?.v ?? 0,
  }));
  const latestLeadingVenue = latestVenueTotals.sort((a, b) => b.value - a.value)[0];
  const concentrationIndex = selectedRangeTotal
    ? venueMix.reduce((sum, venue) => sum + venue.share ** 2, 0)
    : 0;

  const highlights = [
    `The latest ${mode === "daily" ? "day" : "month"} is ${formatPercentFraction(currentVsPeak)} from the selected-range peak of ${formatValue({ value: peak.v, unit: "usd" })} on ${formatPeriodLabel(peak.t, mode)}.`,
    rangeChange === null
      ? "There is no preceding comparable range in the selected history."
      : `The selected range is ${formatSignedPercent(rangeChange)} versus the preceding comparable range (${formatPeriodRange(previousTotal, mode)}).`,
    currentVsAverage === null
      ? `The latest ${mode === "daily" ? "day" : "month"} has no recorded volume.`
      : `The latest ${mode === "daily" ? "day" : "month"} is ${formatPercentFraction(currentVsAverage)} versus the selected-range average of ${formatValue({ value: average, unit: "usd" })}.`,
    topVenue
      ? `${topVenue.label} represents ${formatPercentFraction(topVenue.share)} of selected-range volume; the top three venues represent ${formatPercentFraction(topThreeShare)}.`
      : "No venue recorded activity in the selected range.",
    `The daily trend slope is ${formatValue({ value: dailyInsightSlope, unit: "usd" })} per day across ${dailyInsightPoints.length} observations${maxDrawdown.drawdownPct < 0 ? `; the largest drawdown reached ${formatPercentFraction(maxDrawdown.drawdownPct)}` : ""}.`,
  ];

  const kpiSnapshot = [
    {
      id: "kpi.latest",
      label: mode === "daily" ? "Latest daily volume" : "Latest monthly volume",
      value: latest.v,
      unit: "usd",
      note: formatPeriodLabel(latest.t, mode),
    },
    {
      id: "kpi.peak",
      label: "Peak in range",
      value: peak.v,
      unit: "usd",
      note: formatPeriodLabel(peak.t, mode),
    },
    {
      id: "kpi.currentVsPeak",
      label: "Current vs peak",
      value: currentVsPeak,
      unit: "percent",
      note: "Latest vs selected-range peak",
    },
    {
      id: "kpi.rangeChange",
      label: "Selected vs prior range",
      value: rangeChange,
      unit: "percent",
      note: "Equal-length comparable period",
    },
    {
      id: "kpi.dailyMedian",
      label: "Median daily volume",
      value: dailyInsightMedian,
      unit: "usd",
      note: `${dailyInsightPoints.length} daily observations`,
    },
    {
      id: "kpi.dailySlope",
      label: "Daily trend slope",
      value: dailyInsightSlope,
      unit: "usd",
      note: "USD / day · linear fit",
    },
  ];

  return {
    header: {
      title: snapshot.title,
      subtitle: snapshot.subtitle ?? "",
    },
    mode,
    modeLabel: mode === "daily" ? "Daily" : "Monthly",
    windows: snapshot.timeWindows,
    dates,
    series,
    total,
    kpiTiles: [
      {
        id: "latest-total",
        label: "Latest total volume",
        value: latest.v,
        unit: "usd" as const,
        sublabel: `${formatPeriodLabel(latest.t, mode)} · ${latest.activeVenues} active venues`,
        delta: latestChange === null ? null : { value: latestChange, unit: "percent", vs: "prev_period" },
      },
      {
        id: "peak-total",
        label: "Peak total volume",
        value: peak.v,
        unit: "usd" as const,
        sublabel: `${formatPeriodLabel(peak.t, mode)} · ${peak.leadingVenue ?? "No leading venue"}`,
        delta: null,
      },
      {
        id: "average-total",
        label: "Average total volume",
        value: average,
        unit: "usd" as const,
        sublabel: `${formatNumberOfPeriods(total.length, mode)} · selected range`,
        delta: null,
      },
    ],
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
      venueMix,
      comparison: {
        selectedLabel: formatPeriodRange(total, mode),
        previousLabel: formatPeriodRange(previousTotal, mode),
        currentAverage: average,
        previousAverage,
        currentTotal: selectedRangeTotal,
        previousTotal: previousRangeTotal,
        change: rangeChange,
        currentActiveVenues,
        previousActiveVenues,
        currentActivePeriods: activePeriodCount,
        totalDailyPeriods: dailyInsightPoints.length,
      },
      summary: {
        latest: latest.v,
        average,
        currentVsAverage,
        currentVsPeak,
        latestLabel: formatPeriodLabel(latest.t, mode),
        peak,
        periodCount: total.length,
        activeVenueCount: latest.activeVenues,
        venueCount: series.length,
        leadingVenue: latestLeadingVenue?.venue.label ?? null,
      },
      concentration: {
        topVenue,
        topVenueShare: topVenue?.share ?? 0,
        topThreeShare,
        index: concentrationIndex,
      },
      stats: {
        median: dailyInsightMedian,
        volatility: dailyInsightVolatility,
        stability: dailyInsightAverage ? dailyInsightVolatility / dailyInsightAverage : 0,
        peakMultiple: average ? peak.v / average : 0,
        activePeriodCount,
        totalPeriodCount: dailyInsightPoints.length,
        dailyInsightSlope,
        recentAverage,
        recentChange,
        dailyObservationCount: dailyInsightPoints.length,
      },
      method: {
        source: snapshot.sources[0]?.label ?? "Terra Classic DEX / on-chain activity",
        metricDefinition:
          "USD trading volume grouped by venue and aggregated into daily or monthly periods.",
        dataWindow: `${formatDayLabel(dailyInsightPoints[0]?.t ?? dates[0] ?? period.coverage.start)} → ${formatDayLabel(dailyInsightPoints.at(-1)?.t ?? latest.t)} · ${dailyInsightPoints.length} daily observations`,
        notes: [
          "The selected-range comparison uses an equal-length preceding period when one exists.",
          "Monthly and quarterly summaries use daily venue totals so averages, medians, volatility, and peak days remain interpretable.",
          "Monthly chart totals are retained as provided; daily-derived summaries can differ where source partitions are partial or reconcile differently.",
          "Periods with no recorded venue activity are shown as zero and are not imputed.",
          ...(mode === "monthly"
            ? ["The latest monthly period may be partial; compare it with completed periods cautiously."]
            : []),
        ],
      },
    },
  };
}

function formatNumberOfPeriods(count: number, mode: DexVolumeMode) {
  const unit = mode === "daily"
    ? count === 1 ? "day" : "days"
    : count === 1 ? "month" : "months";
  return `${count} ${unit}`;
}
