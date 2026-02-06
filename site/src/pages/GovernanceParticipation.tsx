import { useState } from "react";
import Card from "../components/Card";
import { formatTableValue, formatValue } from "../data/format";
import {
  selectGovernanceParticipation,
} from "../data/selectors";
import type { GovernanceWindowId } from "../data/governanceRaw";
import PageHeader from "../components/PageHeader";

type ChartData = {
  labels: string[];
  values: number[];
};

const GOLD = "#f7b955";
const BLUE = "#60a5fa";
const GREEN = "#34d399";
const TEAL = "#22d3ee";
const PURPLE = "#a78bfa";
const RED = "#f87171";

function sanitizeChartData(input: unknown): ChartData {
  const series = (input ?? {}) as {
    labels?: unknown[];
    values?: unknown[];
  };
  const labels = Array.isArray(series.labels)
    ? series.labels.map((label) => String(label ?? ""))
    : [];
  const values = Array.isArray(series.values)
    ? series.values.map((value) => {
        const parsed = typeof value === "number" ? value : Number(value ?? 0);
        return Number.isFinite(parsed) ? parsed : 0;
      })
    : [];
  const len = Math.min(labels.length, values.length);
  return {
    labels: labels.slice(0, len),
    values: values.slice(0, len),
  };
}

function truncateLabel(label: string, max = 18) {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

function VerticalBarChart({ data }: { data: ChartData }) {
  const maxValue = Math.max(...data.values, 1);
  const width = 1000;
  const height = 320;
  const margin = { top: 12, right: 8, bottom: 50, left: 24 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const slot = plotWidth / Math.max(data.values.length, 1);
  const barWidth = Math.max(8, slot * 0.66);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" preserveAspectRatio="none">
      <line x1={margin.left} y1={margin.top} x2={margin.left} y2={height - margin.bottom} stroke="#1f2937" />
      <line
        x1={margin.left}
        y1={height - margin.bottom}
        x2={width - margin.right}
        y2={height - margin.bottom}
        stroke="#1f2937"
      />
      {data.values.map((value, index) => {
        const barHeight = (value / maxValue) * plotHeight;
        const x = margin.left + index * slot + (slot - barWidth) / 2;
        const y = margin.top + (plotHeight - barHeight);
        return (
          <g key={`${data.labels[index]}-${index}`}>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx={3} fill={GOLD} />
            <text
              x={x + barWidth / 2}
              y={height - margin.bottom + 18}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="17"
            >
              {data.labels[index]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function HorizontalBarChart({
  data,
  percent = false,
}: {
  data: ChartData;
  percent?: boolean;
}) {
  const maxValue = Math.max(...data.values, 1);
  const scaleMax = percent ? 100 : maxValue;
  const width = 1000;
  const height = 320;
  const margin = { top: 8, right: 10, bottom: percent ? 40 : 12, left: 180 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const rowHeight = plotHeight / Math.max(data.values.length, 1);
  const barHeight = Math.max(6, rowHeight * 0.62);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" preserveAspectRatio="none">
      {data.values.map((value, index) => {
        const normalized = Math.min(value / scaleMax, 1);
        const y = margin.top + index * rowHeight + (rowHeight - barHeight) / 2;
        const barLength = plotWidth * normalized;
        const label = data.labels[index];
        return (
          <g key={`${label}-${index}`}>
            <text
              x={margin.left - 8}
              y={y + barHeight / 2 + 5}
              textAnchor="end"
              fill="#cbd5e1"
              fontSize="17"
            >
              {truncateLabel(label)}
            </text>
            <rect x={margin.left} y={y} width={barLength} height={barHeight} rx={3} fill={BLUE} />
            <text x={margin.left + barLength + 6} y={y + barHeight / 2 + 5} fill="#94a3b8" fontSize="16">
              {percent ? `${value}%` : formatTableValue(value, "count")}
            </text>
          </g>
        );
      })}
      {percent ? (
        <g>
          <line
            x1={margin.left}
            y1={height - margin.bottom + 2}
            x2={width - margin.right}
            y2={height - margin.bottom + 2}
            stroke="#1f2937"
          />
          {Array.from({ length: 11 }, (_, index) => {
            const tick = index * 10;
            const x = margin.left + (plotWidth * tick) / 100;
            return (
              <g key={tick}>
                <line
                  x1={x}
                  y1={height - margin.bottom + 2}
                  x2={x}
                  y2={height - margin.bottom + 7}
                  stroke="#334155"
                />
                <text
                  x={x}
                  y={height - margin.bottom + 22}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="13"
                >
                  {tick}
                </text>
              </g>
            );
          })}
        </g>
      ) : null}
    </svg>
  );
}

function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function donutArcPath(cx: number, cy: number, inner: number, outer: number, start: number, end: number) {
  const startOuter = polarToCartesian(cx, cy, outer, end);
  const endOuter = polarToCartesian(cx, cy, outer, start);
  const startInner = polarToCartesian(cx, cy, inner, end);
  const endInner = polarToCartesian(cx, cy, inner, start);
  const largeArc = end - start > 180 ? 1 : 0;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outer} ${outer} 0 ${largeArc} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${inner} ${inner} 0 ${largeArc} 1 ${startInner.x} ${startInner.y}`,
    "Z",
  ].join(" ");
}

function DonutChart({ data }: { data: ChartData }) {
  const total = data.values.reduce((sum, value) => sum + value, 0) || 1;
  const palette = [GOLD, BLUE, GREEN, TEAL, PURPLE, RED];
  let angleCursor = 0;

  return (
    <div className="flex h-full items-center gap-6">
      <svg viewBox="0 0 280 280" className="h-full w-1/2 min-w-[180px]">
        {data.values.map((value, index) => {
          const sweep = (value / total) * 360;
          const start = angleCursor;
          const end = angleCursor + sweep;
          angleCursor = end;
          return (
            <path
              key={`${data.labels[index]}-${index}`}
              d={donutArcPath(140, 140, 58, 108, start, end)}
              fill={palette[index % palette.length]}
            />
          );
        })}
      </svg>
      <ul className="flex-1 space-y-2 text-base text-slate-300">
        {data.labels.map((label, index) => (
          <li key={label} className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: palette[index % palette.length] }}
              />
              {label}
            </span>
            <span>{formatTableValue(data.values[index], "count")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function GovernanceParticipation() {
  const [windowId, setWindowId] = useState<GovernanceWindowId>("1y");
  const view = selectGovernanceParticipation(windowId);
  const nonParticipationDistribution = sanitizeChartData(
    view.charts.nonParticipationDistribution,
  );
  const topNonParticipation = sanitizeChartData(view.charts.topNonParticipation);
  const voteComposition = sanitizeChartData(view.charts.voteComposition);
  const topDelegators = sanitizeChartData(view.charts.topDelegatorsPerProposal);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Terra Classic Governance"
        title={view.header.title}
        subtitle={view.header.subtitle}
      />

      <Card>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-slate-500">
            Time window
          </label>
          <div className="flex flex-wrap gap-2">
            {view.windows.map((window) => (
              <label
                key={window.id}
                className="flex items-center gap-2 rounded-full border border-slate-800 px-3 py-2 text-xs uppercase tracking-wider text-slate-300"
              >
                <input
                  type="radio"
                  checked={windowId === window.id}
                  onChange={() => setWindowId(window.id as GovernanceWindowId)}
                />
                {window.label}
              </label>
            ))}
          </div>
        </div>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {view.kpiGrid.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="text-xs uppercase tracking-wider text-slate-500">
              {item.label}
            </div>
            <div className="mt-2 text-lg font-semibold text-white">
              {formatValue({
                value: item.value,
                unit: item.unit,
              })}
            </div>
          </Card>
        ))}
        {view.statementCards.map((statement) => (
          <Card key={statement.id} className="p-4 lg:col-span-2">
            <div className="text-xs uppercase tracking-wider text-slate-500">
              {statement.title}
            </div>
            <div className="mt-2 text-sm text-slate-300">{statement.body}</div>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold text-white">
            Non-participation distribution
          </h2>
          <div className="mt-3 h-64 rounded-xl border border-dashed border-slate-800 bg-slate-950/50 p-2">
            <VerticalBarChart data={nonParticipationDistribution} />
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-base text-slate-300 xl:grid-cols-3">
            {nonParticipationDistribution.labels.map((label, index) => (
              <li key={label}>
                {label}: {formatTableValue(nonParticipationDistribution.values[index], "count")}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="text-base font-semibold text-white">
            Top 15 by non-participation
          </h2>
          <div className="mt-3 h-64 rounded-xl border border-dashed border-slate-800 bg-slate-950/50 p-2">
            <HorizontalBarChart data={topNonParticipation} percent />
          </div>
        </Card>
        <Card>
          <h2 className="text-base font-semibold text-white">
            Overall vote composition
          </h2>
          <div className="mt-3 h-64 rounded-xl border border-dashed border-slate-800 bg-slate-950/50 p-2">
            <DonutChart data={voteComposition} />
          </div>
        </Card>
        <Card>
          <h2 className="text-base font-semibold text-white">
            Delegators per proposal (top 20)
          </h2>
          <div className="mt-3 h-64 rounded-xl border border-dashed border-slate-800 bg-slate-950/50 p-2">
            <HorizontalBarChart data={topDelegators} />
          </div>
        </Card>
      </section>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-white">{view.table.title}</h2>
          <span className="text-xs text-slate-500">Table note placeholder</span>
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                {view.table.columns.map((column) => (
                  <th key={column.key} className="px-4 py-3">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {view.table.rows.map((row) => (
                <tr key={row.validator} className="text-slate-300">
                  {view.table.columns.map((column) => (
                    <td key={column.key} className="px-4 py-3">
                      {formatTableValue(
                        row[column.key as keyof typeof row],
                        column.unit,
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
