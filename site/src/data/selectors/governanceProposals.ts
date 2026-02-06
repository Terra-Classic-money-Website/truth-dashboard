import { getProposalsRaw } from "../governanceRaw";

function asNumber(value: unknown) {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function voteSummary(row: {
  yesPct?: number;
  noPct?: number;
  abstainPct?: number;
  vetoPct?: number;
}) {
  const yes = asNumber(row.yesPct).toFixed(1);
  const no = asNumber(row.noPct).toFixed(1);
  const abstain = asNumber(row.abstainPct).toFixed(1);
  const veto = asNumber(row.vetoPct).toFixed(1);
  return `Yes ${yes}% • No ${no}% • Abstain ${abstain}% • Veto ${veto}%`;
}

export function selectGovernanceProposals() {
  const raw = getProposalsRaw();
  const rows = raw.payload.rows ?? [];
  const statuses = Array.from(new Set(rows.map((row) => String(row.status ?? "")))).filter(Boolean);

  return {
    header: {
      title: "Proposals dashboard",
      subtitle: "All proposals in voting stage since May 2022 (offline snapshot).",
    },
    filters: {
      sortOptions: [
        { id: "endDate", label: "End date" },
        { id: "id", label: "ID" },
        { id: "delegators", label: "Delegators" },
      ],
      statusOptions: [
        { id: "all", label: "All statuses" },
        ...statuses.map((status) => ({ id: status.toLowerCase(), label: status })),
      ],
    },
    table: {
      id: "tbl.proposals",
      title: "Proposals since May 2022",
      columns: [
        { key: "id", label: "ID", type: "number", unit: "count" },
        { key: "title", label: "Title", type: "text" },
        { key: "type", label: "Type", type: "text" },
        { key: "status", label: "Status", type: "text" },
        { key: "votes", label: "Votes distribution", type: "text" },
        { key: "delegators", label: "Delegators", type: "number", unit: "count" },
        { key: "endDate", label: "End date", type: "text" },
      ],
      rows: rows.map((row) => ({
        id: asNumber(row.id),
        title: String(row.title ?? ""),
        type: String(row.type ?? ""),
        status: String(row.status ?? ""),
        votes: voteSummary(row),
        delegators: asNumber(row.delegators),
        endDate: String(row.endDate ?? ""),
        endDateMs: asNumber(row.endDateMs),
      })),
    },
  };
}
