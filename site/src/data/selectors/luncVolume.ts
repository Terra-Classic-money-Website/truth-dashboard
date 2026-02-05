import type { LuncVolumeSnapshot } from "../contracts";

export function selectLuncVolume(
  snapshot: LuncVolumeSnapshot,
  windowId?: string,
) {
  const selectedWindow = snapshot.timeWindows.find(
    (window) => window.id === windowId,
  );
  const series = snapshot.data.series.volume24hUsd;
  const filteredPoints = (() => {
    if (!selectedWindow || !selectedWindow.days) {
      return series.points;
    }
    const end = new Date(`${snapshot.coverage.end}T00:00:00Z`);
    const start = new Date(end);
    start.setDate(start.getDate() - selectedWindow.days + 1);
    return series.points.filter((point) => {
      const pointDate = new Date(`${point.t}T00:00:00Z`);
      return pointDate >= start && pointDate <= end;
    });
  })();

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
        points: filteredPoints,
      },
    ],
    kpiTiles: snapshot.data.kpiTiles,
  };
}
