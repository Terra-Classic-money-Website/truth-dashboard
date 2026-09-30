import Card from "./Card";
import {
  formatNumber,
  formatPercentFraction,
  formatValue,
} from "../data/format";
import type { StakingAprView } from "../data/selectors/stakingApr";

type StakingAprInsightsProps = {
  insights: StakingAprView["insights"];
};

const captureDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function formatApr(value: number) {
  return formatValue({ value, unit: "percent_points" });
}

function formatCaptureDate(value: string) {
  return `${captureDateFormatter.format(new Date(value))} UTC`;
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function statusLabel(status: string) {
  switch (status) {
    case "apr_observed":
      return "APR observed";
    case "not_observed":
      return "APR not in capture";
    case "parse_failed":
      return "Parse failed";
    default:
      return "Fetch failed";
  }
}

export default function StakingAprInsights({
  insights,
}: StakingAprInsightsProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-white">Insights &amp; Archive Health</h2>
        <p className="mt-1 text-sm text-slate-400">
          Historical findings describe archive captures; the current reference is identified separately.
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
                  {formatValue({ value: item.value, unit: item.unit })}
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
          <p className="mt-1 text-xs text-slate-500">
            Median, low, and high APR among captures in each calendar month.
          </p>
          <div className="section-scroll-x mt-3 rounded-xl border border-slate-800">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">Month</th>
                  <th className="whitespace-nowrap px-4 py-3">Median APR</th>
                  <th className="whitespace-nowrap px-4 py-3">Low</th>
                  <th className="whitespace-nowrap px-4 py-3">High</th>
                  <th className="whitespace-nowrap px-4 py-3">Captures</th>
                </tr>
              </thead>
              <tbody>
                {insights.monthlyRows.map((row) => (
                  <tr key={row.month} className="text-slate-300">
                    <td className="whitespace-nowrap px-4 py-3">{row.month}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatApr(row.median)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatApr(row.low)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatApr(row.high)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatNumber(row.captures)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-white">Archive Health</h3>
          <p className="mt-1 text-xs text-slate-500">
            Capture coverage for the selected history range ({insights.archiveHealth.selectedRangeLabel}).
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">CDX captures</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {formatNumber(insights.archiveHealth.totalCaptures)}
              </p>
              <p className="mt-1 text-xs text-slate-500">HTTP 200 HTML snapshots</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">APR observations</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {formatNumber(insights.archiveHealth.aprObservations)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatPercentFraction(insights.archiveHealth.resolutionRate)} parsed
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">APR breakdowns</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {formatNumber(insights.archiveHealth.breakdownObservations)}
              </p>
              <p className="mt-1 text-xs text-slate-500">LUNC and USTC contributions present</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">Longest APR gap</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {insights.archiveHealth.largestGap
                  ? `${Math.round(insights.archiveHealth.largestGap.days)} days`
                  : "—"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {insights.archiveHealth.largestGap
                  ? `${formatDate(insights.archiveHealth.largestGap.from)} → ${formatDate(insights.archiveHealth.largestGap.to)}`
                : "Not enough observations"}
              </p>
            </div>
            {insights.archiveHealth.currentReferenceGapDays !== null ? (
              <div className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">Current reference gap</p>
                <p className="mt-2 text-lg font-semibold text-amber-200">
                  {Math.round(insights.archiveHealth.currentReferenceGapDays)} days
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Since the latest Wayback APR capture
                </p>
              </div>
            ) : null}
          </div>
          <div className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-slate-300">
            {insights.archiveHealth.unresolvedCaptures > 0 ? (
              <>
                <span className="font-semibold text-amber-200">
                  {formatNumber(insights.archiveHealth.unresolvedCaptures)} captures
                </span>{" "}
                did not yield an APR value. They remain in the evidence table and are excluded from the chart.
              </>
            ) : (
              <>
                <span className="font-semibold text-amber-200">
                  {formatNumber(insights.archiveHealth.uniqueObservationDates)} unique observation dates
                </span>{" "}
                across the selected range.
                {insights.archiveHealth.duplicateDateCaptures > 0
                  ? ` ${formatNumber(insights.archiveHealth.duplicateDateCaptures)} extra capture${insights.archiveHealth.duplicateDateCaptures === 1 ? " shares" : "s share"} a date with another observation.`
                  : ""}
              </>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white">Wayback Capture Evidence</h3>
            <p className="mt-1 text-xs text-slate-500">
              Every CDX capture in the selected range, including captures without a usable APR.
            </p>
          </div>
          <span className="text-xs uppercase tracking-wider text-slate-500">
            {insights.captureRows.length} captures
          </span>
        </div>
        <div className="section-scroll-x mt-3 rounded-xl border border-slate-800">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="whitespace-nowrap px-4 py-3">Captured (UTC)</th>
                <th className="whitespace-nowrap px-4 py-3">Staking APR</th>
                <th className="whitespace-nowrap px-4 py-3">LUNC contribution</th>
                <th className="whitespace-nowrap px-4 py-3">USTC contribution</th>
                <th className="whitespace-nowrap px-4 py-3">Status</th>
                <th className="whitespace-nowrap px-4 py-3">Source</th>
              </tr>
            </thead>
            <tbody>
              {insights.captureRows.map((row) => (
                <tr key={row.captureTimestamp} className="text-slate-300">
                  <td className="whitespace-nowrap px-4 py-3">{formatCaptureDate(row.capturedAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-amber-200">
                    {row.apr === null ? "—" : formatApr(row.apr)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {row.luncApr === null ? "—" : formatApr(row.luncApr)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {row.ustcApr === null ? "—" : formatApr(row.ustcApr)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{statusLabel(row.status)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <a
                      href={row.archiveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-300 underline decoration-slate-600 underline-offset-2 hover:text-amber-200"
                    >
                      Wayback
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h3 className="text-base font-semibold text-white">Metric &amp; Limitations</h3>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wider text-slate-500">Metric</dt>
            <dd className="mt-1 text-slate-300">{insights.method.metricDefinition}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-slate-500">Data window</dt>
            <dd className="mt-1 text-slate-300">{insights.method.dataWindow}</dd>
          </div>
        </dl>
        <ul className="mt-4 space-y-2 text-sm text-slate-400">
          {insights.method.notes.map((note) => (
            <li key={note} className="list-inside list-disc">{note}</li>
          ))}
        </ul>
        {insights.latestBreakdown ? (
          <div className="mt-5 rounded-xl border border-sky-300/20 bg-sky-300/5 p-4">
            <p className="text-xs uppercase tracking-wider text-sky-200">Latest source breakdown</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {formatApr(insights.latestBreakdown.total)} total · {formatApr(insights.latestBreakdown.lunc)} LUNC · {formatApr(insights.latestBreakdown.ustc)} USTC
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Captured {formatDate(insights.latestBreakdown.date)}. Contributions are the values provided by Validator Info.
            </p>
          </div>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <a
            href={insights.method.latestArchiveUrl}
            target="_blank"
            rel="noreferrer"
            className="text-amber-200 underline decoration-amber-200/40 underline-offset-2 hover:text-amber-100"
          >
            Open latest parsed capture
          </a>
          <a
            href={insights.method.cdxSource}
            target="_blank"
            rel="noreferrer"
            className="text-slate-300 underline decoration-slate-600 underline-offset-2 hover:text-white"
          >
            Open Wayback CDX index
          </a>
          <a
            href={insights.method.sourcePageUrl}
            target="_blank"
            rel="noreferrer"
            className="text-slate-300 underline decoration-slate-600 underline-offset-2 hover:text-white"
          >
            Open Validator Info
          </a>
          <a
            href={insights.method.onchainDocsUrl}
            target="_blank"
            rel="noreferrer"
            className="text-slate-300 underline decoration-slate-600 underline-offset-2 hover:text-white"
          >
            Terra on-chain query docs
          </a>
        </div>
      </Card>
    </section>
  );
}
