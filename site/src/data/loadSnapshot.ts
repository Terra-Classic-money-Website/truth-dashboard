import type { z } from "zod";
import activeWalletsJson from "./snapshots/active-wallets.snapshot.json";
import communityPoolJson from "./snapshots/expenditures.snapshot.json";
import governanceParticipationJson from "./snapshots/governance-participation.snapshot.json";
import governanceProposalsJson from "./snapshots/governance-proposals.snapshot.json";
import governanceValidatorsJson from "./snapshots/governance-validators.snapshot.json";
import luncVolumeJson from "./snapshots/lunc-volume.snapshot.json";
import {
  activeWalletsSnapshotSchema,
  communityPoolSnapshotSchema,
  governanceParticipationSnapshotSchema,
  governanceProposalsSnapshotSchema,
  governanceValidatorsSnapshotSchema,
  luncVolumeSnapshotSchema,
} from "./contracts";

export type DashboardId =
  | "active-wallets"
  | "lunc-volume"
  | "community-pool"
  | "governance-participation"
  | "governance-validators"
  | "governance-proposals";

type SnapshotMap = {
  "active-wallets": {
    raw: unknown;
    schema: typeof activeWalletsSnapshotSchema;
  };
  "lunc-volume": {
    raw: unknown;
    schema: typeof luncVolumeSnapshotSchema;
  };
  "community-pool": {
    raw: unknown;
    schema: typeof communityPoolSnapshotSchema;
  };
  "governance-participation": {
    raw: unknown;
    schema: typeof governanceParticipationSnapshotSchema;
  };
  "governance-validators": {
    raw: unknown;
    schema: typeof governanceValidatorsSnapshotSchema;
  };
  "governance-proposals": {
    raw: unknown;
    schema: typeof governanceProposalsSnapshotSchema;
  };
};

type SnapshotById = {
  "active-wallets": z.infer<typeof activeWalletsSnapshotSchema>;
  "lunc-volume": z.infer<typeof luncVolumeSnapshotSchema>;
  "community-pool": z.infer<typeof communityPoolSnapshotSchema>;
  "governance-participation": z.infer<typeof governanceParticipationSnapshotSchema>;
  "governance-validators": z.infer<typeof governanceValidatorsSnapshotSchema>;
  "governance-proposals": z.infer<typeof governanceProposalsSnapshotSchema>;
};

const snapshots: SnapshotMap = {
  "active-wallets": {
    raw: activeWalletsJson,
    schema: activeWalletsSnapshotSchema,
  },
  "lunc-volume": {
    raw: luncVolumeJson,
    schema: luncVolumeSnapshotSchema,
  },
  "community-pool": {
    raw: communityPoolJson,
    schema: communityPoolSnapshotSchema,
  },
  "governance-participation": {
    raw: governanceParticipationJson,
    schema: governanceParticipationSnapshotSchema,
  },
  "governance-validators": {
    raw: governanceValidatorsJson,
    schema: governanceValidatorsSnapshotSchema,
  },
  "governance-proposals": {
    raw: governanceProposalsJson,
    schema: governanceProposalsSnapshotSchema,
  },
};

const snapshotCache = new Map<DashboardId, SnapshotById[DashboardId]>();

function formatIssue(issue: z.ZodIssue) {
  const path = issue.path.length ? issue.path.join(".") : "(root)";
  const expected =
    "expected" in issue && typeof issue.expected !== "undefined"
      ? ` expected=${String(issue.expected)}`
      : "";
  const received =
    "received" in issue && typeof issue.received !== "undefined"
      ? ` received=${String(issue.received)}`
      : "";
  return `${path}: ${issue.message}${expected}${received}`;
}

export class SnapshotValidationError extends Error {
  issues: z.ZodIssue[];
  dashboardId: DashboardId;

  constructor(dashboardId: DashboardId, issues: z.ZodIssue[]) {
    super(
      `Snapshot validation failed for ${dashboardId}. ${issues.length} issue(s) found.\n` +
        issues.map(formatIssue).join("\n"),
    );
    this.name = "SnapshotValidationError";
    this.issues = issues;
    this.dashboardId = dashboardId;
  }
}

export function loadSnapshot<T extends DashboardId>(
  dashboardId: T,
): SnapshotById[T] {
  const cached = snapshotCache.get(dashboardId);
  if (cached) {
    return cached as SnapshotById[T];
  }

  const entry = snapshots[dashboardId];
  const parsed = entry.schema.safeParse(entry.raw);
  if (!parsed.success) {
    const error = new SnapshotValidationError(
      dashboardId,
      parsed.error.issues,
    );
    if (import.meta.env.DEV) {
      console.error(error);
    }
    throw error;
  }
  snapshotCache.set(dashboardId, parsed.data);
  return parsed.data as SnapshotById[T];
}

export function getSnapshot<T extends DashboardId>(dashboardId: T) {
  try {
    return { data: loadSnapshot(dashboardId), error: null };
  } catch (error) {
    if (import.meta.env.PROD) {
      throw error;
    }
    return { data: null, error };
  }
}
