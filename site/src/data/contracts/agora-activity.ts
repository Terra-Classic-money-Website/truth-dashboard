import { z } from "zod";
import { baseSnapshotSchema, sourceSchema } from "./common.ts";

const count = z.number().int().nonnegative();
const timestamp = z.iso.datetime({ offset: true });
const matchSchema = z.object({
  userId: z.number().int().positive(),
  username: z.string(),
  confidence: z.enum(["supported", "candidate"]),
  source: z.enum(["owner", "public", "name"]),
  basis: z.string(),
  evidenceUrls: z.array(z.url()).min(1),
}).strict();

export const agoraActivitySnapshotSchema = baseSnapshotSchema.extend({
  dashboardId: z.literal("agora-activity"),
  generatedAt: timestamp,
  sources: z.array(sourceSchema.extend({ url: z.url().optional() }).strict()),
  data: z.object({
    chain: z.object({
      chainId: z.literal("columbus-5"),
      height: z.string().regex(/^\d+$/),
      blockTime: timestamp,
      registeredValidators: count,
      excludedNonBonded: count,
      bondedTokens: z.string().regex(/^\d+$/),
    }).strict(),
    directoryUpdatedAt: timestamp,
    directoryAccounts: count,
    profilesReviewed: count,
    excludedTopics: z.array(z.object({ id: count, reason: z.string() }).strict()),
    validators: z.array(z.object({
      rank: count,
      address: z.string().startsWith("terravaloper1"),
      moniker: z.string(),
      website: z.string(),
      tokens: z.string().regex(/^\d+$/),
      votingPower: z.number().nonnegative().max(100),
      matches: z.array(matchSchema),
    }).strict()),
    accounts: z.array(z.object({
      id: z.number().int().positive(),
      username: z.string(),
      topicsCreated: count,
      repliesPosted: count,
      topicsViewed: count.nullable(),
      postsRead: count.nullable(),
      daysVisited: count.nullable(),
      likesReceived: count,
      createdAt: timestamp.nullable(),
      lastPostedAt: timestamp.nullable(),
    }).strict()),
    topics: z.array(z.object({
      id: count, title: z.string(), slug: z.string(),
      category: z.string(), createdAt: timestamp, views: count,
      authorUserId: z.number().int().positive(),
      apiReplyCount: count, apiPostsCount: count,
    }).strict()),
    posts: z.array(z.object({
      id: count, topicId: count, userId: z.number().int().positive(),
      postNumber: z.number().int().positive(), createdAt: timestamp,
    }).strict()),
  }).strict(),
}).strict();

export type AgoraActivitySnapshot = z.infer<typeof agoraActivitySnapshotSchema>;
export type AgoraValidator = AgoraActivitySnapshot["data"]["validators"][number];
