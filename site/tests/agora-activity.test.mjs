import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { agoraActivitySnapshotSchema } from "../src/data/contracts/agora-activity.ts";
import { deriveAgoraActivity } from "../src/data/selectors/agoraActivity.ts";

const snapshot = agoraActivitySnapshotSchema.parse(JSON.parse(fs.readFileSync(new URL("../src/data/snapshots/agora-activity.snapshot.json", import.meta.url))));
const evidence = JSON.parse(fs.readFileSync(new URL("../research/agora/public-evidence.json", import.meta.url)));

test("the retained capture covers every directory account, complete topic stream and bonded stake", () => {
  assert.equal(evidence.complete, true);
  assert.equal(evidence.directory.length, evidence.directoryMeta.total_rows_directory_items);
  assert.equal(evidence.profiles.length, evidence.directory.length);
  assert.equal(snapshot.data.validators.length, evidence.validators.filter(v => v.status === "BOND_STATUS_BONDED" && !v.jailed).length);
  assert.equal(snapshot.data.chain.registeredValidators, evidence.validators.length);
  const tokens = snapshot.data.validators.reduce((n, v) => n + BigInt(v.tokens), 0n);
  assert.equal(tokens, BigInt(evidence.chain.pool.bonded_tokens));
  assert.ok(Math.abs(snapshot.data.validators.reduce((n, v) => n + v.votingPower, 0) - 100) < 0.000001);
  assert.equal(new Set(snapshot.data.posts.map(p => p.id)).size, snapshot.data.posts.length);
  const independent = evidence.topics.filter(t => ["General", "Proposals", "Announcements"].includes(evidence.categories.find(c => c.id === t.categoryId)?.name) && t.posts.find(p => p.postNumber === 1)?.userId > 0);
  assert.deepEqual(new Set(independent.map(t => t.id)), new Set(snapshot.data.topics.map(t => t.id)));
  assert.equal(independent.flatMap(t => t.posts.filter(p => p.userId > 0 && [1, 2].includes(p.postType))).length, snapshot.data.posts.length);
});

test("supported mapping defaults retain unresolved identities and do not fabricate zero activity", () => {
  const view = deriveAgoraActivity(snapshot, "all");
  for (const row of view.rows.filter(r => r.confidence !== "supported")) {
    assert.equal(row.posts, null);
    assert.equal(row.replies, null);
    assert.equal(row.lastPost, null);
  }
  const possible = deriveAgoraActivity(snapshot, "all", true);
  assert.ok(possible.validatorPosts >= view.validatorPosts);
  assert.equal(view.groups.reduce((n, g) => n + g.count, 0), view.rows.length);
  assert.ok(Math.abs(view.groups.reduce((n, g) => n + g.power, 0) - 100) < 0.000001);
});

test("window totals reconcile independently at the unique post grain", () => {
  for (const window of ["30d", "90d", "365d", "all"]) {
    const view = deriveAgoraActivity(snapshot, window);
    const ids = new Set(snapshot.data.validators.flatMap(v => v.matches.filter(m => m.confidence === "supported").map(m => m.userId)));
    const relevant = snapshot.data.posts.filter(p => Date.parse(p.createdAt) >= Date.parse(view.start) && Date.parse(p.createdAt) <= Date.parse(view.end));
    assert.equal(view.forumPosts, relevant.length);
    assert.equal(view.validatorPosts, relevant.filter(p => ids.has(p.userId)).length);
    assert.equal(view.months.reduce((n, m) => n + m.posts, 0), relevant.length);
    assert.equal(view.months.reduce((n, m) => n + m.validatorPosts, 0), view.validatorPosts);
    assert.equal(view.writers.reduce((n, a) => n + a.posts, 0), view.validatorPosts);
    assert.equal(view.uniqueValidatorWriters, new Set(relevant.filter(p => ids.has(p.userId)).map(p => p.userId)).size);
    for (const row of view.rows.filter(r => r.posts !== null)) assert.equal(row.topics + row.replies, row.posts);
  }
});

test("system notices and author follow-ups do not create external responses", () => {
  const view = deriveAgoraActivity(snapshot, "all");
  // Topic 491 has an opener and an author follow-up, but no response from anyone else.
  const followup = view.topicRows.find(t => t.id === 491);
  assert.equal(followup.replies, 1);
  assert.equal(followup.externalReplies, 0);
  assert.equal(followup.validatorReplies, 0);
  // API reply_count counts explicit reply-to relationships, not all normal replies.
  const normalReply = view.topicRows.find(t => t.id === 530);
  assert.equal(normalReply.apiReplyCount, 0);
  assert.equal(normalReply.replies, 1);
  assert.equal(normalReply.externalReplies, 1);
  assert.equal(normalReply.validatorReplies, 1);
  // Topic 473 includes two system action posts, which are excluded from the message count.
  const notices = view.topicRows.find(t => t.id === 473);
  assert.equal(notices.replies, 1);
  assert.equal(notices.externalReplies, 1);
});

test("shared representatives count once as writers and messages, while represented validators retain their own stake", () => {
  const view = deriveAgoraActivity(snapshot, "all");
  const frag = snapshot.data.accounts.find(a => a.username === "fragwuerdig");
  const related = view.rows.filter(v => v.accepted.some(m => m.userId === frag.id));
  assert.equal(related.length, 2);
  assert.equal(related.every(v => v.posts > 0), true);
  assert.equal(view.writers.filter(a => a.id === frag.id).length, 1);
  assert.equal(view.writers.find(a => a.id === frag.id).posts, snapshot.data.posts.filter(p => p.userId === frag.id).length);
  assert.equal(new Set(related.map(r => r.address)).size, 2);
});

test("rolling window includes the lower boundary and excludes future posts; empty windows have honest zero counts", () => {
  const fixture = structuredClone(snapshot);
  fixture.generatedAt = "2026-10-13T12:00:00.000Z";
  fixture.data.posts = [
    { ...snapshot.data.posts[0], id: 1, createdAt: "2026-09-13T12:00:00.000Z" },
    { ...snapshot.data.posts[0], id: 2, createdAt: "2026-09-13T11:59:59.999Z" },
    { ...snapshot.data.posts[0], id: 3, createdAt: "2026-10-13T12:00:00.001Z" },
  ];
  assert.equal(deriveAgoraActivity(fixture, "30d").forumPosts, 1);
  fixture.data.posts = [];
  fixture.data.topics = [];
  const empty = deriveAgoraActivity(fixture, "30d");
  assert.equal(empty.forumPosts, 0);
  assert.equal(empty.topicRows.length, 0);
  assert.equal(empty.topThreeShare, null);
  assert.equal(empty.activeRows.length, 0);
});

test("former-validator identity is excluded from today's bonded population", () => {
  const retired = evidence.validators.find(v => v.operator_address === "terravaloper13avdm9rqxpftv3vrkaqaakakgh30909x8c07v3");
  assert.equal(retired.status, "BOND_STATUS_UNBONDED");
  assert.equal(snapshot.data.validators.some(v => v.address === retired.operator_address), false);
});
