import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

console.log("Installing 8x globally...");

const result = spawnSync("npm", ["install", "-g", "."], {
  cwd: repoRoot,
  stdio: "inherit",
});

if (result.error) {
  console.error(`Failed to install: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  console.error("Installation failed. You may need to run with sudo:");
  console.error("  sudo npx 8x install");
  process.exit(result.status ?? 1);
}

console.log("");
console.log("8x installed globally. You can now run commands directly:");
console.log("  8x plan \"add user authentication\"");
console.log("  8x implement");
console.log("  8x review");
