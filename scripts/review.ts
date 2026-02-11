import path from "node:path";
import { loadConfig, pickSpec, loadPrompt, loadSpecAcceptanceCriteria, runAgent, formatDuration } from "./lib/specs.ts";

const config = await loadConfig();
const specName = await pickSpec();
if (!specName) process.exit(1);

const specPath = path.join("specs", specName);
console.log(`\nSelected: ${specName}`);

const preamble = (await loadPrompt("review")).trimEnd() + "\n\n";

const criteria = await loadSpecAcceptanceCriteria(specPath);
if (!criteria) process.exit(1);

console.log(`Found ${criteria.length} acceptance criteria.`);

const prompt = preamble + "Acceptance Criteria:\n" + JSON.stringify(criteria, null, 2);

const startTime = Math.floor(Date.now() / 1000);
const exitCode = runAgent(config.review_command, prompt);
const endTime = Math.floor(Date.now() / 1000);

console.log(`\nreview completed in ${formatDuration(startTime, endTime)}`);

if (exitCode !== 0) {
  console.log(`Review failed with exit code ${exitCode}. Stopping.`);
  process.exit(exitCode);
}
