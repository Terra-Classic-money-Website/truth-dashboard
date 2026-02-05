import type { GovernanceProposalsSnapshot } from "../contracts";

export function selectGovernanceProposals(snapshot: GovernanceProposalsSnapshot) {
  return {
    header: {
      title: snapshot.title,
      subtitle: snapshot.subtitle ?? "",
    },
    filters: snapshot.data.filters,
    table: snapshot.data.table,
  };
}
