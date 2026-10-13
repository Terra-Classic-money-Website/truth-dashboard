import { useMemo, useState } from "react";
import Card from "../components/Card";
import KpiCard from "../components/KpiCard";
import PageHeader from "../components/PageHeader";
import SnapshotErrorPanel from "../components/SnapshotErrorPanel";
import { getSnapshot } from "../data/loadSnapshot";
import { AGORA_WINDOWS, deriveAgoraActivity, type AgoraWindow } from "../data/selectors/agoraActivity";
import "./agora-activity.css";
import useViewportWidth from "../hooks/useViewportWidth";
import AgoraActivityInsights from "../components/AgoraActivityInsights";

type View = ReturnType<typeof deriveAgoraActivity>;
type ValidatorRow = View["rows"][number];
const forum = "https://agora.terra-classic.io";
const labels: Record<string, string> = {
  writing: "Writing in this window", quiet: "Linked · quiet in this window",
  "no-writing": "Linked · no lifetime writing", candidate: "Name match only", unmatched: "No identifiable account",
};
const percent = (n: number, d = 100) => d ? `${(n / d * 100).toFixed(1)}%` : "—";
const number = (n: number | null) => n === null ? "—" : n.toLocaleString("en-US");
const date = (iso: string | null) => iso ? new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Warsaw",
}).format(new Date(iso)) : "—";
const monthName = (month: string) => new Intl.DateTimeFormat("en-GB", {
  month: "short", year: "2-digit", timeZone: "UTC",
}).format(new Date(`${month}-01T00:00:00Z`));

function download(filename: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportValidators(rows: ValidatorRow[], window: AgoraWindow, candidates: boolean) {
  const columns = ["Validator", "Address", "Current voting power (%)", "Account links", "Match evidence", "Activity status", "Topics in window", "Replies in window", "Replies to other accounts' topics", "Last observed message", "Window", "Includes unverified candidates"];
  const csvCell = (value: unknown) => {
    let text = String(value ?? "");
    if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  const lines = [columns, ...rows.map(r => [r.moniker, r.address, r.votingPower.toFixed(8),
    r.matches.map(m => m.username).join("; "), r.matches.map(m => `${m.username}: ${m.confidence}, ${m.source}; ${m.basis}`).join(" | "),
    labels[r.status], r.topics, r.replies, r.externalReplies, r.lastPost, window, candidates,
  ])];
  download(`agora-validators-${window}.csv`, "\uFEFF" + lines.map(row => row.map(csvCell).join(",")).join("\r\n"), "text/csv;charset=utf-8");
}

function Participation({ view }: { view: View }) {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-white">Participation and current voting power</h2>
      <p className="mt-1 text-sm text-slate-400">The same validator groups, weighted two ways. Voting power is the stake held at the chain snapshot.</p>
      <div className="agora-distribution-head text-xs text-slate-400">
        <span>Account and activity status</span><span>Validators</span><span>Voting power</span>
      </div>
      {view.groups.filter(g => g.count > 0).map(g => (
        <div className="agora-distribution-row" key={g.status}>
          <span className="text-sm text-slate-300">{labels[g.status]}</span>
          <div className="agora-bar-value">
            <div className="agora-bar-track"><span className={`agora-fill ${g.status}`} style={{ width: `${g.count / view.rows.length * 100}%` }} /></div>
            <span>{g.count} <small>({percent(g.count, view.rows.length)})</small></span>
          </div>
          <div className="agora-bar-value">
            <div className="agora-bar-track"><span className={`agora-fill ${g.status}`} style={{ width: `${g.power}%` }} /></div>
            <span>{percent(g.power)}</span>
          </div>
        </div>
      ))}
      <p className="mt-4 text-xs leading-5 text-slate-400">“No identifiable account” and “Name match only” are unresolved identities. Their activity is unknown. A linked account’s silence does not rule out other accounts.</p>
    </Card>
  );
}

function MonthlyActivity({ months }: { months: View["months"] }) {
  const [focused, setFocused] = useState<string | null>(null);
  const mobile = useViewportWidth() < 640;
  const selected = months.find(m => m.month === focused) ?? months[months.length - 1];
  const max = Math.max(...months.map(m => m.posts), 1);
  const width = mobile ? 350 : 900, height = 255, left = 38, bottom = 38, top = 20;
  const plotHeight = height - bottom - top;
  const slot = (width - left - 12) / Math.max(months.length, 1);
  const barWidth = Math.min(slot * 0.58, 70);
  return (
    <Card>
      <h2 className="text-lg font-semibold text-white">Public discussion over time</h2>
      <p className="mt-1 text-sm text-slate-400">Monthly human messages, including topics and replies. Current validator account links are applied to every month.</p>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-300">
        <span className="agora-legend"><i className="agora-swatch writing" />Attributed validator messages</span>
        <span className="agora-legend"><i className="agora-swatch unknown" />Other or unidentified accounts</span>
      </div>
      <div className="section-scroll-x mt-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="agora-timeline" role="group" aria-label="Monthly forum messages. Focus a bar for exact counts.">
          {[0, 0.5, 1].map(ratio => {
            const y = top + plotHeight * (1 - ratio);
            return <g key={ratio}><line x1={left} x2={width - 12} y1={y} y2={y} className="agora-gridline" /><text x={left - 8} y={y + 4} textAnchor="end" className="agora-axis">{Math.round(max * ratio)}</text></g>;
          })}
          {months.map((m, i) => {
            const x = left + slot * i + (slot - barWidth) / 2;
            const h = m.posts / max * plotHeight;
            const vh = m.validatorPosts / max * plotHeight;
            const showLabel = months.length <= (mobile ? 4 : 8) || i % Math.ceil(months.length / (mobile ? 4 : 7)) === 0 || i === months.length - 1;
            return <g key={m.month} tabIndex={0} className="agora-month" role="img"
              aria-label={`${monthName(m.month)}${m.partial ? ', partial month' : ''}: ${m.posts} messages, ${m.validatorPosts} attributed to validators`}
              onMouseEnter={() => setFocused(m.month)} onFocus={() => setFocused(m.month)}>
              <rect x={left + slot * i} y={top} width={slot} height={plotHeight + bottom} fill="transparent" />
              <rect x={x} y={top + plotHeight - h} width={barWidth} height={h} className="agora-other-bar" />
              <rect x={x} y={top + plotHeight - vh} width={barWidth} height={vh} className="agora-validator-bar" />
              {showLabel && <text x={x + barWidth / 2} y={height - 12} textAnchor="middle" className="agora-axis">{monthName(m.month)}{m.partial ? "*" : ""}</text>}
            </g>;
          })}
        </svg>
      </div>
      <p className="min-h-5 text-sm text-slate-300" aria-live="polite">{selected && <>{monthName(selected.month)}{selected.partial ? " · partial month" : ""}: <strong>{selected.posts}</strong> messages · <strong>{selected.validatorPosts}</strong> attributed to validators · {selected.validatorWriters} linked accounts writing</>}</p>
      <p className="mt-2 text-xs text-slate-400">* Partial months. UTC calendar buckets; counts outside the selected window are excluded.</p>
    </Card>
  );
}

function AccountEvidence({ row }: { row: ValidatorRow }) {
  return (
    <details className="agora-account-evidence">
      <summary>Account evidence</summary>
      <div className="agora-evidence-content">
        {row.matches.map(m => {
          const a = row.matchedAccounts.find(a => a.id === m.userId);
          return <div key={m.userId} className="agora-account-proof">
            <a href={`${forum}/u/${encodeURIComponent(m.username)}`} target="_blank" rel="noreferrer">@{m.username}</a>
            <span className="agora-evidence-label">{m.confidence === "candidate" ? "Unverified candidate" : m.source === "owner" ? "Owner-supplied association" : "Public affiliation evidence"}</span>
            <p>{m.basis}</p>
            <div className="flex flex-wrap gap-3">{m.evidenceUrls.map((url, i) => <a key={url} href={url} target="_blank" rel="noreferrer">Source {i + 1} ↗</a>)}</div>
            {a && <p className="mt-2">Directory lifetime totals: {a.topicsCreated} topics · {a.repliesPosted} replies · {number(a.daysVisited)} days visited · {number(a.postsRead)} posts read. Directory data can lag the topic capture.</p>}
          </div>;
        })}
        <p>Validator address: <a href={`https://finder.terra.money/classic/validator/${row.address}`} target="_blank" rel="noreferrer">{row.address}</a></p>
      </div>
    </details>
  );
}

export default function AgoraActivity() {
  const { data: snapshot, error } = getSnapshot("agora-activity");
  const [windowId, setWindowId] = useState<AgoraWindow>("90d");
  const [includeCandidates, setIncludeCandidates] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("power");
  const [topicFilter, setTopicFilter] = useState("no-validator");
  const [category, setCategory] = useState("all");
  const view = useMemo(() => snapshot ? deriveAgoraActivity(snapshot, windowId, includeCandidates) : null, [snapshot, windowId, includeCandidates]);
  const tableRows = useMemo(() => {
    if (!view) return [];
    const term = query.toLowerCase().trim();
    return view.rows.filter(r => (status === "all" || r.status === status) &&
      `${r.moniker} ${r.address} ${r.matches.map(m => m.username).join(" ")}`.toLowerCase().includes(term))
      .sort((a, b) => sort === "posts" ? (b.posts ?? -1) - (a.posts ?? -1) || a.rank - b.rank
        : sort === "name" ? a.moniker.localeCompare(b.moniker) : a.rank - b.rank);
  }, [view, query, status, sort]);
  if (!snapshot || !view) return <SnapshotErrorPanel error={error} />;
  const noMatch = view.groups.find(g => g.status === "unmatched")!;
  const topicRows = view.topicRows.filter(t => (category === "all" || t.category === category) &&
    (topicFilter === "all" || (topicFilter === "no-validator" ? t.validatorReplies === 0 : t.externalReplies === 0)));
  const totalTopics = view.topicRows.length;
  const supportedCount = snapshot.data.validators.filter(v => v.matches.some(m => m.confidence === "supported")).length;
  const categories = [...new Set(view.topicRows.map(t => t.category))].sort();
  return (
    <div className="agora-page space-y-8">
      <PageHeader eyebrow="Terra Classic Governance" title="Validator activity on Agora"
        subtitle="Who participates in the public discussion behind Terra Classic governance—and how much voting power they represent."
        status={`Captured ${date(snapshot.generatedAt)} · chain height ${number(Number(snapshot.data.chain.height))} · ${snapshot.data.validators.length} bonded validators`} />

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <fieldset><legend className="mb-2 text-xs text-slate-400">Discussion window</legend>
            <div className="flex flex-wrap gap-2">{AGORA_WINDOWS.map(w => <button className="agora-button" type="button" key={w.id} aria-pressed={windowId === w.id} onClick={() => setWindowId(w.id)}>{w.label}</button>)}</div>
          </fieldset>
          <a className="agora-source-link" href={forum} target="_blank" rel="noreferrer">Open Agora ↗</a>
        </div>
        <p className="mt-3 text-xs text-slate-400">{date(view.start)} – {date(view.end)} · {supportedCount} validators have supported account links · {snapshot.data.directoryAccounts} public directory accounts reviewed</p>
        <label className="agora-candidate-toggle mt-4"><input type="checkbox" checked={includeCandidates} onChange={e => setIncludeCandidates(e.target.checked)} />Include unverified name matches in the activity estimates</label>
        {includeCandidates && <p className="mt-2 text-sm text-amber-200" role="status">Candidate mode: these totals include unverified account associations. They are estimates, not established validator participation.</p>}
      </Card>

      <AgoraActivityInsights view={view} includeCandidates={includeCandidates} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={includeCandidates ? "Estimated validator writers" : "Observed validator writers"} value={`${view.activeRows.length} / ${view.rows.length}`} accent="emerald" helper={`${percent(view.activeRows.length, view.rows.length)} of bonded validators · ${percent(view.activePower)} of current voting power`} />
        <KpiCard label="No identifiable account" value={`${noMatch.count} / ${view.rows.length}`} accent="sky" helper={`${percent(noMatch.power)} of current voting power · participation unknown`} />
        <KpiCard label="Topics without a validator response" value={percent(totalTopics - view.topicsWithValidatorResponse, totalTopics)} accent="amber" helper={`${totalTopics - view.topicsWithValidatorResponse} of ${totalTopics} topics · replies by linked accounts other than the topic author`} />
        <KpiCard label="Topics with no response from other accounts" value={percent(view.noExternalResponse, totalTopics)} accent="rose" helper={`${view.noExternalResponse} of ${totalTopics} topics · author follow-ups excluded`} />
      </div>
      <p className="agora-measurement-note text-sm leading-6 text-slate-300">{includeCandidates ? "Candidate estimates can overstate or understate participation. " : "Observed participation is a lower bound under the supported mappings. "}Unidentified aliases can hide activity; no account match does not prove no account exists. This measures public discussion, not voting, uptime or discussion quality.</p>

      <Participation view={view} />

      <div className="agora-discussion-grid">
        <MonthlyActivity key={windowId} months={view.months} />
        <Card>
          <h2 className="text-lg font-semibold text-white">Where the discussion comes from</h2>
          <p className="mt-1 text-sm text-slate-400">Unique linked accounts. Shared accounts and their messages count once.</p>
          <div className="agora-concentration mt-5">
            <span className="text-slate-400">Share of messages attributed to validators</span><strong>{percent(view.validatorPosts, view.forumPosts)}</strong>
            <span className="text-slate-400">Linked accounts writing</span><strong>{view.uniqueValidatorWriters}</strong>
            <span className="text-slate-400">Top 3 accounts’ share of attributed messages</span><strong>{view.topThreeShare === null ? "—" : percent(view.topThreeShare)}</strong>
          </div>
          <ol className="agora-writers mt-5">{view.writers.slice(0, 5).map(a => <li key={a.id}>
            <a href={`${forum}/u/${encodeURIComponent(a.username)}`} target="_blank" rel="noreferrer">@{a.username}</a><strong>{a.posts}</strong>
          </li>)}</ol>
          {!view.writers.length && <p className="mt-4 text-sm text-slate-400">No messages attributed to linked validator accounts in this window.</p>}
          <p className="mt-4 text-xs leading-5 text-slate-400">{view.validatorPosts} attributed messages out of {view.forumPosts} public human messages. “Other” includes unidentified validators and former validators; it is not a non-validator classification.</p>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-white">Every bonded validator</h2>
        <p className="mt-1 text-sm text-slate-400">Search, compare and inspect each account link. Writing counts use the discussion window; directory reading totals in the evidence details cover the forum lifetime.</p>
        <div className="agora-table-controls mt-5">
          <label>Search validators or accounts<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Validator, username or address" /></label>
          <label>Activity status<select aria-label="Activity status" value={status} onChange={e => setStatus(e.target.value)}><option value="all">All validators</option>{view.groups.map(g => <option key={g.status} value={g.status}>{labels[g.status]}</option>)}</select></label>
          <label>Sort by<select aria-label="Sort by" value={sort} onChange={e => setSort(e.target.value)}><option value="power">Voting power · highest first</option><option value="posts">Messages · most first</option><option value="name">Validator name</option></select></label>
          <button type="button" className="agora-button" onClick={() => exportValidators(tableRows, windowId, includeCandidates)}>Download CSV</button>
        </div>
        <p className="mt-3 text-xs text-slate-400" aria-live="polite">{tableRows.length} of {view.rows.length} validators · search and status filters apply to this table and its CSV only</p>
        <div className="agora-table-scroll section-scroll-x mt-3" tabIndex={0} role="region" aria-label="Bonded validator activity table">
          <table className="agora-table"><thead><tr>
            <th scope="col">Validator / account evidence</th><th scope="col">Voting power</th><th scope="col">Agora accounts</th><th scope="col">Topics</th><th scope="col">Replies</th><th scope="col">To others’ topics</th><th scope="col">Last observed writing</th><th scope="col">Activity</th>
          </tr></thead><tbody>{tableRows.map(r => <tr key={r.address}>
            <th scope="row"><span className="agora-rank text-slate-400">#{r.rank}</span><a href={`https://finder.terra.money/classic/validator/${r.address}`} target="_blank" rel="noreferrer" className="agora-validator-name">{r.moniker}</a>{r.matches.length > 0 && <AccountEvidence row={r} />}</th>
            <td>{percent(r.votingPower)}</td>
            <td>{r.matches.length ? r.matches.map(m => <div key={m.userId} className="agora-account-name"><a href={`${forum}/u/${encodeURIComponent(m.username)}`} target="_blank" rel="noreferrer">@{m.username}</a><small>{m.confidence === "candidate" ? "Name match only" : m.source === "owner" ? "Owner supplied" : "Public evidence"}</small></div>) : <span className="text-slate-400">Not identified</span>}</td>
            <td>{number(r.topics)}</td><td>{number(r.replies)}</td><td>{number(r.externalReplies)}</td>
            <td>{r.lastPost ? <>{date(r.lastPost)}<small className="block text-slate-400">{r.daysSinceLastPost} days before capture</small></> : r.accepted.length ? "None observed" : "Unknown"}</td>
            <td><span className={`agora-status ${r.status}`}>{labels[r.status]}</span>{r.confidence === "candidate" && includeCandidates && <small className="block mt-1 text-slate-400">Unverified identity</small>}</td>
          </tr>)}</tbody></table>
        </div>
        {tableRows.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No validators match these table filters.</p>}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-white">Topics and the response gap</h2>
        <p className="mt-1 text-sm text-slate-400">Topics created in the selected window; replies are counted up to capture. System notices and author follow-ups do not qualify as a response from another account.</p>
        <div className="agora-topic-summary mt-4">
          <span><strong>{view.noReplies} / {totalTopics}</strong> have no human reply</span>
          <span><strong>{view.matureNoResponse} / {view.matureTopics}</strong> have no response from others after ≥7 days</span>
          <span><strong>{view.proposalTopicsWithValidatorResponse} / {view.proposalTopics}</strong> proposal-category topics have a validator response</span>
        </div>
        <div className="mt-5 flex flex-wrap items-end gap-3">
          <fieldset><legend className="mb-2 text-xs text-slate-400">Topic filter</legend><div className="flex flex-wrap gap-2">{[["all", "All topics"], ["no-validator", "No validator response"], ["no-response", "No response from others"]].map(([id, label]) => <button className="agora-button" type="button" key={id} aria-pressed={topicFilter === id} onClick={() => setTopicFilter(id)}>{label}</button>)}</div></fieldset>
          <label className="agora-category-label">Category<select aria-label="Category" value={category} onChange={e => setCategory(e.target.value)}><option value="all">All categories</option>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
        </div>
        <p className="mt-3 text-xs text-slate-400" aria-live="polite">{topicRows.length} of {totalTopics} topics · newest first · these filters apply to the topic table only</p>
        <div className="agora-table-scroll section-scroll-x mt-3" tabIndex={0} role="region" aria-label="Topic response table">
          <table className="agora-table agora-topic-table"><thead><tr><th scope="col">Topic</th><th scope="col">Created</th><th scope="col">Human replies</th><th scope="col">From others</th><th scope="col">Validator replies</th><th scope="col">Views</th></tr></thead>
            <tbody>{topicRows.map(t => <tr key={t.id}><th scope="row"><a href={`${forum}/t/${t.slug}/${t.id}`} target="_blank" rel="noreferrer">{t.title}</a><small className="block text-slate-400">{t.category}{t.ageDays < 7 ? " · less than 7 days old" : ""}</small></th><td>{date(t.createdAt)}</td><td>{t.replies}</td><td>{t.externalReplies}</td><td>{t.validatorReplies}</td><td>{number(t.views)}</td></tr>)}</tbody>
          </table>
        </div>
        {topicRows.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No topics match these filters in this window.</p>}
      </Card>

      <Card>
        <details className="agora-method"><summary>Sources, identity confidence and methodology</summary>
          <div className="mt-5 space-y-4 text-sm leading-6 text-slate-300">
            <p>The main denominator is {view.rows.length} bonded, non-jailed validators at height {snapshot.data.chain.height}. The registry also contains {snapshot.data.chain.excludedNonBonded} non-bonded or jailed entries; they are excluded from participation percentages.</p>
            <p>Coverage: {date(snapshot.coverage.start)}–{date(snapshot.generatedAt)} on this Agora instance. {snapshot.data.topics.length} community topics and {snapshot.data.posts.length} human messages are retained; {snapshot.data.excludedTopics.length} system/site-feedback topics are excluded. This is an offline snapshot, not a live feed, and does not include the older classic-agora.terra.money forum or Commonwealth.</p>
            <p>Supported associations come from public affiliation evidence or the owner’s supplied mappings. Name-only candidates are excluded by default. Account control is not cryptographically verified. Each link’s basis and sources are available in the validator table.</p>
            <p>Former-validator contributors are not automatically counted as current validators. For example, <a href={`${forum}/u/StrathCole`} target="_blank" rel="noreferrer">StrathCole’s public profile</a> links to Galactic Shift; the corresponding <a href="https://terra-classic-lcd.publicnode.com/cosmos/staking/v1beta1/validators/terravaloper13avdm9rqxpftv3vrkaqaakakgh30909x8c07v3" target="_blank" rel="noreferrer">on-chain registry entry</a> is unbonded and describes a March 2026 shutdown.</p>
            <ul className="list-disc space-y-2 pl-5">{snapshot.notes.map(note => <li key={note}>{note}</li>)}</ul>
            <p>Discourse’s <a href="https://github.com/discourse/discourse/blob/main/lib/post_creator.rb" target="_blank" rel="noreferrer">reply_count</a> tracks explicit reply-to-post relationships. The <a href="https://github.com/discourse/discourse/blob/main/app/models/directory_item.rb" target="_blank" rel="noreferrer">directory post_count</a> means replies, excluding topic openers. Counts here are recalculated from complete visible post streams.</p>
            <ul className="space-y-2">{snapshot.sources.map(source => <li key={source.id}>{source.url ? <a href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a> : <strong>{source.label}</strong>}<p className="text-xs text-slate-400">{source.notes}</p></li>)}</ul>
            <p className="text-xs text-slate-400">Directory statistics updated {date(snapshot.data.directoryUpdatedAt)}. All {snapshot.data.profilesReviewed} public directory profile responses reviewed. Forum and chain captures preserve their source URLs and individual fetch timestamps in the repository’s research evidence.</p>
            <button type="button" className="agora-button" onClick={() => download("agora-activity.snapshot.json", JSON.stringify(snapshot, null, 2), "application/json")}>Download full measurement snapshot</button>
          </div>
        </details>
      </Card>
    </div>
  );
}
