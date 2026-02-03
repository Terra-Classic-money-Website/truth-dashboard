import Card from "../components/Card";
import KpiCard from "../components/KpiCard";
import PageHeader from "../components/PageHeader";
import SectionTitle from "../components/SectionTitle";

export default function GovernanceValidators() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Terra Classic Governance"
        title="Current Validators Dashboard"
        subtitle="Active validator set from validator.info (via local proxy)."
        status="Data source: validator.info validator set (static preview)"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Active Validators"
          value="130"
          helper="Current active set"
          trend="Stable"
          accent="amber"
        />
        <KpiCard
          label="Voting Power"
          value="100%"
          helper="Total bonded share"
          trend="Healthy distribution"
          accent="sky"
        />
        <KpiCard
          label="Avg Commission"
          value="5.4%"
          helper="Weighted average"
          trend="Down 0.2%"
          accent="emerald"
        />
        <KpiCard
          label="Median Uptime"
          value="99.1%"
          helper="Last 30 days"
          trend="Stable"
          accent="rose"
        />
      </section>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Controls</h3>
            <p className="mt-1 text-sm text-slate-400">
              Vote window and filters for the active validator set.
            </p>
          </div>
          <span className="text-xs uppercase tracking-wider text-slate-500">
            Last fetched: never
          </span>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Vote Window
            </p>
            <div className="flex flex-wrap gap-2">
              {["All time", "Last 2 years", "Last year"].map((label) => (
                <button
                  key={label}
                  type="button"
                  className="rounded-full border border-slate-800 px-3 py-2 text-xs uppercase tracking-wider text-slate-300 hover:border-amber-300 hover:text-amber-200 transition"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Filters
            </p>
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-400">
              Income &gt; $100 (toggle)
            </div>
            <button
              type="button"
              className="rounded-full border border-slate-800 px-4 py-2 text-xs uppercase tracking-wider text-slate-300 hover:border-amber-300 hover:text-amber-200 transition"
            >
              Fetch validators
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Status"
          subtitle="Idle. Click Fetch to load validators."
        />
        <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-400">
          Validator health summary will appear here once data is loaded.
        </div>
      </Card>

      <Card>
        <SectionTitle title="Active Validators" subtitle="Snapshot table" />
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Validator</th>
                <th className="px-4 py-3">Voting Power</th>
                <th className="px-4 py-3">Delegators</th>
                <th className="px-4 py-3">Income (monthly)</th>
                <th className="px-4 py-3">Did not vote (1Y)</th>
                <th className="px-4 py-3">Did not vote (2Y)</th>
                <th className="px-4 py-3">Yes</th>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Abstain</th>
                <th className="px-4 py-3">No with veto</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-4">1</td>
                <td className="px-4 py-4">Validator One</td>
                <td className="px-4 py-4">7.2%</td>
                <td className="px-4 py-4">9,420</td>
                <td className="px-4 py-4">$18.4K</td>
                <td className="px-4 py-4">6%</td>
                <td className="px-4 py-4">9%</td>
                <td className="px-4 py-4">62%</td>
                <td className="px-4 py-4">21%</td>
                <td className="px-4 py-4">9%</td>
                <td className="px-4 py-4">2%</td>
              </tr>
              <tr className="text-slate-400">
                <td className="px-4 py-4">2</td>
                <td className="px-4 py-4">Validator Two</td>
                <td className="px-4 py-4">6.4%</td>
                <td className="px-4 py-4">8,110</td>
                <td className="px-4 py-4">$15.9K</td>
                <td className="px-4 py-4">8%</td>
                <td className="px-4 py-4">12%</td>
                <td className="px-4 py-4">58%</td>
                <td className="px-4 py-4">24%</td>
                <td className="px-4 py-4">12%</td>
                <td className="px-4 py-4">3%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
