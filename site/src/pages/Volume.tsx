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

    </div>
  );
}
