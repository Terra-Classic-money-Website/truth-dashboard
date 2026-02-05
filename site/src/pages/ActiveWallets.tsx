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
  ["2026", "14,982", "14,982", "-41.8%", "0", "0.0%"],
  ["2025", "25,746", "23,452", "-43.5%", "6,716", "26.1%"],
  ["2024", "45,533", "42,835", "-21.0%", "11,681", "25.7%"],
  ["2023", "57,670", "58,214", "-78.1%", "13,633", "23.6%"],
  ["2022", "263,903", "212,151", "—", "143,464", "54.4%"],
];

const quarterSummary = [
  ["2026 Q1", "14,982", "-49.0%", "Jan 26 (14,982)", "Jan 26 (14,982)"],
  ["2025 Q4", "29,376", "+24.2%", "Oct 25 (44,342)", "Nov 25 (18,414)"],
  ["2025 Q3", "23,645", "+10.0%", "Jul 25 (25,347)", "Aug 25 (22,651)"],
  ["2025 Q2", "21,496", "-24.5%", "Apr 25 (23,146)", "Jun 25 (18,710)"],
  ["2025 Q1", "28,465", "-28.9%", "Jan 25 (31,576)", "Mar 25 (26,054)"],
];

const topMonths = [
  "Aug 22: 498,729",
  "Jul 22: 406,085",
  "Sep 22: 348,416",
  "Jun 22: 212,151",
  "Oct 22: 150,304",
];

const bottomMonths = [
  "Jan 26: 14,982",
  "Nov 25: 18,414",
  "Jun 25: 18,710",
  "May 25: 22,633",
  "Aug 25: 22,651",
];

const thresholds = [
  ["50,000", "May 23", "26", "Jan 26"],
  ["25,000", "Mar 25", "8", "Jan 26"],
  ["15,000", "Jan 26", "1", "Jan 26"],
];

const seasonalityLeft = [
  { month: "Jan", value: "45,763" },
  { month: "Mar", value: "52,214" },
  { month: "May", value: "38,083", tone: "low" },
  { month: "Jul", value: "129,525" },
  { month: "Sep", value: "112,674" },
  { month: "Nov", value: "67,257" },
];

const seasonalityRight = [
  { month: "Feb", value: "54,068" },
  { month: "Apr", value: "41,071" },
  { month: "Jun", value: "81,883" },
  { month: "Aug", value: "149,880", tone: "peak" },
  { month: "Oct", value: "66,906" },
  { month: "Dec", value: "59,458" },
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
                    <th className="px-4 py-3">Avg monthly wallets</th>
                    <th className="px-4 py-3">Median</th>
                    <th className="px-4 py-3">YoY change</th>
                    <th className="px-4 py-3">Volatility</th>
                    <th className="px-4 py-3">Coeff. of variation</th>
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
                    <th className="px-4 py-3">Avg wallets</th>
                    <th className="px-4 py-3">QoQ change</th>
                    <th className="px-4 py-3">Best month</th>
                    <th className="px-4 py-3">Worst month</th>
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
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-sm font-semibold text-white">Top 5 months</p>
                <ul className="mt-3 space-y-1 text-sm text-slate-400 list-disc list-inside">
                  {topMonths.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-sm font-semibold text-white">Bottom 5 months</p>
                <ul className="mt-3 space-y-1 text-sm text-slate-400 list-disc list-inside">
                  {bottomMonths.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-sm font-semibold text-white">
                  Largest MoM increase
                </p>
                <p className="mt-3 text-sm text-slate-300">
                  Jul 22 (+193,934 | +91.4%)
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-sm font-semibold text-white">
                  Largest MoM decrease
                </p>
                <p className="mt-3 text-sm text-slate-300">
                  Oct 22 (-198,112 | -56.9%)
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-sm font-semibold text-white">
                  Max drawdown &amp; recovery
                </p>
                <p className="mt-3 text-sm text-slate-300">
                  Drawdown: -97.0% (Aug 22 → Jan 26)
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Recovery time: Not recovered within dataset
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
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 text-sm text-slate-400">
                {seasonalityLeft.map((item) => (
                  <div
                    key={item.month}
                    className="flex items-center justify-between"
                  >
                    <span className="text-slate-300">{item.month}</span>
                    <span
                      className={
                        item.tone === "low"
                          ? "text-rose-300"
                          : "text-slate-200"
                      }
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-sm text-slate-400">
                {seasonalityRight.map((item) => (
                  <div
                    key={item.month}
                    className="flex items-center justify-between"
                  >
                    <span className="text-slate-300">{item.month}</span>
                    <span
                      className={
                        item.tone === "peak"
                          ? "text-amber-200"
                          : "text-slate-200"
                      }
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
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
                terra-classic-fcd.publicnode.com FCD endpoint.
              </p>
              <p>
                <strong className="text-slate-200">Metric definition:</strong>{" "}
                Monthly Active Wallets = unique addresses observed participating
                in on-chain transactions in that month.
              </p>
              <p>
                <strong className="text-slate-200">Data window:</strong> Jun 22
                → Jan 26.
              </p>
              <p>
                <strong className="text-slate-200">Completeness:</strong> Months
                included: 44; missing months in between: 0.
              </p>
              <p>Based on local dataset file.</p>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
