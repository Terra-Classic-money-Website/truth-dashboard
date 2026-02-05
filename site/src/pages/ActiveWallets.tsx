import { useState } from "react";
import Card from "../components/Card";
import SnapshotErrorPanel from "../components/SnapshotErrorPanel";
import TimeSeriesChart from "../components/charts/TimeSeriesChart";
import {
  formatDelta,
  formatNumber,
  formatPercent,
  formatTableValue,
  formatValue,
} from "../data/format";
import { getSnapshot } from "../data/loadSnapshot";
import { selectActiveWallets } from "../data/selectors";
import PageHeader from "../components/PageHeader";

export default function ActiveWallets() {
  const [windowId, setWindowId] = useState<string>("all");
  const { data: snapshot, error } = getSnapshot("active-wallets");

  if (!snapshot) {
    return <SnapshotErrorPanel error={error} />;
  }

  const view = selectActiveWallets(snapshot, windowId);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Terra Classic On-Chain Activity"
        title={view.header.title}
        subtitle={view.header.subtitle}
      />

      <div className="flex flex-wrap gap-3">
        {["2 Years", "3 Years", "All"].map((label) => (
          <button
            key={label}
            className="rounded-full border border-slate-800 px-4 py-2 text-xs uppercase tracking-wider text-slate-300 hover:border-amber-300 hover:text-amber-200 transition"
            type="button"
            onClick={() =>
              setWindowId(
                label === "All" ? "all" : label === "2 Years" ? "2y" : "3y",
              )
            }
          >
            {label}
          </button>
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Participants</h2>
            <p className="mt-1 text-sm text-slate-400">
              Unique terra1 addresses per month
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="h-2 w-2 rounded-full bg-amber-300 shadow-sm" />
            Active wallets
          </div>
        </div>
        <div className="mt-6">
          <TimeSeriesChart series={view.series} height={320} />
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
            {kpi.delta ? (
              <div className="mt-1 text-xs text-slate-400">
                {formatDelta(kpi.delta)}
              </div>
            ) : null}
          </Card>
        ))}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Insights &amp; Health</h2>
          <p className="mt-1 text-sm text-slate-400">
            Derived from monthly unique active wallet counts (senders + recipients).
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="text-base font-semibold text-white">Key Highlights</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-400 list-disc list-inside">
              {view.insights.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
          <Card>
            <h3 className="text-base font-semibold text-white">KPI Snapshot</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {view.insights.kpiSnapshot.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
                >
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {formatValue({
                      value: item.value,
                      unit: item.unit,
                      scale: item.scale,
                    })}
                  </p>
                  {item.note ? (
                    <p className="mt-1 text-xs text-slate-500">{item.note}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="text-base font-semibold text-white">Year Summary</h3>
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    {view.tables.yearSummary.columns.map((column) => (
                      <th key={column.key} className="px-4 py-3">
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {view.tables.yearSummary.rows.map((row) => (
                    <tr key={row.year} className="text-slate-300">
                      {view.tables.yearSummary.columns.map((column) => (
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
            <h3 className="text-base font-semibold text-white">Quarterly Summary</h3>
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    {view.tables.quarterlySummary.columns.map((column) => (
                      <th key={column.key} className="px-4 py-3">
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {view.tables.quarterlySummary.rows.map((row) => (
                    <tr key={row.quarter} className="text-slate-300">
                      {view.tables.quarterlySummary.columns.map((column) => (
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

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="text-base font-semibold text-white">
              Extremes &amp; Turning Points
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-sm font-semibold text-white">Top 5 months</p>
                <ul className="mt-3 space-y-1 text-sm text-slate-400 list-disc list-inside">
                  {view.extremes.topMonths.map((item) => (
                    <li key={item.label}>
                      {item.label}: {formatTableValue(item.value, "count")}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-sm font-semibold text-white">Bottom 5 months</p>
                <ul className="mt-3 space-y-1 text-sm text-slate-400 list-disc list-inside">
                  {view.extremes.bottomMonths.map((item) => (
                    <li key={item.label}>
                      {item.label}: {formatTableValue(item.value, "count")}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-sm font-semibold text-white">
                  Largest MoM increase
                </p>
                <p className="mt-3 text-sm text-slate-300">
                  {view.extremes.largestMoMIncrease.label} (
                  {formatTableValue(view.extremes.largestMoMIncrease.abs, "count")}{" "}
                  | {formatPercent(view.extremes.largestMoMIncrease.pct)})
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-sm font-semibold text-white">
                  Largest MoM decrease
                </p>
                <p className="mt-3 text-sm text-slate-300">
                  {view.extremes.largestMoMDecrease.label} (
                  {formatTableValue(view.extremes.largestMoMDecrease.abs, "count")}{" "}
                  | {formatPercent(view.extremes.largestMoMDecrease.pct)})
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-sm font-semibold text-white">
                  Max drawdown &amp; recovery
                </p>
                <p className="mt-3 text-sm text-slate-300">
                  Drawdown: {formatPercent(view.extremes.drawdownRecovery.drawdownPct)} (
                  {view.extremes.drawdownRecovery.from} →{" "}
                  {view.extremes.drawdownRecovery.to})
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Recovery time:{" "}
                  {view.extremes.drawdownRecovery.recovered
                    ? "Recovered within dataset"
                    : "Not recovered within dataset"}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <h3 className="text-base font-semibold text-white">
              Threshold &amp; Milestone Tracker
            </h3>
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Threshold</th>
                    <th className="px-4 py-3">First month below</th>
                    <th className="px-4 py-3">Months below</th>
                    <th className="px-4 py-3">Most recent below</th>
                  </tr>
                </thead>
                <tbody>
                  {view.milestones.thresholds.map((row) => (
                    <tr key={row.threshold} className="text-slate-300">
                      <td className="px-4 py-3">
                        {formatNumber(row.threshold)}
                      </td>
                      <td className="px-4 py-3">{row.firstReached}</td>
                      <td className="px-4 py-3">—</td>
                      <td className="px-4 py-3">{row.lastSeen}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="text-base font-semibold text-white">
              Seasonality Snapshot
            </h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div className="text-sm text-slate-400">
                Snapshot does not include seasonality data.
              </div>
            </div>
          </Card>
          <Card>
            <h3 className="text-base font-semibold text-white">
              Method &amp; Confidence
            </h3>
            <div className="mt-3 space-y-2 text-sm text-slate-400">
              <p>
                <strong className="text-slate-200">Source:</strong>{" "}
                {view.method.source} FCD endpoint.
              </p>
              <p>
                <strong className="text-slate-200">Metric definition:</strong>{" "}
                {view.method.metricDefinition}
              </p>
              <p>
                <strong className="text-slate-200">Data window:</strong>{" "}
                {view.method.dataWindow}
              </p>
              {view.method.notes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
