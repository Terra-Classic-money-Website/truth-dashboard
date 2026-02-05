import { useState } from "react";
import Card from "../components/Card";
import SnapshotErrorPanel from "../components/SnapshotErrorPanel";
import { formatTableValue } from "../data/format";
import { getSnapshot } from "../data/loadSnapshot";
import { selectGovernanceValidators } from "../data/selectors";
import PageHeader from "../components/PageHeader";

export default function GovernanceValidators() {
  const { data: snapshot, error } = getSnapshot("governance-validators");
  const [windowId, setWindowId] = useState<string>("all");

  if (!snapshot) {
    return <SnapshotErrorPanel error={error} />;
  }

  const view = selectGovernanceValidators(snapshot, windowId);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Terra Classic Governance"
        title={view.header.title}
        subtitle={view.header.subtitle}
      />

      <Card>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-500">
              Time window
            </label>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {view.windows.map((window) => (
                  <label
                    key={window.id}
                    className="flex items-center gap-2 rounded-full border border-slate-800 px-3 py-2 text-xs uppercase tracking-wider text-slate-300"
                  >
                    <input
                      type="radio"
                      checked={windowId === window.id}
                      onChange={() => setWindowId(window.id)}
                    />
                    {window.label}
                  </label>
                ))}
              </div>
              {view.filters.incomeThresholds.map((threshold) => (
                <label
                  key={threshold.id}
                  className="flex items-center gap-2 text-xs text-slate-400"
                >
                  <input type="checkbox" disabled />
                  {threshold.label}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2" />
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-white">Active validators</h2>
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
              {view.table.rows.map((row) => (
                <tr key={row.rank} className="text-slate-300">
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
