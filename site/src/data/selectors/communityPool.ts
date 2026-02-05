import type { CommunityPoolSnapshot } from "../contracts";
import { formatValue } from "../format";

function dateInRange(value: string, start: string, end: string) {
  return value >= start && value <= end;
}

export function selectCommunityPool(
  snapshot: CommunityPoolSnapshot,
  windowId = "ALL",
  showLowConfidence = true,
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
    if (!showLowConfidence && marker.lowConfidence) {
      return false;
    }
    return true;
  });

  const luncTotal = outflowMarkers.reduce(
    (acc, marker) => acc + (marker.lunc?.amount ?? 0),
    0,
  );
  const ustcTotal = outflowMarkers.reduce(
    (acc, marker) => acc + (marker.ustc?.amount ?? 0),
    0,
  );
  const combinedImpact = outflowMarkers
    .map((marker) => marker.combinedImpactPct)
    .filter((value): value is number => value !== null)
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
        impactPct: marker.combinedImpactPct ?? 0,
        lowConfidence: marker.lowConfidence,
      };
    });

  const withOutflow = outflowMarkers.filter(
    (marker) => (marker.lunc?.amount ?? 0) + (marker.ustc?.amount ?? 0) > 0,
  ).length;
  const idleWeeks = Math.max(0, balances.length - withOutflow);

  return {
    header: {
      title: snapshot.title,
      subtitle: snapshot.subtitle ?? "",
    },
    windows: snapshot.timeWindows,
    selectedWindow,
    balances,
    outflowMarkers,
    showLowConfidence,
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
    outflowSummaryText: `Outflow summary: LUNC ${formatValue({
      value: luncTotal,
      unit: "lunc",
      scale: 1e9,
    })} | USTC ${formatValue({
      value: ustcTotal,
      unit: "ustc",
      scale: 1e9,
    })} | Max impact LUNC/USTC combined ${combinedImpact.toFixed(2)}% | Count ${
      outflowMarkers.length
    }`,
    overview: {
      totalOutflowLunc: luncTotal,
      totalOutflowUstc: ustcTotal,
      idleWeeks,
      markerCount: outflowMarkers.length,
    },
  };
}
