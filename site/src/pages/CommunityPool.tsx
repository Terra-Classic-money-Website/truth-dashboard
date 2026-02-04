import Card from "../components/Card";
import PageHeader from "../components/PageHeader";

const rangeOptions = ["7D", "1M", "3M", "1Y", "2Y", "4Y", "Since May 2022"];
const stakebinOptions = ["1Y", "7D", "1M", "3M", "2Y", "4Y", "Since May 2022"];

export default function CommunityPool() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          eyebrow="Terra Classic Community Pool"
          title="Balances & Flow Analysis"
          subtitle="Track historical balances, inflows, and outflows for LUNC and USTC."
        />
        <div className="rounded-full border border-slate-800 bg-slate-950/70 px-4 py-2 text-xs uppercase tracking-wider text-slate-400">
          Static MVP v0
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Data</h2>
          </div>
          <div className="text-xs text-slate-500">
            <div>Data coverage: —</div>
            <div>Current (LCD): —</div>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <label className="block text-xs uppercase tracking-wider text-slate-500">
            Source
          </label>
          <select
            className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
            disabled
          >
            <option>Sample</option>
            <option>FCD (Indexed)</option>
            <option>Community Pool (Monthly snapshots)</option>
            <option>FCD reconstructed (monthly)</option>
            <option>LCD sampled (CSV) — monthly avg</option>
            <option>LCD sampled (CSV) — weekly clean</option>
            <option>LCD sampled (CSV) — monthly last</option>
            <option>LCD/RPC (Cached Proxy)</option>
            <option>StakeBin (Live)</option>
            <option>Custom API (JSON)</option>
            <option>Paste JSON</option>
            <option>Load from URL</option>
          </select>
          <p className="text-sm text-slate-500">
            StakeBin history is often capped. Use FCD (Indexed) for long-range
            coverage, or LCD/RPC (Cached Proxy) for full daily history (slower on
            first run).
          </p>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card className="bg-slate-950/60">
            <p className="text-sm text-slate-400">
              Using built-in sample data (90 days). Switch sources to load your
              own.
            </p>
          </Card>

          <Card className="bg-slate-950/60">
            <h3 className="text-sm font-semibold text-white">FCD (Indexed)</h3>
            <div className="mt-3 space-y-3">
              {[
                ["Proxy Base URL", "http://localhost:8787"],
                [
                  "FCD Base URL",
                  "https://terra-classic-fcd.publicnode.com",
                ],
                [
                  "LCD URL",
                  "https://terra-classic-lcd.publicnode.com",
                ],
              ].map(([label, placeholder]) => (
                <label key={label} className="block text-xs text-slate-500">
                  <span className="block uppercase tracking-wider">{label}</span>
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
                    placeholder={placeholder}
                    disabled
                  />
                </label>
              ))}
              <label className="block text-xs text-slate-500">
                <span className="block uppercase tracking-wider">Range</span>
                <select
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
                  disabled
                >
                  {rangeOptions.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </label>
              <p className="text-sm text-slate-500">
                Builds long-range daily history by scanning indexed FCD
                transactions. First run can take time; subsequent loads use the
                cache. Requires the local proxy.
              </p>
              <button
                type="button"
                className="rounded-full border border-slate-800 px-4 py-2 text-xs uppercase tracking-wider text-slate-300"
              >
                Load data
              </button>
            </div>
          </Card>

          <Card className="bg-slate-950/60">
            <h3 className="text-sm font-semibold text-white">
              Community Pool (Monthly)
            </h3>
            <div className="mt-3 space-y-3">
              <label className="block text-xs text-slate-500">
                <span className="block uppercase tracking-wider">
                  Proxy Base URL
                </span>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
                  placeholder="http://localhost:8787"
                  disabled
                />
              </label>
              <label className="block text-xs text-slate-500">
                <span className="block uppercase tracking-wider">
                  LCD URLs (comma separated)
                </span>
                <textarea
                  rows={2}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
                  placeholder="https://terra-classic-lcd.publicnode.com, https://api-lunc-lcd.binodes.com"
                  disabled
                />
              </label>
              <label className="block text-xs text-slate-500">
                <span className="block uppercase tracking-wider">
                  RPC URLs (comma separated)
                </span>
                <textarea
                  rows={2}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
                  placeholder="https://terra-classic-rpc.publicnode.com, https://api-lunc-rpc.binodes.com"
                  disabled
                />
              </label>
              <label className="block text-xs text-slate-500">
                <span className="block uppercase tracking-wider">Range</span>
                <select
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
                  disabled
                >
                  {rangeOptions.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </label>
              <p className="text-sm text-slate-500">
                Monthly snapshots of x/distribution community pool state at month
                boundaries. Uses LCD/RPC failover and caches progress per month.
              </p>
              <button
                type="button"
                className="rounded-full border border-slate-800 px-4 py-2 text-xs uppercase tracking-wider text-slate-300"
              >
                Load data
              </button>
            </div>
          </Card>

          <Card className="bg-slate-950/60">
            <h3 className="text-sm font-semibold text-white">
              FCD reconstructed (monthly)
            </h3>
            <div className="mt-3 space-y-3">
              <label className="block text-xs text-slate-500">
                <span className="block uppercase tracking-wider">
                  Proxy Base URL
                </span>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
                  placeholder="http://localhost:8787"
                  disabled
                />
              </label>
              <label className="block text-xs text-slate-500">
                <span className="block uppercase tracking-wider">
                  LCD URLs (comma separated)
                </span>
                <textarea
                  rows={2}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
                  placeholder="https://terra-classic-lcd.publicnode.com, https://api-lunc-lcd.binodes.com"
                  disabled
                />
              </label>
              <label className="block text-xs text-slate-500">
                <span className="block uppercase tracking-wider">Range</span>
                <select
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
                  disabled
                >
                  {rangeOptions.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </label>
              <p className="text-sm text-slate-500">
                Monthly reconstruction using FCD tx logs for the distribution
                module account. Uses LCD failover and resumes from checkpoints.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full border border-slate-800 px-4 py-2 text-xs uppercase tracking-wider text-slate-300"
                >
                  Load previous build
                </button>
                <button
                  type="button"
                  className="rounded-full border border-amber-300/50 px-4 py-2 text-xs uppercase tracking-wider text-amber-200"
                >
                  Start new build
                </button>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-950/60">
            <h3 className="text-sm font-semibold text-white">
              LCD sampled (CSV) — local
            </h3>
            <div className="mt-3 space-y-3">
              <label className="block text-xs text-slate-500">
                <span className="block uppercase tracking-wider">
                  Proxy Base URL
                </span>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
                  placeholder="http://localhost:8787"
                  disabled
                />
              </label>
              <p className="text-sm text-slate-500">
                Balances are LCD-sampled snapshots; accuracy ~90–95%;
                weekly/monthly spacing.
              </p>
              <button
                type="button"
                className="rounded-full border border-slate-800 px-4 py-2 text-xs uppercase tracking-wider text-slate-300"
              >
                Load data
              </button>
            </div>
          </Card>

          <Card className="bg-slate-950/60">
            <h3 className="text-sm font-semibold text-white">
              LCD/RPC (Cached Proxy)
            </h3>
            <div className="mt-3 space-y-3">
              {[
                ["Proxy Base URL", "http://localhost:8787"],
                ["LCD URL", "https://terra-classic-lcd.publicnode.com"],
                ["RPC URL", "https://terra-classic-rpc.publicnode.com:443"],
              ].map(([label, placeholder]) => (
                <label key={label} className="block text-xs text-slate-500">
                  <span className="block uppercase tracking-wider">{label}</span>
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
                    placeholder={placeholder}
                    disabled
                  />
                </label>
              ))}
              <label className="block text-xs text-slate-500">
                <span className="block uppercase tracking-wider">Range</span>
                <select
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
                  disabled
                >
                  {rangeOptions.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-slate-500">
                <span className="block uppercase tracking-wider">
                  Start date (UTC)
                </span>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
                  type="date"
                  disabled
                />
              </label>
              <p className="text-sm text-slate-500">
                Default denoms: <code>uluna</code> + <code>uustc</code>. If an RPC
                is pruned, the proxy will clamp the effective start date or
                switch to a fallback.
              </p>
              <button
                type="button"
                className="rounded-full border border-slate-800 px-4 py-2 text-xs uppercase tracking-wider text-slate-300"
              >
                Load data
              </button>
            </div>
          </Card>

          <Card className="bg-slate-950/60">
            <h3 className="text-sm font-semibold text-white">StakeBin (Live)</h3>
            <div className="mt-3 space-y-3">
              <label className="block text-xs text-slate-500">
                <span className="block uppercase tracking-wider">Base URL</span>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
                  placeholder="https://terraclassic.stakebin.io"
                  disabled
                />
              </label>
              <label className="block text-xs text-slate-500">
                <span className="block uppercase tracking-wider">
                  Proxy URL (optional)
                </span>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
                  placeholder="https://your-proxy/?url="
                  disabled
                />
              </label>
              <p className="text-sm text-slate-500">
                If CORS blocks direct calls, set Proxy URL to a proxy that
                accepts <code>?url=</code> and we will append the encoded target
                URL.
              </p>
              <label className="block text-xs text-slate-500">
                <span className="block uppercase tracking-wider">Range</span>
                <select
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
                  disabled
                >
                  {stakebinOptions.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </label>
              <p className="text-sm text-slate-500">
                StakeBin granularity: —
              </p>
              <button
                type="button"
                className="rounded-full border border-slate-800 px-4 py-2 text-xs uppercase tracking-wider text-slate-300"
              >
                Load live data
              </button>
              <p className="text-sm text-slate-500">
                For ranges beyond 1M, the StakeBin endpoint may be capped.
                Consider using FCD (Indexed) for long-range coverage or the
                LCD/RPC proxy source for full history.
              </p>
            </div>
          </Card>

          <Card className="bg-slate-950/60">
            <h3 className="text-sm font-semibold text-white">
              Custom API (JSON)
            </h3>
            <div className="mt-3 space-y-3">
              <label className="block text-xs text-slate-500">
                <span className="block uppercase tracking-wider">
                  Custom API URL
                </span>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
                  placeholder="https://example.com/community-pool.json"
                  disabled
                />
              </label>
              <label className="block text-xs text-slate-500">
                <span className="block uppercase tracking-wider">
                  Proxy URL (optional)
                </span>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
                  placeholder="https://your-proxy/?url="
                  disabled
                />
              </label>
              <p className="text-sm text-slate-500">
                Accepts either <code>{`{ data: [[ts, lunc, ustc], ...] }`}</code>{" "}
                or <code>{`[[ts, lunc, ustc], ...]`}</code>. If using a proxy, we
                append <code>encodeURIComponent(targetUrl)</code>.
              </p>
              <button
                type="button"
                className="rounded-full border border-slate-800 px-4 py-2 text-xs uppercase tracking-wider text-slate-300"
              >
                Load live data
              </button>
            </div>
          </Card>

          <Card className="bg-slate-950/60">
            <h3 className="text-sm font-semibold text-white">Paste JSON</h3>
            <div className="mt-3 space-y-3">
              <label className="block text-xs text-slate-500">
                <span className="block uppercase tracking-wider">Paste JSON</span>
                <textarea
                  rows={6}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
                  placeholder='{"balances": [{"t":"2022-05-13","denom":"LUNC","balance":8500000000}]}'
                  disabled
                />
              </label>
              <button
                type="button"
                className="rounded-full border border-slate-800 px-4 py-2 text-xs uppercase tracking-wider text-slate-300"
              >
                Load
              </button>
            </div>
          </Card>

          <Card className="bg-slate-950/60">
            <h3 className="text-sm font-semibold text-white">Load from URL</h3>
            <div className="mt-3 space-y-3">
              <label className="block text-xs text-slate-500">
                <span className="block uppercase tracking-wider">JSON URL</span>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300"
                  placeholder="https://example.com/community-pool.json"
                  disabled
                />
              </label>
              <button
                type="button"
                className="rounded-full border border-slate-800 px-4 py-2 text-xs uppercase tracking-wider text-slate-300"
              >
                Fetch
              </button>
            </div>
          </Card>
        </div>

        <div className="mt-4 space-y-3 text-sm text-slate-400">
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            Data error output will appear here if a load fails.
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            History depth scorecard placeholder.
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Build progress</h3>
              <button
                type="button"
                className="rounded-full border border-slate-800 px-3 py-1 text-xs uppercase tracking-wider text-slate-300"
              >
                Cancel build
              </button>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-800">
              <div className="h-2 w-1/3 rounded-full bg-amber-300" />
            </div>
            <div className="mt-2 text-xs text-slate-500">
              24 / 72 checkpoints processed
            </div>
          </div>
        </div>
      </Card>

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
          <div className="flex flex-wrap gap-3 text-xs text-slate-400">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked disabled />
              Show forecast (12M)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" disabled />
              Show height/time
            </label>
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
          <div className="space-y-2 text-xs text-slate-400">
            <div>Outflow summary: —</div>
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
        <div className="mt-4 space-y-2 text-sm text-slate-400">
          <div className="grid grid-cols-4 gap-3 rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-2 text-xs uppercase tracking-wider text-slate-500">
            <span>Date</span>
            <span>Proposal</span>
            <span>Amount</span>
            <span>Notes</span>
          </div>
          {[
            ["2024-03-18", "Community Pool Funding", "48M LUNC", "Mapped"],
            ["2024-07-02", "Ecosystem Grant", "22M LUNC", "Low confidence"],
          ].map((row) => (
            <div
              key={row[0]}
              className="grid grid-cols-4 gap-3 rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-3"
            >
              {row.map((cell) => (
                <span key={cell}>{cell}</span>
              ))}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div>
          <h2 className="text-lg font-semibold text-white">Overview</h2>
          <p className="mt-1 text-sm text-slate-400">
            Totals are derived from period deltas in the canonical dataset.
          </p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Total inflow", "1.92B LUNC"],
            ["Total outflow", "1.48B LUNC"],
            ["Net change", "+440M LUNC"],
            ["Utilization ratio", "0.77"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
            >
              <p className="text-xs uppercase tracking-wider text-slate-500">
                {label}
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-400">
          Sanity checks will be listed here.
        </div>
      </Card>

      <Card>
        <div>
          <h2 className="text-lg font-semibold text-white">Capital utilization</h2>
          <p className="mt-1 text-sm text-slate-400">
            Utilization and inactivity metrics computed from weekly spend buckets
            in the active window.
          </p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Utilization", "0.77"],
            ["Idle periods", "14"],
            ["Longest inactivity", "9 weeks"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
            >
              <p className="text-xs uppercase tracking-wider text-slate-500">
                {label}
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div>
          <h2 className="text-lg font-semibold text-white">Spend concentration</h2>
          <p className="mt-1 text-sm text-slate-400">
            How much weekly governance spend is concentrated into a small number
            of weeks.
          </p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Top 5 weeks share", "48%"],
            ["Top 10 weeks share", "62%"],
            ["Median weekly outflow", "18.4M"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
            >
              <p className="text-xs uppercase tracking-wider text-slate-500">
                {label}
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-white">
            Methodology
          </summary>
          <div className="mt-4 space-y-2 text-sm text-slate-400">
            <p>
              <strong className="text-slate-200">Canonical dataset:</strong> Each
              record includes a date (<code>t</code>), denom (<code>LUNC</code> or
              <code> USTC</code>), and balance.
            </p>
            <p>
              <strong className="text-slate-200">Period delta:</strong>{" "}
              <code>delta = balance[t] - balance[t-1]</code>.
            </p>
            <p>
              <strong className="text-slate-200">Inflow:</strong>{" "}
              <code>max(delta, 0)</code>.{" "}
              <strong className="text-slate-200">Outflow:</strong>{" "}
              <code>max(-delta, 0)</code>.
            </p>
            <p>
              <strong className="text-slate-200">Proxy source:</strong> LCD/RPC
              cached proxy samples daily block heights via Tendermint RPC and
              queries LCD community pool balances.
            </p>
          </div>
        </details>
      </Card>

      <Card>
        <div>
          <h2 className="text-lg font-semibold text-white">Exports</h2>
          <p className="mt-1 text-sm text-slate-400">
            Download raw balances and derived daily flows.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {["Download raw balances (CSV)", "Download derived daily flows (CSV)"].map(
            (label) => (
              <button
                key={label}
                type="button"
                className="rounded-full border border-slate-800 px-4 py-2 text-xs uppercase tracking-wider text-slate-300"
              >
                {label}
              </button>
            ),
          )}
        </div>
      </Card>

      <Card>
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-white">
            Debug
          </summary>
          <pre className="mt-4 whitespace-pre-wrap text-xs text-slate-400">
            (collapsed)
          </pre>
        </details>
      </Card>
    </div>
  );
}
