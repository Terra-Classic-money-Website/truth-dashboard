import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "research/agora/public-evidence.json");
const forum = "https://agora.terra-classic.io";
const lcd = "https://terra-classic-lcd.publicnode.com";
const requests = [];
const cache = path.join(root, "research/agora/.cache");
if (!process.argv.includes("--resume")) {
  try {
    await fs.rename(cache, `${cache}-${new Date().toISOString().replaceAll(":", "-")}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
await fs.mkdir(cache, { recursive: true });

async function read(url, headers = {}) {
  const filename = path.join(cache, createHash("sha256").update(url + JSON.stringify(headers)).digest("hex") + ".json");
  try {
    const cached = JSON.parse(await fs.readFile(filename, "utf8"));
    requests.push({ url, fetchedAt: cached.fetchedAt });
    return cached.body;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 1250));
    const response = await fetch(url, {
      headers: { "user-agent": "TruthDashboard/1.0 (public forum research)", ...headers },
      signal: AbortSignal.timeout(30_000),
    });
    if (response.status === 404 && url.includes("/u/")) {
      requests.push({ url, fetchedAt: new Date().toISOString(), status: 404 });
      return null;
    }
    if (response.status === 429) {
      const text = await response.text();
      const data = text.startsWith("{") ? JSON.parse(text) : {};
      const seconds = Number(response.headers.get("retry-after") ?? data.extras?.wait_seconds ?? 60);
      console.log(`Forum rate limit: pausing ${seconds}s.`);
      await new Promise(resolve => setTimeout(resolve, (seconds + 1) * 1000));
      continue;
    }
    if (!response.ok) throw new Error(`${response.status}: ${url}`);
    const text = await response.text();
    if (text.startsWith("Slow down")) {
      console.log("Forum throttle response: pausing 60s.");
      await new Promise(resolve => setTimeout(resolve, 60_000));
      continue;
    }
    const body = JSON.parse(text);
    const fetchedAt = new Date().toISOString();
    await fs.writeFile(filename, JSON.stringify({ fetchedAt, body }));
    requests.push({ url, fetchedAt });
    return body;
  }
  throw new Error(`Forum rate limit did not clear: ${url}`);
}


const startedAt = new Date().toISOString();
const block = await read(`${lcd}/cosmos/base/tendermint/v1beta1/blocks/latest`);
const height = block.block.header.height;
if (block.block.header.chain_id !== "columbus-5") throw new Error("Wrong chain");
const chainHeaders = { "x-cosmos-block-height": height };
const validators = [];
let nextKey = null;
do {
  const url = new URL(`${lcd}/cosmos/staking/v1beta1/validators`);
  url.searchParams.set("pagination.limit", "500");
  if (nextKey) url.searchParams.set("pagination.key", nextKey);
  const page = await read(url.href, chainHeaders);
  validators.push(...page.validators);
  nextKey = page.pagination.next_key;
} while (nextKey);
const pool = await read(`${lcd}/cosmos/staking/v1beta1/pool`, chainHeaders);
const site = await read(`${forum}/site.json`);
const directory = [];
let directoryMeta;
for (let page = 0; ; page++) {
  const result = await read(`${forum}/directory_items.json?period=all&order=likes_received&page=${page}`);
  directoryMeta = result.meta;
  if (!result.directory_items.length) break;
  directory.push(...result.directory_items);
}
console.log(`Chain height ${height}: ${validators.length} registered validators, ${validators.filter(v => v.status === "BOND_STATUS_BONDED").length} bonded. Directory: ${directory.length} entries.`);
const topicsById = new Map();
for (let page = 0; ; page++) {
  const result = await read(`${forum}/latest.json?page=${page}`);
  if (!result.topic_list.topics.length) break;
  for (const topic of result.topic_list.topics) topicsById.set(topic.id, topic);
  if (!result.topic_list.more_topics_url) break;
}
const topics = [];
for (const listing of topicsById.values()) {
  const detail = await read(`${forum}/t/${listing.id}.json`);
  const posts = [...detail.post_stream.posts];
  const seen = new Set(posts.map(p => p.id));
  const missing = detail.post_stream.stream.filter(id => !seen.has(id));
  for (let i = 0; i < missing.length; i += 20) {
    const url = new URL(`${forum}/t/${listing.id}/posts.json`);
    for (const id of missing.slice(i, i + 20)) url.searchParams.append("post_ids[]", id);
    const more = await read(url.href);
    posts.push(...more.post_stream.posts);
  }
  if (posts.length !== detail.post_stream.stream.length) throw new Error(`Incomplete posts: topic ${listing.id}`);
  topics.push({
    id: detail.id, title: detail.title, slug: detail.slug,
    categoryId: detail.category_id, createdAt: detail.created_at,
    views: detail.views, postsCount: detail.posts_count,
    replyCount: detail.reply_count, archetype: detail.archetype,
    posts: posts.map(p => ({
      id: p.id, userId: p.user_id, username: p.username,
      postNumber: p.post_number, postType: p.post_type,
      createdAt: p.created_at, cooked: p.cooked,
    })),
  });
  if (topics.length % 25 === 0) console.log(`Read ${topics.length}/${topicsById.size} complete topic streams.`);
}
const profiles = [];
await fs.mkdir(path.dirname(output), { recursive: true });
const save = async (complete) => {
  const destination = complete ? output : path.join(cache, "partial-evidence.json");
  const temp = destination + ".tmp";
  await fs.writeFile(temp, JSON.stringify({
    complete, startedAt, fetchedAt: new Date().toISOString(),
    chain: { chainId: "columbus-5", height, blockTime: block.block.header.time, pool: pool.pool },
    validators, directory, directoryMeta, profiles,
    categories: site.categories.map(c => ({ id: c.id, name: c.name })),
    topics, requests,
  }, null, 2) + "\n");
  await fs.rename(temp, destination);
};
await save(false);
for (const entry of directory) {
  const result = await read(`${forum}/u/${encodeURIComponent(entry.user.username)}.json`);
  if (result) {
    const u = result.user;
    profiles.push({ id: u.id, username: u.username, name: u.name, website: u.website,
      bio: u.bio_cooked, createdAt: u.created_at, lastPostedAt: u.last_posted_at,
      profileHidden: u.profile_hidden ?? false });
  }
  if (profiles.length % 40 === 0) {
    console.log(`Read ${profiles.length}/${directory.length} public profiles.`);
    await save(false);
  }
}
await save(true);
console.log(`Saved ${topics.length} topics and ${topics.reduce((n, t) => n + t.posts.length, 0)} visible posts to ${output}`);
