import type {
  CmcRankingObservation,
  CmcRankingRankPoint,
  CmcRankingSnapshot,
  TimeWindow,
} from "../contracts";
import { formatValue } from "../format";

export type CmcRankingMode = "snapshots" | "monthly";

type SelectedObservation = CmcRankingObservation & { rank: number };

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function toDate(value: string) {
  const date = new Date(value);
  if (Number.isFinite(date.getTime())) return date;
  return new Date(`${value}T00:00:00Z`);
}

function formatDateTime(value: string) {
  return `${dateTimeFormatter.format(toDate(value))} UTC`;
}

function formatDate(value: string) {
  return dateFormatter.format(toDate(value));
}

function formatMonth(value: string) {
  return monthFormatter.format(toDate(`${value}-01`));
}

function formatRank(value: number) {
  return formatValue({ value, unit: "rank" });
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function getMonthKey(value: string) {
  const date = toDate(value);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function isWithinWindow(
  value: string,
  window: TimeWindow | undefined,
  coverageEnd: string,
) {
  if (!window?.days) return true;
  const end = new Date(`${coverageEnd}T23:59:59.999Z`);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - window.days + 1);
  const time = toDate(value).getTime();
  return time >= start.getTime() && time <= end.getTime();
}

function getSelectedObservations(
  snapshot: CmcRankingSnapshot,
  windowId: string | undefined,
  coverageEnd = snapshot.coverage.end,
) {
  const selectedWindow = snapshot.timeWindows.find(
    (window) => window.id === windowId,
  );
  const allCaptures = [...snapshot.data.observations].sort((a, b) =>
    a.capturedAt.localeCompare(b.capturedAt),
  );
  const windowCaptures = allCaptures.filter((capture) =>
    isWithinWindow(capture.capturedAt, selectedWindow, coverageEnd),
  );
  const captures = windowCaptures.length ? windowCaptures : allCaptures;
  const observations = captures.filter(
    (capture): capture is SelectedObservation =>
      capture.status === "rank_observed" && capture.rank !== null,
  );
  return { captures, observations };
}

function getLargestGap(observations: SelectedObservation[]) {
  if (observations.length < 2) return null;
  let largest = {
    days: 0,
    from: observations[0].capturedAt,
    to: observations[1].capturedAt,
  };

  observations.slice(1).forEach((observation, index) => {
    const previous = observations[index];
    const days =
      (toDate(observation.capturedAt).getTime() -
        toDate(previous.capturedAt).getTime()) /
      86_400_000;
    if (days > largest.days) {
      largest = {
        days,
        from: previous.capturedAt,
        to: observation.capturedAt,
      };
    }
  });

  return largest;
}

function groupByMonth(observations: SelectedObservation[]) {
  const groups = new Map<string, SelectedObservation[]>();
  observations.forEach((observation) => {
    const key = getMonthKey(observation.capturedAt);
    const group = groups.get(key) ?? [];
    group.push(observation);
    groups.set(key, group);
  });
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function buildChanges(observations: SelectedObservation[]) {
  return observations.slice(1).map((observation, index) => ({
    from: observations[index],
    to: observation,
    delta: observation.rank - observations[index].rank,
  }));
}

function describeRankChange(delta: number | null) {
  if (delta === null) return "No previous capture in this range";
  if (delta === 0) return "Unchanged vs previous capture";
  const positions = Math.abs(delta);
  const direction = delta < 0 ? "better" : "worse";
  return `${positions} position${positions === 1 ? "" : "s"} ${direction} vs previous capture`;
}

function buildRankTicks(maxRank: number) {
  const step = maxRank <= 60 ? 10 : maxRank <= 200 ? 50 : 100;
  const ticks = [1];
  for (let rank = step; rank <= maxRank + step / 2; rank += step) {
    ticks.push(rank);
  }
  return [...new Set(ticks)];
}

export function selectCmcRanking(
  snapshot: CmcRankingSnapshot,
  windowId = "all",
  mode: CmcRankingMode = "snapshots",
) {
  const latestEvidence = snapshot.data.currentObservation;
  const selectedWindow = snapshot.timeWindows.find(
    (window) => window.id === windowId,
  );
  const selectionCoverageEnd = latestEvidence.observedDate;
  const { captures, observations } = getSelectedObservations(
    snapshot,
    windowId,
    selectionCoverageEnd,
  );
  const latest = observations[observations.length - 1];
  const previous = observations[observations.length - 2] ?? null;
  const best = observations.reduce((current, observation) =>
    observation.rank < current.rank ? observation : current,
  );
  const worst = observations.reduce((current, observation) =>
    observation.rank > current.rank ? observation : current,
  );
  const rankValues = observations.map((observation) => observation.rank);
  const medianRank = median(rankValues);
  const rankDelta = previous ? latest.rank - previous.rank : null;
  const changes = buildChanges(observations);
  const largestMove = changes.length
    ? changes.reduce((current, change) =>
        Math.abs(change.delta) > Math.abs(current.delta) ? change : current,
      )
    : null;
  const largestGap = getLargestGap(observations);
  const monthlyGroups = groupByMonth(observations);
  const monthlyPoints = monthlyGroups.map(([key, group]) => ({
    t: `${key}-01`,
    v: median(group.map((observation) => observation.rank)),
  }));
  const rawPoints: CmcRankingRankPoint[] = observations.map((observation) => ({
    t: observation.capturedAt,
    v: observation.rank,
  }));
  const chartPoints = mode === "monthly" ? monthlyPoints : rawPoints;
  const rankCaptureRate = captures.length ? observations.length / captures.length : 0;
  const latestEvidenceLabel = formatDate(latestEvidence.observedDate);
  const currentRankDelta = latestEvidence.rank - latest.rank;
  const rankDeltaTile = rankDelta === null
    ? null
    : { value: rankDelta, unit: "rank", vs: "prev_capture" };
  const latestEvidenceInRange = isWithinWindow(
    latestEvidence.recordedAt,
    selectedWindow,
    selectionCoverageEnd,
  );
  const latestChartPoints = latestEvidenceInRange
    ? [
        {
          t: latestEvidence.recordedAt,
          v: latestEvidence.rank,
          tooltipLabel: `Latest rank · ${latestEvidenceLabel}`,
        },
      ]
    : [];
  const plottedChartPoints = [...chartPoints, ...latestChartPoints];
  const chartSeries = [
    {
      label: mode === "monthly" ? "Monthly median CMC rank" : "CMC market-cap rank",
      unit: "rank",
      cadence: mode === "monthly" ? "monthly" : "snapshot",
      points: plottedChartPoints,
    },
  ];
  const monthlyRows = monthlyGroups
    .map(([key, group]) => {
      const values = group.map((observation) => observation.rank);
      return {
        month: formatMonth(key),
        median: median(values),
        best: Math.min(...values),
        worst: Math.max(...values),
        captures: group.length,
      };
    })
    .reverse();

  const recentCaptures = [...observations]
    .reverse()
    .slice(0, 12)
    .map((observation) => ({
      id: observation.captureTimestamp,
      capturedAt: observation.capturedAt,
      rank: observation.rank,
      assetName: observation.assetName ?? "Terra Classic",
      assetSymbol: observation.assetSymbol ?? "LUNC",
      rankSource: observation.rankSource,
      archiveUrl: observation.archiveUrl,
    }));

  const selectedRangeLabel = selectedWindow?.label ?? "ALL";
  const rankCaptureLabel = `${observations.length} of ${captures.length} archive captures resolved to a CMC rank`;
  const latestLabel = formatDateTime(latest.capturedAt);
  const currentDeltaText =
    `${Math.abs(currentRankDelta)} position${Math.abs(currentRankDelta) === 1 ? "" : "s"} ${currentRankDelta < 0 ? "better" : currentRankDelta > 0 ? "worse" : "unchanged"} than latest Wayback`;

  return {
    header: {
      title: snapshot.title,
      subtitle: snapshot.subtitle ?? "",
      status: `Latest rank: ${formatRank(latestEvidence.rank)} on ${latestEvidenceLabel} · ${currentDeltaText} (${formatRank(latest.rank)} latest Wayback)`,
    },
    windows: snapshot.timeWindows,
    mode,
    modeLabel: mode === "monthly" ? "Monthly median" : "Observed snapshots",
    chart: {
      title:
        mode === "monthly"
          ? "Monthly median CMC rank"
          : "Observed CoinMarketCap rank",
      description:
        mode === "monthly"
          ? "Median of all parseable Wayback captures in each calendar month, followed by the latest dated CMC rank. Lower rank is better."
          : "Parseable Wayback captures are plotted at their capture time, followed by the latest dated CMC rank. Lower rank is better; no value is inferred between captures.",
      pointCount: chartPoints.length,
      latestPointCount: latestChartPoints.length,
      yTicks: buildRankTicks(Math.max(worst.rank, latestEvidence.rank)),
    },
    series: chartSeries,
    kpiTiles: [
      {
        id: "kpi.latestCmcRank",
        label: "Latest CMC rank",
        sublabel: `CMC public API · ${latestEvidenceLabel}`,
        value: latestEvidence.rank,
        unit: "rank",
        delta: { value: currentRankDelta, unit: "rank", vs: "latest_wayback" },
      },
      {
        id: "kpi.latestWaybackCmcRank",
        label: "Latest Wayback rank",
        sublabel: latestLabel,
        value: latest.rank,
        unit: "rank",
        delta: rankDeltaTile,
      },
      {
        id: "kpi.bestCmcRank",
        label: "Best historical rank",
        sublabel: `${formatDate(best.capturedAt)} · ${best.assetName ?? "Terra Classic"}`,
        value: best.rank,
        unit: "rank",
        delta: null,
      },
    ],
    insights: {
      highlights: [
        `The latest static CMC observation is ${formatRank(latestEvidence.rank)} on ${latestEvidenceLabel}; it is ${currentDeltaText.toLowerCase()} than the latest Wayback observation.`,
        `The latest Wayback position is ${formatRank(latest.rank)} on ${latestLabel}; ${describeRankChange(rankDelta).toLowerCase()}.`,
        `The best observed position was ${formatRank(best.rank)} on ${formatDateTime(best.capturedAt)}, when the page labelled the asset ${best.assetName ?? "Terra Classic"} / ${best.assetSymbol ?? "LUNC"}.`,
        `The selected range median is ${formatRank(medianRank)} across ${observations.length} plotted observations; the worst observed position was ${formatRank(worst.rank)} on ${formatDateTime(worst.capturedAt)}.`,
        largestMove
          ? `The largest movement between adjacent captures was ${Math.abs(largestMove.delta)} position${Math.abs(largestMove.delta) === 1 ? "" : "s"} (${formatRank(largestMove.from.rank)} → ${formatRank(largestMove.to.rank)}) between ${formatDate(largestMove.from.capturedAt)} and ${formatDate(largestMove.to.capturedAt)}.`
          : "There is not enough data in this range to calculate movement between captures.",
        `${rankCaptureLabel}; the archive cadence is irregular, so this series describes observed CMC snapshots rather than a continuous daily ranking history.`,
      ],
      kpiSnapshot: [
        {
          id: "insight.latestCmcRank",
          label: "Latest CMC rank",
          value: latestEvidence.rank,
          unit: "rank",
          note: `Keyless API observation · ${latestEvidenceLabel}`,
        },
        {
          id: "insight.latestWaybackRank",
          label: "Latest Wayback rank",
          value: latest.rank,
          unit: "rank",
          note: latestLabel,
        },
        {
          id: "insight.medianRank",
          label: "Median rank",
          value: medianRank,
          unit: "rank",
          note: `${observations.length} plotted observations`,
        },
        {
          id: "insight.captureRate",
          label: "Row resolution rate",
          value: rankCaptureRate,
          unit: "percent",
          note: `${observations.length} of ${captures.length} captures`,
        },
      ],
      monthlyRows,
      archiveHealth: {
        selectedRangeLabel,
        totalCaptures: captures.length,
        rankObservations: observations.length,
        plottedRankObservations: observations.length,
        excludedFromChart: 0,
        unresolvedCaptures: captures.length - observations.length,
        resolutionRate: rankCaptureRate,
        uniqueObservationDates: new Set(
          observations.map((observation) => observation.observedDate),
        ).size,
        preRebrandObservations: observations.filter(
          (observation) => observation.assetSymbol === "LUNA",
        ).length,
        largestGap,
        coverageStart: observations[0].capturedAt,
        coverageEnd: latest.capturedAt,
      },
      recentCaptures,
      currentEvidence: {
        rank: latestEvidence.rank,
        observedDate: latestEvidence.observedDate,
        recordedAt: latestEvidence.recordedAt,
        sourceLabel: latestEvidence.sourceLabel,
        sourceUrl: latestEvidence.sourceUrl,
        evidence: latestEvidence.evidence,
        comparison: currentDeltaText,
      },
      method: {
        source: "CoinMarketCap coin page via Internet Archive Wayback Machine",
        metricDefinition:
          "CoinMarketCap market-cap ranking for asset ID 4172, parsed from the archived Terra / Terra Classic coin page. This is separate from the Most Viewed Cryptocurrencies list rank.",
        dataWindow: `${formatDateTime(observations[0].capturedAt)} → ${formatDateTime(latestEvidence.recordedAt)} · ${observations.length} plotted archive observations · ${captures.length} Timemap captures`,
        notes: [
          ...snapshot.notes,
          "The historical API endpoint is not used because CoinMarketCap limits historical listings to paid plans; the historical series is reconstructed from public Wayback captures instead.",
          "The current API point is shown in the same yellow series and is connected to the previous point when the archive gap is within the chart’s continuity threshold.",
        ],
        cdxSource: "https://web.archive.org/web/timemap/json?url=https%3A%2F%2Fcoinmarketcap.com%2Fcurrencies%2Fterra-luna%2F",
        latestArchiveUrl: latest.archiveUrl,
      },
    },
  };
}

export type CmcRankingView = ReturnType<typeof selectCmcRanking>;
