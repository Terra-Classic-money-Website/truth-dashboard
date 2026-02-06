import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const snapshotPath = path.join(root, "src/data/snapshots/expenditures.snapshot.json");

const text = fs.readFileSync(snapshotPath, "utf8");
const snapshot = JSON.parse(text);

if (snapshot.dashboardId !== "community-pool") {
  throw new Error(
    `Unexpected dashboardId in ${snapshotPath}: ${String(snapshot.dashboardId)}`,
  );
}

console.log(`Verified committed expenditures snapshot: ${snapshotPath}`);
