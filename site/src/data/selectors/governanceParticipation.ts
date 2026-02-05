import type { GovernanceParticipationSnapshot } from "../contracts";
import { filterPointsByWindow } from "../format";

export function selectGovernanceParticipation(
  snapshot: GovernanceParticipationSnapshot,
  windowId?: string,
) {
  const selectedWindow = snapshot.timeWindows.find(
    (window) => window.id === windowId,
  );
  const series = snapshot.data.series.nonParticipationDistribution;
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
    kpiGrid: snapshot.data.kpiGrid,
    statementCards: snapshot.data.statementCards,
    table: snapshot.data.tables.validatorsOver60,
    series: [
      {
        label: series.label,
        unit: series.unit,
        scale: series.scale,
        cadence: series.cadence,
        points: filteredPoints,
      },
    ],
  };
}
