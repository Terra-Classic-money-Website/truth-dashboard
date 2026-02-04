import Card from "../components/Card";
import PageHeader from "../components/PageHeader";

const kpis = [
  { label: "Latest volume", value: "—" },
  { label: "Max volume in range", value: "—" },
  { label: "Avg volume in range", value: "—" },
];

export default function Volume() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Terra Classic Off-Chain Activity"
        title="LUNC 24h Trading Volume (USD) — Historical"
        subtitle="Pulls CoinGecko market_chart/range volume data for Terra Classic (LUNC)."
      />

      <Card>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-500">
              CoinGecko Demo API key
            </label>
            <input
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
              placeholder="Enter demo key"
              type="password"
              disabled
            />
            <label className="flex items-center gap-2 text-xs text-slate-500">
              <input type="checkbox" disabled />
              Save key locally (localStorage)
            </label>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-500">
              Start date
            </label>
            <input
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
              type="date"
              disabled
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-500">
              End date
            </label>
            <input
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
              type="date"
              disabled
            />
          </div>

          <div className="flex flex-wrap gap-2 lg:col-span-3">
            {["Load data", "1 year", "Test coin id", "Test /ping", "Export CSV"].map(
              (label) => (
                <button
                  key={label}
                  className="rounded-full border border-slate-800 px-4 py-2 text-xs uppercase tracking-wider text-slate-300 hover:border-amber-300 hover:text-amber-200 transition disabled:opacity-60"
                  type="button"
                  disabled={label === "Export CSV"}
                >
                  {label}
                </button>
              ),
            )}
          </div>

          <div className="lg:col-span-3">
            <label className="text-xs uppercase tracking-wider text-slate-500">
              Debug
            </label>
            <pre className="mt-2 min-h-20 rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-xs text-slate-400">
              (debug output)
            </pre>
          </div>
        </div>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500">
              {kpi.label}
            </div>
            <div className="mt-2 text-lg font-semibold text-white">
              {kpi.value}
            </div>
          </Card>
        ))}
      </section>

      <Card>
        <canvas
          id="volumeChart"
          className="h-80 w-full rounded-xl border border-dashed border-slate-800 bg-slate-950/50"
        />
      </Card>

      <div className="text-sm text-slate-400">
        <span>Status:</span> Idle. Configure inputs and click Load data.
      </div>
    </div>
  );
}
