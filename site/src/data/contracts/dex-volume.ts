import { z } from "zod";
import {
  baseSnapshotSchema,
  coverageSchema,
  dateString,
  timeWindowSchema,
} from "./common";

const dexVolumePointSchema = z
  .object({
    t: dateString,
    v: z.number(),
  })
  .strict();

const dexVolumeSeriesSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    color: z.string(),
    points: z
      .array(dexVolumePointSchema)
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

const dexVolumePeriodSchema = z
  .object({
    cadence: z.enum(["daily", "monthly"]),
    coverage: coverageSchema,
    dates: z
      .array(dateString)
      .min(1)
      .refine(
        (dates) =>
          dates.every(
            (date, index, array) => index === 0 || array[index - 1] <= date,
          ),
        "Dates must be sorted ascending",
      ),
    series: z.array(dexVolumeSeriesSchema).min(1),
  })
  .strict();

const dexVolumeDataSchema = z
  .object({
    periods: z
      .object({
        daily: dexVolumePeriodSchema,
        monthly: dexVolumePeriodSchema,
      })
      .strict(),
  })
  .strict();

export const dexVolumeSnapshotSchema = baseSnapshotSchema
  .extend({
    dashboardId: z.literal("dex-volume"),
    coverage: coverageSchema,
    timeWindows: z.array(timeWindowSchema),
    data: dexVolumeDataSchema,
  })
  .strict();

export type DexVolumeSnapshot = z.infer<typeof dexVolumeSnapshotSchema>;
export type DexVolumePeriod = DexVolumeSnapshot["data"]["periods"]["daily"];
export type DexVolumeSeries = DexVolumePeriod["series"][number];
export type DexVolumePoint = DexVolumeSeries["points"][number];
