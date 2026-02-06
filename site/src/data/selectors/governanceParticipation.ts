import { getParticipationRaw, type GovernanceWindowId } from "../governanceRaw";

type KpiId =
  | "kpi.avgYesVotes"
  | "kpi.avgNoVotes"
  | "kpi.avgVetoVotes"
  | "kpi.avgNonParticipation"
  | "kpi.avgNotVoted"
  | "kpi.avgDelegatorsVoting"
  | "kpi.delegatorsShare"
  | "kpi.pctVotesNotVoted"
  | "kpi.pctNoWithVeto"
  | "kpi.validatorsInDataset"
  | "kpi.validatorsOver60"
  | "kpi.validatorsOver70";

const KPI_MAP: Array<{ id: KpiId; unit: "count" | "percent" }> = [
  { id: "kpi.avgYesVotes", unit: "count" },
  { id: "kpi.avgNoVotes", unit: "count" },
  { id: "kpi.avgVetoVotes", unit: "count" },
  { id: "kpi.avgNonParticipation", unit: "count" },
  { id: "kpi.avgNotVoted", unit: "count" },
  { id: "kpi.avgDelegatorsVoting", unit: "count" },
  { id: "kpi.delegatorsShare", unit: "percent" },
  { id: "kpi.pctVotesNotVoted", unit: "percent" },
  { id: "kpi.pctNoWithVeto", unit: "percent" },
  { id: "kpi.validatorsInDataset", unit: "count" },
  { id: "kpi.validatorsOver60", unit: "count" },
  { id: "kpi.validatorsOver70", unit: "count" },
];

function asNumber(value: string | number | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value !== "string") {
    return 0;
  }
  const normalized = value.replace(/[%,$,]/g, "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isoDateFromMonthIndex(index: number) {
  const base = new Date(Date.UTC(2020, 0, 1));
  base.setUTCMonth(base.getUTCMonth() + index);
  const year = base.getUTCFullYear();
  const month = String(base.getUTCMonth() + 1).padStart(2, "0");
  const day = String(base.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function selectGovernanceParticipation(windowId: GovernanceWindowId) {
  const raw = getParticipationRaw(windowId);
  const payload = raw.payload;
  const metricCards = payload.kpis.metric_cards ?? [];
  const tableRows = payload.tables.validators_over_60_non_participation ?? [];
  const chartSeries = payload.data?.chartSeries ?? payload.charts;
  const seriesSource = chartSeries.nonParticipationDistribution;

  const asOf = raw.exported_at.slice(0, 10);

  const kpiGrid = KPI_MAP.map((kpi, index) => ({
    id: kpi.id,
    label: metricCards[index]?.label ?? kpi.id,
    value: asNumber(metricCards[index]?.value),
    unit: kpi.unit,
    asOf,
  }));

  const statementCards = metricCards.slice(15, 18).map((card, index) => ({
    id: `stmt.${index}`,
    title: card.label,
    body: String(card.value ?? ""),
    asOf,
  }));

  return {
    header: {
      title: "Terra Classic Governance Participation",
      subtitle:
        "Governance participation derived from validator.info indexer API (offline snapshot).",
    },
    windows: [
      { id: "2y", label: "Last 2 years" },
      { id: "1y", label: "Last year" },
    ],
    kpiGrid,
    statementCards,
    table: {
      id: "tbl.validatorsOver60",
      title: "Validators with > 60% non-participation",
      columns: [
        { key: "validator", label: "Validator", type: "text" },
        {
          key: "votingPowerShare",
          label: "Voting power share",
          type: "number",
          unit: "percent",
        },
        { key: "yes", label: "YES", type: "number", unit: "percent" },
        { key: "no", label: "NO", type: "number", unit: "percent" },
        {
          key: "noWithVeto",
          label: "NO WITH VETO",
          type: "number",
          unit: "percent",
        },
        {
          key: "abstain",
          label: "ABSTAIN",
          type: "number",
          unit: "percent",
        },
        {
          key: "didNotVote",
          label: "DID NOT VOTE",
          type: "number",
          unit: "percent",
        },
        {
          key: "nonParticipation",
          label: "NON-PARTICIPATION %",
          type: "number",
          unit: "percent",
        },
      ],
      rows: tableRows.map((row) => ({
        validator: row.moniker,
        votingPowerShare: asNumber(row.votingPowerShare),
        yes: asNumber(row.yes),
        no: asNumber(row.no),
        noWithVeto: asNumber(row.veto),
        abstain: asNumber(row.abstain),
        didNotVote: asNumber(row.didNotVote),
        nonParticipation: asNumber(row.nonParticipationPct),
      })),
    },
    series: [
      {
        label: "Non-participation distribution",
        unit: "count",
        cadence: "monthly",
        points: (seriesSource.labels ?? []).map((label, index) => ({
          periodEnd: isoDateFromMonthIndex(index),
          v: asNumber(seriesSource.values?.[index]),
          label,
        })),
      },
    ],
    charts: {
      nonParticipationDistribution: chartSeries.nonParticipationDistribution,
      topNonParticipation: chartSeries.topNonParticipation,
      voteComposition: chartSeries.voteComposition,
      topDelegatorsPerProposal: chartSeries.topDelegatorsPerProposal,
    },
  };
}
