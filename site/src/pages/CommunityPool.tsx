import { useMemo, useState } from "react";
import Card from "../components/Card";
import SnapshotErrorPanel from "../components/SnapshotErrorPanel";
import CommunityPoolBalanceChart from "../components/charts/CommunityPoolBalanceChart";
import { formatTableValue, formatValue } from "../data/format";
import { getSnapshot } from "../data/loadSnapshot";
import { selectCommunityPool } from "../data/selectors";
import PageHeader from "../components/PageHeader";

export default function CommunityPool() {
  const { data: snapshot, error } = getSnapshot("community-pool");
  const [windowId, setWindowId] = useState<string>("ALL");
  const [showLowConfidence, setShowLowConfidence] = useState<boolean>(true);

  if (!snapshot) {
    return <SnapshotErrorPanel error={error} />;
  }

  const view = useMemo(
    () => selectCommunityPool(snapshot, windowId, showLowConfidence),
    [snapshot, windowId, showLowConfidence],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Terra Classic Community Pool"
        title={view.header.title}
        subtitle={view.header.subtitle}
      />

      <Card>
        <div>
          <h2 className="text-lg font-semibold text-white">Analysis window</h2>
          <p className="mt-1 text-sm text-slate-400">
            Filter balances, mapped outflow markers, and table rows by marker week.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {view.windows.map((window) => (
            <button
              key={window.id}
              type="button"
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-wider transition ${
                window.id === view.selectedWindow.id
                  ? "border-amber-300 text-amber-200"
                  : "border-slate-800 text-slate-300 hover:border-amber-300 hover:text-amber-200"
              }`}
              onClick={() => setWindowId(window.id)}
            >
              {window.label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Community Pool Balance (History)
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Spend bars are anchored at marker week and represent marker → drop
              intervals.
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={showLowConfidence}
              onChange={(event) => setShowLowConfidence(event.target.checked)}
            />
            Show low-confidence
          </label>
        </div>
        <div className="mt-6">
          <CommunityPoolBalanceChart
            balances={view.balances}
            markers={view.outflowMarkers}
            height={420}
          />
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Community Pool Spend Outflows
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Derived from mapped marker objects (same source as chart bars).
            </p>
          </div>
          <div className="text-xs text-slate-400">{view.outflowSummaryText}</div>
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
            <tbody className="text-slate-300">
              {view.table.rows.map((row) => (
                <tr key={row.period} className="align-top">
                  {view.table.columns.map((column) => (
                    <td key={column.key} className="px-4 py-3">
                      {column.key === "title" && row.lowConfidence ? (
                        <div className="space-y-1">
                          <div>{row.title}</div>
                          <span className="inline-flex rounded bg-amber-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-200">
                            Low conf
                          </span>
                        </div>
                      ) : (
                        formatTableValue(row[column.key as keyof typeof row] as string | number, column.unit)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {view.table.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={view.table.columns.length}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    No mapped outflow markers in this window.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-white">Overview</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">Total outflow (LUNC)</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {formatValue({ value: view.overview.totalOutflowLunc, unit: "lunc", scale: 1e9 })}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">Total outflow (USTC)</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {formatValue({ value: view.overview.totalOutflowUstc, unit: "ustc", scale: 1e9 })}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">Idle weeks</p>
            <p className="mt-2 text-lg font-semibold text-white">{view.overview.idleWeeks}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">Mapped markers</p>
            <p className="mt-2 text-lg font-semibold text-white">{view.overview.markerCount}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
