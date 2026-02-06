import { useLayoutEffect, useMemo, useRef, useState } from "react";
import Card from "../components/Card";
import SnapshotErrorPanel from "../components/SnapshotErrorPanel";
import TimeSeriesChart from "../components/charts/TimeSeriesChart";
import { formatDelta, formatValue } from "../data/format";
import { getSnapshot } from "../data/loadSnapshot";
import { selectLuncVolume } from "../data/selectors";
import PageHeader from "../components/PageHeader";
import useViewportWidth from "../hooks/useViewportWidth";

export default function Volume() {
  const { data: snapshot, error } = getSnapshot("lunc-volume");
  const [windowId, setWindowId] = useState<string>("1y");
  const chartWrapRef = useRef<HTMLDivElement>(null);
  const [chartHeight, setChartHeight] = useState<number | null>(null);
  const viewportWidth = useViewportWidth();
  const isMobile = viewportWidth < 640;

  if (!snapshot) {
    return <SnapshotErrorPanel error={error} />;
  }

  const view = selectLuncVolume(snapshot, windowId);
  const monthlyTicks = useMemo(() => {
    const points = view.series[0]?.points ?? [];
    if (!points.length) return [];
    const getDate = (point: { t?: string; periodEnd?: string }) =>
      new Date(`${point.t ?? point.periodEnd ?? ""}T00:00:00Z`);
    const startDate = getDate(points[0]);
    const endDate = getDate(points[points.length - 1]);
    const start = new Date(
      Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1),
    );
    const end = new Date(
      Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), 1),
    );
    const ticks: string[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      ticks.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    return ticks;
  }, [view.series]);

  const yTicks = useMemo(
    () => [
      600_000_000,
      500_000_000,
      400_000_000,
      300_000_000,
      200_000_000,
      100_000_000,
      75_000_000,
      50_000_000,
      25_000_000,
      0,
    ],
    [],
  );

  const formatMonthLabel = (isoDate: string) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      year: "numeric",
    }).format(new Date(`${isoDate}T00:00:00Z`));

  const formatUsdTick = (value: number) => {
    if (value === 0) return "$0.00";
    const abs = Math.abs(value);
    if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
    if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (abs >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

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

      <section className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      <Card className="p-0">
        <div
          ref={chartWrapRef}
          className="min-h-80"
          style={chartHeight ? { height: `${chartHeight}px` } : undefined}
        >
          <TimeSeriesChart
            series={view.series}
            className="h-full"
            xTicks={monthlyTicks}
            xTickFormatter={formatMonthLabel}
            yTicks={yTicks}
            yTickFormatter={formatUsdTick}
            minXTickGap={isMobile ? 96 : 60}
            forceAllXTicks={!isMobile}
          />
        </div>
      </Card>
    </div>
  );
}
