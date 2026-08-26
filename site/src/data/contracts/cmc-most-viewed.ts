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
    v: z.number().int().min(1).max(500),
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
    rank: z.number().int().min(1).max(500).nullable(),
    assetName: z.string().nullable(),
    assetSymbol: z.string().nullable(),
    marketCapRank: z.number().int().positive().nullable(),
    error: z.string().nullable(),
  })
  .strict();

const rankStatsSchema = z
  .object({
    cdxCaptureCount: z.number().int().nonnegative(),
    fetchedCaptureCount: z.number().int().nonnegative(),
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
    rank: z.number().int().min(1).max(500),
    sourceLabel: z.string().min(1),
    sourceUrl: z.string().url(),
    evidence: z.string().min(1),
  })
  .strict();

const cmcMostViewedDataSchema = z
  .object({
    series: z
      .object({
        mostViewedRank: z
          .object({
            points: z.array(rankPointSchema).min(1),
          })
          .strict(),
      })
      .strict(),
    observations: z.array(captureObservationSchema).min(1),
    currentObservation: currentObservationSchema.nullable(),
    stats: rankStatsSchema,
  })
  .strict();

export const cmcMostViewedSnapshotSchema = baseSnapshotSchema
  .extend({
    dashboardId: z.literal("cmc-most-viewed-rank"),
    coverage: coverageSchema,
    timeWindows: z.array(timeWindowSchema),
    data: cmcMostViewedDataSchema,
  })
  .strict();

export type CmcMostViewedSnapshot = z.infer<typeof cmcMostViewedSnapshotSchema>;
export type CmcMostViewedObservation =
  CmcMostViewedSnapshot["data"]["observations"][number];
export type CmcMostViewedRankPoint =
  CmcMostViewedSnapshot["data"]["series"]["mostViewedRank"]["points"][number];
export type CmcMostViewedCurrentObservation =
  NonNullable<CmcMostViewedSnapshot["data"]["currentObservation"]>;
