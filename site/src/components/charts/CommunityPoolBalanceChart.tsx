import { useEffect, useMemo, useRef, useState } from "react";
import { formatValue } from "../../data/format";

type BalancePoint = {
  t: string;
  lunc: number | null;
  ustc: number | null;
};

type Proposal = {
  title: string;
  recipient: string;
  denom: "LUNC" | "USTC";
  amount: number;
  spendTime: string | null;
  observedWeeklyDelta: number | null;
  residualVsExpected: number | null;
  preBalance: number | null;
  postBalance: number | null;
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
  proposals: Proposal[];
};

type Props = {
  balances: BalancePoint[];
  markers: Marker[];
  height?: number;
};

const LUNC_COLOR = "#f7b955";
const USTC_COLOR = "#60a5fa";

function formatMonthDay(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

function compact(value: number | null, unit: "lunc" | "ustc") {
  if (value === null) return "—";
  return formatValue({ value, unit, scale: 1 });
}

export default function CommunityPoolBalanceChart({
  balances,
  markers,
  height = 360,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hoverX, setHoverX] = useState<number | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const padding = { left: 64, right: 22, top: 16, bottom: 38 };
  const plotWidth = Math.max(width - padding.left - padding.right, 1);
  const plotHeight = Math.max(height - padding.top - padding.bottom, 1);

  const extents = useMemo(() => {
    const values = balances.flatMap((point) => [point.lunc, point.ustc]).filter(
      (value): value is number => value !== null,
    );
    const max = values.length ? Math.max(...values) : 1;
    return { min: 0, max };
  }, [balances]);

  const timeBounds = useMemo(() => {
    const times = balances.map((point) =>
      new Date(`${point.t}T00:00:00Z`).getTime(),
    );
    return {
      min: times.length ? Math.min(...times) : 0,
      max: times.length ? Math.max(...times) : 1,
    };
  }, [balances]);

  const markerByTime = useMemo(() => {
    const map = new Map<string, Marker>();
    markers.forEach((marker) => map.set(marker.markerTime, marker));
    return map;
  }, [markers]);

  const xForTime = (time: number) => {
    const range = Math.max(timeBounds.max - timeBounds.min, 1);
    return padding.left + ((time - timeBounds.min) / range) * plotWidth;
  };

  const yForValue = (value: number) => {
    const range = Math.max(extents.max - extents.min, 1);
    return padding.top + (1 - (value - extents.min) / range) * plotHeight;
  };

  const hovered = useMemo(() => {
    if (hoverX === null || balances.length === 0) return null;
    const targetRatio = (hoverX - padding.left) / plotWidth;
    const targetTime =
      timeBounds.min + Math.max(0, Math.min(1, targetRatio)) * (timeBounds.max - timeBounds.min);
    const point = balances.reduce((closest, current) => {
      const currentTime = new Date(`${current.t}T00:00:00Z`).getTime();
      if (!closest) return current;
      const closestTime = new Date(`${closest.t}T00:00:00Z`).getTime();
      return Math.abs(currentTime - targetTime) < Math.abs(closestTime - targetTime)
        ? current
        : closest;
    }, null as BalancePoint | null);
    if (!point) return null;
    const marker = markerByTime.get(point.t) ?? null;
    const idx = balances.findIndex((candidate) => candidate.t === point.t);
    const prev = idx > 0 ? balances[idx - 1] : null;
    return { point, marker, prev };
  }, [hoverX, balances, markerByTime, padding.left, plotWidth, timeBounds]);

  const luncPath = balances
    .filter((point) => point.lunc !== null)
    .map((point) => {
      const x = xForTime(new Date(`${point.t}T00:00:00Z`).getTime());
      const y = yForValue(point.lunc as number);
      return `${x},${y}`;
    })
    .join(" ");

  const ustcPath = balances
    .filter((point) => point.ustc !== null)
    .map((point) => {
      const x = xForTime(new Date(`${point.t}T00:00:00Z`).getTime());
      const y = yForValue(point.ustc as number);
      return `${x},${y}`;
    })
    .join(" ");

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => extents.max * ratio);
  const monthTicks = useMemo(() => {
    const unique = new Map<string, string>();
    balances.forEach((point) => {
      const key = point.t.slice(0, 7);
      if (!unique.has(key)) unique.set(key, point.t);
    });
    return Array.from(unique.values());
  }, [balances]);
  const maxImpact = markers
    .map((marker) => marker.combinedImpactPct ?? 0)
    .reduce((acc, current) => Math.max(acc, current), 1);

  return (
    <div
      ref={ref}
      className="relative h-full w-full rounded-xl border border-dashed border-slate-800 bg-slate-950/50 p-4"
      style={{ height }}
    >
      <svg
        viewBox={`0 0 ${Math.max(width, 1)} ${height}`}
        className="h-full w-full"
        onMouseLeave={() => setHoverX(null)}
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const x = event.clientX - rect.left;
          setHoverX(Math.max(padding.left, Math.min(x, rect.width - padding.right)));
        }}
      >
        {yTicks.map((tick) => {
          const y = yForValue(tick);
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={y}
                x2={Math.max(width - padding.right, padding.left)}
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
                {formatValue({ value: tick, unit: "lunc", scale: 1 })}
              </text>
            </g>
          );
        })}
        {monthTicks.map((tickDate) => {
          const tickTime = new Date(`${tickDate}T00:00:00Z`).getTime();
          const x = xForTime(tickTime);
          return (
            <g key={tickDate}>
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
                {formatMonthDay(tickDate)}
              </text>
            </g>
          );
        })}
        {markers.map((marker) => {
          const markerTime = new Date(`${marker.markerTime}T00:00:00Z`).getTime();
          const x = xForTime(markerTime);
          const impact = marker.combinedImpactPct ?? 0;
          const heightRatio = impact > 0 ? impact / maxImpact : 0;
          const barHeight = Math.max(2, heightRatio * plotHeight * 0.35);
          return (
            <g key={`${marker.markerTime}-${marker.lowConfidence ? "lc" : "hc"}`}>
              <rect
                x={x - 4}
                y={height - padding.bottom - barHeight}
                width={8}
                height={barHeight}
                fill={marker.lowConfidence ? "#64748b" : "#22c55e"}
                opacity={marker.lowConfidence ? 0.45 : 0.8}
              />
              {marker.lowConfidence ? (
                <text
                  x={x}
                  y={height - padding.bottom - barHeight - 4}
                  textAnchor="middle"
                  fill="#f8fafc"
                  fontSize="8"
                >
                  LOW CONF
                </text>
              ) : null}
            </g>
          );
        })}
        <polyline fill="none" stroke={LUNC_COLOR} strokeWidth="2" points={luncPath} />
        <polyline fill="none" stroke={USTC_COLOR} strokeWidth="1.8" points={ustcPath} />
        {hovered ? (
          <>
            <line
              x1={xForTime(new Date(`${hovered.point.t}T00:00:00Z`).getTime())}
              y1={padding.top}
              x2={xForTime(new Date(`${hovered.point.t}T00:00:00Z`).getTime())}
              y2={height - padding.bottom}
              stroke="#334155"
              strokeDasharray="4 4"
            />
            {hovered.point.lunc !== null ? (
              <circle
                cx={xForTime(new Date(`${hovered.point.t}T00:00:00Z`).getTime())}
                cy={yForValue(hovered.point.lunc)}
                r={4}
                fill={LUNC_COLOR}
                stroke="#0f172a"
                strokeWidth={1.5}
              />
            ) : null}
            {hovered.point.ustc !== null ? (
              <circle
                cx={xForTime(new Date(`${hovered.point.t}T00:00:00Z`).getTime())}
                cy={yForValue(hovered.point.ustc)}
                r={4}
                fill={USTC_COLOR}
                stroke="#0f172a"
                strokeWidth={1.5}
              />
            ) : null}
          </>
        ) : null}
      </svg>

      {hovered ? (
        <div className="pointer-events-none absolute left-6 top-6 max-w-sm rounded-lg border border-slate-800 bg-slate-950/95 px-3 py-2 text-xs text-slate-200 shadow-xl">
          <div className="text-slate-400">{hovered.point.t}</div>
          {hovered.marker ? (
            <div className="mt-1 space-y-1">
              <div className="font-semibold text-white">
                Period: {hovered.marker.markerTime} {"->"}{" "}
                {hovered.marker.dropTime ?? "—"}
              </div>
              {hovered.marker.lowConfidence ? (
                <div className="inline-flex rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                  Low Conf
                </div>
              ) : null}
              {hovered.marker.lunc ? (
                <div>
                  LUNC impact {hovered.marker.lunc.impactPct?.toFixed(2) ?? "—"}% |
                  pre {compact(hovered.marker.lunc.preBalance, "lunc")} |
                  post{" "}
                  {compact(
                    hovered.marker.proposals.find((proposal) => proposal.denom === "LUNC")
                      ?.postBalance ?? null,
                    "lunc",
                  )}
                </div>
              ) : null}
              {hovered.marker.ustc ? (
                <div>
                  USTC impact {hovered.marker.ustc.impactPct?.toFixed(2) ?? "—"}% |
                  pre {compact(hovered.marker.ustc.preBalance, "ustc")} |
                  post{" "}
                  {compact(
                    hovered.marker.proposals.find((proposal) => proposal.denom === "USTC")
                      ?.postBalance ?? null,
                    "ustc",
                  )}
                </div>
              ) : null}
              <div>
                Residual sum:{" "}
                {(
                  hovered.marker.proposals
                    .map((proposal) => proposal.residualVsExpected ?? 0)
                    .reduce((acc, current) => acc + current, 0)
                ).toFixed(2)}
              </div>
            </div>
          ) : (
            <div className="mt-1 space-y-1">
              <div>LUNC: {compact(hovered.point.lunc, "lunc")}</div>
              <div>USTC: {compact(hovered.point.ustc, "ustc")}</div>
              <div>
                Weekly step LUNC:{" "}
                {hovered.prev?.lunc !== null && hovered.point.lunc !== null
                  ? compact(hovered.point.lunc - (hovered.prev?.lunc ?? 0), "lunc")
                  : "—"}
              </div>
              <div>
                Weekly step USTC:{" "}
                {hovered.prev?.ustc !== null && hovered.point.ustc !== null
                  ? compact(hovered.point.ustc - (hovered.prev?.ustc ?? 0), "ustc")
                  : "—"}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
