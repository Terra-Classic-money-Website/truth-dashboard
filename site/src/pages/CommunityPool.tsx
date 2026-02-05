import Card from "../components/Card";
import PageHeader from "../components/PageHeader";

export default function CommunityPool() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Terra Classic Community Pool"
        title="Balances & Flow Analysis"
        subtitle="Track historical balances, inflows, and outflows for LUNC and USTC."
      />
      <Card>
        <div>
          <h2 className="text-lg font-semibold text-white">Analysis window</h2>
          <p className="mt-1 text-sm text-slate-400">
            Filters metrics, chart, and outflow table without changing the cached
            build.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {["1M", "6M", "1Y", "2Y", "3Y", "ALL"].map((label) => (
            <button
              key={label}
              type="button"
              className="rounded-full border border-slate-800 px-4 py-2 text-xs uppercase tracking-wider text-slate-300"
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Community Pool Balance (History)
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Outflow markers highlight periods with governance spend outflows.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-400">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked disabled />
              Show forecast (12M)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" disabled />
              Show height/time
            </label>
          </div>
        </div>
        <div className="mt-6 flex h-80 items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/50 text-sm text-slate-500">
          Chart placeholder — community pool balance history
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Community Pool Spend Outflows
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Based on governance spend records (CSV) and mapped to the analysis
              window.
            </p>
          </div>
          <div className="space-y-2 text-xs text-slate-400">
            <div>Outflow summary: —</div>
            <label className="flex items-center gap-2">
              <input type="checkbox" disabled />
              Show unmapped
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked disabled />
              Show low-confidence
            </label>
          </div>
        </div>
        <div className="mt-4 text-sm text-slate-500">
          Outflow warning placeholder.
        </div>
        <div className="mt-4 space-y-2 text-sm text-slate-400">
          <div className="grid grid-cols-4 gap-3 rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-2 text-xs uppercase tracking-wider text-slate-500">
            <span>Date</span>
            <span>Proposal</span>
            <span>Amount</span>
            <span>Notes</span>
          </div>
          {[
            ["2024-03-18", "Community Pool Funding", "48M LUNC", "Mapped"],
            ["2024-07-02", "Ecosystem Grant", "22M LUNC", "Low confidence"],
          ].map((row) => (
            <div
              key={row[0]}
              className="grid grid-cols-4 gap-3 rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-3"
            >
              {row.map((cell) => (
                <span key={cell}>{cell}</span>
              ))}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div>
          <h2 className="text-lg font-semibold text-white">Overview</h2>
          <p className="mt-1 text-sm text-slate-400">
            Totals are derived from period deltas in the canonical dataset.
          </p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Total inflow", "1.92B LUNC"],
            ["Total outflow", "1.48B LUNC"],
            ["Net change", "+440M LUNC"],
            ["Utilization ratio", "0.77"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
            >
              <p className="text-xs uppercase tracking-wider text-slate-500">
                {label}
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-400">
          Sanity checks will be listed here.
        </div>
      </Card>

      <Card>
        <div>
          <h2 className="text-lg font-semibold text-white">Capital utilization</h2>
          <p className="mt-1 text-sm text-slate-400">
            Utilization and inactivity metrics computed from weekly spend buckets
            in the active window.
          </p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Utilization", "0.77"],
            ["Idle periods", "14"],
            ["Longest inactivity", "9 weeks"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
            >
              <p className="text-xs uppercase tracking-wider text-slate-500">
                {label}
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div>
          <h2 className="text-lg font-semibold text-white">Spend concentration</h2>
          <p className="mt-1 text-sm text-slate-400">
            How much weekly governance spend is concentrated into a small number
            of weeks.
          </p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Top 5 weeks share", "48%"],
            ["Top 10 weeks share", "62%"],
            ["Median weekly outflow", "18.4M"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
            >
              <p className="text-xs uppercase tracking-wider text-slate-500">
                {label}
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
      </Card>






    </div>
  );
}
