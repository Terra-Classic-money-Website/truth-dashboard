import { useMemo, useState } from "react";
import Card from "../components/Card";
import SnapshotErrorPanel from "../components/SnapshotErrorPanel";
import TimeSeriesChart from "../components/charts/TimeSeriesChart";
import {
  formatNumber,
  formatPercent,
  formatTableValue,
  formatValue,
} from "../data/format";
import { getSnapshot } from "../data/loadSnapshot";
import { selectActiveWallets } from "../data/selectors";
import PageHeader from "../components/PageHeader";
import useViewportWidth from "../hooks/useViewportWidth";

export default function ActiveWallets() {
  const [windowId, setWindowId] = useState<string>("3y");
  const { data: snapshot, error } = getSnapshot("active-wallets");
  const viewportWidth = useViewportWidth();

  if (!snapshot) {
    return <SnapshotErrorPanel error={error} />;
  }

  const view = selectActiveWallets(snapshot, windowId);
  const chartHeight =
    viewportWidth < 640 ? 340 : viewportWidth < 1024 ? 470 : 590;
  const monthlyTicks = useMemo(() => {
    const points = view.series[0]?.points ?? [];
    return points.map((point) => point.periodEnd);
  }, [view.series]);
  const formatMonthLabel = (isoDate: string) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    }).format(new Date(`${isoDate}T00:00:00Z`));

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
              Participants per month based on transaction senders and recipients
              on the Terra Classic L1.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="h-2 w-2 rounded-full bg-amber-300 shadow-sm" />
            Active wallets
          </div>
        </div>
        <div className="mt-6">
          <TimeSeriesChart
            series={view.series}
            height={chartHeight}
            xTicks={monthlyTicks}
            xTickFormatter={formatMonthLabel}
            minXTickGap={48}
          />
        </div>
      </Card>

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
            <div className="section-scroll-x mt-3 rounded-xl border border-slate-800">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    {view.tables.yearSummary.columns.map((column) => (
                      <th key={column.key} className="px-4 py-3 whitespace-nowrap">
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {view.tables.yearSummary.rows.map((row) => (
                    <tr key={row.year} className="text-slate-300">
                      {view.tables.yearSummary.columns.map((column) => (
                        <td key={column.key} className="px-4 py-3 whitespace-nowrap">
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
            <div className="section-scroll-x mt-3 rounded-xl border border-slate-800">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    {view.tables.quarterlySummary.columns.map((column) => (
                      <th key={column.key} className="px-4 py-3 whitespace-nowrap">
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {view.tables.quarterlySummary.rows.map((row) => (
                    <tr key={row.quarter} className="text-slate-300">
                      {view.tables.quarterlySummary.columns.map((column) => (
                        <td key={column.key} className="px-4 py-3 whitespace-nowrap">
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
              </div>
            </div>
          </Card>
          <Card>
            <h3 className="text-base font-semibold text-white">
              Threshold &amp; Milestone Tracker
            </h3>
            <div className="section-scroll-x mt-3 rounded-xl border border-slate-800">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 whitespace-nowrap">Threshold</th>
                    <th className="px-4 py-3 whitespace-nowrap">First month below</th>
                    <th className="px-4 py-3 whitespace-nowrap">Months below</th>
                    <th className="px-4 py-3 whitespace-nowrap">Most recent below</th>
                  </tr>
                </thead>
                <tbody>
                  {view.milestones.thresholds.map((row) => (
                    <tr key={row.threshold} className="text-slate-300">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatNumber(row.threshold)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{row.firstReached}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{row.monthsBelow}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{row.lastSeen}</td>
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
            <div className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {view.seasonality.rows.map((row) => (
                <div key={row.month} className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">{row.month}</span>
                  <span
                    className={[
                      "text-sm font-semibold",
                      row.isMax
                        ? "text-amber-300"
                        : row.isMin
                          ? "text-rose-300"
                          : "text-white",
                    ].join(" ")}
                  >
                    {row.value === null ? "—" : formatNumber(Math.round(row.value))}
                  </span>
                </div>
              ))}
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
