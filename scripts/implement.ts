import path from "node:path";
import { loadConfig, pickSpec, loadPrompt, loadSpecSteps, runAgentAsync, formatDuration } from "./lib/specs.ts";
import { StickyFooter, renderStepProgress, type StepState } from "./lib/progress.ts";

const config = await loadConfig();
const specName = await pickSpec();
if (!specName) process.exit(1);

const specPath = path.join("specs", specName);
console.log(`\nSelected: ${specName}`);

const preamble = (await loadPrompt("implement")).trimEnd() + "\n\n";

const loadedSteps = await loadSpecSteps(specPath);
if (!loadedSteps) process.exit(1);

console.log(`Found ${loadedSteps.length} step(s).\n`);

// Build step state for progress tracking
const stepStates: StepState[] = loadedSteps.map((s) => ({
  title: s.title ?? "Untitled step",
  stageTitle: s.stage_title,
  status: "pending" as const,
}));

const useTTY = process.stdout.isTTY === true;
const footer = new StickyFooter();

// Footer line count = 1 (separator) + steps + 1 (bottom padding)
const footerLineCount = stepStates.length + 2;

if (useTTY) {
  footer.start(footerLineCount);
  footer.update(renderStepProgress(stepStates, process.stdout.columns || 80));
}

const overallStart = Math.floor(Date.now() / 1000);

for (let idx = 0; idx < loadedSteps.length; idx++) {
  const step = loadedSteps[idx];
  const title = step.title ?? "";
  const goal = step.goal ?? "";
  const context = step.context ?? "";
  const instructions = step.instructions ?? "";
  const verification = step.verification ?? "";
  const stageTitle = step.stage_title;

  // Update step status to running
  stepStates[idx].status = "running";

  let label = `Step ${idx + 1}/${loadedSteps.length}`;
  if (stageTitle) label = `${label} (${stageTitle})`;

  if (useTTY) {
    footer.update(renderStepProgress(stepStates, process.stdout.columns || 80));
    // Print step header into the scrollable area
    footer.writeOutput(`\n${label}: ${title}\n`);
  } else {
    console.log(`\n${label}: ${title}`);
  }

  const prompt =
    preamble +
    `Step Title: ${title}\n` +
    `Goal: ${goal}\n\n` +
    `Context:\n${context}\n\n` +
    `Instructions:\n${instructions}\n\n` +
    `Verification:\n${verification}\n`;

  const stepStart = Math.floor(Date.now() / 1000);

  // Set up a timer to update elapsed time in the footer while the agent runs
  let elapsed = "0s";
  let elapsedTimer: ReturnType<typeof setInterval> | null = null;

  if (useTTY) {
    elapsedTimer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      elapsed = formatDuration(stepStart, now);
      stepStates[idx].duration = elapsed;
      footer.update(renderStepProgress(stepStates, process.stdout.columns || 80));
    }, 1000);
  }

  const exitCode = await runAgentAsync(config.implement_command, prompt, {
    onStdout: (chunk) => footer.writeOutput(chunk),
    onStderr: (chunk) => footer.writeError(chunk),
  });

  if (elapsedTimer) clearInterval(elapsedTimer);

  const stepEnd = Math.floor(Date.now() / 1000);
  const stepDuration = formatDuration(stepStart, stepEnd);

  if (exitCode !== 0) {
    stepStates[idx].status = "failed";
    stepStates[idx].duration = stepDuration;

    if (useTTY) {
      footer.update(renderStepProgress(stepStates, process.stdout.columns || 80));
      // Give a moment for the user to see the final state
      footer.cleanup();
    }

    console.log(`${label} failed with exit code ${exitCode}. Stopping.`);
    process.exit(exitCode);
  }

  stepStates[idx].status = "done";
  stepStates[idx].duration = stepDuration;

  if (useTTY) {
    footer.update(renderStepProgress(stepStates, process.stdout.columns || 80));
    footer.writeOutput(`${label} completed in ${stepDuration}\n`);
  } else {
    console.log(`${label} completed in ${stepDuration}`);
  }
}

if (useTTY) {
  footer.cleanup();
}

const overallEnd = Math.floor(Date.now() / 1000);
console.log(`\nimplement completed in ${formatDuration(overallStart, overallEnd)}`);
