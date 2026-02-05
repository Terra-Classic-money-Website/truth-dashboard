import { z } from "zod";
import {
  baseSnapshotSchema,
  coverageSchema,
  dateString,
  kpiDeltaSchema,
  timeWindowSchema,
} from "./common";

export const REQUIRED_LUNC_VOLUME_KPI_IDS = [
  "kpi.latest24hVolumeUsd",
  "kpi.maxVolumeUsdInRange",
  "kpi.avgVolumeUsdInRange",
] as const;

const volumePointSchema = z
  .object({
    t: dateString,
    v: z.number(),
  })
  .strict();

const volumeSeriesSchema = z
  .object({
    points: z
      .array(volumePointSchema)
      .min(1)
      .refine(
        (points) =>
          points.every(
            (point, index, array) =>
              index === 0 || array[index - 1].t <= point.t,
          ),
        "Points must be sorted ascending by t",
      ),
  })
  .strict();

const kpiTileSchema = z
  .object({
    id: z.enum(REQUIRED_LUNC_VOLUME_KPI_IDS),
    label: z.string(),
    sublabel: z.string(),
    value: z.number().nullable(),
    unit: z.literal("usd"),
    delta: kpiDeltaSchema.nullable().optional(),
  })
  .strict();

const luncVolumeDataSchema = z
  .object({
    series: z
      .object({
        volume24hUsd: volumeSeriesSchema,
      })
      .strict(),
    kpiTiles: z.array(kpiTileSchema).length(REQUIRED_LUNC_VOLUME_KPI_IDS.length),
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
