import Card from "../components/Card";
import KpiCard from "../components/KpiCard";
import PageHeader from "../components/PageHeader";
import SectionTitle from "../components/SectionTitle";

export default function GovernanceParticipation() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Terra Classic Governance"
        title="Governance Participation"
        subtitle="Governance participation derived from validator.info indexer API (via local proxy)."
        status="Data source: validator.info indexer (static preview)"
      />

      <Card>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Time Window
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
            <p className="text-xs text-slate-500">
              Window: All time • Proposals: 118
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Active On-Chain Wallets (Last Year)
            </p>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-400">
              120,000
            </div>
            <div className="text-xs text-slate-500">Debug: Off</div>
          </div>
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Actions
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-full border border-slate-800 px-4 py-2 text-xs uppercase tracking-wider text-slate-300 hover:border-amber-300 hover:text-amber-200 transition"
              >
                Fetch latest data
              </button>
              <span className="text-xs text-slate-500">
                Last fetched: never
              </span>
            </div>
          </div>
        </div>
      </Card>

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
          title="Status"
          subtitle="Idle. Load cached data or fetch latest."
        />
        <div className="mt-3 space-y-3 text-sm text-slate-400">
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            Warning banner placeholder. High non-participation validator clusters
            will be listed here.
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            Vote health card placeholder. Overall governance health summary will
            appear here.
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle title="Debug Sample" subtitle="Debug payload excerpt." />
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-400">
          Debug output will populate once API wiring is enabled.
        </div>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        {[
          "Non-participation distribution",
          "Top 15 by non-participation",
          "Overall vote composition",
          "Delegators per proposal (top 20)",
        ].map((title) => (
          <Card key={title}>
            <SectionTitle title={title} subtitle="Chart placeholder" />
            <div className="mt-4 flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/50 text-sm text-slate-500">
              Chart placeholder
            </div>
          </Card>
        ))}
      </section>

      <Card>
        <SectionTitle
          title="Validators With > 60% Non-Participation"
          subtitle="Sorted by non-participation percentage"
        />
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Validator</th>
                <th className="px-4 py-3">Voting Power Share</th>
                <th className="px-4 py-3">Yes</th>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">No w/ veto</th>
                <th className="px-4 py-3">Abstain</th>
                <th className="px-4 py-3">Did Not Vote</th>
                <th className="px-4 py-3">Non-Participation %</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-4">Validator A</td>
                <td className="px-4 py-4">2.8%</td>
                <td className="px-4 py-4">62%</td>
                <td className="px-4 py-4">18%</td>
                <td className="px-4 py-4">3%</td>
                <td className="px-4 py-4">2%</td>
                <td className="px-4 py-4">15%</td>
                <td className="px-4 py-4">38%</td>
              </tr>
              <tr className="text-slate-400">
                <td className="px-4 py-4">Validator B</td>
                <td className="px-4 py-4">2.1%</td>
                <td className="px-4 py-4">58%</td>
                <td className="px-4 py-4">20%</td>
                <td className="px-4 py-4">4%</td>
                <td className="px-4 py-4">3%</td>
                <td className="px-4 py-4">15%</td>
                <td className="px-4 py-4">41%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
