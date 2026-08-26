import type { z } from "zod";
import activeWalletsJson from "./snapshots/active-wallets.snapshot.json";
import communityPoolJson from "./snapshots/expenditures.snapshot.json";
import dexVolumeJson from "./snapshots/dex-volume.snapshot.json";
import governanceParticipationJson from "./snapshots/governance-participation.snapshot.json";
import governanceProposalsJson from "./snapshots/governance-proposals.snapshot.json";
import governanceValidatorsJson from "./snapshots/governance-validators.snapshot.json";
import luncVolumeJson from "./snapshots/lunc-volume.snapshot.json";
import cmcMostViewedJson from "./snapshots/cmc-most-viewed-rank.snapshot.json";
import {
  activeWalletsSnapshotSchema,
  cmcMostViewedSnapshotSchema,
  communityPoolSnapshotSchema,
  dexVolumeSnapshotSchema,
  governanceParticipationSnapshotSchema,
  governanceProposalsSnapshotSchema,
  governanceValidatorsSnapshotSchema,
  luncVolumeSnapshotSchema,
} from "./contracts";

export type DashboardId =
  | "active-wallets"
  | "dex-volume"
  | "lunc-volume"
  | "cmc-most-viewed-rank"
  | "community-pool"
  | "governance-participation"
  | "governance-validators"
  | "governance-proposals";

type SnapshotMap = {
  "active-wallets": {
    raw: unknown;
    schema: typeof activeWalletsSnapshotSchema;
  };
  "dex-volume": {
    raw: unknown;
    schema: typeof dexVolumeSnapshotSchema;
  };
  "lunc-volume": {
    raw: unknown;
    schema: typeof luncVolumeSnapshotSchema;
  };
  "cmc-most-viewed-rank": {
    raw: unknown;
    schema: typeof cmcMostViewedSnapshotSchema;
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
  "dex-volume": z.infer<typeof dexVolumeSnapshotSchema>;
  "lunc-volume": z.infer<typeof luncVolumeSnapshotSchema>;
  "cmc-most-viewed-rank": z.infer<typeof cmcMostViewedSnapshotSchema>;
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
  "dex-volume": {
    raw: dexVolumeJson,
    schema: dexVolumeSnapshotSchema,
  },
  "lunc-volume": {
    raw: luncVolumeJson,
    schema: luncVolumeSnapshotSchema,
  },
  "cmc-most-viewed-rank": {
    raw: cmcMostViewedJson,
    schema: cmcMostViewedSnapshotSchema,
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
