import PageHeader from "../components/PageHeader";

export default function GovernanceValidators() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Governance Validators"
        subtitle="Validator participation, voting alignment, and missed vote analysis will be staged here."
      />
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <p className="text-xs uppercase tracking-wider text-slate-500">
          Validator Snapshot
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {["Active Validators", "Abstain Rate", "Missed Votes"].map(
            (label) => (
              <div
                key={label}
                className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-5"
              >
                <p className="text-sm font-medium text-slate-200">{label}</p>
                <p className="mt-3 text-2xl font-semibold text-white">--</p>
                <p className="mt-2 text-xs text-slate-500">
                  Snapshot metric placeholder
                </p>
              </div>
            ),
          )}
        </div>
      </div>
      <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-sm text-slate-400">
        Validator performance table will be placed here.
      </div>
    </div>
  );
}
