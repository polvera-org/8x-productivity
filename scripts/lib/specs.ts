import { readdir, readFile, mkdir, stat } from "node:fs/promises";
import { spawnSync, spawn } from "node:child_process";
import readline from "node:readline/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { XMLParser, XMLBuilder } from "fast-xml-parser";

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
  commit_prefix: string;
}

const DEFAULT_CONFIG: Config = {
  plan_command: DEFAULT_COMMAND,
  implement_command: DEFAULT_COMMAND,
  review_command: DEFAULT_COMMAND,
  commit_prefix: "",
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
// spec.xml loading
// ---------------------------------------------------------------------------

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  processEntities: true,
  isArray: (tagName) =>
    tagName === "step" || tagName === "criterion",
});

interface Step {
  title?: string;
  goal?: string;
  context?: string;
  instructions?: string;
  verification?: string;
  [key: string]: unknown;
}

interface Criterion {
  title?: string;
  requirement?: string;
  [key: string]: unknown;
}

async function readSpecXml(
  specPath: string,
): Promise<Record<string, unknown> | null> {
  const specFile = path.join(specPath, "spec.xml");
  let raw: string;
  try {
    raw = await readFile(specFile, "utf8");
  } catch {
    console.log(`spec.xml not found at ${specFile}`);
    return null;
  }
  try {
    const data = xmlParser.parse(raw);
    if (typeof data !== "object" || data === null || !("plan" in data)) {
      console.log("spec.xml is missing a <plan> root element");
      return null;
    }
    return data as Record<string, unknown>;
  } catch (err) {
    console.log(`spec.xml has invalid XML: ${err}`);
    return null;
  }
}

export async function loadSpecSteps(specPath: string): Promise<Step[] | null> {
  const data = await readSpecXml(specPath);
  if (!data) return null;

  const plan = data.plan as Record<string, unknown>;
  const stepsContainer = plan.steps as Record<string, unknown> | undefined;

  if (
    !stepsContainer ||
    typeof stepsContainer !== "object" ||
    !Array.isArray(stepsContainer.step)
  ) {
    console.log("spec.xml <plan> must include a <steps> element with <step> children");
    return null;
  }

  const steps: Step[] = [];
  for (const step of stepsContainer.step) {
    if (typeof step === "object" && step !== null) steps.push(step as Step);
  }
  return steps;
}

export async function loadSpecAcceptanceCriteria(
  specPath: string,
): Promise<Criterion[] | null> {
  const data = await readSpecXml(specPath);
  if (!data) return null;

  const plan = data.plan as Record<string, unknown>;
  const acContainer = plan.acceptance_criteria as Record<string, unknown> | undefined;

  if (
    !acContainer ||
    typeof acContainer !== "object" ||
    !Array.isArray(acContainer.criterion)
  ) {
    console.log(
      "spec.xml <plan> must include an <acceptance_criteria> element with <criterion> children",
    );
    return null;
  }

  const criteria: Criterion[] = [];
  for (const item of acContainer.criterion) {
    if (typeof item !== "object" || item === null) {
      console.log("spec.xml <criterion> entries must be valid elements");
      return null;
    }
    criteria.push(item as Criterion);
  }
  return criteria;
}

// ---------------------------------------------------------------------------
// XML validation with auto-fix retry
// ---------------------------------------------------------------------------

export async function validateSpecXml(
  outputPath: string,
  command: string,
  maxRetries = 3,
): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let raw: string;
    try {
      raw = await readFile(outputPath, "utf8");
    } catch {
      console.log(`spec.xml was not created at ${outputPath}`);
      return;
    }

    try {
      xmlParser.parse(raw);
      console.log("spec.xml is valid.");
      return;
    } catch (err) {
      console.log(
        `\nspec.xml has invalid XML (attempt ${attempt}/${maxRetries}): ${err}`,
      );
      if (attempt === maxRetries) {
        console.log("Max retries reached. Please fix the XML manually.");
        return;
      }

      const fixPrompt =
        `The file at ${outputPath} contains invalid XML.\n` +
        `Error: ${err}\n\n` +
        `Read the file, fix ONLY the XML syntax error, and save it back to ${outputPath}. ` +
        `Do not change the content, only fix the formatting to make it valid XML.\n\n` +
        `XML rules: proper opening/closing tags, CDATA sections for content with special characters ` +
        `(<![CDATA[...]]>), proper entity escaping for & < > outside of CDATA, ` +
        `and a single <plan> root element.`;

      console.log("Attempting auto-fix...\n");
      runAgent(command, fixPrompt);
    }
  }
}

// ---------------------------------------------------------------------------
// XML encoding (for use in command scripts)
// ---------------------------------------------------------------------------

const xmlBuilder = new XMLBuilder({
  format: true,
  indentBy: "  ",
  processEntities: true,
  cdataPropName: "__cdata",
});

export function encodeXml(data: unknown): string {
  return xmlBuilder.build(data) as string;
}

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
