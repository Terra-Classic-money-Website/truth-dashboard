import Card from "../components/Card";
import PageHeader from "../components/PageHeader";

export default function CommunityPool() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Terra Classic Community Pool"
        title="Balances & Flow Analysis"
        subtitle="Track historical balances, inflows, and outflows for LUNC and USTC."
      />
      <Card>
        <div>
          <h2 className="text-lg font-semibold text-white">Analysis window</h2>
          <p className="mt-1 text-sm text-slate-400">
            Filters metrics, chart, and outflow table without changing the cached
            build.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {["1M", "6M", "1Y", "2Y", "3Y", "ALL"].map((label) => (
            <button
              key={label}
              type="button"
              className="rounded-full border border-slate-800 px-4 py-2 text-xs uppercase tracking-wider text-slate-300"
            >
              {label}
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
              Outflow markers highlight periods with governance spend outflows.
            </p>
          </div>
        </div>
        <div className="mt-6 flex h-80 items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/50 text-sm text-slate-500">
          Chart placeholder — community pool balance history
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Community Pool Spend Outflows
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Based on governance spend records (CSV) and mapped to the analysis
              window.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span>
              Outflow summary: LUNC 8.57B | USTC 0 | Max impact LUNC 88.28% /
              USTC 0.00% / Combined 88.28% | Count 16
            </span>
            <label className="flex items-center gap-2">
              <input type="checkbox" disabled />
              Show unmapped
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked disabled />
              Show low-confidence
            </label>
          </div>
        </div>
        <div className="mt-4 text-sm text-slate-500">
          Outflow warning placeholder.
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">LUNC</th>
                <th className="px-4 py-3">USTC</th>
                <th className="px-4 py-3">Impact %</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="align-top">
                <td className="px-4 py-3">2026-01-24 → 2026-01-31</td>
                <td className="px-4 py-3">
                  Spending Proposal: Terra Classic Upgrade to Cosmos SDK v0.53
                  with IBC v2 (Eureka)
                </td>
                <td className="px-4 py-3">terra1...e86v</td>
                <td className="px-4 py-3">1.05B</td>
                <td className="px-4 py-3">0</td>
                <td className="px-4 py-3">12.32%</td>
              </tr>
              <tr className="align-top text-slate-400">
                <td className="px-4 py-3">2025-11-01 → 2025-11-08</td>
                <td className="px-4 py-3">Fund IBC Relaying Activity</td>
                <td className="px-4 py-3">terra1...f5t1</td>
                <td className="px-4 py-3">254.58M</td>
                <td className="px-4 py-3">0</td>
                <td className="px-4 py-3">3.31%</td>
              </tr>
              <tr className="align-top text-slate-400">
                <td className="px-4 py-3">
                  <div>2025-09-28 → 2025-10-05</div>
                  <span className="mt-2 inline-flex items-center rounded-full border border-amber-300/50 bg-slate-950/50 px-2 py-0.5 text-xs uppercase tracking-wider text-amber-200">
                    Low conf
                  </span>
                </td>
                <td className="px-4 py-3">
                  Spending Proposal for Phase 2 of OrbitLabs' Removal of Forked
                  Modules from Terra
                </td>
                <td className="px-4 py-3">terra1...v2fv</td>
                <td className="px-4 py-3">500M</td>
                <td className="px-4 py-3">0</td>
                <td className="px-4 py-3">6.30%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div>
          <h2 className="text-lg font-semibold text-white">Overview</h2>
          <p className="mt-1 text-sm text-slate-400">
            Totals are derived from period deltas in the canonical dataset.
          </p>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
              Total outflow
              <span className="rounded-full bg-slate-950/70 px-2 py-0.5 text-xs uppercase tracking-wider text-slate-400">
                Coarse (weekly)
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ["LUNC", "8.57B"],
                ["USTC", "0"],
                ["COMBINED", "8.57B"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                >
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    {label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
              Idle weeks (zero outflow)
              <span className="rounded-full bg-slate-950/70 px-2 py-0.5 text-xs uppercase tracking-wider text-slate-400">
                Coarse (weekly)
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ["LUNC", "141"],
                ["USTC", "157"],
                ["COMBINED", "141"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                >
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    {label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 lg:col-span-2">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
              Longest inactivity streak (weeks)
              <span className="rounded-full bg-slate-950/70 px-2 py-0.5 text-xs uppercase tracking-wider text-slate-400">
                Coarse (weekly)
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ["LUNC", "21"],
                ["USTC", "157"],
                ["COMBINED", "21"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                >
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    {label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {value}
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
              <p className="text-sm font-semibold text-white">
                Utilization rate (%/yr)
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  ["LUNC", "52.65%/yr"],
                  ["USTC", "0.00%/yr"],
                  ["COMBINED", "52.42%/yr"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-sm font-semibold text-white">
                Typical inactivity (median / p90)
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  ["LUNC", "8.0w / 19.0w"],
                  ["USTC", "157.0w / 157.0w"],
                  ["COMBINED", "8.0w / 19.0w"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-sm font-semibold text-white">Idle weeks share</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  ["LUNC", "89.81%"],
                  ["USTC", "100.00%"],
                  ["COMBINED", "89.81%"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-sm font-semibold text-white">
                Median gap between spends
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  ["LUNC", "9.0w"],
                  ["USTC", "—"],
                  ["COMBINED", "9.0w"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {value}
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
              <p className="text-sm font-semibold text-white">
                Top spend share (1/3/5)
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  ["LUNC", "23.0% / 55.1% / 76.6%"],
                  ["USTC", "—"],
                  ["COMBINED", "23.0% / 55.1% / 76.6%"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-sm font-semibold text-white">Gini coefficient</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  ["LUNC", "0.56"],
                  ["USTC", "—"],
                  ["COMBINED", "0.56"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-sm font-semibold text-white">
                80/20 spend weeks
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  ["LUNC", "6 (37.5%)"],
                  ["USTC", "—"],
                  ["COMBINED", "6 (37.5%)"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-sm font-semibold text-white">Bursty index</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  ["LUNC", "7.71"],
                  ["USTC", "—"],
                  ["COMBINED", "7.71"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <p className="text-xs uppercase tracking-wider text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {value}
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
