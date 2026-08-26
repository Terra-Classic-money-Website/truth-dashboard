import Card from "./Card";
import {
  formatNumber,
  formatPercentFraction,
  formatValue,
} from "../data/format";
import type { selectLuncVolume } from "../data/selectors/luncVolume";

type VolumeInsightsProps = {
  insights: ReturnType<typeof selectLuncVolume>["insights"];
};

const insightDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function formatInsightDate(dateString: string) {
  return insightDateFormatter.format(new Date(`${dateString}T00:00:00Z`));
}

function formatUsd(value: number) {
  return formatValue({ value, unit: "usd" });
}

function formatOptionalPercent(value: number | null) {
  return formatPercentFraction(value);
}

function formatInsightValue(value: number, unit: string) {
  return unit === "percent"
    ? formatPercentFraction(value)
    : formatValue({ value, unit });
}

export default function VolumeInsights({ insights }: VolumeInsightsProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-white">Insights &amp; Health</h2>
        <p className="mt-1 text-sm text-slate-400">
          Derived from daily 24h USD volume observations in the selected CoinGecko range.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="h-full">
          <h3 className="text-base font-semibold text-white">Key Highlights</h3>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-400">
            {insights.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
        <Card className="h-full">
          <h3 className="text-base font-semibold text-white">KPI Snapshot</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {insights.kpiSnapshot.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
              >
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  {item.label}
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
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
          <h3 className="text-base font-semibold text-white">Monthly Summary</h3>
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
                {insights.monthlyRows.map((row) => (
                  <tr key={row.month} className="text-slate-300">
                    <td className="whitespace-nowrap px-4 py-3">{row.month}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatUsd(row.average)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatUsd(row.median)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatOptionalPercent(row.change)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{formatUsd(row.volatility)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.peakDay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <h3 className="text-base font-semibold text-white">Quarterly Summary</h3>
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
                {insights.quarterlyRows.map((row) => (
                  <tr key={row.quarter} className="text-slate-300">
                    <td className="whitespace-nowrap px-4 py-3">{row.quarter}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatUsd(row.average)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatOptionalPercent(row.change)}
                    </td>
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
          <h3 className="text-base font-semibold text-white">
            Extremes &amp; Turning Points
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-sm font-semibold text-white">Top 5 days</p>
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-400">
                {insights.extremes.topDays.map((item) => (
                  <li key={item.label}>
                    {item.label}: {formatUsd(item.value)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-sm font-semibold text-white">Bottom 5 days</p>
              <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-400">
                {insights.extremes.bottomDays.map((item) => (
                  <li key={item.label}>
                    {item.label}: {formatUsd(item.value)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-sm font-semibold text-white">
                Largest day-over-day increase
              </p>
              {insights.extremes.largestIncrease ? (
                <p className="mt-3 text-sm text-slate-300">
                  {formatInsightDate(insights.extremes.largestIncrease.date)} (+
                  {formatUsd(insights.extremes.largestIncrease.delta)} | {formatOptionalPercent(insights.extremes.largestIncrease.pct)})
                </p>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Not enough data.</p>
              )}
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-sm font-semibold text-white">
                Largest day-over-day decrease
              </p>
              {insights.extremes.largestDecrease ? (
                <p className="mt-3 text-sm text-slate-300">
                  {formatInsightDate(insights.extremes.largestDecrease.date)} (
                  {formatUsd(insights.extremes.largestDecrease.delta)} | {formatOptionalPercent(insights.extremes.largestDecrease.pct)})
                </p>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Not enough data.</p>
              )}
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 sm:col-span-2">
              <p className="text-sm font-semibold text-white">
                Max drawdown &amp; recovery
              </p>
              <p className="mt-3 text-sm text-slate-300">
                Drawdown: {formatPercentFraction(insights.extremes.maxDrawdown.drawdownPct)} (
                {formatInsightDate(insights.extremes.maxDrawdown.from)} → {" "}
                {formatInsightDate(insights.extremes.maxDrawdown.to)}) · {" "}
                {insights.extremes.maxDrawdown.recovered ? "Recovered" : "Not recovered"}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <h3 className="text-base font-semibold text-white">
            Volume Regime Tracker
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Relative to the selected-range median.
          </p>
          <div className="section-scroll-x mt-3 rounded-xl border border-slate-800">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">Rule</th>
                  <th className="whitespace-nowrap px-4 py-3">Days</th>
                  <th className="whitespace-nowrap px-4 py-3">Share</th>
                  <th className="whitespace-nowrap px-4 py-3">Latest seen</th>
                </tr>
              </thead>
              <tbody>
                {insights.thresholds.map((row) => (
                  <tr key={row.threshold} className="text-slate-300">
                    <td className="whitespace-nowrap px-4 py-3">{row.threshold}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatNumber(row.days)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatPercentFraction(row.share)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.latestSeen}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="text-base font-semibold text-white">Weekday Profile</h3>
          <p className="mt-1 text-xs text-slate-500">Average daily volume by UTC weekday.</p>
          <div className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {insights.weekdayProfile.map((row) => (
              <div key={row.day} className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{row.day}</span>
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
                  {row.average === null ? "—" : formatUsd(row.average)}
                </span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="text-base font-semibold text-white">Method &amp; Confidence</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-400">
            <p>
              <strong className="text-slate-200">Source:</strong> {insights.method.source}
            </p>
            <p>
              <strong className="text-slate-200">Metric definition:</strong>{" "}
              {insights.method.metricDefinition}
            </p>
            <p>
              <strong className="text-slate-200">Data window:</strong> {insights.method.dataWindow}
            </p>
            {insights.method.notes.map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
