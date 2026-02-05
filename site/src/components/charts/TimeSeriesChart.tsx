import { useEffect, useMemo, useRef, useState } from "react";
import { formatDateLabel, formatValue } from "../../data/format";

type Point = {
  periodEnd?: string;
  t?: string;
  v: number;
};

type Series = {
  label: string;
  unit: string;
  scale?: number;
  points: Point[];
  cadence?: string;
};

type TimeSeriesChartProps = {
  title?: string;
  series: Series[];
  height?: number;
};

const colors = ["#f7b955", "#60a5fa", "#34d399", "#f87171"];

function getPointDate(point: Point) {
  return point.t ?? point.periodEnd ?? "";
}

export default function TimeSeriesChart({
  title,
  series,
  height = 320,
}: TimeSeriesChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [hoverState, setHoverState] = useState<{
    x: number;
    y: number;
    time: number;
  } | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const { min, max, minTime, maxTime } = useMemo(() => {
    const allPoints = series.flatMap((s) => s.points);
    const values = allPoints.map((p) => p.v);
    const times = allPoints
      .map((p) => new Date(`${getPointDate(p)}T00:00:00Z`).getTime())
      .filter((value) => Number.isFinite(value));
    return {
      min: values.length ? Math.min(...values) : 0,
      max: values.length ? Math.max(...values) : 1,
      minTime: times.length ? Math.min(...times) : 0,
      maxTime: times.length ? Math.max(...times) : 1,
    };
  }, [series]);

  const padding = { top: 16, right: 20, bottom: 28, left: 32 };
  const width = containerWidth || 0;
  const innerWidth = Math.max(width - padding.left - padding.right, 1);
  const innerHeight = height - padding.top - padding.bottom;
  const range = max - min || 1;
  const timeRange = maxTime - minTime || 1;

  const xForTime = (time: number) =>
    padding.left + ((time - minTime) / timeRange) * innerWidth;

  const yForValue = (value: number) =>
    padding.top + (1 - (value - min) / range) * innerHeight;

  const basePoints = series[0]?.points ?? [];
  const showEmpty = basePoints.length === 0 || width === 0;

  const tickCount = 4;
  const tickTimes = Array.from({ length: tickCount }, (_, i) =>
    minTime + (i / (tickCount - 1)) * timeRange,
  );

  const tooltipTime = hoverState?.time ?? null;
  const cadence = series[0]?.cadence ?? "daily";

  const tooltipPoint =
    tooltipTime !== null
      ? basePoints.reduce((closest, point) => {
          const time = new Date(
            `${getPointDate(point)}T00:00:00Z`,
          ).getTime();
          if (!closest) return point;
          const closestTime = new Date(
            `${getPointDate(closest)}T00:00:00Z`,
          ).getTime();
          return Math.abs(time - tooltipTime) < Math.abs(closestTime - tooltipTime)
            ? point
            : closest;
        }, null as Point | null)
      : null;

  return (
    <div
      ref={containerRef}
      className="rounded-xl border border-dashed border-slate-800 bg-slate-950/50 p-4"
      style={{ height }}
    >
      {title ? (
        <div className="mb-3 text-sm font-semibold text-white">{title}</div>
      ) : null}
      {showEmpty ? (
        <div className="flex h-full items-center justify-center text-sm text-slate-500">
          No snapshot points available.
        </div>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-full w-full"
            preserveAspectRatio="xMidYMid meet"
            onMouseLeave={() => setHoverState(null)}
            onMouseMove={(event) => {
              if (!innerWidth) return;
              const rect = event.currentTarget.getBoundingClientRect();
              const x = Math.min(
                Math.max(event.clientX - rect.left, padding.left),
                rect.width - padding.right,
              );
              const y = Math.min(
                Math.max(event.clientY - rect.top, padding.top),
                rect.height - padding.bottom,
              );
              const ratio = (x - padding.left) / innerWidth;
              const time = minTime + ratio * timeRange;
              setHoverState({ x, y, time });
            }}
          >
            <line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={height - padding.bottom}
              stroke="#1f2937"
            />
            <line
              x1={padding.left}
              y1={height - padding.bottom}
              x2={width - padding.right}
              y2={height - padding.bottom}
              stroke="#1f2937"
            />
            {tickTimes.map((time, index) => {
              const label = formatDateLabel(
                new Date(time).toISOString().slice(0, 10),
                cadence,
              );
              return (
                <text
                  key={index}
                  x={xForTime(time)}
                  y={height - 8}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="10"
                >
                  {label}
                </text>
              );
            })}
            {series.map((serie, seriesIndex) => {
              const stroke = colors[seriesIndex % colors.length];
              const polyline = serie.points
                .map((point) => {
                  const time = new Date(
                    `${getPointDate(point)}T00:00:00Z`,
                  ).getTime();
                  const x = xForTime(time);
                  const y = yForValue(point.v);
                  return `${x},${y}`;
                })
                .join(" ");
              return (
                <polyline
                  key={serie.label}
                  fill="none"
                  stroke={stroke}
                  strokeWidth="2"
                  points={polyline}
                />
              );
            })}
            {tooltipTime !== null ? (
              <line
                x1={xForTime(tooltipTime)}
                y1={padding.top}
                x2={xForTime(tooltipTime)}
                y2={height - padding.bottom}
                stroke="#334155"
                strokeDasharray="4 4"
              />
            ) : null}
          </svg>
          {tooltipPoint ? (
            <div
              className="pointer-events-none absolute rounded-lg border border-slate-800 bg-slate-950/90 px-3 py-2 text-xs text-slate-200"
              style={{
                left: Math.min(Math.max((hoverState?.x ?? 0) + 12, 12), width - 180),
                top: Math.min(Math.max((hoverState?.y ?? 0) + 12, 12), height - 90),
              }}
            >
              <div className="text-slate-400">
                {formatDateLabel(
                  getPointDate(tooltipPoint),
                  cadence,
                )}
              </div>
              <div className="mt-1 space-y-1">
                {series.map((serie) => {
                  const point =
                    tooltipTime !== null
                      ? serie.points.reduce((closest, candidate) => {
                          const candidateTime = new Date(
                            `${getPointDate(candidate)}T00:00:00Z`,
                          ).getTime();
                          if (!closest) return candidate;
                          const closestTime = new Date(
                            `${getPointDate(closest)}T00:00:00Z`,
                          ).getTime();
                          return Math.abs(candidateTime - tooltipTime) <
                            Math.abs(closestTime - tooltipTime)
                            ? candidate
                            : closest;
                        }, null as Point | null)
                      : null;
                  const value = point ? point.v : 0;
                  return (
                    <div key={serie.label} className="flex gap-2">
                      <span className="text-slate-400">{serie.label}:</span>
                      <span>
                        {formatValue({
                          value,
                          unit: serie.unit,
                          scale: serie.scale,
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
