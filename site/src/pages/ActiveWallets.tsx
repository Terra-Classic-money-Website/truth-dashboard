import Card from "../components/Card";
import KpiCard from "../components/KpiCard";
import PageHeader from "../components/PageHeader";
import SectionTitle from "../components/SectionTitle";

export default function ActiveWallets() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Terra Classic On-Chain Activity"
        title="Monthly Active Wallets"
        subtitle="Participants per month based on transaction senders and recipients on the Terra Classic L1."
        status="Data source: L1 sender + recipient snapshots (static preview)"
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Monthly Active Wallets"
          value="128,420"
          helper="Unique senders + recipients"
          trend="+4.1% vs prior month"
          accent="amber"
        />
        <KpiCard
          label="Monthly Senders"
          value="74,980"
          helper="Wallets initiating txs"
          trend="+2.6% vs prior month"
          accent="sky"
        />
        <KpiCard
          label="Monthly Recipients"
          value="91,340"
          helper="Wallets receiving txs"
          trend="+3.2% vs prior month"
          accent="emerald"
        />
        <KpiCard
          label="Retention"
          value="62%"
          helper="3-month rolling return rate"
          trend="Stable"
          accent="rose"
        />
      </section>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Participants</h3>
            <p className="mt-1 text-sm text-slate-400">
              Unique terra1 addresses per month
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300 shadow-sm" />
            Active wallets
          </div>
        </div>
        <div className="mt-6 flex h-80 items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/50 text-sm text-slate-500">
          Chart placeholder — monthly active wallets trend
        </div>
      </Card>

      <section className="space-y-4">
        <SectionTitle
          title="Insights & Health"
          subtitle="Derived from monthly unique active wallet counts."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h4 className="text-base font-semibold text-white">Key Highlights</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-400 list-disc list-inside">
              <li>Net new wallet creation remains above the 12-month average.</li>
              <li>Reactivation rate is steady across top validator cohorts.</li>
              <li>Seasonal dips align with prior-year governance slowdowns.</li>
            </ul>
          </Card>
          <Card>
            <h4 className="text-base font-semibold text-white">KPI Snapshot</h4>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {[
                ["Median MAW", "118K", "12-month median"],
                ["MoM Growth", "+4.1%", "Latest month"],
                ["Peak MAW", "214K", "Jan 2023"],
                ["Low MAW", "42K", "Jun 2022"],
              ].map(([label, value, sub]) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
                >
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    {label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {value}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{sub}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle
            title="Year Summary"
            subtitle="Totals and averages by calendar year"
          />
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3">Active Wallets</th>
                  <th className="px-4 py-3">MoM Avg</th>
                  <th className="px-4 py-3">Peak Month</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-4">2024</td>
                  <td className="px-4 py-4">1.42M</td>
                  <td className="px-4 py-4">118K</td>
                  <td className="px-4 py-4">Mar</td>
                </tr>
                <tr className="text-slate-400">
                  <td className="px-4 py-4">2025</td>
                  <td className="px-4 py-4">1.58M</td>
                  <td className="px-4 py-4">132K</td>
                  <td className="px-4 py-4">Oct</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Quarterly Summary"
            subtitle="Quarterly active wallet distribution"
          />
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Quarter</th>
                  <th className="px-4 py-3">Total MAW</th>
                  <th className="px-4 py-3">QoQ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-4">Q2 2025</td>
                  <td className="px-4 py-4">402K</td>
                  <td className="px-4 py-4 text-emerald-300">+5.8%</td>
                </tr>
                <tr className="text-slate-400">
                  <td className="px-4 py-4">Q3 2025</td>
                  <td className="px-4 py-4">388K</td>
                  <td className="px-4 py-4 text-rose-300">-3.4%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle
            title="Extremes & Turning Points"
            subtitle="High-water marks and inflection points"
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ["All-time High", "214K", "Jan 2023"],
              ["All-time Low", "34K", "Jun 2022"],
              ["Largest MoM Jump", "+22%", "Aug 2023"],
              ["Largest MoM Drop", "-18%", "Feb 2024"],
            ].map(([label, value, sub]) => (
              <div
                key={label}
                className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"
              >
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  {label}
                </p>
                <p className="mt-2 text-lg font-semibold text-white">{value}</p>
                <p className="mt-1 text-xs text-slate-500">{sub}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Threshold & Milestone Tracker"
            subtitle="Milestones reached over time"
          />
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Threshold</th>
                  <th className="px-4 py-3">First Reached</th>
                  <th className="px-4 py-3">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-4">100K MAW</td>
                  <td className="px-4 py-4">Sep 2022</td>
                  <td className="px-4 py-4">Dec 2025</td>
                </tr>
                <tr className="text-slate-400">
                  <td className="px-4 py-4">200K MAW</td>
                  <td className="px-4 py-4">Jan 2023</td>
                  <td className="px-4 py-4">Jan 2023</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle
            title="Seasonality Snapshot"
            subtitle="Average MAW by month of year"
          />
          <div className="mt-4 grid gap-2 text-sm text-slate-400">
            {[
              ["Jan", "High activity"],
              ["Apr", "Moderate"],
              ["Jul", "Softening"],
              ["Oct", "Rebound"],
            ].map(([month, note]) => (
              <div
                key={month}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/40 px-4 py-2"
              >
                <span className="text-slate-200">{month}</span>
                <span>{note}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Method & Confidence"
            subtitle="Coverage notes and methodology"
          />
          <div className="mt-4 space-y-2 text-sm text-slate-400">
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
      </section>
    </div>
  );
}
