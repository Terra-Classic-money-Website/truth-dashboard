import Card from "../components/Card";
import KpiCard from "../components/KpiCard";
import PageHeader from "../components/PageHeader";
import SectionTitle from "../components/SectionTitle";

export default function CommunityPool() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Terra Classic Community Pool"
        title="Balances & Flow Analysis"
        subtitle="Track historical balances, inflows, and outflows for LUNC and USTC."
        status="Data source: Community pool snapshots (static preview)"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="LUNC Balance"
          value="29.4B"
          helper="Community pool balance"
          trend="Monthly +1.2%"
          accent="amber"
        />
        <KpiCard
          label="USTC Balance"
          value="1.8B"
          helper="Community pool balance"
          trend="Monthly -0.4%"
          accent="sky"
        />
        <KpiCard
          label="Net Inflows"
          value="+312M"
          helper="Last 30 days"
          trend="Inflow trend rising"
          accent="emerald"
        />
        <KpiCard
          label="Distributions"
          value="54M"
          helper="Last 30 days"
          trend="Stable cadence"
          accent="rose"
        />
      </section>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Data</h3>
            <p className="mt-1 text-sm text-slate-400">
              Source and coverage controls for historical community pool
              snapshots.
            </p>
          </div>
          <div className="text-xs uppercase tracking-wider text-slate-500">
            Data coverage: 2022-05 to 2026-02
          </div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Source
            </p>
            <p className="mt-2 text-sm text-slate-300">Community Pool (Monthly)</p>
            <p className="mt-2 text-xs text-slate-500">
              Switch sources once live data wiring is enabled.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Proxy Base URL
            </p>
            <p className="mt-2 text-sm text-slate-300">
              http://localhost:8787
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Range
            </p>
            <p className="mt-2 text-sm text-slate-300">Since May 2022</p>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-400">
          Data coverage and current snapshot values will populate once the data
          adapters are connected.
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Analysis Window"
          subtitle="Filters metrics, chart, and outflow table without changing the cached build."
        />
        <div className="mt-4 flex flex-wrap gap-3">
          {["1M", "6M", "1Y", "2Y", "3Y", "ALL"].map((label) => (
            <button
              key={label}
              type="button"
              className="rounded-full border border-slate-800 px-4 py-2 text-xs uppercase tracking-wider text-slate-300 hover:border-amber-300 hover:text-amber-200 transition"
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Community Pool Balance (History)"
          subtitle="Outflow markers highlight periods with governance spend outflows."
          meta="Forecast: 12M"
        />
        <div className="mt-6 flex h-80 items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/50 text-sm text-slate-500">
          Chart placeholder — balance history
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Community Pool Spend Outflows"
          subtitle="Based on governance spend records mapped to the analysis window."
          meta="Outflow summary: 18 events"
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {["Mapping complete", "Low confidence: 4", "Unmapped: 2"].map(
            (label) => (
              <div
                key={label}
                className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-400"
              >
                {label}
              </div>
            ),
          )}
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Overview"
          subtitle="Totals derived from period deltas in the canonical dataset."
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Total Inflows", "1.92B LUNC"],
            ["Total Outflows", "1.48B LUNC"],
            ["Net Change", "+440M LUNC"],
            ["Utilization Ratio", "77%"],
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
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-400">
          Sanity checks and outlier notes will be displayed here.
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Capital Utilization"
          subtitle="Utilization and inactivity metrics computed from weekly spend buckets."
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Utilization", "0.77"],
            ["Idle Weeks", "14"],
            ["Longest Inactivity", "9 weeks"],
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
        <SectionTitle
          title="Spend Concentration"
          subtitle="How much weekly spend is concentrated in a small number of weeks."
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Top 5 Weeks Share", "48%"],
            ["Top 10 Weeks Share", "62%"],
            ["Median Weekly Outflow", "18.4M"],
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
        <SectionTitle title="Methodology" subtitle="Summary of dataset construction." />
        <details className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-400">
          <summary className="cursor-pointer text-sm font-medium text-slate-200">
            Methodology
          </summary>
          <div className="mt-3 space-y-2">
            <p>
              Canonical dataset includes date, denom, and balance for LUNC/USTC.
            </p>
            <p>
              Inflows and outflows are derived from period deltas and normalized
              to the active analysis window.
            </p>
            <p>
              Proxy builds cache daily balances from LCD/RPC snapshots for long
              range coverage.
            </p>
          </div>
        </details>
      </Card>

      <Card>
        <SectionTitle
          title="Exports"
          subtitle="Download raw balances and derived daily flows."
        />
        <div className="mt-4 flex flex-wrap gap-3">
          {["Download raw balances (CSV)", "Download derived daily flows (CSV)"].map(
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
      </Card>

      <Card>
        <SectionTitle title="Debug" subtitle="Collapsed debug output." />
        <details className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-400">
          <summary className="cursor-pointer text-sm font-medium text-slate-200">
            Debug
          </summary>
          <pre className="mt-3 whitespace-pre-wrap">
            (collapsed) Debug output will appear here.
          </pre>
        </details>
      </Card>
    </div>
  );
}
