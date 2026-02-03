import Card from "../components/Card";
import KpiCard from "../components/KpiCard";
import PageHeader from "../components/PageHeader";
import SectionTitle from "../components/SectionTitle";

export default function GovernanceProposals() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Terra Classic Governance"
        title="Proposals"
        subtitle="Proposal pipeline, voting outcomes, and participation signals."
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
        <SectionTitle
          title="Proposal Cadence"
          subtitle="New proposals over time"
          meta="Since May 2022"
        />
        <div className="mt-6 flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/50 text-sm text-slate-500">
          Chart placeholder — proposals over time
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Proposal Pipeline"
          subtitle="Recent proposals in voting stage"
        />
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Proposal</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">End Date</th>
                <th className="px-4 py-3">Yes %</th>
                <th className="px-4 py-3">Participation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-4 text-slate-500" colSpan={5}>
                  Table placeholder — proposal rows coming soon.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
