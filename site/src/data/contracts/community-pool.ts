import { z } from "zod";
import {
  baseSnapshotSchema,
  coverageSchema,
  kpiTileSchemaBase,
  seriesSchema,
  tableColumnSchemaBase,
  timeWindowSchema,
} from "./common";

export const REQUIRED_COMMUNITY_POOL_KPI_IDS = [
  "kpi.luncBalance",
  "kpi.ustcBalance",
  "kpi.netInflows",
  "kpi.distributions",
] as const;

export const REQUIRED_COMMUNITY_POOL_OVERVIEW_KPI_IDS = [
  "kpi.totalOutflow",
  "kpi.idleWeeks",
] as const;

export const REQUIRED_COMMUNITY_POOL_SPEND_COLUMNS = [
  "period",
  "title",
  "recipient",
  "lunc",
  "ustc",
  "impactPct",
] as const;

const kpiTileSchema = kpiTileSchemaBase.extend({
  id: z.enum(REQUIRED_COMMUNITY_POOL_KPI_IDS),
});

const overviewKpiSchema = kpiTileSchemaBase.extend({
  id: z.enum(REQUIRED_COMMUNITY_POOL_OVERVIEW_KPI_IDS),
});

const spendOutflowsSchema = z
  .object({
    id: z.literal("tbl.spendOutflows"),
    title: z.string(),
    columns: z
      .array(
        tableColumnSchemaBase.extend({
          key: z.enum(REQUIRED_COMMUNITY_POOL_SPEND_COLUMNS),
        }),
      )
      .length(REQUIRED_COMMUNITY_POOL_SPEND_COLUMNS.length),
    rows: z.array(
      z.object({
        period: z.string(),
        title: z.string(),
        recipient: z.string(),
        lunc: z.number(),
        ustc: z.number(),
        impactPct: z.number(),
      }),
    ),
  })
  .strict();

const communityPoolDataSchema = z
  .object({
    series: z
      .object({
        poolBalanceLunc: seriesSchema.extend({
          id: z.literal("cp.balance.lunc"),
        }),
        poolBalanceUstc: seriesSchema.extend({
          id: z.literal("cp.balance.ustc"),
        }),
        netInflowsLunc: seriesSchema.extend({
          id: z.literal("cp.netin.lunc"),
        }),
        spendOutflowsWeekly: seriesSchema.extend({
          id: z.literal("cp.spend.weekly.lunc"),
        }),
      })
      .strict(),
    kpiTiles: z.array(kpiTileSchema),
    tables: z
      .object({
        spendOutflows: spendOutflowsSchema,
      })
      .strict(),
    derivedBlocks: z
      .object({
        overviewKpis: z.array(overviewKpiSchema),
      })
      .strict(),
  })
  .strict();

export const communityPoolSnapshotSchema = baseSnapshotSchema
  .extend({
    dashboardId: z.literal("community-pool"),
    coverage: coverageSchema,
    timeWindows: z.array(timeWindowSchema),
    data: communityPoolDataSchema,
  })
  .strict();

export type CommunityPoolSnapshot = z.infer<
  typeof communityPoolSnapshotSchema
>;
