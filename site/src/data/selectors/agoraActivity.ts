import type { AgoraActivitySnapshot } from "../contracts/agora-activity";

export type AgoraWindow = "30d" | "90d" | "365d" | "all";
export const AGORA_WINDOWS: { id: AgoraWindow; label: string; days: number | null }[] = [
  { id: "30d", label: "30 days", days: 30 },
  { id: "90d", label: "90 days", days: 90 },
  { id: "365d", label: "1 year", days: 365 },
  { id: "all", label: "Forum lifetime", days: null },
];

export function deriveAgoraActivity(
  snapshot: AgoraActivitySnapshot,
  window: AgoraWindow,
  includeCandidates = false,
) {
  const { validators, accounts, topics, posts } = snapshot.data;
  const cutoff = Date.parse(snapshot.generatedAt);
  const days = AGORA_WINDOWS.find(w => w.id === window)!.days;
  const start = days === null ? Date.parse(snapshot.coverage.start) : cutoff - days * 86400000;
  const inWindow = (date: string) => Date.parse(date) >= start && Date.parse(date) <= cutoff;
  const accountById = new Map(accounts.map(a => [a.id, a]));
  const topicById = new Map(topics.map(t => [t.id, t]));
  const scopedPosts = posts.filter(p => inWindow(p.createdAt));
  const rows = validators.map(validator => {
    const accepted = validator.matches.filter(m => includeCandidates || m.confidence === "supported");
    const ids = new Set(accepted.map(m => m.userId));
    const allUserPosts = posts.filter(p => ids.has(p.userId));
    const userPosts = scopedPosts.filter(p => ids.has(p.userId));
    const count = (fn: (p: typeof posts[number]) => boolean) => userPosts.filter(fn).length;
    const lastPost = allUserPosts.reduce<string | null>((last, p) => !last || p.createdAt > last ? p.createdAt : last, null);
    const matchedAccounts = accepted.map(m => accountById.get(m.userId)!).filter(Boolean);
    const directoryWrites = matchedAccounts.reduce((n, a) => n + a.topicsCreated + a.repliesPosted, 0);
    const hasSupported = validator.matches.some(m => m.confidence === "supported");
    return {
      ...validator,
      accepted,
      confidence: hasSupported ? "supported" : validator.matches.length ? "candidate" : "unmatched",
      status: ids.size === 0 ? (validator.matches.length ? "candidate" : "unmatched")
        : userPosts.length > 0 ? "writing" : directoryWrites === 0 && allUserPosts.length === 0 ? "no-writing" : "quiet",
      posts: ids.size ? userPosts.length : null,
      topics: ids.size ? count(p => p.postNumber === 1) : null,
      replies: ids.size ? count(p => p.postNumber > 1) : null,
      externalReplies: ids.size ? count(p => p.postNumber > 1 && !ids.has(topicById.get(p.topicId)!.authorUserId)) : null,
      distinctTopics: ids.size ? new Set(userPosts.map(p => p.topicId)).size : null,
      lastPost,
      daysSinceLastPost: lastPost ? Math.floor((cutoff - Date.parse(lastPost)) / 86400000) : null,
      matchedAccounts,
      lifetimeDirectoryWrites: ids.size ? directoryWrites : null,
    };
  });
  // One account may represent multiple validators. Count its posts once globally.
  const validatorUserIds = new Set(rows.flatMap(r => r.accepted.map(m => m.userId)));
  const validatorPosts = scopedPosts.filter(p => validatorUserIds.has(p.userId));
  const scopedTopics = topics.filter(t => inWindow(t.createdAt));
  const topicRows = scopedTopics.map(topic => {
    const messages = posts.filter(p => p.topicId === topic.id && Date.parse(p.createdAt) <= cutoff);
    const replies = messages.filter(p => p.postNumber > 1);
    const externalReplies = replies.filter(p => p.userId !== topic.authorUserId);
    const validatorReplies = externalReplies.filter(p => validatorUserIds.has(p.userId));
    return { ...topic, replies: replies.length, externalReplies: externalReplies.length,
      validatorReplies: validatorReplies.length,
      validatorResponders: new Set(validatorReplies.map(p => p.userId)).size,
      ageDays: Math.floor((cutoff - Date.parse(topic.createdAt)) / 86400000),
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const activeRows = rows.filter(r => r.status === "writing");
  const activePower = activeRows.reduce((n, r) => n + r.votingPower, 0);
  const groups = ["writing", "quiet", "no-writing", "candidate", "unmatched"].map(status => ({
    status, count: rows.filter(r => r.status === status).length,
    power: rows.filter(r => r.status === status).reduce((n, r) => n + r.votingPower, 0),
  }));
  const writers = [...validatorUserIds].map(id => ({
    ...accountById.get(id)!,
    posts: validatorPosts.filter(p => p.userId === id).length,
    validators: rows.filter(r => r.accepted.some(m => m.userId === id)).map(r => r.moniker),
  })).filter(a => a.posts > 0).sort((a, b) => b.posts - a.posts || a.username.localeCompare(b.username));
  const topThreePosts = writers.slice(0, 3).reduce((n, a) => n + a.posts, 0);
  const months = [];
  const first = new Date(start);
  let month = Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1);
  while (month <= cutoff) {
    const date = new Date(month);
    const key = date.toISOString().slice(0, 7);
    const all = scopedPosts.filter(p => p.createdAt.startsWith(key));
    const attributed = all.filter(p => validatorUserIds.has(p.userId));
    months.push({ month: key, posts: all.length, validatorPosts: attributed.length,
      otherPosts: all.length - attributed.length,
      validatorWriters: new Set(attributed.map(p => p.userId)).size,
      partial: month < start || Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1) > cutoff,
    });
    month = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1);
  }
  const matureTopics = topicRows.filter(t => t.ageDays >= 7);
  const noExternalResponse = topicRows.filter(t => t.externalReplies === 0).length;
  return {
    rows, groups, writers, months, topicRows, activeRows, activePower,
    start: new Date(start).toISOString(), end: snapshot.generatedAt,
    forumPosts: scopedPosts.length, validatorPosts: validatorPosts.length,
    uniqueValidatorWriters: writers.length,
    noExternalResponse,
    noReplies: topicRows.filter(t => t.replies === 0).length,
    matureTopics: matureTopics.length,
    matureNoResponse: matureTopics.filter(t => t.externalReplies === 0).length,
    topicsWithValidatorResponse: topicRows.filter(t => t.validatorReplies > 0).length,
    proposalTopics: topicRows.filter(t => t.category === "Proposals").length,
    proposalTopicsWithValidatorResponse: topicRows.filter(t => t.category === "Proposals" && t.validatorReplies > 0).length,
    topThreeShare: validatorPosts.length ? topThreePosts / validatorPosts.length * 100 : null,
  };
}
