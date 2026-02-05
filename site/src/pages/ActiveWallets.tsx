import Card from "../components/Card";
import PageHeader from "../components/PageHeader";

const kpiSnapshot = [
  { label: "Current month", value: "14,982", sub: "Jan 26" },
  { label: "All-time peak", value: "498,729", sub: "Aug 22" },
  { label: "Drawdown from peak", value: "-97.0%", sub: "Current vs peak" },
  { label: "12M rolling average", value: "24,333", sub: "Last 12 months" },
  { label: "12M trend slope", value: "-217 /month", sub: "Linear regression" },
  { label: "12M stability", value: "28.9%", sub: "Stdev / mean" },
];

const yearSummary = [
  ["2023", "1.62M", "135K", "Jan", "+6.2%"],
  ["2024", "1.42M", "118K", "Mar", "-3.4%"],
  ["2025", "1.58M", "132K", "Oct", "+4.9%"],
];

const quarterSummary = [
  ["Q2 2025", "402K", "134K", "+5.8%"],
  ["Q3 2025", "388K", "129K", "-3.4%"],
  ["Q4 2025", "410K", "136K", "+5.7%"],
];

const extremes = [
  ["All-time High", "214K", "Jan 2023"],
  ["All-time Low", "34K", "Jun 2022"],
  ["Largest MoM Jump", "+22%", "Aug 2023"],
  ["Largest MoM Drop", "-18%", "Feb 2024"],
];

const thresholds = [
  ["50,000", "May 23", "26", "Jan 26"],
  ["25,000", "Mar 25", "8", "Jan 26"],
  ["15,000", "Jan 26", "1", "Jan 26"],
];

const seasonality = [
  ["Jan", "Strong"],
  ["Mar", "Above average"],
  ["Jul", "Soft"],
  ["Oct", "Rebound"],
  ["Dec", "Stable"],
];

export default function ActiveWallets() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Terra Classic On-Chain Activity"
        title="Monthly Active Wallets"
        subtitle="Participants per month based on transaction senders and recipients on the Terra Classic L1."
      />

      <div className="flex flex-wrap gap-3">
        {["2 Years", "3 Years", "All"].map((label) => (
          <button
            key={label}
            className="rounded-full border border-slate-800 px-4 py-2 text-xs uppercase tracking-wider text-slate-300 hover:border-amber-300 hover:text-amber-200 transition"
            type="button"
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
        <div className="relative mt-6">
          <div className="flex h-80 items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/50 text-sm text-slate-500">
            Chart placeholder — monthly active wallets trend
          </div>
          <div className="absolute inset-0 hidden items-center justify-center rounded-xl bg-slate-950/70 text-sm text-slate-400">
            Loading snapshot data...
          </div>
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
              <li>
                Activity is down 97.0% from the peak (peak: Aug 22, 498,729).
              </li>
              <li>
                Over the last 12 months, the trend slope is -217 wallets/month
                (smoothed).
              </li>
              <li>
                The most severe peak-to-trough decline was -97.0% from Aug 22 to
                Jan 26.
              </li>
              <li>
                The last month shows decline with MoM change of -41.0%.
              </li>
              <li>Year-over-year change is -53.1% (vs Jan 25).</li>
              <li>The network spent 8 months below 25,000 active wallets.</li>
            </ul>
          </Card>
          <Card>
            <h3 className="text-base font-semibold text-white">KPI Snapshot</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {kpiSnapshot.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
                >
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{item.sub}</p>
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
                    <th className="px-4 py-3">Year</th>
                    <th className="px-4 py-3">Total MAW</th>
                    <th className="px-4 py-3">Avg MAW</th>
                    <th className="px-4 py-3">Peak Month</th>
                    <th className="px-4 py-3">YoY</th>
                  </tr>
                </thead>
                <tbody>
                  {yearSummary.map((row) => (
                    <tr key={row[0]} className="text-slate-300">
                      {row.map((cell) => (
                        <td key={cell} className="px-4 py-3">
                          {cell}
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
                    <th className="px-4 py-3">Quarter</th>
                    <th className="px-4 py-3">Total MAW</th>
                    <th className="px-4 py-3">Avg MAW</th>
                    <th className="px-4 py-3">QoQ</th>
                  </tr>
                </thead>
                <tbody>
                  {quarterSummary.map((row) => (
                    <tr key={row[0]} className="text-slate-300">
                      {row.map((cell) => (
                        <td key={cell} className="px-4 py-3">
                          {cell}
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
              {extremes.map((item) => (
                <div
                  key={item[0]}
                  className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
                >
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    {item[0]}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {item[1]}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{item[2]}</p>
                </div>
              ))}
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
                  {thresholds.map((row) => (
                    <tr key={row[0]} className="text-slate-300">
                      {row.map((cell) => (
                        <td key={cell} className="px-4 py-3">
                          {cell}
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
              Seasonality Snapshot
            </h3>
            <div className="mt-3 grid gap-2 text-sm text-slate-400">
              {seasonality.map((item) => (
                <div
                  key={item[0]}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-2"
                >
                  <span className="text-slate-200">{item[0]}</span>
                  <span>{item[1]}</span>
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
                Monthly counts are derived from sender + recipient unique address
                lists across Terra Classic L1.
              </p>
              <p>
                Confidence levels increase after Aug 2022 as indexing coverage
                stabilizes.
              </p>
              <p>
                Snapshot cadence is monthly; intra-month volatility is not
                represented here.
              </p>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
