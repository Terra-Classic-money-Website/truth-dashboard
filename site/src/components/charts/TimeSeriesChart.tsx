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
  className?: string;
  xTicks?: string[];
  yTicks?: number[];
  xTickFormatter?: (isoDate: string) => string;
  yTickFormatter?: (value: number) => string;
  minXTickGap?: number;
  forceAllXTicks?: boolean;
};

const colors = ["#f7b955", "#60a5fa", "#34d399", "#f87171"];

function getPointDate(point: Point) {
  return point.t ?? point.periodEnd ?? "";
}

export default function TimeSeriesChart({
  title,
  series,
  height = 320,
  className = "",
  xTicks,
  yTicks,
  xTickFormatter,
  yTickFormatter,
  minXTickGap = 80,
  forceAllXTicks = false,
}: TimeSeriesChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(height);
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
        setContainerHeight(entry.contentRect.height || height);
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [height]);

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

  const padding = { top: 16, right: 20, bottom: 32, left: 52 };
  const width = containerWidth || 0;
  const innerWidth = Math.max(width - padding.left - padding.right, 1);
  const resolvedHeight = containerHeight || height;
  const innerHeight = resolvedHeight - padding.top - padding.bottom;
  const effectiveMin =
    yTicks && yTicks.length ? Math.min(min, ...yTicks) : min;
  const effectiveMax =
    yTicks && yTicks.length ? Math.max(max, ...yTicks) : max;
  const range = effectiveMax - effectiveMin || 1;
  const timeRange = maxTime - minTime || 1;

  const xForTime = (time: number) =>
    padding.left + ((time - minTime) / timeRange) * innerWidth;

  const yForValue = (value: number) =>
    padding.top + (1 - (value - effectiveMin) / range) * innerHeight;

  const basePoints = series[0]?.points ?? [];
  const showEmpty = basePoints.length === 0 || width === 0;

  const xTickCandidates = xTicks?.length
    ? xTicks.map((tick) => new Date(`${tick}T00:00:00Z`).getTime())
    : Array.from({ length: 4 }, (_, i) =>
        minTime + (i / 3) * timeRange,
      );
  const xTickTimes = useMemo(() => {
    if (forceAllXTicks || xTickCandidates.length <= 2) {
      return xTickCandidates;
    }
    const maxTicks = Math.max(2, Math.floor(innerWidth / minXTickGap));
    const step = Math.max(1, Math.ceil(xTickCandidates.length / maxTicks));
    return xTickCandidates.filter((_, index) => {
      const isEdge =
        index === 0 || index === xTickCandidates.length - 1;
      return isEdge || index % step === 0;
    });
  }, [forceAllXTicks, innerWidth, minXTickGap, xTickCandidates]);

  const buildTicks = () => {
    const targetCount = 6;
    const rawStep = range / (targetCount - 1);
    if (!Number.isFinite(rawStep) || rawStep <= 0) {
      return [min];
    }
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const residual = rawStep / magnitude;
    const niceResidual =
      residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10;
    let step = niceResidual * magnitude;
    let niceMin = Math.floor(min / step) * step;
    let niceMax = Math.ceil(max / step) * step;
    let ticks: number[] = [];
    const build = () => {
      ticks = [];
      for (let v = niceMin; v <= niceMax + step / 2; v += step) {
        ticks.push(Number(v.toFixed(10)));
      }
    };
    build();
    while (ticks.length > 7) {
      step *= 2;
      niceMin = Math.floor(min / step) * step;
      niceMax = Math.ceil(max / step) * step;
      build();
    }
    return ticks;
  };

  const yTickValues = yTicks?.length ? yTicks : buildTicks();

  const tooltipTime = hoverState?.time ?? null;
  const cadence = series[0]?.cadence ?? "daily";
  const yUnit = series[0]?.unit ?? "count";

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
  const hoverSeriesPoints = useMemo(() => {
    if (tooltipTime === null) {
      return [];
    }
    return series
      .map((serie, index) => {
        const point = serie.points.reduce((closest, candidate) => {
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
        }, null as Point | null);
        if (!point) {
          return null;
        }
        const pointTime = new Date(`${getPointDate(point)}T00:00:00Z`).getTime();
        return {
          seriesIndex: index,
          point,
          x: xForTime(pointTime),
          y: yForValue(point.v),
        };
      })
      .filter(
        (
          value,
        ): value is {
          seriesIndex: number;
          point: Point;
          x: number;
          y: number;
        } => value !== null,
      );
  }, [tooltipTime, series, xForTime, yForValue]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full rounded-xl border border-dashed border-slate-800 bg-slate-950/50 p-4 ${className}`}
      style={className ? undefined : { height }}
    >
      {title ? (
        <div className="mb-3 text-sm font-semibold text-white">{title}</div>
      ) : null}
      {showEmpty ? (
        <div className="flex h-full items-center justify-center text-sm text-slate-500">
          No snapshot points available.
        </div>
      ) : (
        <div className="relative h-full">
          <svg
            viewBox={`0 0 ${width} ${resolvedHeight}`}
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
              y2={resolvedHeight - padding.bottom}
              stroke="#1f2937"
            />
            <line
              x1={padding.left}
              y1={resolvedHeight - padding.bottom}
              x2={width - padding.right}
              y2={resolvedHeight - padding.bottom}
              stroke="#1f2937"
            />
            {yTickValues.map((tick) => {
              const y = yForValue(tick);
              return (
                <g key={tick}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#1f2937"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 3}
                    textAnchor="end"
                    fill="#94a3b8"
                    fontSize="10"
                  >
                    {yTickFormatter
                      ? yTickFormatter(tick)
                      : formatValue({ value: tick, unit: yUnit })}
                  </text>
                </g>
              );
            })}
            {xTickTimes.map((time, index) => {
              const iso = new Date(time).toISOString().slice(0, 10);
              const label = xTickFormatter
                ? xTickFormatter(iso)
                : formatDateLabel(iso, cadence);
              return (
                <g key={index}>
                  <line
                    x1={xForTime(time)}
                    y1={padding.top}
                    x2={xForTime(time)}
                    y2={resolvedHeight - padding.bottom}
                    stroke="#1f2937"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={xForTime(time)}
                    y={resolvedHeight - 8}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="10"
                  >
                    {label}
                  </text>
                </g>
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
                y2={resolvedHeight - padding.bottom}
                stroke="#334155"
                strokeDasharray="4 4"
              />
            ) : null}
            {hoverSeriesPoints.map(({ seriesIndex, x, y }) => (
              <circle
                key={`hover-dot-${seriesIndex}`}
                cx={x}
                cy={y}
                r={4}
                fill={colors[seriesIndex % colors.length]}
                stroke="#0f172a"
                strokeWidth={1.5}
              />
            ))}
          </svg>
          {tooltipPoint ? (
            <div
              className="pointer-events-none absolute rounded-lg border border-slate-800 bg-slate-950/90 px-3 py-2 text-xs text-slate-200"
              style={{
                left: Math.min(
                  Math.max((hoverState?.x ?? 0) + 12, 12),
                  width - 180,
                ),
                top: Math.min(
                  Math.max((hoverState?.y ?? 0) + 12, 12),
                  resolvedHeight - 90,
                ),
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
