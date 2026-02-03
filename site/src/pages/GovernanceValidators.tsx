import Card from "../components/Card";
import KpiCard from "../components/KpiCard";
import PageHeader from "../components/PageHeader";
import SectionTitle from "../components/SectionTitle";

export default function GovernanceValidators() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Terra Classic Governance"
        title="Validators"
        subtitle="Active validator set, voting performance, and income indicators."
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
        <SectionTitle
          title="Voting Power Distribution"
          subtitle="Share of voting power by validator rank"
          meta="Top 50 validators"
        />
        <div className="mt-6 flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/50 text-sm text-slate-500">
          Chart placeholder — voting power distribution
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Active Validators"
          subtitle="Performance and participation snapshot"
        />
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Validator</th>
                <th className="px-4 py-3">Voting Power</th>
                <th className="px-4 py-3">Delegators</th>
                <th className="px-4 py-3">Missed Votes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-4 text-slate-500" colSpan={5}>
                  Table placeholder — validator rows coming soon.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
