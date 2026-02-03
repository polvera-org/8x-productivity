#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const [command, ...args] = process.argv.slice(2);

const printHelp = () => {
  console.log("Usage: npx 8xp <command> [...arguments]");
  console.log("Commands:");
  console.log("  install    Install agents and skills");
  console.log("Examples:");
  console.log("  npx 8xp install --platform=opencode --path=/path/to/project");
  console.log(
    "  npx 8xp install --platform=agentzero --path=/path/to/agentzero/usr",
  );
};

if (!command || command === "--help" || command === "-h") {
  printHelp();
  process.exit(command ? 0 : 1);
}

const scriptPath = path.join(__dirname, "scripts", `${command}.ts`);
if (!existsSync(scriptPath)) {
  console.error(`Unknown command: ${command}`);
  printHelp();
  process.exit(1);
}

const result = spawnSync("tsx", [scriptPath, ...args], { stdio: "inherit" });

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
