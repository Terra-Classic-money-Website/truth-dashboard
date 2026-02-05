import { useState } from "react";
import Card from "../components/Card";
import SnapshotErrorPanel from "../components/SnapshotErrorPanel";
import TimeSeriesChart from "../components/charts/TimeSeriesChart";
import { formatTableValue, formatValue } from "../data/format";
import { getSnapshot } from "../data/loadSnapshot";
import { selectCommunityPool } from "../data/selectors";
import PageHeader from "../components/PageHeader";

export default function CommunityPool() {
  const { data: snapshot, error } = getSnapshot("community-pool");
  const [windowId, setWindowId] = useState<string>("all");

  if (!snapshot) {
    return <SnapshotErrorPanel error={error} />;
  }

  const view = selectCommunityPool(snapshot, windowId);
  const overviewLookup = Object.fromEntries(
    view.overviewKpis.map((kpi) => [kpi.id, kpi]),
  );
  const totalOutflow = overviewLookup["kpi.totalOutflow"] ?? null;
  const idleWeeks = overviewLookup["kpi.idleWeeks"] ?? null;

  const totalOutflowBlocks = [
    { label: "LUNC", kpi: totalOutflow },
    { label: "USTC", kpi: null },
    { label: "COMBINED", kpi: totalOutflow },
  ];

  const idleWeekBlocks = [
    { label: "LUNC", kpi: idleWeeks },
    { label: "USTC", kpi: null },
    { label: "COMBINED", kpi: idleWeeks },
  ];

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
            Filters metrics, chart, and outflow table without changing the cached
            build.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {view.windows.map((window) => (
            <button
              key={window.id}
              type="button"
              className="rounded-full border border-slate-800 px-4 py-2 text-xs uppercase tracking-wider text-slate-300"
              onClick={() => setWindowId(window.id)}
            >
              {window.label}
            </button>
          ))}
        </div>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {view.kpiTiles.map((kpi) => (
          <Card key={kpi.id} className="p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500">
              {kpi.label}
            </div>
            <div className="mt-2 text-lg font-semibold text-white">
              {formatValue({ value: kpi.value, unit: kpi.unit, scale: kpi.scale })}
            </div>
            {kpi.note ? (
              <div className="mt-1 text-xs text-slate-500">{kpi.note}</div>
            ) : null}
          </Card>
        ))}
      </section>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Community Pool Balance (History)
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Outflow markers highlight periods with governance spend outflows.
            </p>
          </div>
        </div>
        <div className="mt-6">
          <TimeSeriesChart series={view.balanceSeries} height={320} />
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Community Pool Spend Outflows
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Based on governance spend records (CSV) and mapped to the analysis
              window.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span>
              Outflow summary:{" "}
              {totalOutflow
                ? formatValue({
                    value: totalOutflow.value,
                    unit: totalOutflow.unit,
                    scale: totalOutflow.scale,
                  })
                : "—"}
            </span>
            <label className="flex items-center gap-2">
              <input type="checkbox" disabled />
              Show unmapped
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked disabled />
              Show low-confidence
            </label>
          </div>
        </div>
        <div className="mt-4 text-sm text-slate-500">
          Outflow warning placeholder.
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                {view.spendOutflowsTable.columns.map((column) => (
                  <th key={column.key} className="px-4 py-3">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {view.spendOutflowsTable.rows.map((row, index) => (
                <tr key={`${row.period}-${index}`} className="align-top">
                  {view.spendOutflowsTable.columns.map((column) => (
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
        <div>
          <h2 className="text-lg font-semibold text-white">Overview</h2>
          <p className="mt-1 text-sm text-slate-400">
            Totals are derived from period deltas in the canonical dataset.
          </p>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
              Total outflow
              <span className="rounded-full bg-slate-950/70 px-2 py-0.5 text-xs uppercase tracking-wider text-slate-400">
                Coarse (weekly)
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {totalOutflowBlocks.map(({ label, kpi }) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                >
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    {label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {kpi
                      ? formatValue({
                          value: kpi.value,
                          unit: kpi.unit,
                          scale: kpi.scale,
                        })
                      : "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
              Idle weeks (zero outflow)
              <span className="rounded-full bg-slate-950/70 px-2 py-0.5 text-xs uppercase tracking-wider text-slate-400">
                Coarse (weekly)
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {idleWeekBlocks.map(({ label, kpi }) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                >
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    {label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {kpi
                      ? formatValue({
                          value: kpi.value,
                          unit: kpi.unit,
                          scale: kpi.scale,
                        })
                      : "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 lg:col-span-2">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
              Longest inactivity streak (weeks)
              <span className="rounded-full bg-slate-950/70 px-2 py-0.5 text-xs uppercase tracking-wider text-slate-400">
                Coarse (weekly)
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {["LUNC", "USTC", "COMBINED"].map((label) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                >
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    {label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">—</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Capital utilization</h2>
          <p className="text-sm text-slate-400">
            Utilization and inactivity metrics computed from weekly spend buckets
            in the active window.
          </p>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-sm font-semibold text-white">
                Utilization rate (%/yr)
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  ["LUNC", "—"],
                  ["USTC", "—"],
                  ["COMBINED", "—"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-sm font-semibold text-white">
                Typical inactivity (median / p90)
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  ["LUNC", "—"],
                  ["USTC", "—"],
                  ["COMBINED", "—"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-sm font-semibold text-white">Idle weeks share</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  ["LUNC", "—"],
                  ["USTC", "—"],
                  ["COMBINED", "—"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-sm font-semibold text-white">
                Median gap between spends
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  ["LUNC", "—"],
                  ["USTC", "—"],
                  ["COMBINED", "—"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Spend concentration</h2>
          <p className="text-sm text-slate-400">
            How much weekly governance spend is concentrated into a small number
            of weeks.
          </p>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-sm font-semibold text-white">
                Top spend share (1/3/5)
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  ["LUNC", "—"],
                  ["USTC", "—"],
                  ["COMBINED", "—"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-sm font-semibold text-white">Gini coefficient</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  ["LUNC", "—"],
                  ["USTC", "—"],
                  ["COMBINED", "—"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-sm font-semibold text-white">
                80/20 spend weeks
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  ["LUNC", "—"],
                  ["USTC", "—"],
                  ["COMBINED", "—"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-sm font-semibold text-white">Bursty index</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  ["LUNC", "—"],
                  ["USTC", "—"],
                  ["COMBINED", "—"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>






    </div>
  );
}
