import Card from "./Card";
import { formatNumber, formatPercentFraction, formatValue } from "../data/format";
import type { CmcMostViewedView } from "../data/selectors/cmcMostViewed";

type CmcMostViewedInsightsProps = {
  insights: CmcMostViewedView["insights"];
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

function formatCaptureDate(value: string) {
  return `${captureDateFormatter.format(new Date(value))} UTC`;
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function formatRank(value: number) {
  return formatValue({ value, unit: "rank" });
}

export default function CmcMostViewedInsights({
  insights,
}: CmcMostViewedInsightsProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-white">Insights &amp; Health</h2>
        <p className="mt-1 text-sm text-slate-400">
          Derived from Wayback captures of CoinMarketCap’s Most Viewed list. Lower rank is better.
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
            Median, best, and worst observed rank by calendar month.
          </p>
          <div className="section-scroll-x mt-3 rounded-xl border border-slate-800">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">Month</th>
                  <th className="whitespace-nowrap px-4 py-3">Median</th>
                  <th className="whitespace-nowrap px-4 py-3">Best</th>
                  <th className="whitespace-nowrap px-4 py-3">Worst</th>
                  <th className="whitespace-nowrap px-4 py-3">Captures</th>
                </tr>
              </thead>
              <tbody>
                {insights.monthlyRows.map((row) => (
                  <tr key={row.month} className="text-slate-300">
                    <td className="whitespace-nowrap px-4 py-3">{row.month}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatRank(row.median)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatRank(row.best)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatRank(row.worst)}</td>
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
            Capture completeness for the selected history range ({insights.archiveHealth.selectedRangeLabel}).
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">CDX captures</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {formatNumber(insights.archiveHealth.totalCaptures)}
              </p>
              <p className="mt-1 text-xs text-slate-500">HTTP 200 HTML captures</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">Rank observations</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {formatNumber(insights.archiveHealth.rankObservations)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatPercentFraction(insights.archiveHealth.resolutionRate)} resolved · {formatNumber(insights.archiveHealth.plottedRankObservations)} plotted
                {insights.archiveHealth.excludedFromChart > 0
                  ? ` · ${formatNumber(insights.archiveHealth.excludedFromChart)} excluded from chart`
                  : ""}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">Unresolved captures</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {formatNumber(insights.archiveHealth.unresolvedCaptures)}
              </p>
              <p className="mt-1 text-xs text-slate-500">Terra row not available in HTML</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">Longest rank gap</p>
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
          </div>
          <div className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-slate-300">
            <span className="font-semibold text-amber-200">
              {formatNumber(insights.archiveHealth.preRebrandObservations)} observations
            </span>{" "}
            use the historical Terra / LUNA label. They remain in the series because they resolve to CMC asset ID 4172.
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white">Recent Archive Captures</h3>
            <p className="mt-1 text-xs text-slate-500">
              Exact source observations behind the latest plotted points. Market-cap rank is context only.
            </p>
          </div>
          <span className="text-xs uppercase tracking-wider text-slate-500">
            {insights.recentCaptures.length} latest observations
          </span>
        </div>
        <div className="section-scroll-x mt-3 rounded-xl border border-slate-800">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="whitespace-nowrap px-4 py-3">Captured (UTC)</th>
                <th className="whitespace-nowrap px-4 py-3">Viewed rank</th>
                <th className="whitespace-nowrap px-4 py-3">CMC label</th>
                <th className="whitespace-nowrap px-4 py-3">Market-cap rank</th>
                <th className="whitespace-nowrap px-4 py-3">Source</th>
              </tr>
            </thead>
            <tbody>
              {insights.recentCaptures.map((row) => (
                <tr key={row.id} className="text-slate-300">
                  <td className="whitespace-nowrap px-4 py-3">{formatCaptureDate(row.capturedAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-amber-200">
                    {formatRank(row.rank)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {row.assetName} <span className="text-slate-500">{row.assetSymbol}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {row.marketCapRank === null ? "—" : formatRank(row.marketCapRank)}
                  </td>
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
        <h3 className="text-base font-semibold text-white">Method &amp; Limitations</h3>
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
            <li key={note} className="list-inside list-disc">
              {note}
            </li>
          ))}
        </ul>
        {insights.currentEvidence ? (
          <div className="mt-5 rounded-xl border border-sky-300/20 bg-sky-300/5 p-4">
            <p className="text-xs uppercase tracking-wider text-sky-200">Latest score</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {formatRank(insights.currentEvidence.rank)} · {formatDate(insights.currentEvidence.observedDate)}
            </p>
            <p className="mt-1 text-sm text-slate-300">
              {insights.currentEvidence.comparison} · {insights.currentEvidence.sourceLabel}.
            </p>
            <p className="mt-2 text-xs text-slate-500">{insights.currentEvidence.evidence}</p>
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
            className="text-slate-300 underline decoration-slate-600 underline-offset-2 hover:text-amber-200"
          >
            Open Wayback CDX query
          </a>
        </div>
      </Card>
    </section>
  );
}
