import { readdir, readFile, mkdir, stat } from "node:fs/promises";
import { spawnSync, spawn } from "node:child_process";
import readline from "node:readline/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { encode as toonEncode, decode as toonDecode } from "@toon-format/toon";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, "..", "..");

const SPECS_DIR = "specs";
const PROMPTS_DIR = path.join(PACKAGE_ROOT, "src", "prompts");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const DEFAULT_COMMAND = "opencode run";

export interface Config {
  plan_command: string;
  implement_command: string;
  review_command: string;
}

const DEFAULT_CONFIG: Config = {
  plan_command: DEFAULT_COMMAND,
  implement_command: DEFAULT_COMMAND,
  review_command: DEFAULT_COMMAND,
};

async function readJsonFile(filePath: string): Promise<Record<string, unknown> | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    const data = JSON.parse(raw);
    if (typeof data === "object" && data !== null && !Array.isArray(data)) {
      return data as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

export async function loadConfig(): Promise<Config> {
  const globalPath = path.join(os.homedir(), ".8x", "config.json");
  const projectPath = path.join(process.cwd(), ".8x", "config.json");

  const globalData = await readJsonFile(globalPath);
  const projectData = await readJsonFile(projectPath);

  const merged = { ...DEFAULT_CONFIG };

  for (const data of [globalData, projectData]) {
    if (!data) continue;
    for (const key of Object.keys(DEFAULT_CONFIG) as (keyof Config)[]) {
      if (typeof data[key] === "string") {
        merged[key] = data[key] as string;
      }
    }
  }

  return merged;
}

// ---------------------------------------------------------------------------
// Spec folder helpers
// ---------------------------------------------------------------------------

export async function getSpecFolders(): Promise<string[]> {
  let entries: Awaited<ReturnType<typeof readdir>>;
  try {
    entries = await readdir(SPECS_DIR, { withFileTypes: true });
  } catch {
    return [];
  }
  const folders = entries.filter((e) => e.isDirectory());

  // Sort by mtime descending (newest first)
  const withMtime = await Promise.all(
    folders.map(async (f) => {
      const full = path.join(SPECS_DIR, f.name);
      const s = await stat(full);
      return { name: f.name, mtime: s.mtimeMs };
    }),
  );
  withMtime.sort((a, b) => b.mtime - a.mtime);
  return withMtime.map((f) => f.name);
}

export async function pickSpec(): Promise<string | null> {
  const folders = await getSpecFolders();
  if (folders.length === 0) {
    console.log("No specs found in /specs/");
    return null;
  }

  console.log("\nExisting specs:");
  for (let i = 0; i < folders.length; i++) {
    const suffix = i === 0 ? " (default)" : "";
    console.log(`  [${i + 1}] ${folders[i]}${suffix}`);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const choice = (await rl.question("\nPick a spec [1]: ")).trim();
  rl.close();

  if (!choice) return folders[0];

  const idx = Number.parseInt(choice, 10) - 1;
  if (Number.isNaN(idx) || idx < 0 || idx >= folders.length) {
    console.log(`Invalid choice: ${choice}`);
    return null;
  }
  return folders[idx];
}

export async function askSpecName(task: string): Promise<string | null> {
  const slug = task.toLowerCase().replace(/\s+/g, "-").slice(0, 40);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const name =
    (await rl.question(`\nSpec folder name [specs/${slug}]: `)).trim() || slug;
  rl.close();

  const specPath = path.join(SPECS_DIR, name);
  await mkdir(specPath, { recursive: true });
  return specPath;
}

// ---------------------------------------------------------------------------
// Prompt file loading
// ---------------------------------------------------------------------------

export async function loadPrompt(name: string): Promise<string> {
  const promptFile = path.join(PROMPTS_DIR, `${name}.md`);
  try {
    return await readFile(promptFile, "utf8");
  } catch {
    console.error(`Prompt file not found: ${promptFile}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// spec.toon loading
// ---------------------------------------------------------------------------

interface Step {
  title?: string;
  goal?: string;
  context?: string;
  instructions?: string;
  verification?: string;
  stage_title?: string;
  [key: string]: unknown;
}

interface Criterion {
  title?: string;
  requirement?: string;
  stage_title?: string;
  [key: string]: unknown;
}

async function readSpecToon(
  specPath: string,
): Promise<Record<string, unknown> | null> {
  const specFile = path.join(specPath, "spec.toon");
  let raw: string;
  try {
    raw = await readFile(specFile, "utf8");
  } catch {
    console.log(`spec.toon not found at ${specFile}`);
    return null;
  }
  try {
    const data = toonDecode(raw);
    if (typeof data !== "object" || data === null || !("plan" in data)) {
      console.log("spec.toon is missing a plan object");
      return null;
    }
    return data as Record<string, unknown>;
  } catch (err) {
    console.log(`spec.toon has invalid TOON: ${err}`);
    return null;
  }
}

export async function loadSpecSteps(specPath: string): Promise<Step[] | null> {
  const data = await readSpecToon(specPath);
  if (!data) return null;

  const plan = data.plan as Record<string, unknown>;
  const steps: Step[] = [];

  // Flat steps
  if (Array.isArray(plan.steps)) {
    for (const step of plan.steps) {
      if (typeof step === "object" && step !== null) steps.push(step as Step);
    }
    return steps;
  }

  // Staged steps
  if (Array.isArray(plan.stages)) {
    for (const stage of plan.stages) {
      if (typeof stage !== "object" || stage === null) continue;
      const s = stage as Record<string, unknown>;
      const stageTitle = s.title as string | undefined;
      if (!Array.isArray(s.steps)) continue;
      for (const step of s.steps) {
        if (typeof step !== "object" || step === null) continue;
        const copy: Step = { ...(step as Step) };
        if (stageTitle && !copy.stage_title) copy.stage_title = stageTitle;
        steps.push(copy);
      }
    }
    return steps;
  }

  console.log("spec.toon plan must include steps or stages");
  return null;
}

export async function loadSpecAcceptanceCriteria(
  specPath: string,
): Promise<Criterion[] | null> {
  const data = await readSpecToon(specPath);
  if (!data) return null;

  const plan = data.plan as Record<string, unknown>;
  const criteria: Criterion[] = [];

  // Flat acceptance_criteria
  if (Array.isArray(plan.acceptance_criteria)) {
    for (const item of plan.acceptance_criteria) {
      if (typeof item !== "object" || item === null) {
        console.log(
          "spec.toon plan acceptance_criteria must be a list of objects",
        );
        return null;
      }
      criteria.push(item as Criterion);
    }
    return criteria;
  }

  // Staged acceptance_criteria
  if (Array.isArray(plan.stages)) {
    for (const stage of plan.stages) {
      if (typeof stage !== "object" || stage === null) {
        console.log("spec.toon plan stages must be a list of objects");
        return null;
      }
      const s = stage as Record<string, unknown>;
      const stageTitle = s.title as string | undefined;
      if (!Array.isArray(s.acceptance_criteria)) {
        console.log("spec.toon stage acceptance_criteria must be a list");
        return null;
      }
      for (const item of s.acceptance_criteria) {
        if (typeof item !== "object" || item === null) {
          console.log(
            "spec.toon stage acceptance_criteria must be a list of objects",
          );
          return null;
        }
        const copy: Criterion = { ...(item as Criterion) };
        if (stageTitle && !copy.stage_title) copy.stage_title = stageTitle;
        criteria.push(copy);
      }
    }
    return criteria;
  }

  console.log("spec.toon plan must include acceptance_criteria or stages");
  return null;
}

// ---------------------------------------------------------------------------
// TOON validation with auto-fix retry
// ---------------------------------------------------------------------------

export async function validateSpecToon(
  outputPath: string,
  command: string,
  maxRetries = 3,
): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let raw: string;
    try {
      raw = await readFile(outputPath, "utf8");
    } catch {
      console.log(`spec.toon was not created at ${outputPath}`);
      return;
    }

    try {
      toonDecode(raw);
      console.log("spec.toon is valid.");
      return;
    } catch (err) {
      console.log(
        `\nspec.toon has invalid TOON (attempt ${attempt}/${maxRetries}): ${err}`,
      );
      if (attempt === maxRetries) {
        console.log("Max retries reached. Please fix the TOON manually.");
        return;
      }

      const fixPrompt =
        `The file at ${outputPath} contains invalid TOON.\n` +
        `Error: ${err}\n\n` +
        `Read the file, fix ONLY the TOON syntax error, and save it back to ${outputPath}. ` +
        `Do not change the content, only fix the formatting to make it valid TOON.\n\n` +
        `TOON syntax rules: indentation-based nesting (2-space indent), key: value pairs, ` +
        `arrays declared with key[N]: header (N = item count), list items start with "- ", ` +
        `minimal quoting (only quote values containing commas, colons, brackets, or leading/trailing whitespace).`;

      console.log("Attempting auto-fix...\n");
      runAgent(command, fixPrompt);
    }
  }
}

// ---------------------------------------------------------------------------
// TOON encoding (re-export for use in command scripts)
// ---------------------------------------------------------------------------

export { toonEncode as encodeToon };

// ---------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------

export function formatDuration(startSec: number, endSec: number): string {
  const total = endSec - startSec;
  const mins = Math.floor(total / 60);
  const secs = Math.floor(total % 60);
  if (mins > 0) return `${mins}m${secs.toString().padStart(2, "0")}s`;
  return `${secs}s`;
}

// ---------------------------------------------------------------------------
// Agent runner
// ---------------------------------------------------------------------------

function shellEscape(value: string): string {
  return "'" + value.replace(/'/g, "'\\''") + "'";
}

export function runAgent(command: string, prompt: string): number {
  const fullCommand = `${command} ${shellEscape(prompt)}`;
  const result = spawnSync("sh", ["-c", fullCommand], {
    stdio: "inherit",
  });

  if (result.error) {
    console.error(`Failed to run command: ${result.error.message}`);
    process.exit(1);
  }

  return result.status ?? 1;
}

// ---------------------------------------------------------------------------
// Async agent runner (for use with progress display)
// ---------------------------------------------------------------------------

export interface RunAgentAsyncOptions {
  onStdout?: (chunk: string) => void;
  onStderr?: (chunk: string) => void;
}

export function runAgentAsync(
  command: string,
  prompt: string,
  options?: RunAgentAsyncOptions,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const fullCommand = `${command} ${shellEscape(prompt)}`;
    const child = spawn("sh", ["-c", fullCommand], {
      stdio: ["inherit", "pipe", "pipe"],
      env: {
        ...process.env,
        FORCE_COLOR: "1",
        CLICOLOR_FORCE: "1",
      },
    });

    child.stdout?.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      if (options?.onStdout) {
        options.onStdout(text);
      } else {
        process.stdout.write(text);
      }
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      if (options?.onStderr) {
        options.onStderr(text);
      } else {
        process.stderr.write(text);
      }
    });

    child.on("close", (code) => {
      resolve(code ?? 1);
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}
