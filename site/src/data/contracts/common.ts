import { z } from "zod";

export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD date string");

export const coverageSchema = z
  .object({
    start: dateString,
    end: dateString,
    cadence: z.string(),
  })
  .strict();

export const timeWindowSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    days: z.number().nullable().optional(),
    weeks: z.number().nullable().optional(),
    months: z.number().nullable().optional(),
  })
  .strict();

export const sourceSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    type: z.string().optional(),
    notes: z.string().optional(),
  })
  .strict();

export const seriesPointSchema = z
  .object({
    periodEnd: dateString,
    v: z.number(),
  })
  .strict();

export const seriesSchema = z
  .object({
    id: z.string(),
    label: z.string(),
    cadence: z.string(),
    unit: z.string(),
    scale: z.number().optional(),
    points: z.array(seriesPointSchema),
  })
  .strict();

export const kpiDeltaSchema = z
  .object({
    value: z.number(),
    unit: z.string(),
    vs: z.string(),
  })
  .strict();

export const kpiTileSchemaBase = z
  .object({
    id: z.string(),
    label: z.string(),
    value: z.number(),
    unit: z.string(),
    scale: z.number().optional(),
    asOf: dateString,
    delta: kpiDeltaSchema.nullable().optional(),
    note: z.string().optional(),
  })
  .strict();

export const tableColumnSchemaBase = z
  .object({
    key: z.string(),
    label: z.string(),
    type: z.enum(["text", "number"]),
    unit: z.string().optional(),
  })
  .strict();

export const baseSnapshotSchema = z
  .object({
    schemaVersion: z.string(),
    dashboardId: z.string(),
    title: z.string(),
    subtitle: z.string().optional(),
    generatedAt: z.string().optional(),
    coverage: coverageSchema,
    sources: z.array(sourceSchema),
    notes: z.array(z.string()),
    timeWindows: z.array(timeWindowSchema),
    data: z.unknown(),
  })
  .strict();

export type TimeWindow = z.infer<typeof timeWindowSchema>;
export type SeriesPoint = z.infer<typeof seriesPointSchema>;
