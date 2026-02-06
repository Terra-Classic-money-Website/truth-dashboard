import fs from "fs";
import path from "path";

const root = path.resolve("/workspaces/truth-dashboard/site");
const snapshotPath = path.join(root, "src/data/snapshots/active-wallets.snapshot.json");

type Snapshot = {
  dashboardId?: string;
};

const text = fs.readFileSync(snapshotPath, "utf8");
const snapshot = JSON.parse(text) as Snapshot;

if (snapshot.dashboardId !== "active-wallets") {
  throw new Error(
    `Unexpected dashboardId in ${snapshotPath}: ${String(snapshot.dashboardId)}`,
  );
}

console.log(`Verified committed active-wallets snapshot: ${snapshotPath}`);
