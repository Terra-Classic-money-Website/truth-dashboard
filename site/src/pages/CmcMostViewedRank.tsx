import { useLayoutEffect, useMemo, useRef, useState } from "react";
import Card from "../components/Card";
import CmcMostViewedInsights from "../components/CmcMostViewedInsights";
import SnapshotErrorPanel from "../components/SnapshotErrorPanel";
import TimeSeriesChart from "../components/charts/TimeSeriesChart";
import PageHeader from "../components/PageHeader";
import { formatDelta, formatValue } from "../data/format";
import { getSnapshot } from "../data/loadSnapshot";
import {
  selectCmcMostViewed,
  type CmcMostViewedMode,
} from "../data/selectors";
import useViewportWidth from "../hooks/useViewportWidth";

function getDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date
    : new Date(`${value}T00:00:00Z`);
}

function buildMonthlyTicks(points: Array<{ t?: string; periodEnd?: string }>) {
  if (!points.length) return [];
  const firstValue = points[0].t ?? points[0].periodEnd ?? "";
  const lastValue = points[points.length - 1].t ?? points[points.length - 1].periodEnd ?? "";
  const firstDate = getDate(firstValue);
  const lastDate = getDate(lastValue);
  if (!Number.isFinite(firstDate.getTime()) || !Number.isFinite(lastDate.getTime())) {
    return [];
  }
  const cursor = new Date(
    Date.UTC(firstDate.getUTCFullYear(), firstDate.getUTCMonth(), 1),
  );
  const end = new Date(
    Date.UTC(lastDate.getUTCFullYear(), lastDate.getUTCMonth(), 1),
  );
  const ticks: string[] = [];
  while (cursor <= end) {
    ticks.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return ticks;
}

export default function CmcMostViewedRank() {
  const { data: snapshot, error } = getSnapshot("cmc-most-viewed-rank");
  const [windowId, setWindowId] = useState("all");
  const [mode, setMode] = useState<CmcMostViewedMode>("snapshots");
  const chartWrapRef = useRef<HTMLDivElement>(null);
  const [chartHeight, setChartHeight] = useState<number | null>(null);
  const viewportWidth = useViewportWidth();
  const isMobile = viewportWidth < 640;
  const view = useMemo(
    () => (snapshot ? selectCmcMostViewed(snapshot, windowId, mode) : null),
    [snapshot, windowId, mode],
  );

  const monthlyTicks = useMemo(
    () => buildMonthlyTicks(view?.series.flatMap((serie) => serie.points) ?? []),
    [view],
  );

  useLayoutEffect(() => {
    const updateHeight = () => {
      if (!chartWrapRef.current) return;
      const rect = chartWrapRef.current.getBoundingClientRect();
      const available = window.innerHeight - rect.top - 32;
      const minHeight = window.innerWidth < 640 ? 300 : 360;
      setChartHeight(Math.max(minHeight, Math.floor(available)));
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  if (!snapshot || !view) {
    return <SnapshotErrorPanel error={error} />;
  }

  const formatMonthLabel = (isoDate: string) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${isoDate}T00:00:00Z`));

  const formatRankTick = (value: number) => `#${Math.round(value)}`;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Terra Classic External Attention"
        title={view.header.title}
        subtitle={view.header.subtitle}
        status={view.header.status}
      />

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/35 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">View</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {([
              ["snapshots", "Snapshots"],
              ["monthly", "Monthly median"],
            ] as const).map(([option, label]) => (
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
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500 sm:text-right">History</p>
          <div className="mt-2 flex flex-wrap gap-2 sm:justify-end">
            {view.windows.map((window) => (
              <button
                key={window.id}
                type="button"
                aria-pressed={window.id === windowId}
                onClick={() => setWindowId(window.id)}
                className={`rounded-full border px-4 py-2 text-xs uppercase tracking-wider transition ${
                  window.id === windowId
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
            <div className="text-xs uppercase tracking-wider text-slate-500">
              {kpi.label}
            </div>
            <div className="mt-2 text-lg font-semibold text-white">
              {formatValue({ value: kpi.value, unit: kpi.unit })}
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

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">{view.chart.title}</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">{view.chart.description}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-xs uppercase tracking-wider text-slate-500">
            <p>
              {view.chart.pointCount} {mode === "monthly" ? "months" : "captures"} · interactive chart
            </p>
            {view.chart.latestPointCount > 0 && view.insights.currentEvidence ? (
              <p className="flex items-center gap-2 text-amber-200">
                <span className="h-2 w-2 rounded-full bg-amber-300" aria-hidden="true" />
                Latest score · {formatValue({ value: view.insights.currentEvidence.rank, unit: "rank" })}
              </p>
            ) : null}
          </div>
        </div>
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
              yTicks={[1, 10, 20, 30, 40, 50, 60]}
              yTickFormatter={formatRankTick}
              minXTickGap={isMobile ? 96 : 64}
              invertY
              showPoints
              maxGapDays={mode === "monthly" ? 120 : 120}
            />
          </div>
        </Card>
      </section>

      <CmcMostViewedInsights insights={view.insights} />
    </div>
  );
}
