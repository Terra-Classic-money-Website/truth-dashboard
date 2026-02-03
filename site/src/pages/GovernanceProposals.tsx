import Card from "../components/Card";
import KpiCard from "../components/KpiCard";
import PageHeader from "../components/PageHeader";
import SectionTitle from "../components/SectionTitle";

export default function GovernanceProposals() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Terra Classic Governance"
        title="Proposals Dashboard"
        subtitle="All proposals in voting stage since May 2022 (validator.info via local proxy)."
        status="Data source: validator.info proposals (static preview)"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Open Proposals"
          value="6"
          helper="Currently in voting"
          trend="Window: last 90 days"
          accent="amber"
        />
        <KpiCard
          label="Pass Rate"
          value="71%"
          helper="Rolling 12 months"
          trend="+3% vs prior year"
          accent="emerald"
        />
        <KpiCard
          label="Avg Participation"
          value="68%"
          helper="Voting power turnout"
          trend="Stable"
          accent="sky"
        />
        <KpiCard
          label="Avg Delegators"
          value="1.4K"
          helper="Per proposal"
          trend="Growing"
          accent="rose"
        />
      </section>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Controls</h3>
            <p className="mt-1 text-sm text-slate-400">
              Search, sort, and filter proposals before loading.
            </p>
          </div>
          <span className="text-xs uppercase tracking-wider text-slate-500">
            Last fetched: never
          </span>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-500">
              Search
            </label>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-400">
              Search by id, title, type...
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-500">
              Sort
            </label>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-400">
              End date (descending)
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-500">
              Status
            </label>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-400">
              All statuses
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-full border border-slate-800 px-4 py-2 text-xs uppercase tracking-wider text-slate-300 hover:border-amber-300 hover:text-amber-200 transition"
          >
            Fetch proposals
          </button>
          <span className="text-xs text-slate-500">
            Debug: Descending sort enabled
          </span>
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Status"
          subtitle="Idle. Click Fetch to load proposals."
        />
        <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-400">
          Proposal health and error messages will appear here.
        </div>
      </Card>

      <Card>
        <SectionTitle title="Proposals Debug" subtitle="Debug payload excerpt." />
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-400">
          Debug output will populate once API wiring is enabled.
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Proposals Since May 2022"
          subtitle="Voting-stage proposals"
        />
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Votes Distribution</th>
                <th className="px-4 py-3">Delegators</th>
                <th className="px-4 py-3">End Date</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-4">128</td>
                <td className="px-4 py-4">Community Pool Funding</td>
                <td className="px-4 py-4">Spend</td>
                <td className="px-4 py-4">Voting</td>
                <td className="px-4 py-4">Yes 72% • No 18%</td>
                <td className="px-4 py-4">1,420</td>
                <td className="px-4 py-4">2026-03-12</td>
              </tr>
              <tr className="text-slate-400">
                <td className="px-4 py-4">127</td>
                <td className="px-4 py-4">Validator Incentives</td>
                <td className="px-4 py-4">Parameter Change</td>
                <td className="px-4 py-4">Passed</td>
                <td className="px-4 py-4">Yes 68% • No 22%</td>
                <td className="px-4 py-4">1,210</td>
                <td className="px-4 py-4">2026-02-01</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
