import Card from "../components/Card";
import PageHeader from "../components/PageHeader";

export default function GovernanceProposals() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Terra Classic Governance"
        title="Proposals dashboard"
        subtitle="All proposals in voting stage since May 2022 (validator.info via local proxy)."
      />

      <Card>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-500">
              Search
            </label>
            <input
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
              placeholder="Search by id, title, type..."
              type="text"
              disabled
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-500">
              Sort
            </label>
            <select
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
              disabled
            >
              <option>End date</option>
              <option>Delegators</option>
              <option>Yes %</option>
              <option>No %</option>
              <option>Veto %</option>
              <option>Abstain %</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-500">
              Status
            </label>
            <select
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
              disabled
            >
              <option>All statuses</option>
              <option>Voting</option>
              <option>Passed</option>
              <option>Rejected</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input type="checkbox" defaultChecked disabled />
            Descending
          </label>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-white">
            Proposals since May 2022
          </h2>
          <span className="text-xs text-slate-500">Table note placeholder</span>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Votes distribution</th>
                <th className="px-4 py-3">Delegators</th>
                <th className="px-4 py-3">End date</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-slate-300">
                <td className="px-4 py-3">128</td>
                <td className="px-4 py-3">Community Pool Funding</td>
                <td className="px-4 py-3">Spend</td>
                <td className="px-4 py-3">Voting</td>
                <td className="px-4 py-3">Yes 72% • No 18%</td>
                <td className="px-4 py-3">1,420</td>
                <td className="px-4 py-3">2026-03-12</td>
              </tr>
              <tr className="text-slate-400">
                <td className="px-4 py-3">127</td>
                <td className="px-4 py-3">Validator Incentives</td>
                <td className="px-4 py-3">Parameter Change</td>
                <td className="px-4 py-3">Passed</td>
                <td className="px-4 py-3">Yes 68% • No 22%</td>
                <td className="px-4 py-3">1,210</td>
                <td className="px-4 py-3">2026-02-01</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
