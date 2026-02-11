import { askSpecName, loadConfig, loadPrompt, runAgent, validateSpecToon, formatDuration } from "./lib/specs.ts";
import path from "node:path";

const task = process.argv.slice(2).join(" ").trim();
if (!task) {
  console.error("Usage: 8x quick-plan <task description>");
  process.exit(1);
}

const config = await loadConfig();
const specPath = await askSpecName(task);
if (!specPath) process.exit(1);

const systemPrompt = await loadPrompt("quick-plan");
const outputPath = path.join(specPath, "spec.toon");

const userMessage =
  `Task: ${task}\n\n` +
  `Explore the codebase, then produce the plan.\n` +
  `Save the TOON output to: ${outputPath}`;

console.log(`\nPlanning (quick-plan)...`);
console.log(`Output: ${outputPath}\n`);

const startTime = Math.floor(Date.now() / 1000);
runAgent(config.quick_plan_command, systemPrompt + "\n\n" + userMessage);

await validateSpecToon(outputPath, config.quick_plan_command);
const endTime = Math.floor(Date.now() / 1000);

console.log(`\nquick-plan completed in ${formatDuration(startTime, endTime)}`);
