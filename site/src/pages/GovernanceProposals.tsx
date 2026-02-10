import { useMemo, useState } from "react";
import Card from "../components/Card";
import { formatTableValue } from "../data/format";
import { selectGovernanceProposals } from "../data/selectors";
import PageHeader from "../components/PageHeader";

type ProposalRow = {
  id: number;
  title: string;
  type: string;
  status: string;
  votes: string;
  delegators: number;
  endDate: string;
  endDateMs: number;
  yesPct?: number;
  noPct?: number;
  abstainPct?: number;
  vetoPct?: number;
  noWithVetoPct?: number;
};

type VoteDistribution = {
  yesPct: number;
  noPct: number;
  abstainPct: number;
  vetoPct: number;
};

type InsightKpis = {
  count: number;
  passRate: number | null;
  rejectedRate: number | null;
  otherRate: number | null;
  medianDelegators: number | null;
  zeroDelegatorCount: number;
  lowEngCount: number;
  lowEngRate: number | null;
  lowEngThreshold: number | null;
  avgVeto: number | null;
  medianControversy: number | null;
  passedCount: number;
  rejectedCount: number;
  otherCount: number;
  otherStatusBreakdown: Array<{ status: string; count: number }>;
};

type MonthlyPoint = {
  month: string;
  label: string;
  count: number;
};

type TypePassRatePoint = {
  type: string;
  count: number;
  passed: number;
  rejected: number;
  other: number;
  passRate: number;
};

type TopListItem = {
  id: number;
  title: string;
  delegators: number;
  score: number;
};

type ProposalInsights = {
  kpis: InsightKpis;
  perMonth: MonthlyPoint[];
  passRateByType: TypePassRatePoint[];
  topMostEngaged: TopListItem[];
  topMostControversial: TopListItem[];
  topHighestVeto: TopListItem[];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function asNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toPercentValue(value: unknown) {
  const parsed = asNumber(value);
  return clamp(parsed, 0, 100);
}

function parseVoteDistribution(proposal: ProposalRow): VoteDistribution {
  return {
    yesPct: toPercentValue(proposal.yesPct),
    noPct: toPercentValue(proposal.noPct),
    abstainPct: toPercentValue(proposal.abstainPct),
    vetoPct: toPercentValue(proposal.vetoPct ?? proposal.noWithVetoPct),
  };
}

function formatPercent(value: number | null, digits = 1) {
  if (value === null || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

function formatCount(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  return value.toLocaleString("en-US");
}

function truncateLabel(label: string, max = 36) {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

function percentile(values: number[], pct: number) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = (sorted.length - 1) * pct;
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  if (low === high) return sorted[low];
  const weight = rank - low;
  return sorted[low] * (1 - weight) + sorted[high] * weight;
}

function monthKeyFromProposal(row: ProposalRow) {
  const dateFromMs =
    Number.isFinite(row.endDateMs) && row.endDateMs > 0 ? new Date(row.endDateMs) : null;
  const fallbackDate = row.endDate ? new Date(`${row.endDate}T00:00:00Z`) : null;
  const date =
    dateFromMs && Number.isFinite(dateFromMs.getTime()) ? dateFromMs : fallbackDate;
  if (!date || !Number.isFinite(date.getTime())) return null;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) return monthKey;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function statusKey(status: string) {
  return status.trim().toLowerCase();
}

function computeProposalInsights(rows: ProposalRow[]): ProposalInsights {
  const count = rows.length;
  const statusCounts = new Map<string, number>();
  const typeCounts = new Map<string, { count: number; passed: number; rejected: number; other: number }>();
  const monthCounts = new Map<string, number>();

  const delegators = rows.map((row) => Math.max(0, asNumber(row.delegators)));
  const controversies: Array<{ row: ProposalRow; score: number }> = [];
  const vetos: Array<{ row: ProposalRow; vetoPct: number }> = [];

  let passedCount = 0;
  let rejectedCount = 0;
  let vetoSum = 0;
  let vetoCount = 0;

  rows.forEach((row) => {
    const status = String(row.status ?? "");
    const statusNormalized = statusKey(status);
    statusCounts.set(statusNormalized, (statusCounts.get(statusNormalized) ?? 0) + 1);

    if (statusNormalized === "passed") passedCount += 1;
    else if (statusNormalized === "rejected") rejectedCount += 1;

    const vote = parseVoteDistribution(row);
    vetoSum += vote.vetoPct;
    vetoCount += 1;
    vetos.push({ row, vetoPct: vote.vetoPct });

    const yesNoSum = vote.yesPct + vote.noPct;
    if (yesNoSum > 0) {
      const controversy = 1 - Math.abs(vote.yesPct - vote.noPct) / yesNoSum;
      controversies.push({ row, score: clamp(controversy, 0, 1) });
    }

    const monthKey = monthKeyFromProposal(row);
    if (monthKey) {
      monthCounts.set(monthKey, (monthCounts.get(monthKey) ?? 0) + 1);
    }

    const type = String(row.type ?? "Unknown").trim() || "Unknown";
    const typeEntry = typeCounts.get(type) ?? { count: 0, passed: 0, rejected: 0, other: 0 };
    typeEntry.count += 1;
    if (statusNormalized === "passed") typeEntry.passed += 1;
    else if (statusNormalized === "rejected") typeEntry.rejected += 1;
    else typeEntry.other += 1;
    typeCounts.set(type, typeEntry);
  });

  const otherCount = Math.max(0, count - passedCount - rejectedCount);
  const passRate = count > 0 ? (passedCount / count) * 100 : null;
  const rejectedRate = count > 0 ? (rejectedCount / count) * 100 : null;
  const otherRate = count > 0 ? (otherCount / count) * 100 : null;

  const medianDelegators = percentile(delegators, 0.5);
  const zeroDelegatorCount = delegators.filter((value) => value === 0).length;
  const p25Delegators = percentile(delegators, 0.25);
  const lowEngThreshold =
    p25Delegators === null ? null : Math.max(1, Math.floor(p25Delegators));
  const lowEngCount =
    lowEngThreshold === null
      ? 0
      : delegators.filter((value) => value <= lowEngThreshold).length;
  const lowEngRate = count > 0 ? (lowEngCount / count) * 100 : null;
  const avgVeto = vetoCount > 0 ? vetoSum / vetoCount : null;
  const medianControversyRaw = percentile(
    controversies.map((entry) => entry.score),
    0.5,
  );
  const medianControversy =
    medianControversyRaw === null ? null : medianControversyRaw * 100;

  const perMonth = Array.from(monthCounts.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([month, monthlyCount]) => ({
      month,
      label: formatMonthLabel(month),
      count: monthlyCount,
    }));

  const passRateByTypeRaw = Array.from(typeCounts.entries())
    .map(([type, stats]) => ({
      type,
      ...stats,
      passRate: stats.count > 0 ? (stats.passed / stats.count) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const topEightTypes = passRateByTypeRaw.slice(0, 8);
  const otherTypes = passRateByTypeRaw.slice(8);
  const passRateByType: TypePassRatePoint[] = topEightTypes.map((entry) => ({
    type: entry.type,
    count: entry.count,
    passed: entry.passed,
    rejected: entry.rejected,
    other: entry.other,
    passRate: entry.passRate,
  }));

  if (otherTypes.length > 0) {
    const merged = otherTypes.reduce(
      (acc, entry) => {
        acc.count += entry.count;
        acc.passed += entry.passed;
        acc.rejected += entry.rejected;
        acc.other += entry.other;
        return acc;
      },
      { count: 0, passed: 0, rejected: 0, other: 0 },
    );
    passRateByType.push({
      type: "Other",
      count: merged.count,
      passed: merged.passed,
      rejected: merged.rejected,
      other: merged.other,
      passRate: merged.count > 0 ? (merged.passed / merged.count) * 100 : 0,
    });
  }

  const topMostEngaged = [...rows]
    .sort((a, b) => b.delegators - a.delegators)
    .slice(0, 10)
    .map((row) => ({
      id: row.id,
      title: row.title,
      delegators: row.delegators,
      score: row.delegators,
    }));

  const topMostControversial = [...controversies]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ row, score }) => ({
      id: row.id,
      title: row.title,
      delegators: row.delegators,
      score: score * 100,
    }));

  const topHighestVeto = [...vetos]
    .sort((a, b) => b.vetoPct - a.vetoPct)
    .slice(0, 10)
    .map(({ row, vetoPct }) => ({
      id: row.id,
      title: row.title,
      delegators: row.delegators,
      score: vetoPct,
    }));

  const otherStatusBreakdown = Array.from(statusCounts.entries())
    .filter(([status]) => status !== "passed" && status !== "rejected")
    .map(([status, statusCount]) => ({
      status: status || "unknown",
      count: statusCount,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    kpis: {
      count,
      passRate,
      rejectedRate,
      otherRate,
      medianDelegators,
      zeroDelegatorCount,
      lowEngCount,
      lowEngRate,
      lowEngThreshold,
      avgVeto,
      medianControversy,
      passedCount,
      rejectedCount,
      otherCount,
      otherStatusBreakdown,
    },
    perMonth,
    passRateByType,
    topMostEngaged,
    topMostControversial,
    topHighestVeto,
  };
}

function InfoHint({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={text}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-600 text-[10px] font-semibold leading-none text-slate-400 transition hover:border-slate-400 hover:text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400"
      >
        ?
      </button>
      <span className="pointer-events-none absolute left-1/2 top-6 z-20 w-72 -translate-x-1/2 rounded-lg border border-slate-800 bg-slate-950/95 px-3 py-2 text-left text-[11px] font-normal leading-5 text-slate-200 opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
        {text}
      </span>
    </span>
  );
}

function MonthlyCountChart({ data }: { data: MonthlyPoint[] }) {
  const maxValue = Math.max(...data.map((point) => point.count), 1);
  const width = 960;
  const height = 260;
  const margin = { top: 16, right: 10, bottom: 58, left: 24 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const slot = plotWidth / Math.max(data.length, 1);
  const barWidth = Math.max(4, slot * 0.64);
  const labelStep = Math.max(1, Math.ceil(data.length / 12));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" preserveAspectRatio="none">
      <line
        x1={margin.left}
        y1={height - margin.bottom}
        x2={width - margin.right}
        y2={height - margin.bottom}
        stroke="#1f2937"
      />
      {data.map((point, index) => {
        const barHeight = (point.count / maxValue) * plotHeight;
        const x = margin.left + index * slot + (slot - barWidth) / 2;
        const y = margin.top + (plotHeight - barHeight);
        return (
          <g key={point.month}>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx={2} fill="#60a5fa" />
            {index % labelStep === 0 || index === data.length - 1 ? (
              <text
                x={x + barWidth / 2}
                y={height - margin.bottom + 18}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize={10}
              >
                {point.label}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function TypePassRateChart({ data }: { data: TypePassRatePoint[] }) {
  const width = 960;
  const height = 340;
  const margin = { top: 10, right: 146, bottom: 42, left: 180 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const rowHeight = plotHeight / Math.max(data.length, 1);
  const barHeight = Math.max(10, rowHeight * 0.58);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-full w-full"
      preserveAspectRatio="none"
    >
      <line
        x1={margin.left}
        y1={height - margin.bottom}
        x2={width - margin.right}
        y2={height - margin.bottom}
        stroke="#1f2937"
      />
      {Array.from({ length: 6 }, (_, idx) => {
        const tick = idx * 20;
        const x = margin.left + (plotWidth * tick) / 100;
        return (
          <g key={`tick-${tick}`}>
            <line
              x1={x}
              y1={margin.top}
              x2={x}
              y2={height - margin.bottom}
              stroke="#1e293b"
              strokeDasharray="3 4"
            />
            <text
              x={x}
              y={height - margin.bottom + 18}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize={12}
            >
              {tick}
            </text>
          </g>
        );
      })}
      {data.map((point, index) => {
        const y = margin.top + index * rowHeight + (rowHeight - barHeight) / 2;
        const barWidth = (plotWidth * point.passRate) / 100;
        const valueLabel = `${point.passRate.toFixed(1)}% (n=${point.count})`;
        return (
          <g key={point.type}>
            <text
              x={margin.left - 8}
              y={y + barHeight / 2 + 5}
              textAnchor="end"
              fill="#cbd5e1"
              fontSize={13}
            >
              {truncateLabel(point.type, 18)}
            </text>
            <rect x={margin.left} y={y} width={barWidth} height={barHeight} rx={3} fill="#34d399">
              <title>{`Type: ${point.type}\nTotal: ${point.count}\nPassed: ${point.passed}\nRejected: ${point.rejected}\nOther: ${point.other}\nPass rate: ${point.passRate.toFixed(1)}%`}</title>
            </rect>
            <text
              x={width - 8}
              y={y + barHeight / 2 + 5}
              fill="#cbd5e1"
              fontSize={12}
              textAnchor="end"
            >
              {valueLabel}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function TypePassRateMobileChart({ data }: { data: TypePassRatePoint[] }) {
  return (
    <div className="space-y-3">
      {data.map((point) => (
        <div key={point.type} className="rounded-lg border border-slate-800/80 bg-slate-950/40 px-3 py-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-5 text-slate-200 break-words">
              {point.type}
            </p>
            <p className="shrink-0 text-xs text-slate-400">
              {`${point.passRate.toFixed(1)}% (n=${point.count})`}
            </p>
          </div>
          <div
            className="mt-2 w-full rounded-full bg-slate-900/80"
            style={{ height: "10px" }}
          >
            <div
              className="rounded-full"
              style={{
                width: `${clamp(point.passRate, 0, 100)}%`,
                height: "100%",
                backgroundColor: "#34d399",
              }}
            />
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

function TopListCard({
  title,
  subtitle,
  items,
  scoreLabel,
  scoreFormatter,
  showScoreColumn = true,
}: {
  title: string;
  subtitle: string;
  items: TopListItem[];
  scoreLabel: string;
  scoreFormatter: (value: number) => string;
  showScoreColumn?: boolean;
}) {
  return (
    <Card>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      <div className="section-scroll-x mt-3 rounded-xl border border-slate-800">
        <table className="w-full min-w-[460px] text-left text-sm">
          <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-3 py-2 whitespace-nowrap">ID</th>
              <th className="px-3 py-2 whitespace-nowrap">Title</th>
              <th className="px-3 py-2 whitespace-nowrap">Delegators</th>
              {showScoreColumn ? (
                <th className="px-3 py-2 whitespace-nowrap">{scoreLabel}</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={`${title}-${item.id}`} className="text-slate-300">
                <td className="px-3 py-2 whitespace-nowrap">#{item.id}</td>
                <td className="px-3 py-2 min-w-[14rem] whitespace-normal break-words" title={item.title}>
                  {truncateLabel(item.title, 62)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{formatCount(item.delegators)}</td>
                {showScoreColumn ? (
                  <td className="px-3 py-2 whitespace-nowrap">{scoreFormatter(item.score)}</td>
                ) : null}
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={showScoreColumn ? 4 : 3}
                  className="px-3 py-4 text-center text-slate-500"
                >
                  No proposals in current view.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function GovernanceProposals() {
  const view = selectGovernanceProposals();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("endDate");
  const [status, setStatus] = useState("all");
  const [descending, setDescending] = useState(true);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = view.table.rows as ProposalRow[];

    if (status !== "all") {
      result = result.filter((row) => row.status.toLowerCase() === status);
    }

    if (q) {
      result = result.filter((row) => {
        return (
          String(row.id).includes(q) ||
          row.title.toLowerCase().includes(q) ||
          row.type.toLowerCase().includes(q)
        );
      });
    }

    const sorted = [...result].sort((a, b) => {
      if (sortBy === "id") {
        return a.id - b.id;
      }
      if (sortBy === "delegators") {
        return a.delegators - b.delegators;
      }
      return a.endDateMs - b.endDateMs;
    });

    if (descending) {
      sorted.reverse();
    }

    return sorted;
  }, [descending, query, sortBy, status, view.table.rows]);
  const insights = useMemo(() => computeProposalInsights(rows), [rows]);
  const otherStatusTooltip = insights.kpis.otherStatusBreakdown.length
    ? insights.kpis.otherStatusBreakdown
        .map((entry) => `${entry.status}: ${entry.count}`)
        .join(" • ")
    : "No additional statuses in current view.";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Terra Classic Governance"
        title={view.header.title}
        subtitle={view.header.subtitle}
      />

      <Card>
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-500">
              Search
            </label>
            <input
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
              placeholder="Search by id, title, type..."
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-500">
              Sort
            </label>
            <select
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              {view.filters.sortOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-slate-500">
              Status
            </label>
            <select
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              {view.filters.statusOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={descending}
              onChange={(event) => setDescending(event.target.checked)}
            />
            Descending
          </label>
        </div>
      </Card>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Governance insights (current view)
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Calculated from proposals currently shown by your filters.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
              Proposals in view
              <InfoHint text="Total number of proposals after applying your current status/search filters." />
            </div>
            <p className="mt-3 text-2xl font-semibold text-white">{formatCount(insights.kpis.count)}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
              Pass rate
              <InfoHint text="Share of proposals that ended with status Passed in the current view. Formula: passed / total." />
            </div>
            <p className="mt-3 text-2xl font-semibold text-white">{formatPercent(insights.kpis.passRate)}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
              Rejected rate
              <InfoHint text="Share of proposals that ended with status Rejected in the current view. Formula: rejected / total." />
            </div>
            <p className="mt-3 text-2xl font-semibold text-white">{formatPercent(insights.kpis.rejectedRate)}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
              Other outcomes
              <InfoHint text={`Share of proposals with outcomes other than Passed/Rejected. Formula: (total - passed - rejected) / total. Breakdown: ${otherStatusTooltip}`} />
            </div>
            <p className="mt-3 text-2xl font-semibold text-white">{formatPercent(insights.kpis.otherRate)}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
              Median delegators
              <InfoHint text="Typical number of wallets that voted on a proposal (median). Less sensitive to outliers than average." />
            </div>
            <p className="mt-3 text-2xl font-semibold text-white">{formatCount(insights.kpis.medianDelegators)}</p>
            {insights.kpis.medianDelegators === 0 ? (
              <p className="mt-1 text-xs text-slate-500">
                {`${formatCount(insights.kpis.zeroDelegatorCount)} of ${formatCount(insights.kpis.count)} proposals have 0 delegators`}
              </p>
            ) : null}
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
              Low-engagement proposals
              <InfoHint text="Proposals with delegators at or below the 25th percentile of this view. A proxy for low attention governance. Formula: delegators <= p25." />
            </div>
            <p className="mt-3 text-2xl font-semibold text-white">{formatPercent(insights.kpis.lowEngRate)}</p>
            <p className="mt-1 text-xs text-slate-500">
              {`${formatCount(insights.kpis.lowEngCount)} proposals (threshold ≤ ${formatCount(insights.kpis.lowEngThreshold)})`}
            </p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
              Veto pressure (avg)
              <InfoHint text="Average share of No with veto / Veto votes across proposals in view. Higher values may indicate legitimacy disputes." />
            </div>
            <p className="mt-3 text-2xl font-semibold text-white">{formatPercent(insights.kpis.avgVeto)}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
              Controversy (median)
              <InfoHint text="How close the Yes vs No vote was (ignores abstain/veto). 0% = landslide, 100% = perfectly split. Formula: 1 - |yes-no|/(yes+no)." />
            </div>
            <p className="mt-3 text-2xl font-semibold text-white">{formatPercent(insights.kpis.medianControversy)}</p>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white">Proposals per month (count)</h3>
              <InfoHint text="Monthly count of proposals in the current view, grouped by proposal end date (UTC)." />
            </div>
            <div className="mt-3 h-64 rounded-xl border border-dashed border-slate-800 bg-slate-950/50 p-2">
              <MonthlyCountChart data={insights.perMonth} />
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white">Pass rate by type (top 8 types)</h3>
              <InfoHint text="Pass rate per proposal type, sorted by count. Types after top 8 are merged into Other." />
            </div>
            <div className="mt-3 overflow-x-hidden rounded-xl border border-dashed border-slate-800 bg-slate-950/50 p-3 md:p-2">
              <div className="md:hidden">
                <TypePassRateMobileChart data={insights.passRateByType} />
              </div>
              <div className="hidden h-64 min-w-0 overflow-hidden md:block">
                <TypePassRateChart data={insights.passRateByType} />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <TopListCard
            title="Most engaged"
            subtitle="Top 10 by delegator count."
            items={insights.topMostEngaged}
            scoreLabel="Delegators"
            scoreFormatter={(value) => formatCount(value)}
            showScoreColumn={false}
          />
          <TopListCard
            title="Highest veto"
            subtitle="Top 10 by veto percentage."
            items={insights.topHighestVeto}
            scoreLabel="Veto %"
            scoreFormatter={(value) => formatPercent(value)}
          />
        </div>
      </section>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-white">{view.table.title}</h2>
          <span className="text-xs text-slate-500">Table note placeholder</span>
        </div>
        <div className="section-scroll-x mt-4 rounded-xl border border-slate-800">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                {view.table.columns.map((column) => (
                  <th key={column.key} className="px-4 py-3 whitespace-nowrap">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="text-slate-300">
                  {view.table.columns.map((column) => (
                    <td
                      key={column.key}
                      className={[
                        "px-4 py-3",
                        column.key === "title" || column.key === "votes"
                          ? "min-w-[16rem] whitespace-normal break-words"
                          : "whitespace-nowrap",
                      ].join(" ")}
                    >
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
