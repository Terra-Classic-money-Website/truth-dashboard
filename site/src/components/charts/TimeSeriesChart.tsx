import { useMemo, useState } from "react";
import { formatDateLabel, formatValue } from "../../data/format";

type Point = {
  periodEnd: string;
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

export default function TimeSeriesChart({
  title,
  series,
  height = 320,
}: TimeSeriesChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { pointsCount, min, max } = useMemo(() => {
    const allPoints = series.flatMap((s) => s.points);
    const values = allPoints.map((p) => p.v);
    return {
      pointsCount: Math.max(...series.map((s) => s.points.length), 0),
      min: values.length ? Math.min(...values) : 0,
      max: values.length ? Math.max(...values) : 1,
    };
  }, [series]);

  const padding = { top: 16, right: 20, bottom: 28, left: 40 };
  const width = 720;
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const range = max - min || 1;

  const xForIndex = (index: number) => {
    if (pointsCount <= 1) return padding.left;
    return padding.left + (index / (pointsCount - 1)) * innerWidth;
  };

  const yForValue = (value: number) =>
    padding.top + (1 - (value - min) / range) * innerHeight;

  const basePoints = series[0]?.points ?? [];
  const showEmpty = pointsCount === 0;

  const tickCount = 4;
  const tickIndices = Array.from({ length: tickCount }, (_, i) =>
    pointsCount > 1
      ? Math.round((i / (tickCount - 1)) * (pointsCount - 1))
      : 0,
  );

  const tooltipIndex =
    hoverIndex !== null
      ? Math.min(Math.max(hoverIndex, 0), pointsCount - 1)
      : null;

  const tooltipPoint =
    tooltipIndex !== null ? basePoints[tooltipIndex] : null;

  return (
    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/50 p-4">
      {title ? (
        <div className="mb-3 text-sm font-semibold text-white">{title}</div>
      ) : null}
      {showEmpty ? (
        <div className="flex h-64 items-center justify-center text-sm text-slate-500">
          No snapshot points available.
        </div>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-72 w-full"
            onMouseLeave={() => setHoverIndex(null)}
            onMouseMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const x = event.clientX - rect.left;
              const ratio = (x - padding.left) / innerWidth;
              const index = Math.round(ratio * (pointsCount - 1));
              if (Number.isFinite(index)) {
                setHoverIndex(index);
              }
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
            {tickIndices.map((index) => {
              const label = basePoints[index]
                ? formatDateLabel(
                    basePoints[index].periodEnd,
                    series[0]?.cadence ?? "monthly",
                  )
                : "";
              return (
                <text
                  key={index}
                  x={xForIndex(index)}
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
                .map((point, index) => {
                  const x = xForIndex(index);
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
            {tooltipIndex !== null ? (
              <line
                x1={xForIndex(tooltipIndex)}
                y1={padding.top}
                x2={xForIndex(tooltipIndex)}
                y2={height - padding.bottom}
                stroke="#334155"
                strokeDasharray="4 4"
              />
            ) : null}
          </svg>
          {tooltipPoint ? (
            <div className="pointer-events-none absolute left-4 top-4 rounded-lg border border-slate-800 bg-slate-950/90 px-3 py-2 text-xs text-slate-200">
              <div className="text-slate-400">
                {formatDateLabel(
                  tooltipPoint.periodEnd,
                  series[0]?.cadence ?? "monthly",
                )}
              </div>
              <div className="mt-1 space-y-1">
                {series.map((serie) => {
                  const resolvedIndex = tooltipIndex ?? 0;
                  const point =
                    serie.points[resolvedIndex] ?? serie.points[0];
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
