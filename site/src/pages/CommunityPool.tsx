import { useMemo, useState } from "react";
import Card from "../components/Card";
import SnapshotErrorPanel from "../components/SnapshotErrorPanel";
import CommunityPoolBalanceChart from "../components/charts/CommunityPoolBalanceChart";
import { formatTableValue, formatValue } from "../data/format";
import { getSnapshot } from "../data/loadSnapshot";
import { selectCommunityPool } from "../data/selectors";
import PageHeader from "../components/PageHeader";

type DenomKey = "lunc" | "ustc" | "combined";

const DENOMS: Array<{ key: DenomKey; label: string }> = [
  { key: "lunc", label: "LUNC" },
  { key: "ustc", label: "USTC" },
  { key: "combined", label: "COMBINED" },
];

function InfoHint({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={text}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-600 text-[10px] font-semibold leading-none text-slate-400 transition hover:border-slate-400 hover:text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400"
      >
        i
      </button>
      <span className="pointer-events-none absolute left-1/2 top-6 z-20 w-72 -translate-x-1/2 rounded-lg border border-slate-800 bg-slate-950/95 px-3 py-2 text-left text-[11px] font-normal leading-5 text-slate-200 opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
        {text}
      </span>
    </span>
  );
}

function renderNumber(value: number | null, digits = 0, suffix = "") {
  if (value === null || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}${suffix}`;
}

function renderPercent(value: number | null, digits = 1) {
  if (value === null || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

export default function CommunityPool() {
  const { data: snapshot, error } = getSnapshot("community-pool");
  const [windowId, setWindowId] = useState<string>("ALL");

  if (!snapshot) {
    return <SnapshotErrorPanel error={error} />;
  }

  const view = useMemo(() => selectCommunityPool(snapshot, windowId), [snapshot, windowId]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Terra Classic Community Pool"
        title={view.header.title}
        subtitle={view.header.subtitle}
      />

      <Card>
        <div>
          <h2 className="text-lg font-semibold text-white">Analysis window</h2>
          <p className="mt-1 text-sm text-slate-400">
            Filter balances, mapped outflow markers, and table rows by marker week.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {view.windows.map((window) => (
            <button
              key={window.id}
              type="button"
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-wider transition ${
                window.id === view.selectedWindow.id
                  ? "border-amber-300 text-amber-200"
                  : "border-slate-800 text-slate-300 hover:border-amber-300 hover:text-amber-200"
              }`}
              onClick={() => setWindowId(window.id)}
            >
              {window.label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Community Pool Balance (History)
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Spend bars are anchored at marker week and represent marker to drop
              intervals.
            </p>
          </div>
        </div>
        <div className="mt-6">
          <CommunityPoolBalanceChart
            balances={view.balances}
            markers={view.outflowMarkers}
            height={520}
          />
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Community Pool Spend Outflows
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Derived from mapped marker objects (same source as chart bars).
            </p>
          </div>
          <div className="text-xs text-slate-400">{view.outflowSummaryText}</div>
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
            <tbody className="text-slate-300">
              {view.table.rows.map((row) => (
                <tr key={row.period} className="align-top">
                  {view.table.columns.map((column) => (
                    <td key={column.key} className="px-4 py-3">
                      {column.key === "title" && row.lowConfidence ? (
                        <div className="space-y-1">
                          <div>{row.title}</div>
                          <span className="inline-flex rounded bg-amber-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-200">
                            Low conf
                          </span>
                        </div>
                      ) : (
                        formatTableValue(
                          row[column.key as keyof typeof row] as string | number,
                          column.unit,
                        )
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {view.table.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={view.table.columns.length}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    No mapped outflow markers in this window.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Overview</h2>
          <p className="text-sm text-slate-400">
            Totals are derived from period deltas in the canonical dataset.
          </p>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
              Total outflow
              <InfoHint text="Sum of weekly governance outflows inside the selected analysis window. Reported separately for LUNC and USTC, plus a combined total." />
              <span className="rounded-full bg-slate-950/70 px-2 py-0.5 text-xs uppercase tracking-wider text-slate-400">
                Coarse (weekly)
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {DENOMS.map(({ key, label }) => (
                <div
                  key={`overview-total-${key}`}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                >
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    {label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {key === "ustc"
                      ? formatValue({
                          value: view.overview.totalOutflow[key],
                          unit: "ustc",
                          scale: 1e9,
                        })
                      : formatValue({
                          value: view.overview.totalOutflow[key],
                          unit: "lunc",
                          scale: 1e9,
                        })}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
              Idle weeks (zero outflow)
              <InfoHint text="Number of weeks in the selected window where weekly outflow equals 0 for the given denom. “Combined” counts weeks where both LUNC and USTC outflow are 0." />
              <span className="rounded-full bg-slate-950/70 px-2 py-0.5 text-xs uppercase tracking-wider text-slate-400">
                Coarse (weekly)
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {DENOMS.map(({ key, label }) => (
                <div
                  key={`overview-idle-${key}`}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                >
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    {label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {renderNumber(view.overview.idleWeeks[key], 0)}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 lg:col-span-2">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
              Longest inactivity streak (weeks)
              <InfoHint text="The longest run of consecutive weeks in the selected window with zero weekly outflow for the given denom. “Combined” requires both denoms to have zero outflow." />
              <span className="rounded-full bg-slate-950/70 px-2 py-0.5 text-xs uppercase tracking-wider text-slate-400">
                Coarse (weekly)
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {DENOMS.map(({ key, label }) => (
                <div
                  key={`overview-longest-${key}`}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                >
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    {label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {renderNumber(view.overview.longestInactivityStreak[key], 0)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Capital utilization</h2>
          <p className="text-sm text-slate-400">
            Utilization and inactivity metrics computed from weekly spend buckets
            in the active window.
          </p>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                Utilization rate (%/yr)
                <InfoHint text="Annualized outflow rate based on the selected window: (total outflow ÷ average balance) scaled to a 1-year rate. Higher means faster capital is being spent relative to the pool size." />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {DENOMS.map(({ key, label }) => (
                  <div
                    key={`capital-util-${key}`}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {view.capitalUtilization.utilizationRatePct[key] === null
                        ? "—"
                        : `${view.capitalUtilization.utilizationRatePct[key]!.toFixed(2)}%/yr`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                Typical inactivity (median / p90)
                <InfoHint text="Typical time between non-zero outflow weeks, measured in weeks. Shown as median and 90th percentile (p90) gaps between spending events." />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {DENOMS.map(({ key, label }) => (
                  <div
                    key={`capital-typical-${key}`}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {view.capitalUtilization.typicalInactivity[key].median === null ||
                      view.capitalUtilization.typicalInactivity[key].p90 === null
                        ? "—"
                        : `${view.capitalUtilization.typicalInactivity[
                            key
                          ].median!.toFixed(1)}w / ${view.capitalUtilization.typicalInactivity[
                            key
                          ].p90!.toFixed(1)}w`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                Idle weeks share
                <InfoHint text="Percent of weeks in the selected window with zero weekly outflow: (idle weeks ÷ total weeks) × 100%." />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {DENOMS.map(({ key, label }) => (
                  <div
                    key={`capital-idle-share-${key}`}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {renderPercent(view.capitalUtilization.idleWeeksSharePct[key], 1)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                Median gap between spends
                <InfoHint text="Median number of weeks between consecutive non-zero outflow weeks in the selected window." />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {DENOMS.map(({ key, label }) => (
                  <div
                    key={`capital-median-gap-${key}`}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {view.capitalUtilization.medianGapWeeks[key] === null
                        ? "—"
                        : `${view.capitalUtilization.medianGapWeeks[key]!.toFixed(1)}w`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Spend concentration</h2>
          <p className="text-sm text-slate-400">
            How much weekly governance spend is concentrated into a small number
            of weeks.
          </p>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                Top spend share (1/3/5)
                <InfoHint text="Share of total outflow concentrated in the top 1, top 3, and top 5 spending weeks (ranked by weekly outflow) within the selected window." />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {DENOMS.map(({ key, label }) => (
                  <div
                    key={`concentration-top-share-${key}`}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {view.spendConcentration.topSpendShare[key] === null
                        ? "—"
                        : `${view.spendConcentration.topSpendShare[
                            key
                          ]!.top1.toFixed(1)}% / ${view.spendConcentration.topSpendShare[
                            key
                          ]!.top3.toFixed(1)}% / ${view.spendConcentration.topSpendShare[
                            key
                          ]!.top5.toFixed(1)}%`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                Gini coefficient
                <InfoHint text="Inequality of weekly spending amounts across weeks in the selected window (0 = perfectly even, 1 = extremely concentrated)." />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {DENOMS.map(({ key, label }) => (
                  <div
                    key={`concentration-gini-${key}`}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {renderNumber(view.spendConcentration.giniCoefficient[key], 2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                80/20 spend weeks
                <InfoHint text="How many weeks account for ~80% of total outflow in the selected window, plus that count as a share of all weeks." />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {DENOMS.map(({ key, label }) => (
                  <div
                    key={`concentration-8020-${key}`}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {view.spendConcentration.eightyTwentySpendWeeks[key] === null
                        ? "—"
                        : `${view.spendConcentration.eightyTwentySpendWeeks[
                            key
                          ]!.weeks} (${view.spendConcentration.eightyTwentySpendWeeks[
                            key
                          ]!.pct.toFixed(1)}%)`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                Bursty index
                <InfoHint text="A measure of “clumpiness” of spending over time. Higher values mean spend events are more clustered into bursts rather than evenly spaced." />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {DENOMS.map(({ key, label }) => (
                  <div
                    key={`concentration-bursty-${key}`}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {renderNumber(view.spendConcentration.burstyIndex[key], 2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
