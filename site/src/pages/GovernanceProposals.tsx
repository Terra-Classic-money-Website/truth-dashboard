import PageHeader from "../components/PageHeader";

export default function GovernanceProposals() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Governance Proposals"
        subtitle="Proposal cadence, status distribution, and top themes will be summarized here."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {["Open Proposals", "Passed vs Rejected"].map((label) => (
          <div
            key={label}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-6"
          >
            <p className="text-xs uppercase tracking-wider text-slate-500">
              {label}
            </p>
            <p className="mt-4 text-2xl font-semibold text-slate-200">--</p>
            <p className="mt-2 text-xs text-slate-500">
              Snapshot metric placeholder
            </p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-sm text-slate-400">
        Proposal history table will appear here.
      </div>
    </div>
  );
}
