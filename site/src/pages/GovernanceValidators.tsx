import { useMemo, useState } from "react";
import Card from "../components/Card";
import { formatTableValue, formatValue } from "../data/format";
import { selectGovernanceValidators } from "../data/selectors";
import { deriveGovernanceValidatorInsights } from "../data/selectors/governanceValidatorInsights";
import type { GovernanceWindowId } from "../data/governanceRaw";
import PageHeader from "../components/PageHeader";

type HistogramBin = {
  label: string;
  count: number;
};

type TableMetricRow = {
  label: string;
  value: string;
};

function InfoHint({
  explanation,
  formula,
}: {
  explanation: string;
  formula: string;
}) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={`${explanation} Formula: ${formula}`}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-600 text-[10px] font-semibold leading-none text-slate-400 transition hover:border-slate-400 hover:text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400"
      >
        ?
      </button>
      <span className="pointer-events-none absolute left-1/2 top-6 z-20 w-72 -translate-x-1/2 rounded-lg border border-slate-800 bg-slate-950/95 px-3 py-2 text-left text-[11px] font-normal leading-5 text-slate-200 opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
        <span>{explanation}</span>
        <span className="mt-1 block text-slate-400">Formula: {formula}</span>
      </span>
    </span>
  );
}

function formatPercent(value: number | null, digits = 1) {
  if (value === null || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

function formatCompactUsd(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  return formatValue({ value, unit: "usd" });
}

function formatNumber(value: number | null, digits = 0) {
  if (value === null || Number.isNaN(value)) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function MetricCard({
  title,
  explanation,
  formula,
  rows,
}: {
  title: string;
  explanation: string;
  formula: string;
  rows: TableMetricRow[];
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
        <span>{title}</span>
        <InfoHint explanation={explanation} formula={formula} />
      </div>
      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-2">
            <span className="text-xs text-slate-400">{row.label}</span>
            <span className="text-sm font-semibold text-white">{row.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function HistogramChart({
  bins,
  color,
}: {
  bins: HistogramBin[];
  color: string;
}) {
  const maxCount = Math.max(...bins.map((bin) => bin.count), 1);
  const width = 820;
  const height = 240;
  const margin = { top: 16, right: 12, bottom: 56, left: 22 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const slot = plotWidth / Math.max(bins.length, 1);
  const barWidth = Math.max(12, slot * 0.58);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" preserveAspectRatio="none">
      <line
        x1={margin.left}
        y1={height - margin.bottom}
        x2={width - margin.right}
        y2={height - margin.bottom}
        stroke="#1f2937"
      />
      {bins.map((bin, index) => {
        const barHeight = (bin.count / maxCount) * plotHeight;
        const x = margin.left + index * slot + (slot - barWidth) / 2;
        const y = margin.top + (plotHeight - barHeight);
        return (
          <g key={bin.label}>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx={3} fill={color} />
            <text
              x={x + barWidth / 2}
              y={y - 6}
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize={12}
            >
              {bin.count}
            </text>
            <text
              x={x + barWidth / 2}
              y={height - margin.bottom + 18}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize={11}
            >
              {bin.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function RankedTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: Array<Array<string>>;
}) {
  return (
    <div className="section-scroll-x section-scroll-mobile-y mt-3 rounded-xl border border-slate-800">
      <table className="w-full text-left text-sm" style={{ minWidth: "620px" }}>
        <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-3 py-2 whitespace-nowrap">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row[0]}-${index}`} className="text-slate-300">
              {row.map((value, valueIndex) => (
                <td
                  key={`${row[0]}-${columns[valueIndex]}`}
                  className="px-3 py-2 whitespace-nowrap"
                  style={valueIndex === 0 ? { minWidth: "12rem" } : undefined}
                >
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function GovernanceValidators() {
  const [windowId, setWindowId] = useState<GovernanceWindowId>("1y");
  const [incomeFilterEnabled, setIncomeFilterEnabled] = useState(false);
  const view = selectGovernanceValidators(windowId);
  const insights = useMemo(
    () => deriveGovernanceValidatorInsights(view.table.rows, windowId),
    [view.table.rows, windowId],
  );
  const filteredRows = useMemo(
    () =>
      incomeFilterEnabled
        ? view.table.rows.filter((row) => row.incomeMonthlyUsd >= 100)
        : view.table.rows,
    [incomeFilterEnabled, view.table.rows],
  );

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

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Validator Insights</h2>
          <p className="mt-1 text-sm text-slate-400">
            Participation and concentration diagnostics derived from the active
            validator dataset for the selected window.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Income thresholds"
            explanation="How many validators earn at least each monthly income threshold."
            formula="count(incomeMonthlyUsd >= threshold)"
            rows={[
              { label: ">= $100", value: formatNumber(insights.kpis.incomeThresholdCounts.gte100) },
              { label: ">= $500", value: formatNumber(insights.kpis.incomeThresholdCounts.gte500) },
              { label: ">= $1k", value: formatNumber(insights.kpis.incomeThresholdCounts.gte1000) },
              { label: ">= $5k", value: formatNumber(insights.kpis.incomeThresholdCounts.gte5000) },
            ]}
          />
          <MetricCard
            title="Total monthly income"
            explanation="Total monthly commission income summed across all validators."
            formula="sum(incomeMonthlyUsd)"
            rows={[
              { label: "All validators", value: formatCompactUsd(insights.kpis.totalMonthlyIncome) },
            ]}
          />
          <MetricCard
            title="Income concentration"
            explanation="Share of total monthly income captured by top earning validators."
            formula="sum(top N income) / total income * 100"
            rows={[
              { label: "Top 1 share", value: formatPercent(insights.kpis.incomeTopShares.top1) },
              { label: "Top 5 share", value: formatPercent(insights.kpis.incomeTopShares.top5) },
              { label: "Top 10 share", value: formatPercent(insights.kpis.incomeTopShares.top10) },
            ]}
          />
          <MetricCard
            title="Delegator concentration"
            explanation="Share of all delegators delegated to the top validators."
            formula="sum(top N delegators) / total delegators * 100"
            rows={[
              { label: "Top 1 share", value: formatPercent(insights.kpis.delegatorTopShares.top1) },
              { label: "Top 5 share", value: formatPercent(insights.kpis.delegatorTopShares.top5) },
              { label: "Top 10 share", value: formatPercent(insights.kpis.delegatorTopShares.top10) },
            ]}
          />
          <MetricCard
            title="Inactive voting power"
            explanation="Voting power controlled by validators with high missed-vote rates."
            formula="sum(votingPowerPct where missRate >= threshold)"
            rows={[
              { label: "Never votes", value: formatPercent(insights.kpis.inactiveVotingPower.neverVotes) },
              { label: "Miss >= 70%", value: formatPercent(insights.kpis.inactiveVotingPower.missOver70) },
              { label: "Miss >= 50%", value: formatPercent(insights.kpis.inactiveVotingPower.missOver50) },
            ]}
          />
          <MetricCard
            title="Effective governance power"
            explanation="Voting power discounted by missed-vote rate to reflect reliable participation."
            formula="effectivePowerPct = votingPowerPct * (1 - missRate)"
            rows={[
              { label: "Effective power", value: formatPercent(insights.kpis.effectivePower.totalEffectivePower) },
              { label: "Raw voting power", value: formatPercent(insights.kpis.effectivePower.totalVotingPower) },
              { label: "Effective loss", value: formatPercent(insights.kpis.effectivePower.effectivePowerLoss) },
            ]}
          />
          <MetricCard
            title="Reliability score"
            explanation="Participation reliability score based on missed-vote rate."
            formula="Reliability = 100 * (1 - missRate)"
            rows={[
              { label: "Average", value: formatNumber(insights.kpis.reliability.average, 1) },
              { label: "Median", value: formatNumber(insights.kpis.reliability.median, 1) },
            ]}
          />
          <MetricCard
            title="Abstain-heavy power"
            explanation="Voting power held by validators that abstain frequently."
            formula="sum(votingPowerPct where abstainPct >= 20)"
            rows={[
              { label: "Power share", value: formatPercent(insights.kpis.abstainHeavyPower) },
              { label: "Polarized power", value: formatPercent(insights.kpis.powerPolarized) },
            ]}
          />
          <MetricCard
            title="Nakamoto concentration (raw)"
            explanation="Minimum validator count needed to reach key voting-power thresholds."
            formula="min N where cumulative votingPowerPct >= threshold"
            rows={[
              { label: "N33", value: formatNumber(insights.kpis.nakamotoVotingPower.n33) },
              { label: "N50", value: formatNumber(insights.kpis.nakamotoVotingPower.n50) },
              { label: "N67", value: formatNumber(insights.kpis.nakamotoVotingPower.n67) },
            ]}
          />
          <MetricCard
            title="Nakamoto concentration (effective)"
            explanation="Minimum validator count needed to reach thresholds using reliability-adjusted power."
            formula="min N where cumulative effectivePowerPct >= threshold"
            rows={[
              { label: "N33", value: formatNumber(insights.kpis.nakamotoEffectivePower.n33) },
              { label: "N50", value: formatNumber(insights.kpis.nakamotoEffectivePower.n50) },
              { label: "N67", value: formatNumber(insights.kpis.nakamotoEffectivePower.n67) },
            ]}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              Income tier distribution
              <InfoHint
                explanation="Distribution of validators across monthly income tiers."
                formula="count(validators in each income bracket)"
              />
            </div>
            <div className="mt-4 h-56 rounded-xl border border-dashed border-slate-800 bg-slate-950/50 p-2">
              <HistogramChart bins={insights.distributions.incomeTiers} color="#60a5fa" />
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              Participation reliability distribution
              <InfoHint
                explanation="How many validators fall into each reliability score band."
                formula="Reliability = 100 * (1 - missRate)"
              />
            </div>
            <div className="mt-4 h-56 rounded-xl border border-dashed border-slate-800 bg-slate-950/50 p-2">
              <HistogramChart bins={insights.distributions.reliability} color="#34d399" />
            </div>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              Paid but absent (Top 10)
              <InfoHint
                explanation="Validators earning meaningful income while missing at least half of votes."
                formula="incomeMonthlyUsd >= 500 and missRate >= 0.5"
              />
            </div>
            <RankedTable
              columns={["Validator", "Income/mo", "Missed votes %", "Voting power"]}
              rows={insights.ranked.paidButAbsent.map((row) => [
                row.validator,
                formatCompactUsd(row.incomeMonthlyUsd),
                formatPercent(row.missPct),
                formatPercent(row.votingPower),
              ])}
            />
          </Card>
          <Card className="lg:col-span-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              Top validators by effective power
              <InfoHint
                explanation="Validators contributing the most reliability-adjusted governance power."
                formula="effectivePowerPct = votingPowerPct * (1 - missRate)"
              />
            </div>
            <RankedTable
              columns={["Validator", "Effective power", "Voting power", "Missed votes %"]}
              rows={insights.ranked.topEffectivePower.map((row) => [
                row.validator,
                formatPercent(row.effectivePowerPct),
                formatPercent(row.votingPower),
                formatPercent(row.missPct),
              ])}
            />
          </Card>
        </div>
      </section>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-white">Active validators</h2>
          {view.filters.incomeThresholds.map((threshold) => (
            <label
              key={threshold.id}
              className="flex items-center gap-2 text-xs text-slate-400"
            >
              <input
                type="checkbox"
                checked={incomeFilterEnabled}
                onChange={(event) => setIncomeFilterEnabled(event.target.checked)}
              />
              {threshold.label}
            </label>
          ))}
        </div>
        <div className="section-scroll-x mt-4 rounded-xl border border-slate-800">
          <table className="w-full min-w-[1280px] text-left text-sm">
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
              {filteredRows.map((row) => (
                <tr key={row.rank} className="text-slate-300">
                  {view.table.columns.map((column) => (
                    <td
                      key={column.key}
                      className={
                        column.key === "validator"
                          ? "px-4 py-3 min-w-[16rem] whitespace-normal break-words"
                          : "px-4 py-3 whitespace-nowrap"
                      }
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
