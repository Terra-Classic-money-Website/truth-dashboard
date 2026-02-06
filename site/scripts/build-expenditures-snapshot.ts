import fs from "fs";
import path from "path";

const root = path.resolve("/workspaces/truth-dashboard/site");
const snapshotPath = path.join(root, "src/data/snapshots/expenditures.snapshot.json");

type Snapshot = {
  dashboardId?: string;
};

const text = fs.readFileSync(snapshotPath, "utf8");
const snapshot = JSON.parse(text) as Snapshot;

if (snapshot.dashboardId !== "community-pool") {
  throw new Error(
    `Unexpected dashboardId in ${snapshotPath}: ${String(snapshot.dashboardId)}`,
  );
}

console.log(`Verified committed expenditures snapshot: ${snapshotPath}`);
