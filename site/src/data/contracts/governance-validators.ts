import { z } from "zod";
import {
  baseSnapshotSchema,
  coverageSchema,
  tableColumnSchemaBase,
  timeWindowSchema,
} from "./common";

export const REQUIRED_GOV_VALIDATORS_TABLE_COLUMNS = [
  "rank",
  "validator",
  "votingPower",
  "delegators",
  "incomeMonthlyUsd",
  "didNotVote1y",
  "didNotVote2y",
  "yes",
  "no",
  "abstain",
  "noWithVeto",
] as const;

const governanceValidatorsDataSchema = z
  .object({
    filters: z
      .object({
        incomeThresholds: z.array(
          z.object({
            id: z.string(),
            label: z.string(),
            minUsd: z.number(),
          }),
        ),
      })
      .strict(),
    table: z
      .object({
        id: z.literal("tbl.validators"),
        title: z.string(),
        columns: z
          .array(
            tableColumnSchemaBase.extend({
              key: z.enum(REQUIRED_GOV_VALIDATORS_TABLE_COLUMNS),
            }),
          )
          .length(REQUIRED_GOV_VALIDATORS_TABLE_COLUMNS.length),
        rows: z.array(
          z.object({
            rank: z.number(),
            validator: z.string(),
            votingPower: z.number(),
            delegators: z.number(),
            incomeMonthlyUsd: z.number(),
            didNotVote1y: z.number(),
            didNotVote2y: z.number(),
            yes: z.number(),
            no: z.number(),
            abstain: z.number(),
            noWithVeto: z.number(),
          }),
        ),
      })
      .strict(),
  })
  .strict();

export const governanceValidatorsSnapshotSchema = baseSnapshotSchema
  .extend({
    dashboardId: z.literal("governance-validators"),
    coverage: coverageSchema,
    timeWindows: z.array(timeWindowSchema),
    data: governanceValidatorsDataSchema,
  })
  .strict();

export type GovernanceValidatorsSnapshot = z.infer<
  typeof governanceValidatorsSnapshotSchema
>;
