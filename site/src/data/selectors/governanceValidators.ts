import type { GovernanceValidatorsSnapshot } from "../contracts";

export function selectGovernanceValidators(
  snapshot: GovernanceValidatorsSnapshot,
  windowId?: string,
) {
  const selectedWindow = snapshot.timeWindows.find(
    (window) => window.id === windowId,
  );

  return {
    header: {
      title: snapshot.title,
      subtitle: snapshot.subtitle ?? "",
    },
    windows: snapshot.timeWindows,
    selectedWindow,
    filters: snapshot.data.filters,
    table: snapshot.data.table,
  };
}
