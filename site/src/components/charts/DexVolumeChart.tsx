import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import type { DexVolumeSeries } from "../../data/contracts";
import { formatDateLabel, formatValue } from "../../data/format";

export type ChartPoint = { t: string; v: number };

export type DexVolumeChartProps = {
  dates: string[];
  series: DexVolumeSeries[];
  total: ChartPoint[];
  mode: "daily" | "monthly";
  height?: number;
  hiddenIds: string[];
};

export type DexVolumeLegendProps = {
  series: DexVolumeSeries[];
  total: ChartPoint[];
  hiddenIds: string[];
  onToggle: (id: string) => void;
  onShowAll: () => void;
};

type HoverState = {
  index: number;
  x: number;
};

const totalId = "__total__";
const totalColor = "#f8fafc";
const defaultChartHeight = 440;
const margins = { top: 24, right: 24, bottom: 48, left: 72 };

function niceStep(maxValue: number, targetTickCount: number) {
  if (maxValue <= 0) return 1;
  const roughStep = maxValue / targetTickCount;
  const power = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / power;
  const multiplier = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return multiplier * power;
}

function formatUsdTick(value: number) {
  if (value === 0) return "$0";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function buildPath(
  points: ChartPoint[],
  x: (index: number) => number,
  y: (value: number) => number,
) {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(point.v)}`)
    .join(" ");
}

function getLatestValue(points: ChartPoint[]) {
  return points[points.length - 1]?.v ?? 0;
}

function isHidden(hiddenIds: string[], id: string) {
  return hiddenIds.includes(id);
}

export default function DexVolumeChart({
  dates,
  series,
  total,
  mode,
  height = defaultChartHeight,
  hiddenIds,
}: DexVolumeChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(960);
  const [hover, setHover] = useState<HoverState | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateWidth = () => {
      const nextWidth = Math.floor(element.getBoundingClientRect().width);
      if (nextWidth > 0) setWidth(nextWidth);
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const chartHeight = Math.max(260, height);
  const plotWidth = Math.max(180, width - margins.left - margins.right);
  const plotHeight = chartHeight - margins.top - margins.bottom;
  const maxValue = Math.max(
    0,
    ...total.map((point) => point.v),
    ...series.flatMap((venue) => venue.points.map((point) => point.v)),
  );
  const yStep = niceStep(maxValue, 5);
  const yMax = Math.max(yStep, Math.ceil(maxValue / yStep) * yStep);
  const yTicks = Array.from({ length: 6 }, (_, index) => yStep * index).reverse();
  const x = (index: number) =>
    margins.left + (dates.length <= 1 ? 0 : (index / (dates.length - 1)) * plotWidth);
  const y = (value: number) => margins.top + plotHeight - (value / yMax) * plotHeight;
  const totalPath = buildPath(total, x, y);
  const totalAreaPath = total.length
    ? `${totalPath} L ${x(total.length - 1)} ${y(0)} L ${x(0)} ${y(0)} Z`
    : "";
  const visibleSeries = series.filter((venue) => !isHidden(hiddenIds, venue.id));
  const isTotalVisible = !isHidden(hiddenIds, totalId);

  const xTickIndexes = useMemo(() => {
    if (!dates.length) return [];
    const count = Math.min(8, dates.length);
    return Array.from({ length: count }, (_, index) =>
      count === 1 ? 0 : Math.round((index / (count - 1)) * (dates.length - 1)),
    );
  }, [dates]);

  const hoveredDate = hover ? dates[hover.index] : null;
  const hoveredTotal = hover ? total[hover.index] : null;
  const hoveredSeries = hover
    ? visibleSeries
        .map((venue) => ({
          ...venue,
          point: venue.points[hover.index],
        }))
        .sort((a, b) => (b.point?.v ?? 0) - (a.point?.v ?? 0))
    : [];
  const tooltipWidth = Math.min(224, width - 24);
  const tooltipLeft = hover
    ? Math.min(
        Math.max(12, hover.x - tooltipWidth / 2),
        width - tooltipWidth - 12,
      )
    : 12;

  const handleMouseMove = (event: MouseEvent<SVGSVGElement>) => {
    if (!dates.length) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    const svgX = ((event.clientX - rect.left) / rect.width) * width;
    const index = Math.max(
      0,
      Math.min(
        dates.length - 1,
        Math.round(((svgX - margins.left) / plotWidth) * (dates.length - 1)),
      ),
    );
    setHover({ index, x: x(index) });
  };

  return (
    <div ref={containerRef} className="relative h-full min-w-0 overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/55">
      {hoveredDate && hover ? (
        <div
          className="pointer-events-none absolute z-10 overflow-y-auto rounded-lg border border-slate-700 bg-slate-950/95 p-3 text-xs shadow-2xl"
          style={{
            left: `${tooltipLeft}px`,
            top: "12px",
            width: `${tooltipWidth}px`,
            maxHeight: "calc(100% - 24px)",
          }}
        >
          <p className="font-semibold text-white">
            {formatDateLabel(hoveredDate, mode)}
          </p>
          {isTotalVisible && hoveredTotal ? (
            <div className="mt-2 flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: totalColor }} />
                Total
              </span>
              <span className="font-medium text-white">
                {formatValue({ value: hoveredTotal.v, unit: "usd" })}
              </span>
            </div>
          ) : null}
          <div className="mt-2 space-y-1">
            {hoveredSeries.map((venue) => (
              <div key={venue.id} className="flex items-center justify-between gap-3 text-slate-400">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: venue.color }} />
                  <span className="truncate">{venue.label}</span>
                </span>
                <span className="shrink-0 text-slate-200">
                  {formatValue({ value: venue.point?.v ?? 0, unit: "usd" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <svg
        viewBox={`0 0 ${width} ${chartHeight}`}
        className="block h-full min-h-0 w-full"
        role="img"
        aria-label="Trading volume by DEX and on-chain venue"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
      >
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={margins.left}
              x2={width - margins.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke="#243044"
              strokeDasharray="4 4"
            />
            <text x={margins.left - 10} y={y(tick) + 4} textAnchor="end" fill="#64748b" fontSize="11">
              {formatUsdTick(tick)}
            </text>
          </g>
        ))}
        {xTickIndexes.map((index) => (
          <g key={dates[index]}>
            <line
              x1={x(index)}
              x2={x(index)}
              y1={margins.top}
              y2={margins.top + plotHeight}
              stroke="#1e293b"
            />
            <text
              x={x(index)}
              y={chartHeight - 18}
              textAnchor="middle"
              fill="#64748b"
              fontSize="11"
            >
              {formatDateLabel(dates[index], mode)}
            </text>
          </g>
        ))}
        {isTotalVisible && totalAreaPath ? (
          <path d={totalAreaPath} fill={totalColor} fillOpacity="0.08" />
        ) : null}
        {visibleSeries.map((venue) => (
          <path
            key={venue.id}
            d={buildPath(venue.points, x, y)}
            fill="none"
            stroke={venue.color}
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity="0.82"
          />
        ))}
        {isTotalVisible && totalPath ? (
          <path
            d={totalPath}
            fill="none"
            stroke={totalColor}
            strokeWidth="2.4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
        {hover ? (
          <line
            x1={hover.x}
            x2={hover.x}
            y1={margins.top}
            y2={margins.top + plotHeight}
            stroke="#cbd5e1"
            strokeDasharray="3 3"
            opacity="0.6"
          />
        ) : null}
      </svg>
    </div>
  );
}

export function DexVolumeLegend({
  series,
  total,
  hiddenIds,
  onToggle,
  onShowAll,
}: DexVolumeLegendProps) {
  const legendSeries = useMemo(
    () =>
      [...series]
        .map((venue) => ({ ...venue, latest: getLatestValue(venue.points) }))
        .sort((a, b) => b.latest - a.latest),
    [series],
  );
  const isTotalVisible = !isHidden(hiddenIds, totalId);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-wider text-slate-500">Legend</p>
        <button
          type="button"
          className="text-xs text-slate-500 underline-offset-2 hover:text-slate-200 hover:underline"
          onClick={onShowAll}
        >
          Show all
        </button>
      </div>
      <div className="mt-3 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
        <button
          type="button"
          aria-pressed={isTotalVisible}
          onClick={() => onToggle(totalId)}
          className={`flex min-w-0 items-center justify-between gap-3 rounded-lg px-2 py-2 text-left text-sm transition ${
            isTotalVisible ? "bg-slate-800/70 text-white" : "text-slate-600"
          }`}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: totalColor }} />
            <span className="truncate font-medium">Total</span>
          </span>
          <span className="shrink-0 text-xs text-slate-400">
            {formatValue({ value: getLatestValue(total), unit: "usd" })}
          </span>
        </button>
        {legendSeries.map((venue) => {
          const visible = !isHidden(hiddenIds, venue.id);
          return (
            <button
              key={venue.id}
              type="button"
              aria-pressed={visible}
              onClick={() => onToggle(venue.id)}
              className={`flex min-w-0 items-center justify-between gap-3 rounded-lg px-2 py-2 text-left text-sm transition ${
                visible ? "text-slate-300 hover:bg-slate-800/60" : "text-slate-600"
              }`}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: venue.color }} />
                <span className="truncate">{venue.label}</span>
              </span>
              <span className="shrink-0 text-xs text-slate-500">
                {formatValue({ value: venue.latest, unit: "usd" })}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
