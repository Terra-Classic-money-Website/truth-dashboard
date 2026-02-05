import { useState } from "react";
import Card from "../components/Card";
import SnapshotErrorPanel from "../components/SnapshotErrorPanel";
import TimeSeriesChart from "../components/charts/TimeSeriesChart";
import { formatDelta, formatValue } from "../data/format";
import { getSnapshot } from "../data/loadSnapshot";
import { selectLuncVolume } from "../data/selectors";
import PageHeader from "../components/PageHeader";

export default function Volume() {
  const { data: snapshot, error } = getSnapshot("lunc-volume");
  const [windowId, setWindowId] = useState<string>("all");

  if (!snapshot) {
    return <SnapshotErrorPanel error={error} />;
  }

  const view = selectLuncVolume(snapshot, windowId);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Terra Classic Off-Chain Activity"
        title={view.header.title}
        subtitle={view.header.subtitle}
      />

      <div className="flex flex-wrap gap-3">
        {view.windows.map((window) => (
          <button
            key={window.id}
            type="button"
            className="rounded-full border border-slate-800 px-4 py-2 text-xs uppercase tracking-wider text-slate-300 hover:border-amber-300 hover:text-amber-200 transition"
            onClick={() => setWindowId(window.id)}
          >
            {window.label}
          </button>
        ))}
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {view.kpiTiles.map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500">
              {kpi.label}
            </div>
            <div className="mt-2 text-lg font-semibold text-white">
              {kpi.value !== null
                ? formatValue({ value: kpi.value, unit: kpi.unit })
                : "—"}
            </div>
            <div className="mt-1 text-xs text-slate-500">{kpi.sublabel}</div>
            {kpi.delta ? (
              <div className="mt-1 text-xs text-slate-400">
                {formatDelta(kpi.delta)}
              </div>
            ) : null}
          </Card>
        ))}
      </section>

      <Card>
        <TimeSeriesChart series={view.series} height={320} />
      </Card>
    </div>
  );
}
