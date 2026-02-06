import { useEffect, useMemo, useRef, useState } from "react";
import { formatValue } from "../../data/format";

type BalancePoint = {
  t: string;
  lunc: number | null;
  ustc: number | null;
};

type Marker = {
  markerTime: string;
  dropTime: string | null;
  lunc?: {
    amount: number;
    preBalance: number | null;
    impactPct: number | null;
    observedDelta: number | null;
  };
  ustc?: {
    amount: number;
    preBalance: number | null;
    impactPct: number | null;
    observedDelta: number | null;
  };
  combinedImpactPct: number | null;
  lowConfidence: boolean;
  proposals: Array<{
    title: string;
    recipient: string;
    denom: "LUNC" | "USTC";
    amount: number;
    spendTime: string | null;
    observedWeeklyDelta: number | null;
    residualVsExpected: number | null;
    preBalance: number | null;
    postBalance: number | null;
    lowConfidence?: boolean;
  }>;
};

type Props = {
  balances: BalancePoint[];
  markers: Marker[];
  height?: number;
};

const LUNC_COLOR = "#3b82f6";
const USTC_COLOR = "#22c55e";
const IMPACT_COLOR = "#facc15";

function formatMonthTick(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function compactAxis(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1e9) {
    const scaled = value / 1e9;
    const whole = Math.abs(scaled - Math.round(scaled)) < 0.05;
    return `${whole ? Math.round(scaled) : scaled.toFixed(1)}B`;
  }
  if (abs >= 1e6) {
    const scaled = value / 1e6;
    const whole = Math.abs(scaled - Math.round(scaled)) < 0.05;
    return `${whole ? Math.round(scaled) : scaled.toFixed(1)}M`;
  }
  if (abs >= 1e3) {
    const scaled = value / 1e3;
    const whole = Math.abs(scaled - Math.round(scaled)) < 0.05;
    return `${whole ? Math.round(scaled) : scaled.toFixed(1)}K`;
  }
  return `${Math.round(value)}`;
}

function buildEvenTicks(minValue: number, maxValue: number, count = 6) {
  if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
    return [0];
  }
  if (maxValue <= minValue) {
    return [minValue];
  }
  const step = (maxValue - minValue) / (count - 1);
  return Array.from({ length: count }, (_, index) => minValue + step * index);
}

function estimateTooltipBox(marker: Marker | null) {
  if (!marker) {
    return { width: 310, height: 230 };
  }
  const proposalRows = Math.min(marker.proposals.length, 6);
  return {
    width: 360,
    height: Math.min(340, 190 + proposalRows * 16),
  };
}

function compact(value: number | null, unit: "lunc" | "ustc") {
  if (value === null || Number.isNaN(value)) return "—";
  return formatValue({ value, unit, scale: 1 });
}

function firstNonNull<T>(values: Array<T | null | undefined>) {
  for (const value of values) {
    if (value !== null && typeof value !== "undefined") return value;
  }
  return null;
}

export default function CommunityPoolBalanceChart({
  balances,
  markers,
  height = 520,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hoverState, setHoverState] = useState<{
    x: number;
    y: number;
    pointIndex: number;
  } | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const padding = { left: 56, right: 56, top: 46, bottom: 42 };
  const plotWidth = Math.max(width - padding.left - padding.right, 1);
  const plotHeight = Math.max(height - padding.top - padding.bottom, 1);

  const markerByTime = useMemo(() => {
    const map = new Map<string, Marker>();
    markers.forEach((marker) => map.set(marker.markerTime, marker));
    return map;
  }, [markers]);

  const markerPointIndices = useMemo(
    () =>
      balances
        .map((point, index) => {
          const marker = markerByTime.get(point.t);
          if (!marker) return -1;
          const hasLunc = (marker.lunc?.amount ?? 0) > 0;
          const hasUstc = (marker.ustc?.amount ?? 0) > 0;
          return hasLunc || hasUstc ? index : -1;
        })
        .filter((index) => index >= 0),
    [balances, markerByTime],
  );

  const luncMax = useMemo(() => {
    const values = balances
      .map((point) => point.lunc)
      .filter((value): value is number => value !== null);
    return values.length ? Math.max(...values) : 1;
  }, [balances]);

  const luncMin = useMemo(() => {
    const values = balances
      .map((point) => point.lunc)
      .filter((value): value is number => value !== null);
    return values.length ? Math.min(...values) : 0;
  }, [balances]);

  const ustcMax = useMemo(() => {
    const values = balances
      .map((point) => point.ustc)
      .filter((value): value is number => value !== null);
    return values.length ? Math.max(...values) : 1;
  }, [balances]);

  const ustcMin = useMemo(() => {
    const values = balances
      .map((point) => point.ustc)
      .filter((value): value is number => value !== null);
    return values.length ? Math.min(...values) : 0;
  }, [balances]);

  const maxImpact = useMemo(() => {
    const values = markers
      .map((marker) => marker.combinedImpactPct)
      .filter((value): value is number => value !== null);
    return values.length ? Math.max(...values) : 1;
  }, [markers]);

  const xForIndex = (index: number) =>
    padding.left + (index / Math.max(balances.length - 1, 1)) * plotWidth;

  const luncDomain = useMemo(() => {
    const span = Math.max(luncMax - luncMin, Math.abs(luncMax) * 0.05, 1);
    const pad = span * 0.06;
    return {
      min: Math.max(0, luncMin - pad),
      max: luncMax + pad,
    };
  }, [luncMin, luncMax]);

  const ustcDomain = useMemo(() => {
    const span = Math.max(ustcMax - ustcMin, Math.abs(ustcMax) * 0.05, 1);
    const pad = span * 0.06;
    return {
      min: Math.max(0, ustcMin - pad),
      max: ustcMax + pad,
    };
  }, [ustcMin, ustcMax]);

  const yForLunc = (value: number) =>
    padding.top +
    (1 - (value - luncDomain.min) / Math.max(luncDomain.max - luncDomain.min, 1)) *
      plotHeight;

  const yForUstc = (value: number) =>
    padding.top +
    (1 - (value - ustcDomain.min) / Math.max(ustcDomain.max - ustcDomain.min, 1)) *
      plotHeight;

  const monthTickIndices = useMemo(() => {
    const ticks: number[] = [];
    const seen = new Set<string>();
    balances.forEach((point, index) => {
      const key = point.t.slice(0, 7);
      if (!seen.has(key)) {
        seen.add(key);
        ticks.push(index);
      }
    });
    return ticks;
  }, [balances]);

  const visibleMonthTickIndices = useMemo(() => {
    if (monthTickIndices.length <= 2) return monthTickIndices;
    const isOneYear = balances.length <= 60;
    const minTicks = isOneYear ? 8 : 10;
    const maxTicks = isOneYear ? 12 : 14;
    const target = clamp(Math.round(width / 150), minTicks, maxTicks);
    const step = Math.max(1, Math.ceil(monthTickIndices.length / target));
    return monthTickIndices.filter((_, index) => {
      const isEdge =
        index === 0 || index === monthTickIndices.length - 1;
      return isEdge || index % step === 0;
    });
  }, [monthTickIndices, balances.length, width]);

  const luncPolyline = balances
    .map((point, index) => {
      if (point.lunc === null) return null;
      return `${xForIndex(index)},${yForLunc(point.lunc)}`;
    })
    .filter((value): value is string => value !== null)
    .join(" ");

  const ustcPolyline = balances
    .map((point, index) => {
      if (point.ustc === null) return null;
      return `${xForIndex(index)},${yForUstc(point.ustc)}`;
    })
    .filter((value): value is string => value !== null)
    .join(" ");

  const hovered = useMemo(() => {
    if (!hoverState || balances.length === 0) return null;
    const point = balances[hoverState.pointIndex] ?? null;
    if (!point) return null;
    const prev = hoverState.pointIndex > 0 ? balances[hoverState.pointIndex - 1] : null;
    const marker = markerByTime.get(point.t) ?? null;
    return { point, prev, marker, index: hoverState.pointIndex };
  }, [hoverState, balances, markerByTime]);

  const luncTicks = useMemo(
    () => buildEvenTicks(luncDomain.min, luncDomain.max, 6),
    [luncDomain],
  );
  const ustcTicks = useMemo(
    () => buildEvenTicks(ustcDomain.min, ustcDomain.max, 6),
    [ustcDomain],
  );
  const tooltipBox = useMemo(() => estimateTooltipBox(hovered?.marker ?? null), [hovered]);

  return (
    <div
      ref={ref}
      className="relative h-full w-full rounded-xl border border-dashed border-slate-800 bg-slate-950/50 px-2 py-4"
      style={{ height }}
    >
      <div className="mb-2 flex flex-wrap items-center justify-end gap-4 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-10 rounded-sm border"
            style={{ borderColor: LUNC_COLOR }}
          />
          LUNC
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-10 rounded-sm border"
            style={{ borderColor: USTC_COLOR }}
          />
          USTC
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-10 rounded-sm border"
            style={{ borderColor: IMPACT_COLOR }}
          />
          Outflow impact (% of CP)
        </div>
      </div>

      <svg
        viewBox={`0 0 ${Math.max(width, 1)} ${height}`}
        className="h-full w-full"
        onMouseLeave={() => setHoverState(null)}
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          const ratio = clamp((x - padding.left) / Math.max(plotWidth, 1), 0, 1);
          const pointIndex = Math.round(ratio * Math.max(balances.length - 1, 0));
          setHoverState({ x, y, pointIndex });
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
          x1={width - padding.right}
          y1={padding.top}
          x2={width - padding.right}
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

        {luncTicks.map((tick) => {
          const y = yForLunc(tick);
          return (
            <g key={`lunc-tick-${tick}`}>
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
                {compactAxis(tick)}
              </text>
            </g>
          );
        })}

        {ustcTicks.map((tick) => {
          const y = yForUstc(tick);
          return (
            <text
              key={`ustc-tick-${tick}`}
              x={width - padding.right + 8}
              y={y + 3}
              textAnchor="start"
              fill="#94a3b8"
              fontSize="10"
            >
              {compactAxis(tick)}
            </text>
          );
        })}

        {visibleMonthTickIndices.map((index) => {
          const x = xForIndex(index);
          return (
            <g key={`month-${index}`}>
              <line
                x1={x}
                y1={padding.top}
                x2={x}
                y2={height - padding.bottom}
                stroke="#1f2937"
                strokeDasharray="4 4"
              />
              <text
                x={x}
                y={height - 10}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="10"
              >
                {formatMonthTick(balances[index].t)}
              </text>
            </g>
          );
        })}

        {markerPointIndices.map((index) => {
          const marker = markerByTime.get(balances[index].t);
          const impact = marker?.combinedImpactPct ?? 0;
          const x = xForIndex(index);
          const barHeight = Math.max(2, (impact / Math.max(maxImpact, 1)) * plotHeight * 0.3);
          return (
            <g key={`impact-${balances[index].t}`}>
              <rect
                x={x - 4}
                y={height - padding.bottom - barHeight}
                width={8}
                height={barHeight}
                fill={IMPACT_COLOR}
                opacity={marker?.lowConfidence ? 0.45 : 0.8}
              />
            </g>
          );
        })}

        <polyline fill="none" stroke={LUNC_COLOR} strokeWidth="2" points={luncPolyline} />
        <polyline fill="none" stroke={USTC_COLOR} strokeWidth="1.8" points={ustcPolyline} />

        {markerPointIndices.map((index) => {
          const point = balances[index];
          const marker = markerByTime.get(point.t);
          return (
            <g key={`marker-dot-${point.t}`}>
              {point.lunc !== null && (marker?.lunc?.amount ?? 0) > 0 ? (
                <circle
                  cx={xForIndex(index)}
                  cy={yForLunc(point.lunc)}
                  r={5}
                  fill={IMPACT_COLOR}
                  stroke="#0f172a"
                  strokeWidth={1.5}
                />
              ) : null}
              {point.ustc !== null && (marker?.ustc?.amount ?? 0) > 0 ? (
                <circle
                  cx={xForIndex(index)}
                  cy={yForUstc(point.ustc)}
                  r={5}
                  fill={IMPACT_COLOR}
                  stroke="#0f172a"
                  strokeWidth={1.5}
                />
              ) : null}
            </g>
          );
        })}

        {hovered ? (
          <>
            <line
              x1={xForIndex(hovered.index)}
              y1={padding.top}
              x2={xForIndex(hovered.index)}
              y2={height - padding.bottom}
              stroke="#334155"
              strokeDasharray="4 4"
            />
            {hovered.point.lunc !== null ? (
              <circle
                cx={xForIndex(hovered.index)}
                cy={yForLunc(hovered.point.lunc)}
                r={4}
                fill={LUNC_COLOR}
                stroke="#0f172a"
                strokeWidth={1.5}
              />
            ) : null}
            {hovered.point.ustc !== null ? (
              <circle
                cx={xForIndex(hovered.index)}
                cy={yForUstc(hovered.point.ustc)}
                r={4}
                fill={USTC_COLOR}
                stroke="#0f172a"
                strokeWidth={1.5}
              />
            ) : null}
          </>
        ) : null}
      </svg>

      {hovered && hoverState ? (
        <div
          className="pointer-events-none absolute z-10 max-w-md rounded-lg border border-slate-800 bg-slate-950/95 px-3 py-2 text-xs text-slate-200 shadow-xl"
          style={(() => {
            const tooltipWidth = tooltipBox.width;
            const tooltipHeight = tooltipBox.height;
            const rightPreferred = hoverState.x + 14;
            const leftPreferred = hoverState.x - tooltipWidth - 14;
            const topPreferred = hoverState.y + 14;
            const bottomPreferred = hoverState.y - tooltipHeight - 14;

            const x =
              rightPreferred + tooltipWidth <= width - 12
                ? rightPreferred
                : Math.max(12, leftPreferred);
            const y =
              topPreferred + tooltipHeight <= height - 12
                ? topPreferred
                : Math.max(12, bottomPreferred);

            return {
              left: clamp(x, 12, Math.max(width - tooltipWidth - 12, 12)),
              top: clamp(y, 12, Math.max(height - tooltipHeight - 12, 12)),
            };
          })()}
        >
          <div className="text-slate-400">{hovered.point.t}</div>

          {hovered.marker ? (
            <div className="mt-1 space-y-1">
              {(() => {
                const marker = hovered.marker;
                if (!marker) return null;
                const luncImpactPct =
                  marker.lunc?.preBalance && marker.lunc.preBalance > 0
                    ? (marker.lunc.amount / marker.lunc.preBalance) * 100
                    : 0;
                const ustcImpactPct =
                  marker.ustc?.preBalance && marker.ustc.preBalance > 0
                    ? (marker.ustc.amount / marker.ustc.preBalance) * 100
                    : 0;
                const combinedImpactPct = luncImpactPct + ustcImpactPct;
                return (
                  <>
              <div className="font-semibold text-white">
                Marker interval: {marker.markerTime} {"->"}{" "}
                {marker.dropTime ?? "—"}
              </div>
              {(["lunc", "ustc"] as const).map((denom) => {
                const bucket = marker[denom];
                if (!bucket) return null;
                const proposals = marker.proposals.filter(
                  (proposal) => proposal.denom === denom.toUpperCase(),
                );
                const postBalance = firstNonNull(
                  proposals.map((proposal) => proposal.postBalance).concat(
                    bucket.preBalance !== null && bucket.observedDelta !== null
                      ? [bucket.preBalance + bucket.observedDelta]
                      : [null],
                  ),
                );
                const residual = proposals.reduce(
                  (acc, proposal) => acc + (proposal.residualVsExpected ?? 0),
                  0,
                );
                const impactPct =
                  bucket.preBalance && bucket.preBalance > 0
                    ? (bucket.amount / bucket.preBalance) * 100
                    : 0;
                return (
                  <div key={`marker-tooltip-${denom}`} className="rounded border border-slate-800 bg-slate-900/50 p-2">
                    <div className="font-semibold uppercase text-slate-100">{denom}</div>
                    <div>Pre balance: {compact(bucket.preBalance, denom)}</div>
                    <div>Post balance: {compact(postBalance, denom)}</div>
                    <div>Observed Δ: {compact(bucket.observedDelta, denom)}</div>
                    <div>Spend total: {compact(bucket.amount, denom)}</div>
                    <div>Impact: {impactPct.toFixed(2)}%</div>
                    <div>Residual: {residual.toFixed(2)}</div>
                  </div>
                );
              })}
              <div>
                Combined impact: {combinedImpactPct.toFixed(2)}%
              </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="mt-1 space-y-2">
              {(["lunc", "ustc"] as const).map((denom) => {
                const current = hovered.point[denom];
                const prev = hovered.prev?.[denom] ?? null;
                const delta =
                  current !== null && prev !== null ? current - prev : null;
                const inflow =
                  delta !== null ? Math.max(delta, 0) : null;
                const outflow =
                  delta !== null ? Math.max(-delta, 0) : null;
                const outflowPctPrior =
                  outflow !== null && prev !== null && prev > 0
                    ? (outflow / prev) * 100
                    : null;
                return (
                  <div key={`normal-tooltip-${denom}`} className="rounded border border-slate-800 bg-slate-900/50 p-2">
                    <div className="font-semibold uppercase text-slate-100">{denom}</div>
                    <div>Historical balance (weekly): {compact(current, denom)}</div>
                    <div>Inflow (weekly step): {compact(inflow, denom)}</div>
                    <div>Outflow (weekly step): {compact(outflow, denom)}</div>
                    <div>Outflow % of prior: {outflowPctPrior?.toFixed(2) ?? "0.00"}%</div>
                  </div>
                );
              })}
              <div>Outflow impact %: 0.00%</div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
