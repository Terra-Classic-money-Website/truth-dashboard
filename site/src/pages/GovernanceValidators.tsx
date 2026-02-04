import Card from "../components/Card";
import PageHeader from "../components/PageHeader";

export default function GovernanceValidators() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Terra Classic Governance"
        title="Current validators dashboard"
        subtitle="Active validator set from validator.info (via local proxy)."
      />

      <Card>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-500">
              Vote window (affects computed vote metrics only)
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
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input type="checkbox" disabled />
              Income &gt; $100
            </label>
            <button
              type="button"
              className="rounded-full border border-slate-800 px-4 py-2 text-xs uppercase tracking-wider text-slate-300"
            >
              Fetch validators
            </button>
            <div className="text-xs text-slate-500">Last fetched: never</div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="space-y-2 text-sm text-slate-400">
          <div>Idle. Click Fetch to load validators.</div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            Error output placeholder.
          </div>
        </div>
      </Card>

      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-400">
        Validators meta / health card placeholder.
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-white">Active validators</h2>
          <span className="text-xs text-slate-500">Table note placeholder</span>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Validator</th>
                <th className="px-4 py-3">Voting power</th>
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
              <tr className="text-slate-300">
                <td className="px-4 py-3">1</td>
                <td className="px-4 py-3">Validator One</td>
                <td className="px-4 py-3">7.2%</td>
                <td className="px-4 py-3">9,420</td>
                <td className="px-4 py-3">$18.4K</td>
                <td className="px-4 py-3">6%</td>
                <td className="px-4 py-3">9%</td>
                <td className="px-4 py-3">62%</td>
                <td className="px-4 py-3">21%</td>
                <td className="px-4 py-3">9%</td>
                <td className="px-4 py-3">2%</td>
              </tr>
              <tr className="text-slate-400">
                <td className="px-4 py-3">2</td>
                <td className="px-4 py-3">Validator Two</td>
                <td className="px-4 py-3">6.4%</td>
                <td className="px-4 py-3">8,110</td>
                <td className="px-4 py-3">$15.9K</td>
                <td className="px-4 py-3">8%</td>
                <td className="px-4 py-3">12%</td>
                <td className="px-4 py-3">58%</td>
                <td className="px-4 py-3">24%</td>
                <td className="px-4 py-3">12%</td>
                <td className="px-4 py-3">3%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
