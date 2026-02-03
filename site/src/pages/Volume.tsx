import Card from "../components/Card";
import KpiCard from "../components/KpiCard";
import PageHeader from "../components/PageHeader";
import SectionTitle from "../components/SectionTitle";

export default function Volume() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Terra Classic Off-Chain Activity"
        title="LUNC 24h Trading Volume (USD) — Historical"
        subtitle="Pulls CoinGecko market_chart/range volume data for Terra Classic (LUNC)."
        status="Data source: CoinGecko market chart (static preview)"
      />

      <Card>
        <SectionTitle
          title="Controls"
          subtitle="Configure key and time range before loading volume snapshots."
        />
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-500">
              CoinGecko Demo API Key
            </label>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-400">
              Enter demo key
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="h-2 w-2 rounded-full bg-slate-600" />
              Save key locally (localStorage)
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-500">
              Start Date
            </label>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-400">
              2022-06-01
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-500">
              End Date
            </label>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-400">
              2026-02-03
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {["Load data", "1 year", "Test coin id", "Test /ping", "Export CSV"].map(
            (label) => (
              <button
                key={label}
                type="button"
                className="rounded-full border border-slate-800 px-4 py-2 text-xs uppercase tracking-wider text-slate-300 hover:border-amber-300 hover:text-amber-200 transition"
              >
                {label}
              </button>
            ),
          )}
        </div>
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400">
          Debug output will appear here when the loader is wired in.
        </div>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Latest Volume"
          value="$18.4M"
          helper="Most recent snapshot"
          trend="+6.2% day-over-day"
          accent="amber"
        />
        <KpiCard
          label="Max Volume in Range"
          value="$42.9M"
          helper="Peak day in range"
          trend="High volatility"
          accent="sky"
        />
        <KpiCard
          label="Avg Volume in Range"
          value="$21.7M"
          helper="Rolling average"
          trend="Stable"
          accent="emerald"
        />
      </section>

      <Card>
        <SectionTitle
          title="Volume Chart"
          subtitle="Daily 24h trading volume in USD"
          meta="Range: 24 months"
        />
        <div className="mt-6 flex h-80 items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/50 text-sm text-slate-500">
          Chart placeholder — trading volume history
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Status"
          subtitle="Load state, warnings, and export hints"
        />
        <div className="mt-4 text-sm text-slate-400">
          Idle. Configure API key and date range, then click Load data to refresh
          the volume history.
        </div>
      </Card>
    </div>
  );
}
