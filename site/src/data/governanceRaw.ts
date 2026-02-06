import participation1y from "./snapshots/governance/terra-classic-governance-participation-1y.json";
import participation2y from "./snapshots/governance/terra-classic-governance-participation-2y.json";
import proposalsRaw from "./snapshots/governance/terra-classic-governance-proposals.json";
import validators1y from "./snapshots/governance/terra-classic-governance-validators-1y.json";
import validators2y from "./snapshots/governance/terra-classic-governance-validators-2y.json";

export type GovernanceWindowId = "1y" | "2y";

export function getParticipationRaw(windowId: GovernanceWindowId) {
  return windowId === "2y" ? participation2y : participation1y;
}

export function getValidatorsRaw(windowId: GovernanceWindowId) {
  return windowId === "2y" ? validators2y : validators1y;
}

export function getProposalsRaw() {
  return proposalsRaw;
}
