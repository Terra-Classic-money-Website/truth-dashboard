import type { CommunityPoolSnapshot } from "../contracts";
import { filterPointsByWindow } from "../format";

export function selectCommunityPool(
  snapshot: CommunityPoolSnapshot,
  windowId?: string,
) {
  const selectedWindow = snapshot.timeWindows.find(
    (window) => window.id === windowId,
  );

  const balanceLunc = snapshot.data.series.poolBalanceLunc;
  const balanceUstc = snapshot.data.series.poolBalanceUstc;

  const balanceSeries = [
    {
      label: balanceLunc.label,
      unit: balanceLunc.unit,
      scale: balanceLunc.scale,
      cadence: balanceLunc.cadence,
      points: filterPointsByWindow(
        balanceLunc.points,
        selectedWindow,
        snapshot.coverage.end,
      ),
    },
    {
      label: balanceUstc.label,
      unit: balanceUstc.unit,
      scale: balanceUstc.scale,
      cadence: balanceUstc.cadence,
      points: filterPointsByWindow(
        balanceUstc.points,
        selectedWindow,
        snapshot.coverage.end,
      ),
    },
  ];

  return {
    header: {
      title: snapshot.title,
      subtitle: snapshot.subtitle ?? "",
    },
    windows: snapshot.timeWindows,
    balanceSeries,
    kpiTiles: snapshot.data.kpiTiles,
    spendOutflowsTable: snapshot.data.tables.spendOutflows,
    overviewKpis: snapshot.data.derivedBlocks.overviewKpis,
  };
}
