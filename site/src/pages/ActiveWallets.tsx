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
        subtitle="Participants per month based on transaction senders and recipients on Terra Classic L1."
        status="Data source: L1 sender + recipient snapshots (static preview)"
      />

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
        <SectionTitle
          title="Participants"
          subtitle="Unique terra1 addresses per month"
          meta="Monthly cadence"
        />
        <div className="mt-6 flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/50 text-sm text-slate-500">
          Chart placeholder — monthly active wallets trend
        </div>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle
            title="Yearly Summary"
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
                  <td className="px-4 py-4 text-slate-500" colSpan={4}>
                    Table placeholder — snapshot rows coming soon.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Insights & Health"
            subtitle="Signals derived from monthly active wallets"
          />
          <div className="mt-4 space-y-3 text-sm text-slate-400">
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              Engagement momentum and reactivation insights will be summarized here.
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              Network health notes will be generated once KPI thresholds are live.
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
