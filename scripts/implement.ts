import path from "node:path";
import { loadConfig, pickSpec, loadPrompt, loadSpecSteps, runAgent } from "./lib/specs.ts";

const config = await loadConfig();
const specName = await pickSpec();
if (!specName) process.exit(1);

const specPath = path.join("specs", specName);
console.log(`\nSelected: ${specName}`);

const preamble = (await loadPrompt("implement")).trimEnd() + "\n\n";

const steps = await loadSpecSteps(specPath);
if (!steps) process.exit(1);

console.log(`Found ${steps.length} step(s).`);

for (let idx = 0; idx < steps.length; idx++) {
  const step = steps[idx];
  const title = step.title ?? "";
  const goal = step.goal ?? "";
  const context = step.context ?? "";
  const instructions = step.instructions ?? "";
  const verification = step.verification ?? "";
  const stageTitle = step.stage_title;

  let label = `Step ${idx + 1}/${steps.length}`;
  if (stageTitle) label = `${label} (${stageTitle})`;
  console.log(`\n${label}: ${title}`);

  const prompt =
    preamble +
    `Step Title: ${title}\n` +
    `Goal: ${goal}\n\n` +
    `Context:\n${context}\n\n` +
    `Instructions:\n${instructions}\n\n` +
    `Verification:\n${verification}\n`;

  const exitCode = runAgent(config.implement_command, prompt);
  if (exitCode !== 0) {
    console.log(`Step failed with exit code ${exitCode}. Stopping.`);
    process.exit(exitCode);
  }
}
