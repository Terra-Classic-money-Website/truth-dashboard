import { getValidatorsRaw, type GovernanceWindowId } from "../governanceRaw";

function asNumber(value: unknown) {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

export function selectGovernanceValidators(windowId: GovernanceWindowId) {
  const raw = getValidatorsRaw(windowId);
  const rows = raw.payload.rows ?? [];

  return {
    header: {
      title: "Current validators dashboard",
      subtitle: "Active validator set from validator.info (offline snapshot).",
    },
    windows: [
      { id: "2y", label: "Last 2 years" },
      { id: "1y", label: "Last year" },
    ],
    filters: {
      incomeThresholds: [{ id: "gt100", label: "Income > $100", minUsd: 100 }],
    },
    table: {
      id: "tbl.validators",
      title: "Active validators",
      columns: [
        { key: "rank", label: "Rank", type: "number", unit: "count" },
        { key: "validator", label: "Validator", type: "text" },
        {
          key: "votingPower",
          label: "Voting power",
          type: "number",
          unit: "percent",
        },
        { key: "delegators", label: "Delegators", type: "number", unit: "count" },
        {
          key: "incomeMonthlyUsd",
          label: "Income (monthly)",
          type: "number",
          unit: "usd",
        },
        {
          key: "didNotVote1y",
          label: "Did not vote (1Y)",
          type: "number",
          unit: "percent",
        },
        {
          key: "didNotVote2y",
          label: "Did not vote (2Y)",
          type: "number",
          unit: "percent",
        },
        { key: "yes", label: "YES", type: "number", unit: "percent" },
        { key: "no", label: "NO", type: "number", unit: "percent" },
        { key: "abstain", label: "ABSTAIN", type: "number", unit: "percent" },
        {
          key: "noWithVeto",
          label: "NO WITH VETO",
          type: "number",
          unit: "percent",
        },
      ],
      rows: rows.map((row) => ({
        rank: asNumber(row.rank),
        validator: String(row.name ?? ""),
        votingPower: asNumber(row.votingPowerShare),
        delegators: asNumber(row.delegators),
        incomeMonthlyUsd: asNumber(row.incomeMonthlyUsd),
        didNotVote1y: asNumber(row.didNotVote1y),
        didNotVote2y: asNumber(row.didNotVote2y),
        yes: asNumber(row.yes),
        no: asNumber(row.no),
        abstain: asNumber(row.abstain),
        noWithVeto: asNumber(row.veto),
      })),
    },
  };
}
