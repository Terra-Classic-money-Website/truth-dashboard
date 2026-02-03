import Card from "../components/Card";
import KpiCard from "../components/KpiCard";
import PageHeader from "../components/PageHeader";
import SectionTitle from "../components/SectionTitle";

export default function GovernanceParticipation() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Terra Classic Governance"
        title="Participation"
        subtitle="Governance participation rates, validator turnout, and voting coverage insights."
        status="Data source: validator.info indexer (static preview)"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Turnout Rate"
          value="72%"
          helper="Voting power participating"
          trend="+1.4% vs prior quarter"
          accent="amber"
        />
        <KpiCard
          label="Non-Participation"
          value="14%"
          helper="Did not vote share"
          trend="-0.8% vs prior quarter"
          accent="rose"
        />
        <KpiCard
          label="Voting Power Coverage"
          value="86%"
          helper="Validators participating"
          trend="Stable"
          accent="emerald"
        />
        <KpiCard
          label="Active Proposals"
          value="8"
          helper="Within current window"
          trend="Window: 12 months"
          accent="sky"
        />
      </section>

      <Card>
        <SectionTitle
          title="Participation Distribution"
          subtitle="Validator non-participation buckets"
          meta="Window: all time"
        />
        <div className="mt-6 flex h-80 items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/50 text-sm text-slate-500">
          Chart placeholder — non-participation distribution
        </div>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle
            title="Validators With High Non-Participation"
            subtitle="Threshold: &gt; 60% non-participation"
          />
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Validator</th>
                  <th className="px-4 py-3">Voting Power</th>
                  <th className="px-4 py-3">Non-Participation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={3}>
                    Table placeholder — validator participation rows pending.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Participation Notes"
            subtitle="Health signals and alerts"
          />
          <div className="mt-4 space-y-3 text-sm text-slate-400">
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              Flag validators with rising non-participation for review.
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              Participation anomalies will be highlighted once data is live.
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
