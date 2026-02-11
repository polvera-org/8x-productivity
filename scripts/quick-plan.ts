import { askSpecName, loadPrompt, runOpencode, validateSpecJson } from "./lib/specs.ts";
import path from "node:path";

const task = process.argv.slice(2).join(" ").trim();
if (!task) {
  console.error("Usage: npx 8x quick-plan <task description>");
  process.exit(1);
}

const specPath = await askSpecName(task);
if (!specPath) process.exit(1);

const systemPrompt = await loadPrompt("quick-plan");
const outputPath = path.join(specPath, "spec.json");

const userMessage =
  `Task: ${task}\n\n` +
  `Explore the codebase, then produce the plan.\n` +
  `Save the JSON output to: ${outputPath}`;

console.log(`\nPlanning (quick-plan)...`);
console.log(`Output: ${outputPath}\n`);

runOpencode(systemPrompt + "\n\n" + userMessage);

await validateSpecJson(outputPath);
