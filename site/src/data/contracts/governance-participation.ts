import { z } from "zod";
import {
  baseSnapshotSchema,
  coverageSchema,
  kpiTileSchemaBase,
  seriesSchema,
  tableColumnSchemaBase,
  timeWindowSchema,
} from "./common";

export const REQUIRED_GOV_PARTICIPATION_KPI_IDS = [
  "kpi.avgYesVotes",
  "kpi.avgNoVotes",
  "kpi.avgVetoVotes",
  "kpi.avgNonParticipation",
  "kpi.avgNotVoted",
  "kpi.avgDelegatorsVoting",
  "kpi.delegatorsShare",
  "kpi.pctVotesNotVoted",
  "kpi.pctNoWithVeto",
  "kpi.validatorsInDataset",
  "kpi.validatorsOver60",
  "kpi.validatorsOver70",
] as const;

export const REQUIRED_GOV_PARTICIPATION_TABLE_COLUMNS = [
  "validator",
  "votingPowerShare",
  "yes",
  "no",
  "noWithVeto",
  "abstain",
  "didNotVote",
  "nonParticipation",
] as const;

const kpiTileSchema = kpiTileSchemaBase.extend({
  id: z.enum(REQUIRED_GOV_PARTICIPATION_KPI_IDS),
});

const statementSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    body: z.string(),
    asOf: z.string(),
  })
  .strict();

const validatorsTableSchema = z
  .object({
    id: z.literal("tbl.validatorsOver60"),
    title: z.string(),
    columns: z
      .array(
        tableColumnSchemaBase.extend({
          key: z.enum(REQUIRED_GOV_PARTICIPATION_TABLE_COLUMNS),
        }),
      )
      .length(REQUIRED_GOV_PARTICIPATION_TABLE_COLUMNS.length),
    rows: z.array(
      z.object({
        validator: z.string(),
        votingPowerShare: z.number(),
        yes: z.number(),
        no: z.number(),
        noWithVeto: z.number(),
        abstain: z.number(),
        didNotVote: z.number(),
        nonParticipation: z.number(),
      }),
    ),
  })
  .strict();

const governanceParticipationDataSchema = z
  .object({
    kpiGrid: z.array(kpiTileSchema),
    statementCards: z.array(statementSchema),
    tables: z
      .object({
        validatorsOver60: validatorsTableSchema,
      })
      .strict(),
    series: z
      .object({
        nonParticipationDistribution: seriesSchema.extend({
          id: z.literal("gov.nonpart.dist"),
        }),
      })
      .strict(),
  })
  .strict();

export const governanceParticipationSnapshotSchema = baseSnapshotSchema
  .extend({
    dashboardId: z.literal("governance-participation"),
    coverage: coverageSchema,
    timeWindows: z.array(timeWindowSchema),
    data: governanceParticipationDataSchema,
  })
  .strict();

export type GovernanceParticipationSnapshot = z.infer<
  typeof governanceParticipationSnapshotSchema
>;
