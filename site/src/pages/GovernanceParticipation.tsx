import { useState } from "react";
import Card from "../components/Card";
import SnapshotErrorPanel from "../components/SnapshotErrorPanel";
import TimeSeriesChart from "../components/charts/TimeSeriesChart";
import { formatTableValue, formatValue } from "../data/format";
import { getSnapshot } from "../data/loadSnapshot";
import { selectGovernanceParticipation } from "../data/selectors";
import PageHeader from "../components/PageHeader";

export default function GovernanceParticipation() {
  const { data: snapshot, error } = getSnapshot("governance-participation");
  const [windowId, setWindowId] = useState<string>("all");

  if (!snapshot) {
    return <SnapshotErrorPanel error={error} />;
  }

  const view = selectGovernanceParticipation(snapshot, windowId);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Terra Classic Governance"
        title={view.header.title}
        subtitle={view.header.subtitle}
      />

      <Card>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-slate-500">
            Time window
          </label>
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
        </div>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {view.kpiGrid.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500">
              {item.label}
            </div>
            <div
              className="mt-2 text-lg font-semibold text-white"
            >
              {formatValue({
                value: item.value,
                unit: item.unit,
                scale: item.scale,
              })}
            </div>
          </Card>
        ))}
        {view.statementCards.map((statement) => (
          <Card key={statement.id} className="p-4 lg:col-span-2">
            <div className="text-xs uppercase tracking-wider text-slate-500">
              {statement.title}
            </div>
            <div className="mt-2 text-sm text-slate-300">{statement.body}</div>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold text-white">
            Non-participation distribution
          </h2>
          <div className="mt-3">
            <TimeSeriesChart series={view.series} height={260} />
          </div>
          <div className="mt-3 text-sm text-slate-400">
            Legend placeholder
          </div>
        </Card>
        <Card>
          <h2 className="text-base font-semibold text-white">
            Top 15 by non-participation
          </h2>
          <div className="mt-3 flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/50 text-sm text-slate-500">
            Chart placeholder
          </div>
        </Card>
        <Card>
          <h2 className="text-base font-semibold text-white">
            Overall vote composition
          </h2>
          <div className="mt-3 flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/50 text-sm text-slate-500">
            Chart placeholder
          </div>
        </Card>
        <Card>
          <h2 className="text-base font-semibold text-white">
            Delegators per proposal (top 20)
          </h2>
          <div className="mt-3 flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/50 text-sm text-slate-500">
            Chart placeholder
          </div>
        </Card>
      </section>

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
              {view.table.rows.map((row) => (
                <tr key={row.validator} className="text-slate-300">
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
