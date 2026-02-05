import Card from "../components/Card";
import PageHeader from "../components/PageHeader";

const metrics = [
  {
    label: "Average Yes votes per proposal (validators)",
    value: "29.9",
  },
  {
    label: "Average No votes per proposal (validators)",
    value: "9.2",
  },
  {
    label: "Average Veto votes per proposal (validators)",
    value: "3.1",
  },
  {
    label: "Average non-participation per proposal (validators)",
    value: "55",
  },
  {
    label: "Average proposals not voted",
    value: "55",
  },
  {
    label: "Avg delegators voting per proposal",
    value: "439",
  },
  {
    label: "Avg delegators as % of active wallets (last year)",
    value: "0.37%",
  },
  {
    label: "% of all votes not voted",
    value: "30.39%",
  },
  {
    label: "% of all votes that are No with Veto",
    value: "1.71%",
  },
  {
    label: "Active validators in dataset",
    value: "181",
  },
  {
    label: "Validators with >60% non-participation",
    value: "42",
  },
  {
    label: "Validators with >70% non-participation",
    value: "36",
  },
  {
    label: "Validators with >80% non-participation",
    value: "29",
  },
  {
    label: "Validators with >90% non-participation",
    value: "19",
  },
  {
    label: "Validators with 100% non-participation",
    value: "3",
  },
  {
    label: "<50% non-participation statement",
    value:
      "Validators with <50% non-participation: 134 of 181. That means 25.97% of validators participate in fewer than half of proposals.",
    variant: "long",
  },
  {
    label: "Voting power of never-voters",
    value:
      "Validators with 100% non-participation control 3.08% of total voting power.",
    variant: "long",
  },
  {
    label: "Bottom 50% voting power behavior",
    value:
      "Bottom 50% (by voting power rank) skip 20.72% of proposals on average.",
    variant: "long",
  },
];

export default function GovernanceParticipation() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Terra Classic Governance"
        title="Terra Classic Governance Participation"
        subtitle="Governance participation derived from validator.info indexer API (via local proxy)."
      />

      <Card>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-slate-500">
            Time window
          </label>
          <div className="flex flex-wrap gap-2">
            {["All time", "Last 2 years", "Last year"].map((label) => (
              <label
                key={label}
                className="flex items-center gap-2 rounded-full border border-slate-800 px-3 py-2 text-xs uppercase tracking-wider text-slate-300"
              >
                <input type="radio" disabled />
                {label}
              </label>
            ))}
          </div>
        </div>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((item) => (
          <Card key={item.label} className="p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500">
              {item.label}
            </div>
            <div
              className={`mt-2 font-semibold text-white ${
                item.variant === "long" ? "text-base" : "text-lg"
              }`}
            >
              {item.value}
            </div>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold text-white">
            Non-participation distribution
          </h2>
          <div className="mt-3 flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/50 text-sm text-slate-500">
            Chart placeholder
          </div>
          <div className="mt-3 text-sm text-slate-400">
            Legend placeholder
          </div>
        </Card>
        <Card>
          <h2 className="text-base font-semibold text-white">
            Top 15 by non-participation
          </h2>
          <div className="mt-3 flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/50 text-sm text-slate-500">
            Chart placeholder
          </div>
        </Card>
        <Card>
          <h2 className="text-base font-semibold text-white">
            Overall vote composition
          </h2>
          <div className="mt-3 flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/50 text-sm text-slate-500">
            Chart placeholder
          </div>
        </Card>
        <Card>
          <h2 className="text-base font-semibold text-white">
            Delegators per proposal (top 20)
          </h2>
          <div className="mt-3 flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/50 text-sm text-slate-500">
            Chart placeholder
          </div>
        </Card>
      </section>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-white">
            Validators with &gt; 60% non-participation
          </h2>
          <span className="text-xs text-slate-500">Table note placeholder</span>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Validator</th>
                <th className="px-4 py-3">Voting power share</th>
                <th className="px-4 py-3">Yes</th>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">No with veto</th>
                <th className="px-4 py-3">Abstain</th>
                <th className="px-4 py-3">Did not vote</th>
                <th className="px-4 py-3">Non-participation %</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-slate-300">
                <td className="px-4 py-3">Validator A</td>
                <td className="px-4 py-3">2.8%</td>
                <td className="px-4 py-3">62%</td>
                <td className="px-4 py-3">18%</td>
                <td className="px-4 py-3">3%</td>
                <td className="px-4 py-3">2%</td>
                <td className="px-4 py-3">15%</td>
                <td className="px-4 py-3">38%</td>
              </tr>
              <tr className="text-slate-400">
                <td className="px-4 py-3">Validator B</td>
                <td className="px-4 py-3">2.1%</td>
                <td className="px-4 py-3">58%</td>
                <td className="px-4 py-3">20%</td>
                <td className="px-4 py-3">4%</td>
                <td className="px-4 py-3">3%</td>
                <td className="px-4 py-3">15%</td>
                <td className="px-4 py-3">41%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
