import Card from "../components/Card";
import KpiCard from "../components/KpiCard";
import PageHeader from "../components/PageHeader";
import SectionTitle from "../components/SectionTitle";

export default function CommunityPool() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Terra Classic Community Pool"
        title="Balances & Flow Analysis"
        subtitle="Track historical balances, inflows, and outflows for LUNC and USTC."
        status="Data source: Community Pool snapshots (static preview)"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="LUNC Balance"
          value="29.4B"
          helper="Community pool balance"
          trend="Monthly +1.2%"
          accent="amber"
        />
        <KpiCard
          label="USTC Balance"
          value="1.8B"
          helper="Community pool balance"
          trend="Monthly -0.4%"
          accent="sky"
        />
        <KpiCard
          label="Net Inflows"
          value="+312M"
          helper="Last 30 days"
          trend="Inflow trend rising"
          accent="emerald"
        />
        <KpiCard
          label="Distributions"
          value="54M"
          helper="Last 30 days"
          trend="Stable cadence"
          accent="rose"
        />
      </section>

      <Card>
        <SectionTitle
          title="Pool Balances"
          subtitle="Historical LUNC + USTC balances"
          meta="Snapshot cadence: monthly"
        />
        <div className="mt-6 flex h-80 items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/50 text-sm text-slate-500">
          Chart placeholder — community pool balances
        </div>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle
            title="Flow Breakdown"
            subtitle="Inflows vs outflows by category"
          />
          <div className="mt-4 space-y-3 text-sm text-slate-400">
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              Grants, staking rewards, and burn allocations will be summarized.
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              Inflow and outflow trend notes will appear here.
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Allocation Table"
            subtitle="Recent community pool distributions"
          />
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Proposal</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Denom</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={4}>
                    Table placeholder — distributions coming soon.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}
