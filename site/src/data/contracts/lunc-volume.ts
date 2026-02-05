import { z } from "zod";
import {
  baseSnapshotSchema,
  coverageSchema,
  kpiTileSchemaBase,
  seriesSchema,
  tableColumnSchemaBase,
  timeWindowSchema,
} from "./common";

export const REQUIRED_LUNC_VOLUME_KPI_IDS = [
  "kpi.latest",
  "kpi.max",
  "kpi.avg",
  "kpi.venues",
] as const;

export const REQUIRED_LUNC_VOLUME_TABLE_COLUMNS = [
  "exchange",
  "share",
  "avgDailyUsd",
  "liquidity",
] as const;

const kpiTileSchema = kpiTileSchemaBase.extend({
  id: z.enum(REQUIRED_LUNC_VOLUME_KPI_IDS),
});

const venueTableSchema = z
  .object({
    id: z.literal("tbl.venues"),
    title: z.string(),
    columns: z
      .array(
        tableColumnSchemaBase.extend({
          key: z.enum(REQUIRED_LUNC_VOLUME_TABLE_COLUMNS),
        }),
      )
      .length(REQUIRED_LUNC_VOLUME_TABLE_COLUMNS.length),
    rows: z.array(
      z.object({
        exchange: z.string(),
        share: z.number(),
        avgDailyUsd: z.number(),
        liquidity: z.string(),
      }),
    ),
  })
  .strict();

const luncVolumeDataSchema = z
  .object({
    series: z
      .object({
        volume24hUsd: seriesSchema.extend({ id: z.literal("vol.usd.24h") }),
      })
      .strict(),
    kpiTiles: z.array(kpiTileSchema),
    tables: z
      .object({
        venueBreakdown: venueTableSchema,
      })
      .strict(),
    notesBlocks: z
      .object({
        marketNotes: z.array(z.string()),
      })
      .strict(),
  })
  .strict();

export const luncVolumeSnapshotSchema = baseSnapshotSchema
  .extend({
    dashboardId: z.literal("lunc-volume"),
    coverage: coverageSchema,
    timeWindows: z.array(timeWindowSchema),
    data: luncVolumeDataSchema,
  })
  .strict();

export type LuncVolumeSnapshot = z.infer<typeof luncVolumeSnapshotSchema>;
