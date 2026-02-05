import type { LuncVolumeSnapshot } from "../contracts";
import { filterPointsByWindow } from "../format";

export function selectLuncVolume(
  snapshot: LuncVolumeSnapshot,
  windowId?: string,
) {
  const selectedWindow = snapshot.timeWindows.find(
    (window) => window.id === windowId,
  );
  const series = snapshot.data.series.volume24hUsd;
  const filteredPoints = filterPointsByWindow(
    series.points,
    selectedWindow,
    snapshot.coverage.end,
  );

  return {
    header: {
      title: snapshot.title,
      subtitle: snapshot.subtitle ?? "",
    },
    windows: snapshot.timeWindows,
    series: [
      {
        label: series.label,
        unit: series.unit,
        scale: series.scale,
        cadence: series.cadence,
        points: filteredPoints,
      },
    ],
    kpiTiles: snapshot.data.kpiTiles,
    tables: snapshot.data.tables,
    notes: snapshot.data.notesBlocks,
  };
}
