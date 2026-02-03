import Card from "../components/Card";
import KpiCard from "../components/KpiCard";
import PageHeader from "../components/PageHeader";
import SectionTitle from "../components/SectionTitle";

export default function Volume() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Terra Classic Off-Chain Activity"
        title="LUNC Trading Volume"
        subtitle="Historical LUNC trading volume snapshots, aggregated across major venues."
        status="Data source: CoinGecko market_chart/range (static preview)"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Latest 24h Volume"
          value="$18.4M"
          helper="Most recent snapshot"
          trend="+6.2% day-over-day"
          accent="amber"
        />
        <KpiCard
          label="Max Volume (Range)"
          value="$42.9M"
          helper="Peak day in range"
          trend="High volatility"
          accent="sky"
        />
        <KpiCard
          label="Avg Volume (Range)"
          value="$21.7M"
          helper="Rolling average"
          trend="Stable"
          accent="emerald"
        />
        <KpiCard
          label="Tracked Venues"
          value="12"
          helper="Centralized exchanges"
          trend="Coverage expanding"
          accent="rose"
        />
      </section>

      <Card>
        <SectionTitle
          title="Volume Trend"
          subtitle="Daily 24h trading volume in USD"
          meta="Range: 24 months"
        />
        <div className="mt-6 flex h-80 items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/50 text-sm text-slate-500">
          Chart placeholder — trading volume history
        </div>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle
            title="Venue Breakdown"
            subtitle="Top exchanges by average daily volume"
          />
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Exchange</th>
                  <th className="px-4 py-3">Share</th>
                  <th className="px-4 py-3">Avg Daily</th>
                  <th className="px-4 py-3">Liquidity</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={4}>
                    Table placeholder — venue stats coming soon.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Market Notes"
            subtitle="Context for volume shifts"
          />
          <div className="mt-4 space-y-3 text-sm text-slate-400">
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              Volume spikes will be annotated with market catalysts.
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              Exchange coverage notes will be added as data snapshots update.
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
