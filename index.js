#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const [command, ...args] = process.argv.slice(2);

const printHelp = () => {
  console.log("Usage: 8x <command> [...arguments]");
  console.log("");
  console.log("Commands:");
  console.log("  quick-plan <task>   Quick plan for a straightforward task");
  console.log("  deep-plan  <task>   Deep plan for complex, multi-stage work");
  console.log("  implement           Run implementation steps for a spec");
  console.log("  review              Run QA review for a spec");
  console.log("  install             Install 8x globally");
  console.log("");
  console.log("Examples:");
  console.log('  8x quick-plan "add user authentication"');
  console.log('  8x deep-plan "migrate database to PostgreSQL"');
  console.log("  8x implement");
  console.log("  8x review");
  console.log("  8x install");
  console.log("");
  console.log("Config:");
  console.log("  ~/.8x/config.json          Global config");
  console.log("  <project>/.8x/config.json  Project config (takes precedence)");
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

const tsxBin = path.join(__dirname, "node_modules", ".bin", "tsx");
const result = spawnSync(tsxBin, [scriptPath, ...args], { stdio: "inherit" });

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
