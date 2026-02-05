import { z } from "zod";
import {
  baseSnapshotSchema,
  coverageSchema,
  tableColumnSchemaBase,
  timeWindowSchema,
} from "./common";

export const REQUIRED_GOV_PROPOSALS_TABLE_COLUMNS = [
  "id",
  "title",
  "type",
  "status",
  "votes",
  "delegators",
  "endDate",
] as const;

const governanceProposalsDataSchema = z
  .object({
    filters: z
      .object({
        sortOptions: z.array(
          z.object({
            id: z.string(),
            label: z.string(),
          }),
        ),
        statusOptions: z.array(
          z.object({
            id: z.string(),
            label: z.string(),
          }),
        ),
      })
      .strict(),
    table: z
      .object({
        id: z.literal("tbl.proposals"),
        title: z.string(),
        columns: z
          .array(
            tableColumnSchemaBase.extend({
              key: z.enum(REQUIRED_GOV_PROPOSALS_TABLE_COLUMNS),
            }),
          )
          .length(REQUIRED_GOV_PROPOSALS_TABLE_COLUMNS.length),
        rows: z.array(
          z.object({
            id: z.number(),
            title: z.string(),
            type: z.string(),
            status: z.string(),
            votes: z.string(),
            delegators: z.number(),
            endDate: z.string(),
          }),
        ),
      })
      .strict(),
  })
  .strict();

export const governanceProposalsSnapshotSchema = baseSnapshotSchema
  .extend({
    dashboardId: z.literal("governance-proposals"),
    coverage: coverageSchema,
    timeWindows: z.array(timeWindowSchema),
    data: governanceProposalsDataSchema,
  })
  .strict();

export type GovernanceProposalsSnapshot = z.infer<
  typeof governanceProposalsSnapshotSchema
>;
