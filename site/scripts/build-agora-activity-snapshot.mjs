import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { agoraActivitySnapshotSchema } from "../src/data/contracts/agora-activity.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const evidence = JSON.parse(await fs.readFile(path.join(root, "research/agora/public-evidence.json"), "utf8"));
const reviewed = JSON.parse(await fs.readFile(path.join(root, "research/agora/account-matches.json"), "utf8"));
if (!evidence.complete) throw new Error("Source collection is incomplete. Finish collect-agora-evidence.mjs first.");
const forum = "https://agora.terra-classic.io";
const lcd = "https://terra-classic-lcd.publicnode.com";
const norm = s => (s ?? "").normalize("NFKD").replace(/[^a-z0-9]/gi, "").toLowerCase();
function domain(value) {
  if (!value) return null;
  try {
    const host = new URL(value.startsWith("http") ? value : `https://${value}`).hostname.toLowerCase().replace(/^www\./, "");
    return ["x.com", "twitter.com", "t.me", "linktr.ee", "youtube.com", "mobile.twitter.com", "s.cryptonian.life"].includes(host) ? null : host;
  } catch { return null; }
}

const directory = evidence.directory;
if (new Set(directory.map(a => a.user.id)).size !== directory.length) throw new Error("Duplicate directory accounts");
if (directory.length !== evidence.directoryMeta.total_rows_directory_items) throw new Error("Directory pagination is incomplete");
const active = evidence.validators.filter(v => v.status === "BOND_STATUS_BONDED" && !v.jailed)
  .sort((a, b) => BigInt(a.tokens) > BigInt(b.tokens) ? -1 : BigInt(a.tokens) < BigInt(b.tokens) ? 1 : a.operator_address.localeCompare(b.operator_address));
const total = active.reduce((n, v) => n + BigInt(v.tokens), 0n);
if (total !== BigInt(evidence.chain.pool.bonded_tokens)) throw new Error("Active stake does not reconcile to the staking pool");
const profileById = new Map(evidence.profiles.map(p => [p.id, p]));
const accountByUsername = new Map(directory.map(a => [a.user.username.toLowerCase(), a]));
for (const match of reviewed) {
  if (!evidence.validators.some(v => v.operator_address === match.address)) throw new Error(`Unknown reviewed validator: ${match.address}`);
  if (!accountByUsername.has(match.username.toLowerCase())) throw new Error(`Unknown reviewed account: ${match.username}`);
}
const validators = active.map((v, i) => {
  const matches = new Map();
  const moniker = v.description.moniker;
  const brand = moniker.split("|")[0].trim();
  const brandKeys = new Set([norm(brand), norm(brand.split(" - ")[0]), norm(brand.replace(/\b(node|validator)\b/gi, ""))]);
  const host = domain(v.description.website);
  if (host) brandKeys.add(norm(host.split(".")[0]));
  for (const entry of directory) {
    const profile = profileById.get(entry.user.id);
    const sameDomain = host && host === domain(profile?.website);
    const nameMatch = [norm(entry.user.username), norm(entry.user.name)].some(k => k.length >= 5 && brandKeys.has(k));
    if (!sameDomain && !nameMatch) continue;
    matches.set(entry.user.id, {
      userId: entry.user.id, username: entry.user.username,
      confidence: sameDomain ? "supported" : "candidate", source: sameDomain ? "public" : "name",
      basis: sameDomain ? `The public profile website and the on-chain validator website share ${host}. This supports affiliation; it is not a signed ownership proof.`
        : "The account username or display name matches the on-chain brand. Name similarity alone does not establish ownership.",
      evidenceUrls: [`${forum}/u/${encodeURIComponent(entry.user.username)}`, `${lcd}/cosmos/staking/v1beta1/validators/${v.operator_address}`],
    });
  }
  for (const match of reviewed.filter(m => m.address === v.operator_address)) {
    const account = accountByUsername.get(match.username.toLowerCase());
    const { address: _address, ...details } = match;
    matches.set(account.user.id, { ...details, userId: account.user.id, username: account.user.username });
  }
  return { rank: i + 1, address: v.operator_address, moniker, website: v.description.website,
    tokens: v.tokens, votingPower: Number(BigInt(v.tokens) * 10000000000n / total) / 100000000,
    matches: [...matches.values()].sort((a, b) => a.username.localeCompare(b.username)) };
});
const excludedTopics = [];
const topics = [];
const posts = [];
for (const topic of evidence.topics) {
  const first = topic.posts.find(p => p.postNumber === 1);
  const category = evidence.categories.find(c => c.id === topic.categoryId)?.name;
  if (topic.archetype !== "regular" || !first || first.userId <= 0 || !["General", "Proposals", "Announcements"].includes(category)) {
    excludedTopics.push({ id: topic.id, reason: first?.userId <= 0 ? "System welcome or category topic" : "Outside public governance/community categories" });
    continue;
  }
  topics.push({ id: topic.id, title: topic.title, slug: topic.slug, category,
    createdAt: topic.createdAt, views: topic.views, authorUserId: first.userId,
    apiReplyCount: topic.replyCount, apiPostsCount: topic.postsCount });
  posts.push(...topic.posts.filter(p => p.userId > 0 && [1, 2].includes(p.postType)).map(p => ({
    id: p.id, topicId: topic.id, userId: p.userId, postNumber: p.postNumber, createdAt: p.createdAt,
  })));
}
if (new Set(posts.map(p => p.id)).size !== posts.length) throw new Error("Duplicate posts");
const accounts = directory.map(a => {
  const p = profileById.get(a.user.id);
  return { id: a.user.id, username: a.user.username, topicsCreated: a.topic_count, repliesPosted: a.post_count,
    topicsViewed: a.topics_entered ?? null, postsRead: a.posts_read ?? null,
    daysVisited: a.days_visited ?? null, likesReceived: a.likes_received,
    createdAt: p?.createdAt ?? null, lastPostedAt: p?.lastPostedAt ?? null };
});
const earliest = topics.map(t => t.createdAt).sort()[0].slice(0, 10);
const snapshot = agoraActivitySnapshotSchema.parse({
  schemaVersion: "1.0.0", dashboardId: "agora-activity",
  title: "Validator activity on Agora",
  subtitle: "Public discussion participation by the current bonded validator set.",
  generatedAt: evidence.fetchedAt,
  coverage: { start: earliest, end: evidence.fetchedAt.slice(0, 10), cadence: "Public snapshot; no scheduled refresh" },
  timeWindows: [{ id: "30d", label: "30 days", days: 30 }, { id: "90d", label: "90 days", days: 90 }, { id: "365d", label: "1 year", days: 365 }, { id: "all", label: "Forum lifetime" }],
  sources: [
    { id: "chain", label: "Terra Classic LCD · columbus-5", type: "on-chain", url: `${lcd}/cosmos/staking/v1beta1/validators?pagination.limit=500`, notes: `Validator registry and staking pool read at height ${evidence.chain.height}.` },
    { id: "forum", label: "Agora public topics and complete visible post streams", type: "public-api", url: `${forum}/latest.json`, notes: "All latest-list pages, all topic streams and all remaining post IDs were collected. Private, deleted, unlisted and login-only content is outside coverage." },
    { id: "directory", label: "Agora all-time public directory and profiles", type: "public-api", url: `${forum}/u?order=likes_received&period=all`, notes: `All ${directory.length} directory entries and ${evidence.profiles.length} public profile responses were reviewed. Directory statistics updated ${evidence.directoryMeta.last_updated_at}.` },
    { id: "owner", label: "Account mappings supplied by Dawid", type: "owner-supplied", notes: "Identity associations supplied by the dashboard owner on 13 October 2026. Kept separate from public-source matches and name-only candidates." },
  ],
  notes: [
    "Supported links mean public affiliation evidence or an owner-supplied association. They are not cryptographic proof of account control.",
    "No identifiable account means unknown identity, not proof that a validator has no account or never reads Agora.",
    "The population is the current bonded, non-jailed validator set. Historical messages are attributed to today's set, not a reconstructed historical validator population.",
    "Voting power is current bonded stake share. It does not establish how a validator voted, delegation overrides, operational performance or forum reading quality.",
    "Human messages are post types 1 and 2 from positive user IDs; system notices are excluded. Replies are human messages after the topic opener; responses from others additionally exclude the topic author.",
    "Topic health covers General, Proposals and Announcements; Site Feedback and system welcome/category topics are excluded. Topic responses are measured up to the capture, including responses outside the topic-creation window.",
    "The directory's post_count means replies, excluding topics. Directory reading and visit statistics are lifetime totals, not the selected time window. They can lag post-stream captures.",
    "Account and topic captures are sequential, not atomic. The snapshot preserves request URLs and per-request fetch times in the retained source evidence.",
    "Shared accounts can represent multiple validators. Validator counts and their current stake count each validator once; forum message totals count each post once.",
  ],
  data: { chain: { chainId: "columbus-5", height: evidence.chain.height, blockTime: evidence.chain.blockTime,
    registeredValidators: evidence.validators.length, excludedNonBonded: evidence.validators.length - active.length, bondedTokens: total.toString() },
    directoryUpdatedAt: evidence.directoryMeta.last_updated_at, directoryAccounts: directory.length,
    profilesReviewed: evidence.profiles.length, excludedTopics, validators, accounts, topics, posts },
});
const output = path.join(root, "src/data/snapshots/agora-activity.snapshot.json");
await fs.writeFile(output, JSON.stringify(snapshot, null, 2) + "\n");
console.log(`Built Agora snapshot: ${validators.length} validators, ${topics.length} community topics, ${posts.length} human posts.`);
console.log(`Supported account links: ${validators.filter(v => v.matches.some(m => m.confidence === "supported")).length}; candidates only: ${validators.filter(v => v.matches.length && !v.matches.some(m => m.confidence === "supported")).length}.`);
