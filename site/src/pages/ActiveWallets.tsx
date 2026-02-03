import PageHeader from "../components/PageHeader";

export default function ActiveWallets() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Active Wallets"
        subtitle="Monthly active wallets and engagement signals will live here once snapshot data is wired in."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {["Active Wallets", "New Wallets", "Retention"].map((label) => (
          <div
            key={label}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"
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
        Chart and cohort panels will be slotted into this area.
      </div>
    </div>
  );
}
