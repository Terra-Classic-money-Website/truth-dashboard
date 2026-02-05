import { useState } from "react";
import Card from "../components/Card";
import SnapshotErrorPanel from "../components/SnapshotErrorPanel";
import TimeSeriesChart from "../components/charts/TimeSeriesChart";
import { formatDelta, formatTableValue, formatValue } from "../data/format";
import { getSnapshot } from "../data/loadSnapshot";
import { selectLuncVolume } from "../data/selectors";
import PageHeader from "../components/PageHeader";

export default function Volume() {
  const { data: snapshot, error } = getSnapshot("lunc-volume");
  const [windowId, setWindowId] = useState<string>("all");

  if (!snapshot) {
    return <SnapshotErrorPanel error={error} />;
  }

  const view = selectLuncVolume(snapshot, windowId);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Terra Classic Off-Chain Activity"
        title={view.header.title}
        subtitle={view.header.subtitle}
      />

      <div className="flex flex-wrap gap-3">
        {view.windows.map((window) => (
          <button
            key={window.id}
            type="button"
            className="rounded-full border border-slate-800 px-4 py-2 text-xs uppercase tracking-wider text-slate-300 hover:border-amber-300 hover:text-amber-200 transition"
            onClick={() => setWindowId(window.id)}
          >
            {window.label}
          </button>
        ))}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {view.kpiTiles.map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500">
              {kpi.label}
            </div>
            <div className="mt-2 text-lg font-semibold text-white">
              {formatValue({ value: kpi.value, unit: kpi.unit, scale: kpi.scale })}
            </div>
            {kpi.note ? (
              <div className="mt-1 text-xs text-slate-500">{kpi.note}</div>
            ) : null}
            {kpi.delta ? (
              <div className="mt-1 text-xs text-slate-400">
                {formatDelta(kpi.delta)}
              </div>
            ) : null}
          </Card>
        ))}
      </section>

      <Card>
        <TimeSeriesChart series={view.series} height={320} />
      </Card>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-white">
            {view.tables.venueBreakdown.title}
          </h2>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                {view.tables.venueBreakdown.columns.map((column) => (
                  <th key={column.key} className="px-4 py-3">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {view.tables.venueBreakdown.rows.map((row) => (
                <tr key={row.exchange} className="text-slate-300">
                  {view.tables.venueBreakdown.columns.map((column) => (
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

      <Card>
        <h2 className="text-base font-semibold text-white">Market notes</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-400">
          {view.notes.marketNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
