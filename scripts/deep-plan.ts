import { askSpecName, loadConfig, loadPrompt, runAgent, validateSpecJson } from "./lib/specs.ts";
import path from "node:path";

const task = process.argv.slice(2).join(" ").trim();
if (!task) {
  console.error("Usage: 8x deep-plan <task description>");
  process.exit(1);
}

const config = await loadConfig();
const specPath = await askSpecName(task);
if (!specPath) process.exit(1);

const systemPrompt = await loadPrompt("deep-plan");
const outputPath = path.join(specPath, "spec.json");

const userMessage =
  `Task: ${task}\n\n` +
  `Explore the codebase, then produce the plan.\n` +
  `Save the JSON output to: ${outputPath}`;

console.log(`\nPlanning (deep-plan)...`);
console.log(`Output: ${outputPath}\n`);

runAgent(config.deep_plan_command, systemPrompt + "\n\n" + userMessage);

await validateSpecJson(outputPath, config.deep_plan_command);
