import { z } from "zod";
import {
  baseSnapshotSchema,
  coverageSchema,
  dateString,
  timeWindowSchema,
} from "./common";

const capturedAtSchema = z.string().datetime({ offset: true });

const aprPointSchema = z
  .object({
    t: capturedAtSchema,
    v: z.number().nonnegative(),
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
      "apr_observed",
      "not_observed",
      "parse_failed",
      "fetch_failed",
      "excluded",
    ]),
    apr: z.number().nonnegative().nullable(),
    luncApr: z.number().nonnegative().nullable(),
    ustcApr: z.number().nonnegative().nullable(),
    exclusionReason: z.string().nullable(),
    error: z.string().nullable(),
  })
  .strict();

const currentObservationSchema = z
  .object({
    observedDate: dateString,
    apr: z.number().nonnegative(),
    sourceLabel: z.string().min(1),
    evidence: z.string().min(1),
  })
  .strict()
  .nullable();

const aprStatsSchema = z
  .object({
    cdxCaptureCount: z.number().int().nonnegative(),
    fetchedCaptureCount: z.number().int().nonnegative(),
    aprObservationCount: z.number().int().nonnegative(),
    excludedCaptureCount: z.number().int().nonnegative(),
    notObservedCount: z.number().int().nonnegative(),
    parseFailedCount: z.number().int().nonnegative(),
    fetchFailedCount: z.number().int().nonnegative(),
    uniqueObservationDates: z.number().int().nonnegative(),
    breakdownObservationCount: z.number().int().nonnegative(),
  })
  .strict();

const stakingAprDataSchema = z
  .object({
    series: z
      .object({
        stakingApr: z
          .object({
            points: z.array(aprPointSchema).min(1),
          })
          .strict(),
      })
      .strict(),
    observations: z.array(captureObservationSchema).min(1),
    currentObservation: currentObservationSchema,
    stats: aprStatsSchema,
  })
  .strict();

export const stakingAprSnapshotSchema = baseSnapshotSchema
  .extend({
    dashboardId: z.literal("staking-apr"),
    coverage: coverageSchema,
    timeWindows: z.array(timeWindowSchema),
    data: stakingAprDataSchema,
  })
  .strict();

export type StakingAprSnapshot = z.infer<typeof stakingAprSnapshotSchema>;
export type StakingAprObservation = StakingAprSnapshot["data"]["observations"][number];
export type StakingAprPoint = StakingAprSnapshot["data"]["series"]["stakingApr"]["points"][number];
