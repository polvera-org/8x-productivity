import { askSpecName, loadConfig, loadPrompt, runAgent, validateSpecXml, formatDuration } from "./lib/specs.ts";
import path from "node:path";

const task = process.argv.slice(2).join(" ").trim();
if (!task) {
  console.error("Usage: 8x plan <task description>");
  process.exit(1);
}

const config = await loadConfig();
const specPath = await askSpecName(task);
if (!specPath) process.exit(1);

const systemPrompt = await loadPrompt("plan");
const outputPath = path.join(specPath, "spec.xml");

const userMessage =
  `Task: ${task}\n\n` +
  `Explore the codebase, then produce the plan.\n` +
  `Save the XML output to: ${outputPath}`;

console.log(`\nPlanning (plan)...`);
console.log(`Output: ${outputPath}\n`);

const startTime = Math.floor(Date.now() / 1000);
runAgent(config.plan_command, systemPrompt + "\n\n" + userMessage);

await validateSpecXml(outputPath, config.plan_command);
const endTime = Math.floor(Date.now() / 1000);

console.log(`\nplan completed in ${formatDuration(startTime, endTime)}`);
