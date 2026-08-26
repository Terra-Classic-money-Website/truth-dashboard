import Card from "./Card";
import {
  formatNumber,
  formatPercentFraction,
  formatValue,
} from "../data/format";
import type { selectDexVolume } from "../data/selectors/dexVolume";

type DexVolumeInsightsProps = {
  insights: ReturnType<typeof selectDexVolume>["insights"];
};

const insightDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function formatInsightDate(dateString: string) {
  return dateString
    ? insightDateFormatter.format(new Date(`${dateString}T00:00:00Z`))
    : "—";
}

function formatUsd(value: number | null) {
  return value === null ? "—" : formatValue({ value, unit: "usd" });
}

function formatInsightValue(value: number | null, unit: string) {
  if (value === null) return "—";
  return unit === "percent"
    ? formatChange(value)
    : formatValue({ value, unit });
}

function formatChange(value: number | null) {
  if (value === null) return "—";
  const formatted = formatPercentFraction(value);
  return value > 0 ? `+${formatted}` : formatted;
}

function changeClass(value: number | null) {
  if (value === null || value === 0) return "text-slate-500";
  return value > 0 ? "text-emerald-300" : "text-rose-300";
}

export default function DexVolumeInsights({ insights }: DexVolumeInsightsProps) {
  const {
    highlights,
    kpiSnapshot,
    monthlyRows,
    quarterlyRows,
    extremes,
    venueMix,
    comparison,
    method,
    stats,
    concentration,
  } = insights;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-white">Insights &amp; Health</h2>
        <p className="mt-1 text-sm text-slate-400">
          Evidence of volume contraction, venue changes, and turning points across the selected range.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="h-full">
          <h3 className="text-base font-semibold text-white">Key Highlights</h3>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-6 text-slate-400">
            {highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>

        <Card className="h-full">
          <h3 className="text-base font-semibold text-white">KPI Snapshot</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {kpiSnapshot.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
              >
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  {item.label}
                </p>
                <p className={`mt-2 text-lg font-semibold ${item.unit === "percent" ? changeClass(item.value) : "text-white"}`}>
                  {formatInsightValue(item.value, item.unit)}
                </p>
                <p className="mt-1 text-xs text-slate-500">{item.note}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-white">Monthly Summary</h3>
              <p className="mt-1 text-xs text-slate-500">
                Daily venue totals grouped by calendar month.
              </p>
            </div>
            <p className="text-xs text-slate-500">{monthlyRows.length} month{monthlyRows.length === 1 ? "" : "s"}</p>
          </div>
          <div className="section-scroll-x mt-3 rounded-xl border border-slate-800">
            <table className="w-full min-w-[940px] text-left text-sm">
              <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">Month</th>
                  <th className="whitespace-nowrap px-4 py-3">Avg / day</th>
                  <th className="whitespace-nowrap px-4 py-3">Median</th>
                  <th className="whitespace-nowrap px-4 py-3">MoM change</th>
                  <th className="whitespace-nowrap px-4 py-3">Volatility</th>
                  <th className="whitespace-nowrap px-4 py-3">Peak day</th>
                </tr>
              </thead>
              <tbody>
                {monthlyRows.map((row, index) => (
                  <tr key={row.month} className={index === 0 ? "bg-slate-800/35 text-white" : "text-slate-300"}>
                    <td className="whitespace-nowrap px-4 py-3">{row.month}{index === 0 ? <span className="ml-2 text-xs text-amber-200">Latest</span> : null}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatUsd(row.average)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatUsd(row.median)}</td>
                    <td className={`whitespace-nowrap px-4 py-3 ${changeClass(row.change)}`}>{formatChange(row.change)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatUsd(row.volatility)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.peakDay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-white">Quarterly Summary</h3>
              <p className="mt-1 text-xs text-slate-500">
                Daily venue totals grouped by calendar quarter.
              </p>
            </div>
            <p className="text-xs text-slate-500">{quarterlyRows.length} quarter{quarterlyRows.length === 1 ? "" : "s"}</p>
          </div>
          <div className="section-scroll-x mt-3 rounded-xl border border-slate-800">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">Quarter</th>
                  <th className="whitespace-nowrap px-4 py-3">Avg / day</th>
                  <th className="whitespace-nowrap px-4 py-3">QoQ change</th>
                  <th className="whitespace-nowrap px-4 py-3">Peak day</th>
                  <th className="whitespace-nowrap px-4 py-3">Low day</th>
                  <th className="whitespace-nowrap px-4 py-3">Days</th>
                </tr>
              </thead>
              <tbody>
                {quarterlyRows.map((row, index) => (
                  <tr key={row.quarter} className={index === 0 ? "bg-slate-800/35 text-white" : "text-slate-300"}>
                    <td className="whitespace-nowrap px-4 py-3">{row.quarter}{index === 0 ? <span className="ml-2 text-xs text-amber-200">Latest</span> : null}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatUsd(row.average)}</td>
                    <td className={`whitespace-nowrap px-4 py-3 ${changeClass(row.change)}`}>{formatChange(row.change)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.peakDay}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.lowDay}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatNumber(row.days)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="text-base font-semibold text-white">Extremes &amp; Turning Points</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-sm font-semibold text-white">Top 5 days</p>
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-400">
                {extremes.topDays.map((item) => <li key={item.label}>{item.label}: {formatUsd(item.value)}</li>)}
              </ul>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-sm font-semibold text-white">Bottom 5 days</p>
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-400">
                {extremes.bottomDays.map((item) => <li key={item.label}>{item.label}: {formatUsd(item.value)}</li>)}
              </ul>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-sm font-semibold text-white">Largest day-over-day increase</p>
              {extremes.largestIncrease ? (
                <p className="mt-3 text-sm text-slate-300">
                  {formatInsightDate(extremes.largestIncrease.date)} (+{formatUsd(extremes.largestIncrease.delta)} | {formatChange(extremes.largestIncrease.pct)})
                </p>
              ) : <p className="mt-3 text-sm text-slate-500">Not enough data.</p>}
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-sm font-semibold text-white">Largest day-over-day decrease</p>
              {extremes.largestDecrease ? (
                <p className="mt-3 text-sm text-slate-300">
                  {formatInsightDate(extremes.largestDecrease.date)} ({formatUsd(extremes.largestDecrease.delta)} | {formatChange(extremes.largestDecrease.pct)})
                </p>
              ) : <p className="mt-3 text-sm text-slate-500">Not enough data.</p>}
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 sm:col-span-2">
              <p className="text-sm font-semibold text-white">Max drawdown &amp; recovery</p>
              <p className="mt-3 text-sm text-slate-300">
                Drawdown: {formatPercentFraction(extremes.maxDrawdown.drawdownPct)} ({formatInsightDate(extremes.maxDrawdown.from)} → {formatInsightDate(extremes.maxDrawdown.to)}) · {extremes.maxDrawdown.recovered ? "Recovered" : "Not recovered"}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-white">Comparable-range decline</h3>
          <p className="mt-1 text-sm text-slate-500">
            Selected range versus the preceding equal-length range.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">Selected average</p>
              <p className="mt-2 text-lg font-semibold text-white">{formatUsd(comparison.currentAverage)}</p>
              <p className="mt-1 text-xs text-slate-500">{comparison.selectedLabel}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">Prior average</p>
              <p className="mt-2 text-lg font-semibold text-white">{formatUsd(comparison.previousAverage)}</p>
              <p className="mt-1 text-xs text-slate-500">{comparison.previousLabel}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">Range change</p>
              <p className={`mt-2 text-lg font-semibold ${changeClass(comparison.change)}`}>{formatChange(comparison.change)}</p>
              <p className="mt-1 text-xs text-slate-500">Selected average vs prior average</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">Active venues</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {comparison.currentActiveVenues} <span className="text-sm font-normal text-slate-500">vs {comparison.previousActiveVenues ?? "—"}</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">Selected vs prior range</p>
            </div>
          </div>
          <div className="mt-4 border-t border-slate-800 pt-4 text-sm text-slate-400">
            {stats.recentChange === null
              ? `The selected daily view contains ${formatNumber(stats.dailyObservationCount)} observations.`
              : `The latest ${formatNumber(Math.min(30, Math.max(1, Math.floor(stats.dailyObservationCount / 2))))} days average ${formatUsd(stats.recentAverage)}, ${formatChange(stats.recentChange)} versus the preceding comparable days.`}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white">Venue mix</h3>
            <p className="mt-1 text-sm text-slate-500">
              Selected-range contribution and change versus the preceding comparable range.
            </p>
          </div>
          <p className="text-xs text-slate-500">
            Top 3: {formatPercentFraction(concentration.topThreeShare)} · range change {formatChange(comparison.change)}
          </p>
        </div>
        <div className="mt-5 space-y-4">
          {venueMix.map((venue) => (
            <div key={venue.id}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2 text-slate-200">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: venue.color }} />
                  <span className="truncate">{venue.label}</span>
                </span>
                <span className="shrink-0 text-slate-300">{formatUsd(venue.selected)}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-950/80">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: venue.share ? `${Math.max(1.5, venue.share * 100)}%` : "0%",
                    backgroundColor: venue.color,
                  }}
                />
              </div>
              <div className="mt-1 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                <span>{formatPercentFraction(venue.share)} of selected range</span>
                <span className={changeClass(venue.change)}>
                  {venue.previous === null
                    ? "No prior comparable range"
                    : `${formatChange(venue.change)} vs prior · prior ${formatUsd(venue.previous)}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-base font-semibold text-white">Method &amp; coverage</h3>
        <div className="mt-4 grid gap-4 text-sm md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Dataset</p>
            <p className="mt-1 text-slate-300">{method.source}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Window</p>
            <p className="mt-1 text-slate-300">{method.dataWindow}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Coverage</p>
            <p className="mt-1 text-slate-300">{stats.activePeriodCount} of {stats.totalPeriodCount} daily periods with activity</p>
          </div>
        </div>
        <p className="mt-4 max-w-4xl text-sm leading-6 text-slate-400">{method.metricDefinition}</p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-slate-500">
          {method.notes.map((note) => <li key={note}>{note}</li>)}
        </ul>
      </Card>
    </section>
  );
}
