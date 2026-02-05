import { z } from "zod";
import {
  baseSnapshotSchema,
  coverageSchema,
  dateString,
  kpiDeltaSchema,
  kpiTileSchemaBase,
  seriesSchema,
  tableColumnSchemaBase,
  timeWindowSchema,
} from "./common";

export const REQUIRED_ACTIVE_WALLETS_KPI_IDS = [
  "kpi.mawTotal",
  "kpi.senders",
  "kpi.recipients",
  "kpi.retention",
] as const;

export const REQUIRED_ACTIVE_WALLETS_INSIGHT_KPI_IDS = [
  "kpi.currentMonth",
  "kpi.allTimePeak",
  "kpi.drawdown",
  "kpi.roll12Avg",
  "kpi.trendSlope",
  "kpi.stability",
] as const;

export const REQUIRED_ACTIVE_WALLETS_YEAR_COLUMNS = [
  "year",
  "avgMonthly",
  "median",
  "yoy",
  "volatility",
  "cv",
] as const;

export const REQUIRED_ACTIVE_WALLETS_QUARTER_COLUMNS = [
  "quarter",
  "avg",
  "qoq",
  "bestMonth",
  "worstMonth",
] as const;

const kpiTileSchema = z
  .object({
    id: z.enum(REQUIRED_ACTIVE_WALLETS_KPI_IDS),
    label: z.string(),
    value: z.number().nullable(),
    unit: z.string(),
    scale: z.number().optional(),
    asOf: dateString,
    delta: kpiDeltaSchema.nullable().optional(),
    note: z.string().optional(),
  })
  .strict();

const insightKpiSchema = kpiTileSchemaBase.extend({
  id: z.enum(REQUIRED_ACTIVE_WALLETS_INSIGHT_KPI_IDS),
});

const yearSummarySchema = z
  .object({
    id: z.literal("tbl.yearSummary"),
    title: z.string(),
    columns: z
      .array(
        tableColumnSchemaBase.extend({
          key: z.enum(REQUIRED_ACTIVE_WALLETS_YEAR_COLUMNS),
        }),
      )
      .length(REQUIRED_ACTIVE_WALLETS_YEAR_COLUMNS.length),
    rows: z.array(
      z.object({
        year: z.string(),
        avgMonthly: z.number(),
        median: z.number(),
        yoy: z.number(),
        volatility: z.number(),
        cv: z.number(),
      }),
    ),
  })
  .strict();

const quarterlySummarySchema = z
  .object({
    id: z.literal("tbl.quarterlySummary"),
    title: z.string(),
    columns: z
      .array(
        tableColumnSchemaBase.extend({
          key: z.enum(REQUIRED_ACTIVE_WALLETS_QUARTER_COLUMNS),
        }),
      )
      .length(REQUIRED_ACTIVE_WALLETS_QUARTER_COLUMNS.length),
    rows: z.array(
      z.object({
        quarter: z.string(),
        avg: z.number(),
        qoq: z.number(),
        bestMonth: z.string(),
        worstMonth: z.string(),
      }),
    ),
  })
  .strict();

const extremesSchema = z
  .object({
    topMonths: z.array(z.object({ label: z.string(), value: z.number() })),
    bottomMonths: z.array(z.object({ label: z.string(), value: z.number() })),
    largestMoMIncrease: z.object({
      label: z.string(),
      abs: z.number(),
      pct: z.number(),
    }),
    largestMoMDecrease: z.object({
      label: z.string(),
      abs: z.number(),
      pct: z.number(),
    }),
    drawdownRecovery: z.object({
      drawdownPct: z.number(),
      from: dateString,
      to: dateString,
      recovered: z.boolean(),
    }),
  })
  .strict();

const milestonesSchema = z
  .object({
    thresholds: z.array(
      z.object({
        threshold: z.number(),
        firstReached: dateString,
        lastSeen: dateString,
      }),
    ),
  })
  .strict();

const methodSchema = z
  .object({
    source: z.string(),
    metricDefinition: z.string(),
    dataWindow: z.string(),
    notes: z.array(z.string()),
  })
  .strict();

const activeWalletsDataSchema = z
  .object({
    series: z
      .object({
        mawTotal: seriesSchema.extend({ id: z.literal("maw.total") }),
        mawSenders: seriesSchema.extend({ id: z.literal("maw.senders") }),
        mawRecipients: seriesSchema.extend({ id: z.literal("maw.recipients") }),
      })
      .strict(),
    kpiTiles: z.array(kpiTileSchema),
    insights: z
      .object({
        highlights: z.array(z.string()),
        kpiSnapshot: z.array(insightKpiSchema),
      })
      .strict(),
    tables: z
      .object({
        yearSummary: yearSummarySchema,
        quarterlySummary: quarterlySummarySchema,
      })
      .strict(),
    extremes: extremesSchema,
    milestones: milestonesSchema,
    method: methodSchema,
  })
  .strict();

export const activeWalletsSnapshotSchema = baseSnapshotSchema
  .extend({
    dashboardId: z.literal("active-wallets"),
    coverage: coverageSchema,
    timeWindows: z.array(timeWindowSchema),
    data: activeWalletsDataSchema,
  })
  .strict();

export type ActiveWalletsSnapshot = z.infer<typeof activeWalletsSnapshotSchema>;
