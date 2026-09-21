import { z } from "zod";
import {
  baseSnapshotSchema,
  coverageSchema,
  dateString,
  timeWindowSchema,
} from "./common";

const capturedAtSchema = z.string().datetime({ offset: true });

const rankPointSchema = z
  .object({
    t: capturedAtSchema,
    v: z.number().int().min(1).max(1_000_000),
  })
  .strict();

const captureObservationSchema = z
  .object({
    captureTimestamp: z
      .string()
      .regex(/^\d{14}$/, "Expected YYYYMMDDHHMMSS timestamp"),
    capturedAt: capturedAtSchema,
    observedDate: dateString,
    archiveUrl: z.string().url(),
    originalUrl: z.string().url(),
    digest: z.string().min(1),
    archiveBytes: z.number().int().nonnegative().nullable(),
    status: z.enum([
      "rank_observed",
      "not_observed",
      "parse_failed",
      "fetch_failed",
    ]),
    rank: z.number().int().min(1).max(1_000_000).nullable(),
    assetName: z.string().nullable(),
    assetSymbol: z.string().nullable(),
    rankSource: z.string().nullable(),
    error: z.string().nullable(),
  })
  .strict();

const rankStatsSchema = z
  .object({
    timemapCaptureCount: z.number().int().nonnegative(),
    uniqueDigestCount: z.number().int().nonnegative(),
    fetchedContentCount: z.number().int().nonnegative(),
    rankObservationCount: z.number().int().nonnegative(),
    notObservedCount: z.number().int().nonnegative(),
    parseFailedCount: z.number().int().nonnegative(),
    fetchFailedCount: z.number().int().nonnegative(),
    uniqueObservationDates: z.number().int().nonnegative(),
  })
  .strict();

const currentObservationSchema = z
  .object({
    observedDate: dateString,
    recordedAt: capturedAtSchema,
    rank: z.number().int().min(1).max(1_000_000),
    sourceLabel: z.string().min(1),
    sourceUrl: z.string().url(),
    evidence: z.string().min(1),
  })
  .strict();

const cmcRankingDataSchema = z
  .object({
    series: z
      .object({
        cmcRank: z
          .object({
            points: z.array(rankPointSchema).min(1),
          })
          .strict(),
      })
      .strict(),
    observations: z.array(captureObservationSchema).min(1),
    currentObservation: currentObservationSchema,
    stats: rankStatsSchema,
  })
  .strict();

export const cmcRankingSnapshotSchema = baseSnapshotSchema
  .extend({
    dashboardId: z.literal("cmc-ranking"),
    coverage: coverageSchema,
    timeWindows: z.array(timeWindowSchema),
    data: cmcRankingDataSchema,
  })
  .strict();

export type CmcRankingSnapshot = z.infer<typeof cmcRankingSnapshotSchema>;
export type CmcRankingObservation =
  CmcRankingSnapshot["data"]["observations"][number];
export type CmcRankingRankPoint =
  CmcRankingSnapshot["data"]["series"]["cmcRank"]["points"][number];
export type CmcRankingCurrentObservation =
  CmcRankingSnapshot["data"]["currentObservation"];
