import type { ActiveWalletsSnapshot } from "../contracts";
import { filterPointsByWindow } from "../format";

export function selectActiveWallets(
  snapshot: ActiveWalletsSnapshot,
  windowId?: string,
) {
  const selectedWindow = snapshot.timeWindows.find(
    (window) => window.id === windowId,
  );
  const totalSeries = snapshot.data.series.mawTotal;
  const sendersSeries = snapshot.data.series.mawSenders;
  const recipientsSeries = snapshot.data.series.mawRecipients;

  type ActiveSeries =
    ActiveWalletsSnapshot["data"]["series"][keyof ActiveWalletsSnapshot["data"]["series"]];

  const buildSeries = (serie: ActiveSeries) => ({
    label: serie.label,
    unit: serie.unit,
    scale: serie.scale,
    cadence: serie.cadence,
    points: filterPointsByWindow(
      serie.points,
      selectedWindow,
      snapshot.coverage.end,
    ),
  });

  return {
    header: {
      title: snapshot.title,
      subtitle: snapshot.subtitle ?? "",
    },
    windows: snapshot.timeWindows,
    series: [
      buildSeries(totalSeries),
      buildSeries(sendersSeries),
      buildSeries(recipientsSeries),
    ],
    kpiTiles: snapshot.data.kpiTiles,
    insights: snapshot.data.insights,
    tables: snapshot.data.tables,
    extremes: snapshot.data.extremes,
    milestones: snapshot.data.milestones,
    method: snapshot.data.method,
  };
}
