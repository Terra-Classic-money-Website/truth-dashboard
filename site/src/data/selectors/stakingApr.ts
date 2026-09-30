import type {
  StakingAprObservation,
  StakingAprSnapshot,
  TimeWindow,
} from "../contracts";
import { formatPercentFraction, formatValue } from "../format";

export type StakingAprMode = "snapshots" | "monthly";

type ObservedApr = StakingAprObservation & { apr: number };

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

function formatApr(value: number) {
  return formatValue({ value, unit: "percent_points" });
}

function formatSignedPercentagePoints(value: number) {
  return formatValue({ value, unit: "signed_percentage_points" });
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

function groupByMonth(observations: ObservedApr[]) {
  const groups = new Map<string, ObservedApr[]>();
  observations.forEach((observation) => {
    const key = getMonthKey(observation.capturedAt);
    const group = groups.get(key) ?? [];
    group.push(observation);
    groups.set(key, group);
  });
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function getLargestGap(observations: ObservedApr[]) {
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

function buildChanges(observations: ObservedApr[]) {
  return observations.slice(1).map((observation, index) => ({
    from: observations[index],
    to: observation,
    delta: observation.apr - observations[index].apr,
  }));
}

function describeAprChange(delta: number) {
  if (delta === 0) return "unchanged";
  return `${formatValue({ value: Math.abs(delta), unit: "percentage_points" })} ${delta < 0 ? "lower" : "higher"}`;
}

function buildAprTicks(maximum: number) {
  const step = maximum <= 5 ? 1 : maximum <= 10 ? 2 : 5;
  const maxTick = Math.max(step, Math.ceil(maximum / step) * step);
  return Array.from({ length: Math.floor(maxTick / step) + 1 }, (_, index) =>
    Number((index * step).toFixed(2)),
  );
}

export function selectStakingApr(
  snapshot: StakingAprSnapshot,
  windowId = "all",
  mode: StakingAprMode = "snapshots",
) {
  const selectedWindow = snapshot.timeWindows.find(
    (window) => window.id === windowId,
  );
  const allCaptures = [...snapshot.data.observations].sort((a, b) =>
    a.capturedAt.localeCompare(b.capturedAt),
  );
  const currentReference = snapshot.data.currentObservation;
  const referenceDate = currentReference?.observedDate ?? snapshot.coverage.end;
  const capturesInWindow = allCaptures.filter((capture) =>
    isWithinWindow(capture.capturedAt, selectedWindow, referenceDate),
  );
  const captures = capturesInWindow.length ? capturesInWindow : allCaptures;
  const excludedCaptures = captures.filter((capture) => capture.status === "excluded");
  const eligibleCaptures = captures.length - excludedCaptures.length;
  const observations = captures.filter(
    (capture): capture is ObservedApr =>
      capture.status === "apr_observed" && capture.apr !== null,
  );
  const first = observations[0];
  const latest = observations[observations.length - 1];
  const previous = observations[observations.length - 2] ?? null;
  const highest = observations.reduce((current, observation) =>
    observation.apr > current.apr ? observation : current,
  );
  const lowest = observations.reduce((current, observation) =>
    observation.apr < current.apr ? observation : current,
  );
  const medianApr = median(observations.map((observation) => observation.apr));
  const rangeDelta = latest.apr - first.apr;
  const latestDelta = previous ? latest.apr - previous.apr : null;
  const largestMove = buildChanges(observations).reduce(
    (current, change) =>
      Math.abs(change.delta) > Math.abs(current.delta) ? change : current,
    { from: first, to: first, delta: 0 },
  );
  const largestGap = getLargestGap(observations);
  const monthlyGroups = groupByMonth(observations);
  const monthlyPoints = monthlyGroups.map(([month, group]) => ({
    t: `${month}-01`,
    v: median(group.map((observation) => observation.apr)),
    tooltipLabel: `Monthly median · ${formatMonth(month)}`,
  }));
  const snapshotPoints = observations.map((observation) => ({
    t: observation.capturedAt,
    v: observation.apr,
    tooltipLabel: `Captured · ${formatDateTime(observation.capturedAt)}`,
  }));
  const chartPoints = mode === "monthly" ? monthlyPoints : snapshotPoints;
  const currentReferenceInWindow =
    currentReference &&
    isWithinWindow(currentReference.observedDate, selectedWindow, referenceDate)
      ? currentReference
      : null;
  const currentReferencePoint = currentReferenceInWindow
    ? {
        t: currentReferenceInWindow.observedDate,
        v: currentReferenceInWindow.apr,
        tooltipLabel: `Current reference · ${formatDate(currentReferenceInWindow.observedDate)} · ${currentReferenceInWindow.sourceLabel}`,
        color: "#f7b955",
      }
    : null;
  const chartPointsWithReference = currentReferencePoint
    ? [...chartPoints, currentReferencePoint]
    : chartPoints;
  const componentObservations = observations.filter(
    (observation) =>
      observation.luncApr !== null && observation.ustcApr !== null,
  );
  const firstComponentObservation = componentObservations[0] ?? null;
  const latestComponentObservation =
    componentObservations[componentObservations.length - 1] ?? null;
  const monthlyRows = monthlyGroups
    .map(([month, group]) => {
      const values = group.map((observation) => observation.apr);
      return {
        month: formatMonth(month),
        median: median(values),
        low: Math.min(...values),
        high: Math.max(...values),
        captures: group.length,
      };
    })
    .reverse();

  const selectedRangeLabel = selectedWindow?.label ?? "ALL";
  const captureRate = eligibleCaptures ? observations.length / eligibleCaptures : 0;
  const relativeChange = first.apr === 0 ? null : rangeDelta / first.apr;
  const latestGapDays = previous
    ? (toDate(latest.capturedAt).getTime() -
        toDate(previous.capturedAt).getTime()) /
      86_400_000
    : null;
  const currentReferenceGapDays = currentReference
    ? (toDate(currentReference.observedDate).getTime() -
        toDate(latest.observedDate).getTime()) /
      86_400_000
    : null;
  const currentReferenceDelta = currentReferenceInWindow
    ? currentReferenceInWindow.apr - latest.apr
    : null;
  const componentLuncDelta =
    firstComponentObservation && latestComponentObservation
      ? latestComponentObservation.luncApr! - firstComponentObservation.luncApr!
      : null;
  const componentUstcDelta =
    firstComponentObservation && latestComponentObservation
      ? latestComponentObservation.ustcApr! - firstComponentObservation.ustcApr!
      : null;
  const captureDateCounts = new Map<string, number>();
  observations.forEach((observation) => {
    captureDateCounts.set(
      observation.observedDate,
      (captureDateCounts.get(observation.observedDate) ?? 0) + 1,
    );
  });
  const duplicateDateCaptures = [...captureDateCounts.values()].reduce(
    (total, count) => total + Math.max(0, count - 1),
    0,
  );

  const latestBreakdown = latestComponentObservation
    ? {
        date: latestComponentObservation.capturedAt,
        total: latestComponentObservation.apr,
        lunc: latestComponentObservation.luncApr!,
        ustc: latestComponentObservation.ustcApr!,
      }
    : null;
  const archiveStatus = `Latest archived APR: ${formatApr(latest.apr)} on ${formatDate(latest.capturedAt)} · ${formatValue({ value: rangeDelta, unit: "percentage_points" })} since ${formatDate(first.capturedAt)} (${formatApr(first.apr)} at the first capture)`;
  const headerStatus = currentReference
    ? `Current reference: ${formatApr(currentReference.apr)} on ${formatDate(currentReference.observedDate)} · latest archive: ${formatApr(latest.apr)} on ${formatDate(latest.capturedAt)} (${Math.round(currentReferenceGapDays ?? 0)} days earlier) · no interim archive readings`
    : archiveStatus;
  const chartDescription =
    mode === "monthly"
      ? `Amber values are monthly medians of archived captures${currentReferenceInWindow ? `, with a separate current reference from ${currentReferenceInWindow.sourceLabel} dated ${formatDate(currentReferenceInWindow.observedDate)}` : ""}. The current reference is not included in monthly medians, and the line joins points in chronological order.`
      : currentReferenceInWindow
        ? `Amber dots show Wayback captures and the separate current reference dated ${formatDate(currentReferenceInWindow.observedDate)}. The line connects reported readings in chronological order.`
        : "Amber dots show APR readings from Wayback captures. The line connects readings in chronological order.";

  return {
    header: {
      title: snapshot.title,
      subtitle: snapshot.subtitle ?? "",
      status: headerStatus,
    },
    windows: snapshot.timeWindows,
    mode,
    chart: {
      title:
        mode === "monthly"
          ? "Monthly median APR + current reference"
          : "Staking APR snapshots + current reference",
      description: chartDescription,
      pointCount: chartPoints.length,
      captureCount: observations.length,
      currentReferenceCount: currentReferencePoint ? 1 : 0,
      legendItems: [
        {
          label: mode === "monthly" ? "Wayback monthly median" : "Wayback snapshots",
          value: latest.apr,
          color: "#f7b955",
        },
        ...(currentReferenceInWindow
          ? [{
              label: "Current reference",
              value: currentReferenceInWindow.apr,
              color: "#f7b955",
            }]
          : []),
      ],
      yTicks: buildAprTicks(
        Math.max(
          ...observations.map((observation) => observation.apr),
          ...(currentReferenceInWindow ? [currentReferenceInWindow.apr] : []),
        ),
      ),
    },
    series: [
      {
        label: mode === "monthly" ? "Monthly median APR" : "Staking APR",
        unit: "percent_points",
        cadence: mode === "monthly" ? "monthly" : "snapshot",
        points: chartPointsWithReference,
      },
    ],
    kpiTiles: [
      {
        id: currentReferenceInWindow
          ? "kpi.currentStakingApr"
          : "kpi.latestStakingApr",
        label: currentReferenceInWindow ? "Current APR reference" : "Latest archived APR",
        value: currentReferenceInWindow?.apr ?? latest.apr,
        unit: "percent_points",
        sublabel: currentReferenceInWindow
          ? `${formatDate(currentReferenceInWindow.observedDate)} · ${currentReferenceInWindow.sourceLabel}`
          : formatDate(latest.capturedAt),
        delta: null,
      },
      {
        id: "kpi.latestStakingApr",
        label: "Latest archived APR",
        value: latest.apr,
        unit: "percent_points",
        sublabel: formatDate(latest.capturedAt),
        delta:
          latestDelta === null
            ? null
            : { value: latestDelta, unit: "percentage_points", vs: "previous_capture" },
      },
      {
        id: "kpi.currentArchiveDifference",
        label: currentReferenceInWindow ? "Current vs archive" : "Archive range change",
        value: currentReferenceInWindow ? currentReferenceDelta! : rangeDelta,
        unit: currentReferenceInWindow ? "signed_percentage_points" : "percentage_points",
        sublabel: currentReferenceInWindow
          ? `${formatApr(currentReferenceInWindow.apr)} vs ${formatApr(latest.apr)}`
          : `${formatDate(first.capturedAt)} → ${formatDate(latest.capturedAt)}`,
        delta: null,
      },
      {
        id: "kpi.stakingAprObservations",
        label: "APR observations",
        value: observations.length,
        unit: "count",
        sublabel: `${captures.length} captures · ${selectedRangeLabel}`,
        delta: null,
      },
    ],
    insights: {
      highlights: [
        `Across ${observations.length} archived observations, displayed APR moved from ${formatApr(first.apr)} on ${formatDateTime(first.capturedAt)} to ${formatApr(latest.apr)} on ${formatDateTime(latest.capturedAt)} (${formatValue({ value: rangeDelta, unit: "percentage_points" })}${relativeChange === null ? "" : `; ${formatPercentFraction(relativeChange)} relative`}).`,
        currentReferenceInWindow && currentReferenceGapDays !== null
          ? `The separate current reference is ${formatApr(currentReferenceInWindow.apr)} on ${formatDate(currentReferenceInWindow.observedDate)}, ${formatSignedPercentagePoints(currentReferenceDelta!)} vs the latest archived ${formatApr(latest.apr)} on ${formatDate(latest.capturedAt)}. There are no Wayback APR observations across the ${Math.round(currentReferenceGapDays)}-day gap.`
          : "No separate current reference falls within this history range.",
        `The highest observed APR was ${formatApr(highest.apr)} on ${formatDateTime(highest.capturedAt)}; the lowest was ${formatApr(lowest.apr)} on ${formatDateTime(lowest.capturedAt)}.`,
        previous && latestDelta !== null && latestGapDays !== null
          ? `The latest archived reading is ${formatApr(latest.apr)}, ${describeAprChange(latestDelta)} than the prior capture (${formatApr(previous.apr)}) ${Math.round(latestGapDays)} days earlier.`
          : "There is not enough data in this range to compare the latest capture with a previous one.",
        Math.abs(largestMove.delta) > 0
          ? `The largest change between adjacent captures was ${formatValue({ value: largestMove.delta, unit: "percentage_points" })}, from ${formatApr(largestMove.from.apr)} on ${formatDate(largestMove.from.capturedAt)} to ${formatApr(largestMove.to.apr)} on ${formatDate(largestMove.to.capturedAt)}.`
          : "No movement between captures can be calculated in this range.",
        firstComponentObservation && latestComponentObservation
          ? `From the first available breakdown (${formatDate(firstComponentObservation.capturedAt)}) to the latest, LUNC’s reported APR contribution changed by ${formatValue({ value: componentLuncDelta!, unit: "percentage_points" })} and USTC’s by ${formatValue({ value: componentUstcDelta!, unit: "percentage_points" })}.`
          : "The selected range does not contain enough source-reported LUNC / USTC breakdown data to compare contributions.",
      ],
      kpiSnapshot: [
        {
          id: "insight.medianApr",
          label: "Median observed APR",
          value: medianApr,
          unit: "percent_points",
          note: `${observations.length} captured readings · ${selectedRangeLabel}`,
        },
        {
          id: "insight.lowestApr",
          label: "Lowest observed APR",
          value: lowest.apr,
          unit: "percent_points",
          note: formatDate(lowest.capturedAt),
        },
        ...(latestBreakdown
          ? [
              {
                id: "insight.luncApr",
                label: "Latest LUNC contribution",
                value: latestBreakdown.lunc,
                unit: "percent_points",
                note: formatDate(latestBreakdown.date),
              },
              {
                id: "insight.ustcApr",
                label: "Latest USTC contribution",
                value: latestBreakdown.ustc,
                unit: "percent_points",
                note: formatDate(latestBreakdown.date),
              },
            ]
          : []),
      ],
      monthlyRows,
      archiveHealth: {
        selectedRangeLabel,
        totalCaptures: captures.length,
        aprObservations: observations.length,
        unresolvedCaptures: eligibleCaptures - observations.length,
        excludedCaptureCount: excludedCaptures.length,
        resolutionRate: captureRate,
        uniqueObservationDates: new Set(
          observations.map((observation) => observation.observedDate),
        ).size,
        duplicateDateCaptures,
        breakdownObservations: componentObservations.length,
        largestGap,
        coverageStart: first.capturedAt,
        coverageEnd: latest.capturedAt,
        currentReferenceGapDays,
      },
      captureRows: [...captures].reverse(),
      latestBreakdown,
      method: {
        metricDefinition:
          "Aggregate Terra Classic Staking APR displayed on Validator Info’s network page. Archived numbers are shown as published and are not recalculated from on-chain inputs.",
        dataWindow: `${formatDateTime(first.capturedAt)} → ${formatDateTime(latest.capturedAt)} · ${observations.length} APR observations · ${captures.length} CDX captures${currentReference ? ` · separate current reference: ${formatApr(currentReference.apr)} on ${formatDate(currentReference.observedDate)}` : ""}`,
        notes: [
          ...snapshot.notes,
          ...(currentReference
            ? [`${currentReference.sourceLabel}: ${currentReference.evidence} This is a separate reference point, not a Wayback capture; it is excluded from archive statistics and monthly medians.`]
            : []),
          ...(duplicateDateCaptures > 0
            ? [`${duplicateDateCaptures} extra capture${duplicateDateCaptures === 1 ? "" : "s"} share an observation date with another capture; all remain in the source table.`]
            : []),
        ],
        cdxSource:
          "https://web.archive.org/cdx/search/cdx?url=validator.info/terra-classic&output=json&filter=statuscode:200&filter=mimetype:text/html",
        sourcePageUrl: "https://validator.info/terra-classic",
        onchainDocsUrl:
          "https://docs.terra.money/develop/terrad/commands/queries/mint/terrad_query_mint_annual-provisions/",
        latestArchiveUrl: latest.archiveUrl,
      },
    },
  };
}

export type StakingAprView = ReturnType<typeof selectStakingApr>;
