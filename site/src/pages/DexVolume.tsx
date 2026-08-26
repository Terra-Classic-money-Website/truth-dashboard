import { useLayoutEffect, useMemo, useRef, useState } from "react";
import Card from "../components/Card";
import DexVolumeInsights from "../components/DexVolumeInsights";
import SnapshotErrorPanel from "../components/SnapshotErrorPanel";
import DexVolumeChart, {
  DexVolumeLegend,
} from "../components/charts/DexVolumeChart";
import PageHeader from "../components/PageHeader";
import { formatDelta, formatValue } from "../data/format";
import { getSnapshot } from "../data/loadSnapshot";
import { selectDexVolume, type DexVolumeMode } from "../data/selectors";

export default function DexVolume() {
  const { data: snapshot, error } = getSnapshot("dex-volume");
  const [mode, setMode] = useState<DexVolumeMode>("daily");
  const [windowId, setWindowId] = useState("1w");
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const chartWrapRef = useRef<HTMLDivElement>(null);
  const [chartHeight, setChartHeight] = useState<number | null>(null);
  const effectiveWindowId =
    mode === "monthly" && (windowId === "1w" || windowId === "2w" || windowId === "1m")
      ? "3m"
      : windowId;
  const view = useMemo(
    () => (snapshot ? selectDexVolume(snapshot, mode, effectiveWindowId) : null),
    [snapshot, mode, effectiveWindowId],
  );
  const periodUnit =
    mode === "daily"
      ? view?.dates.length === 1
        ? "day"
        : "days"
      : view?.dates.length === 1
        ? "month"
        : "months";

  useLayoutEffect(() => {
    const updateHeight = () => {
      if (!chartWrapRef.current) return;
      const rect = chartWrapRef.current.getBoundingClientRect();
      const available = window.innerHeight - rect.top - 32;
      const minHeight = window.innerWidth < 640 ? 260 : 320;
      setChartHeight(Math.max(minHeight, Math.floor(available)));
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  if (!snapshot || !view) {
    return <SnapshotErrorPanel error={error} />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Terra Classic On-Chain Activity"
        title={view.header.title}
        subtitle={view.header.subtitle}
      />

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/35 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">View</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["daily", "monthly"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={mode === option}
                onClick={() => setMode(option)}
                className={`rounded-full border px-4 py-2 text-xs uppercase tracking-wider transition ${
                  mode === option
                    ? "border-amber-300/70 bg-amber-300/10 text-amber-200"
                    : "border-slate-800 text-slate-300 hover:border-amber-300 hover:text-amber-200"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500 sm:text-right">History</p>
          <div className="mt-2 flex flex-wrap gap-2 sm:justify-end">
            {view.windows
              .filter(
                (window) =>
                  mode === "daily" || window.id === "all" || (window.months !== null && window.id !== "1m"),
              )
              .map((window) => (
                <button
                  key={window.id}
                  type="button"
                  aria-pressed={window.id === effectiveWindowId}
                  onClick={() => setWindowId(window.id)}
                  className={`rounded-full border px-4 py-2 text-xs uppercase tracking-wider transition ${
                    window.id === effectiveWindowId
                      ? "border-sky-300/70 bg-sky-300/10 text-sky-200"
                      : "border-slate-800 text-slate-300 hover:border-sky-300 hover:text-sky-200"
                  }`}
                >
                  {window.label}
                </button>
              ))}
          </div>
        </div>
      </section>

      <section className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {view.kpiTiles.map((kpi) => (
          <Card key={kpi.id} className="border-t-2 border-amber-300/60 p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500">{kpi.label}</div>
            <div className="mt-2 text-lg font-semibold text-white">
              {formatValue({ value: kpi.value, unit: kpi.unit })}
            </div>
            <div className="mt-1 text-xs text-slate-500">{kpi.sublabel}</div>
            {kpi.delta ? (
              <div className="mt-1 text-xs text-slate-400">{formatDelta(kpi.delta)}</div>
            ) : null}
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Volume by venue</h2>
            <p className="mt-1 text-sm text-slate-500">
              {view.modeLabel} USD volume with the total line and individual DEX / on-chain venue series.
            </p>
          </div>
          <p className="text-xs uppercase tracking-wider text-slate-500">
            {view.dates.length} {periodUnit} · interactive chart
          </p>
        </div>
        <Card className="p-0">
          <div
            ref={chartWrapRef}
            className="min-h-80"
            style={chartHeight ? { height: `${chartHeight}px` } : undefined}
          >
            <DexVolumeChart
              dates={view.dates}
              series={view.series}
              total={view.total}
              mode={view.mode}
              height={chartHeight ?? undefined}
              hiddenIds={hiddenIds}
            />
          </div>
        </Card>
        <Card className="p-4 sm:p-5">
          <DexVolumeLegend
            series={view.series}
            total={view.total}
            hiddenIds={hiddenIds}
            onToggle={(id) =>
              setHiddenIds((current) =>
                current.includes(id)
                  ? current.filter((item) => item !== id)
                  : [...current, id],
              )
            }
            onShowAll={() => setHiddenIds([])}
          />
        </Card>
      </section>

      <DexVolumeInsights insights={view.insights} />
    </div>
  );
}
