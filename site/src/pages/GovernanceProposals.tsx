import { useMemo, useState } from "react";
import Card from "../components/Card";
import { formatTableValue } from "../data/format";
import { selectGovernanceProposals } from "../data/selectors";
import PageHeader from "../components/PageHeader";

type ProposalRow = {
  id: number;
  title: string;
  type: string;
  status: string;
  votes: string;
  delegators: number;
  endDate: string;
  endDateMs: number;
};

export default function GovernanceProposals() {
  const view = selectGovernanceProposals();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("endDate");
  const [status, setStatus] = useState("all");
  const [descending, setDescending] = useState(true);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = view.table.rows as ProposalRow[];

    if (status !== "all") {
      result = result.filter((row) => row.status.toLowerCase() === status);
    }

    if (q) {
      result = result.filter((row) => {
        return (
          String(row.id).includes(q) ||
          row.title.toLowerCase().includes(q) ||
          row.type.toLowerCase().includes(q)
        );
      });
    }

    const sorted = [...result].sort((a, b) => {
      if (sortBy === "id") {
        return a.id - b.id;
      }
      if (sortBy === "delegators") {
        return a.delegators - b.delegators;
      }
      return a.endDateMs - b.endDateMs;
    });

    if (descending) {
      sorted.reverse();
    }

    return sorted;
  }, [descending, query, sortBy, status, view.table.rows]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Terra Classic Governance"
        title={view.header.title}
        subtitle={view.header.subtitle}
      />

      <Card>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-500">
              Search
            </label>
            <input
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
              placeholder="Search by id, title, type..."
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-500">
              Sort
            </label>
            <select
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              {view.filters.sortOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-500">
              Status
            </label>
            <select
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              {view.filters.statusOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={descending}
              onChange={(event) => setDescending(event.target.checked)}
            />
            Descending
          </label>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-white">{view.table.title}</h2>
          <span className="text-xs text-slate-500">Table note placeholder</span>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                {view.table.columns.map((column) => (
                  <th key={column.key} className="px-4 py-3">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="text-slate-300">
                  {view.table.columns.map((column) => (
                    <td key={column.key} className="px-4 py-3">
                      {formatTableValue(
                        row[column.key as keyof typeof row],
                        column.unit,
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
