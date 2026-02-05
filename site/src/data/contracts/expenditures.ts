import { z } from "zod";
import {
  baseSnapshotSchema,
  coverageSchema,
  dateString,
  sourceSchema,
} from "./common";

const windowIdSchema = z.enum(["1Y", "2Y", "3Y", "ALL"]);

const proposalSchema = z
  .object({
    title: z.string(),
    recipient: z.string(),
    denom: z.enum(["LUNC", "USTC"]),
    amount: z.number(),
    spendTime: dateString.nullable(),
    observedWeeklyDelta: z.number().nullable(),
    residualVsExpected: z.number().nullable(),
    preBalance: z.number().nullable(),
    postBalance: z.number().nullable(),
    lowConfidence: z.boolean().optional(),
  })
  .strict();

const denomOutflowSchema = z
  .object({
    amount: z.number(),
    preBalance: z.number().nullable(),
    impactPct: z.number().nullable(),
    observedDelta: z.number().nullable(),
  })
  .strict();

const outflowWeekSchema = z
  .object({
    markerTime: dateString,
    dropTime: dateString.nullable(),
    lunc: denomOutflowSchema.optional(),
    ustc: denomOutflowSchema.optional(),
    combinedImpactPct: z.number().nullable(),
    lowConfidence: z.boolean(),
    proposals: z.array(proposalSchema),
  })
  .strict();

const balancesWeeklySchema = z
  .object({
    t: dateString,
    lunc: z.number().nullable(),
    ustc: z.number().nullable(),
  })
  .strict();

const expendituresDataSchema = z
  .object({
    series: z
      .object({
        balancesWeekly: z.array(balancesWeeklySchema),
        outflowsWeekly: z.array(outflowWeekSchema),
      })
      .strict(),
    method: z
      .object({
        markerRule: z.string(),
        filterRule: z.string(),
        notes: z.array(z.string()),
      })
      .strict(),
  })
  .strict();

export const expendituresSnapshotSchema = baseSnapshotSchema
  .extend({
    dashboardId: z.literal("community-pool"),
    coverage: coverageSchema,
    sources: z.array(sourceSchema),
    timeWindows: z.array(
      z
        .object({
          id: windowIdSchema,
          label: z.string(),
          weeks: z.number().nullable().optional(),
        })
        .strict(),
    ),
    data: expendituresDataSchema,
  })
  .strict();

export type ExpendituresSnapshot = z.infer<typeof expendituresSnapshotSchema>;
