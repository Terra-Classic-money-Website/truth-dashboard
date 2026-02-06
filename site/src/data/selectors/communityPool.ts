import type { CommunityPoolSnapshot } from "../contracts";
import { formatValue } from "../format";

type DenomTriplet<T> = {
  lunc: T;
  ustc: T;
  combined: T;
};

type SeriesStats = {
  totalOutflow: number;
  idleWeeks: number;
  longestInactivityStreak: number;
  utilizationRatePct: number | null;
  idleWeeksSharePct: number;
  medianGapWeeks: number | null;
  p90GapWeeks: number | null;
  topShare: { top1: number; top3: number; top5: number } | null;
  eightyTwenty: { weeks: number; pct: number } | null;
  gini: number | null;
  burstyIndex: number | null;
};

function dateInRange(value: string, start: string, end: string) {
  return value >= start && value <= end;
}

function mean(values: number[]) {
  if (!values.length) return null;
  return values.reduce((acc, current) => acc + current, 0) / values.length;
}

function variance(values: number[]) {
  if (!values.length) return null;
  const avg = mean(values);
  if (avg === null) return null;
  return (
    values.reduce((acc, current) => acc + (current - avg) ** 2, 0) / values.length
  );
}

function stdDev(values: number[]) {
  const varValue = variance(values);
  if (varValue === null) return null;
  return Math.sqrt(varValue);
}

function percentile(values: number[], p: number) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function longestZeroStreak(values: number[]) {
  let best = 0;
  let current = 0;
  values.forEach((value) => {
    if (value === 0) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  });
  return best;
}

function gapSeries(values: number[]) {
  const spendIndices = values
    .map((value, index) => (value > 0 ? index : -1))
    .filter((index) => index >= 0);
  if (spendIndices.length < 2) {
    return [];
  }
  const gaps: number[] = [];
  for (let i = 1; i < spendIndices.length; i += 1) {
    gaps.push(spendIndices[i] - spendIndices[i - 1]);
  }
  return gaps;
}

function gini(values: number[]) {
  if (!values.length) return null;
  if (values.length === 1) return 0;
  const total = values.reduce((acc, current) => acc + current, 0);
  if (total === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  let weighted = 0;
  sorted.forEach((value, index) => {
    weighted += (index + 1) * value;
  });
  const n = sorted.length;
  return (2 * weighted) / (n * total) - (n + 1) / n;
}

function computeSeriesStats(
  outflowSeries: number[],
  balanceSeries: Array<number | null>,
): SeriesStats {
  const weeksInWindow = outflowSeries.length;
  const totalOutflow = outflowSeries.reduce((acc, current) => acc + current, 0);
  const idleWeeks = outflowSeries.filter((value) => value === 0).length;
  const longestInactivityStreak = longestZeroStreak(outflowSeries);
  const avgBalance = mean(
    balanceSeries.filter((value): value is number => value !== null),
  );
  const annualizedSpend =
    weeksInWindow > 0 ? totalOutflow * (52 / weeksInWindow) : 0;
  const utilizationRatePct =
    avgBalance && avgBalance > 0 ? (annualizedSpend / avgBalance) * 100 : null;
  const idleWeeksSharePct =
    weeksInWindow > 0 ? (idleWeeks / weeksInWindow) * 100 : 0;

  const gaps = gapSeries(outflowSeries);
  const medianGapWeeks = percentile(gaps, 0.5);
  const p90GapWeeks = percentile(gaps, 0.9);

  const spendWeeks = outflowSeries.filter((value) => value > 0).sort((a, b) => b - a);
  const topShare =
    totalOutflow > 0
      ? {
          top1: ((spendWeeks[0] ?? 0) / totalOutflow) * 100,
          top3:
            (spendWeeks.slice(0, 3).reduce((acc, current) => acc + current, 0) /
              totalOutflow) *
            100,
          top5:
            (spendWeeks.slice(0, 5).reduce((acc, current) => acc + current, 0) /
              totalOutflow) *
            100,
        }
      : null;

  let eightyTwenty: { weeks: number; pct: number } | null = null;
  if (totalOutflow > 0 && spendWeeks.length > 0) {
    const target = totalOutflow * 0.8;
    let acc = 0;
    let k = 0;
    for (let i = 0; i < spendWeeks.length; i += 1) {
      acc += spendWeeks[i];
      k = i + 1;
      if (acc >= target) break;
    }
    eightyTwenty = {
      weeks: k,
      pct: (k / spendWeeks.length) * 100,
    };
  }

  const activeOutflowSeries = outflowSeries.filter((value) => value > 0);
  const giniCoefficient = gini(activeOutflowSeries);
  const avgOutflow = mean(activeOutflowSeries);
  const stdOutflow = stdDev(activeOutflowSeries);
  const burstyIndex =
    activeOutflowSeries.length >= 2 &&
    avgOutflow !== null &&
    avgOutflow > 0 &&
    stdOutflow !== null
      ? stdOutflow / avgOutflow
      : null;

  return {
    totalOutflow,
    idleWeeks,
    longestInactivityStreak,
    utilizationRatePct,
    idleWeeksSharePct,
    medianGapWeeks,
    p90GapWeeks,
    topShare,
    eightyTwenty,
    gini: giniCoefficient,
    burstyIndex,
  };
}

function asTriplet<T>(factory: (denom: keyof DenomTriplet<unknown>) => T): DenomTriplet<T> {
  return {
    lunc: factory("lunc"),
    ustc: factory("ustc"),
    combined: factory("combined"),
  };
}

export function selectCommunityPool(
  snapshot: CommunityPoolSnapshot,
  windowId = "ALL",
) {
  const selectedWindow =
    snapshot.timeWindows.find((window) => window.id === windowId) ??
    snapshot.timeWindows[snapshot.timeWindows.length - 1];

  const balancesAll = snapshot.data.series.balancesWeekly;
  const balances =
    selectedWindow.weeks && selectedWindow.weeks > 0
      ? balancesAll.slice(-selectedWindow.weeks)
      : balancesAll;
  const start = balances[0]?.t ?? snapshot.coverage.start;
  const end = balances[balances.length - 1]?.t ?? snapshot.coverage.end;

  const outflowMarkers = snapshot.data.series.outflowsWeekly.filter((marker) => {
    if (!dateInRange(marker.markerTime, start, end)) {
      return false;
    }
    return true;
  });

  const markerByTime = new Map(outflowMarkers.map((marker) => [marker.markerTime, marker]));

  const weeklyLuncOutflow = balances.map(
    (balance) => markerByTime.get(balance.t)?.lunc?.amount ?? 0,
  );
  const weeklyUstcOutflow = balances.map(
    (balance) => markerByTime.get(balance.t)?.ustc?.amount ?? 0,
  );
  const weeklyCombinedOutflow = balances.map(
    (_, index) => weeklyLuncOutflow[index] + weeklyUstcOutflow[index],
  );

  const luncBalanceSeries = balances.map((point) => point.lunc);
  const ustcBalanceSeries = balances.map((point) => point.ustc);
  const combinedBalanceSeries = balances.map((point) => {
    if (point.lunc === null && point.ustc === null) return null;
    return (point.lunc ?? 0) + (point.ustc ?? 0);
  });

  const stats = {
    lunc: computeSeriesStats(weeklyLuncOutflow, luncBalanceSeries),
    ustc: computeSeriesStats(weeklyUstcOutflow, ustcBalanceSeries),
    combined: computeSeriesStats(weeklyCombinedOutflow, combinedBalanceSeries),
  };

  const markerImpactPct = (marker: (typeof outflowMarkers)[number]) => {
    const luncImpact =
      marker.lunc?.preBalance && marker.lunc.preBalance > 0
        ? (marker.lunc.amount / marker.lunc.preBalance) * 100
        : 0;
    const ustcImpact =
      marker.ustc?.preBalance && marker.ustc.preBalance > 0
        ? (marker.ustc.amount / marker.ustc.preBalance) * 100
        : 0;
    return luncImpact + ustcImpact;
  };

  const combinedImpact = outflowMarkers
    .map((marker) => markerImpactPct(marker))
    .reduce((acc, current) => Math.max(acc, current), 0);

  const rows = outflowMarkers
    .slice()
    .sort((a, b) => b.markerTime.localeCompare(a.markerTime))
    .map((marker) => {
      const uniqueTitles = Array.from(
        new Set(marker.proposals.map((proposal) => proposal.title).filter(Boolean)),
      );
      const uniqueRecipients = Array.from(
        new Set(marker.proposals.map((proposal) => proposal.recipient).filter(Boolean)),
      );
      return {
        period: `${marker.markerTime} -> ${marker.dropTime ?? "—"}`,
        title:
          uniqueTitles.length <= 1
            ? uniqueTitles[0] ?? "—"
            : `${uniqueTitles[0]} (+${uniqueTitles.length - 1})`,
        recipient:
          uniqueRecipients.length <= 1
            ? uniqueRecipients[0] ?? "—"
            : `${uniqueRecipients[0]} (+${uniqueRecipients.length - 1})`,
        lunc: marker.lunc?.amount ?? 0,
        ustc: marker.ustc?.amount ?? 0,
        impactPct: markerImpactPct(marker),
        lowConfidence: marker.lowConfidence,
      };
    });

  const outflowSummaryText = `Outflow summary: LUNC ${formatValue({
    value: stats.lunc.totalOutflow,
    unit: "lunc",
    scale: 1e9,
  })} | USTC ${formatValue({
    value: stats.ustc.totalOutflow,
    unit: "ustc",
    scale: 1e9,
  })} | Max impact LUNC/USTC combined ${combinedImpact.toFixed(2)}% | Count ${
    outflowMarkers.length
  }`;

  return {
    header: {
      title: snapshot.title,
      subtitle: snapshot.subtitle ?? "",
    },
    windows: snapshot.timeWindows,
    selectedWindow,
    balances,
    outflowMarkers,
    table: {
      columns: [
        { key: "period", label: "Period", type: "text" as const },
        { key: "title", label: "Title", type: "text" as const },
        { key: "recipient", label: "Recipient", type: "text" as const },
        { key: "lunc", label: "LUNC", type: "number" as const, unit: "lunc" },
        { key: "ustc", label: "USTC", type: "number" as const, unit: "ustc" },
        { key: "impactPct", label: "Impact %", type: "number" as const, unit: "percent" },
      ],
      rows,
    },
    outflowSummaryText,
    overview: {
      totalOutflow: asTriplet((denom) => stats[denom].totalOutflow),
      idleWeeks: asTriplet((denom) => stats[denom].idleWeeks),
      longestInactivityStreak: asTriplet(
        (denom) => stats[denom].longestInactivityStreak,
      ),
    },
    capitalUtilization: {
      utilizationRatePct: asTriplet((denom) => stats[denom].utilizationRatePct),
      idleWeeksSharePct: asTriplet((denom) => stats[denom].idleWeeksSharePct),
      typicalInactivity: asTriplet((denom) => ({
        median: stats[denom].medianGapWeeks,
        p90: stats[denom].p90GapWeeks,
      })),
      medianGapWeeks: asTriplet((denom) => stats[denom].medianGapWeeks),
    },
    spendConcentration: {
      topSpendShare: asTriplet((denom) => stats[denom].topShare),
      eightyTwentySpendWeeks: asTriplet((denom) => stats[denom].eightyTwenty),
      giniCoefficient: asTriplet((denom) => stats[denom].gini),
      burstyIndex: asTriplet((denom) => stats[denom].burstyIndex),
    },
  };
}
