import { cp, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline/promises";
import process from "node:process";

const AGENT_ZERO_DEFAULT_BASE_DIR = "/a0/usr";

type Frontmatter = {
  name: string;
  description: string;
  body: string;
};

const toTitleCase = (value: string) =>
  value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");

const parseFrontmatter = (content: string, fallbackName: string): Frontmatter => {
  if (!content.startsWith("---")) {
    return {
      name: fallbackName,
      description: "",
      body: content.trimStart(),
    };
  }

  const lines = content.split(/\r?\n/);
  if (lines[0] !== "---") {
    return {
      name: fallbackName,
      description: "",
      body: content.trimStart(),
    };
  }

  const endIndex = lines.indexOf("---", 1);
  if (endIndex === -1) {
    return {
      name: fallbackName,
      description: "",
      body: content.trimStart(),
    };
  }

  const frontmatter = lines.slice(1, endIndex).join("\n");
  const body = lines.slice(endIndex + 1).join("\n").trimStart();
  const nameMatch = frontmatter.match(/^name:\s*(.+)\s*$/m);
  const descriptionMatch = frontmatter.match(/^description:\s*(.+)\s*$/m);

  return {
    name: nameMatch ? nameMatch[1].trim() : fallbackName,
    description: descriptionMatch ? descriptionMatch[1].trim() : "",
    body,
  };
};

const deriveContext = (body: string, description: string, title: string) => {
  const line = body
    .split(/\r?\n/)
    .map((value) => value.trim())
    .find((value) => value.length > 0);
  if (line) {
    return line.replace(/^#+\s*/, "");
  }
  if (description) {
    return description;
  }
  return `Agent specialized in ${title.toLowerCase()} tasks.`;
};

const ensureDir = async (dir: string) => {
  await mkdir(dir, { recursive: true });
};

const fileExists = async (filePath: string) => {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
};

const parseArgs = (argv: string[]) => {
  const result: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      continue;
    }
    const [key, value] = arg.slice(2).split("=", 2);
    if (value !== undefined) {
      result[key] = value;
    } else if (argv[index + 1] && !argv[index + 1].startsWith("--")) {
      result[key] = argv[index + 1];
      index += 1;
    } else {
      result[key] = "true";
    }
  }
  return result;
};

const isDirectory = async (dirPath: string) => {
  try {
    const info = await stat(dirPath);
    return info.isDirectory();
  } catch {
    return false;
  }
};

const copyDirContents = async (sourceDir: string, destinationDir: string) => {
  await ensureDir(destinationDir);
  const entries = await readdir(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const destinationPath = path.join(destinationDir, entry.name);
    await cp(sourcePath, destinationPath, { recursive: entry.isDirectory() });
  }
};

const copyAgentFiles = async (sourceAgentsDir: string, targetAgentsDir: string) => {
  await ensureDir(targetAgentsDir);
  const entries = await readdir(sourceAgentsDir, { withFileTypes: true });
  const agentFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name);

  for (const agentFile of agentFiles) {
    const sourceFile = path.join(sourceAgentsDir, agentFile);
    const targetFile = path.join(targetAgentsDir, agentFile);
    await cp(sourceFile, targetFile);
  }
};

const buildOpencodeFrontmatter = (description: string) => `---\n` +
  `description: ${description}\n` +
  `mode: subagent\n` +
  `tools:\n` +
  `  write: true\n` +
  `  edit: true\n` +
  `  bash: true\n` +
  `---\n\n`;

const updateOpencodeAgents = async (agentsDir: string) => {
  const entries = await readdir(agentsDir, { withFileTypes: true });
  const agentFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.join(agentsDir, entry.name));

  for (const agentFile of agentFiles) {
    const content = await readFile(agentFile, "utf8");
    const { description, body } = parseFrontmatter(
      content,
      path.basename(agentFile, ".md"),
    );
    const updated = `${buildOpencodeFrontmatter(description)}${body}`;
    await writeFile(agentFile, updated, "utf8");
  }
};

const scaffoldAgentZero = async (
  sourceAgentsDir: string,
  targetAgentsDir: string,
  communicationPromptPath: string,
) => {
  await ensureDir(targetAgentsDir);
  const communicationPrompt = await readFile(communicationPromptPath, "utf8");
  const entries = await readdir(sourceAgentsDir, { withFileTypes: true });
  const agentFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.join(sourceAgentsDir, entry.name));

  for (const agentFile of agentFiles) {
    const content = await readFile(agentFile, "utf8");
    const fallbackName = path.basename(agentFile, ".md");
    const { name, description, body } = parseFrontmatter(content, fallbackName);
    const title = toTitleCase(name);
    const context = deriveContext(body, description, title);
    const agentDir = path.join(targetAgentsDir, name);
    const promptsDir = path.join(agentDir, "prompts");

    await ensureDir(promptsDir);

    const agentJson = {
      title,
      description: description || context,
      context,
    };

    const contextLine = description || `agent specialized in ${title.toLowerCase()} tasks`;
    const contextFile = `# ${title}\n- ${contextLine}\n`;
    const roleFile = body.trimStart();

    await writeFile(
      path.join(agentDir, "agent.json"),
      `${JSON.stringify(agentJson, null, 2)}\n`,
      "utf8",
    );
    await writeFile(path.join(agentDir, "_context.md"), contextFile, "utf8");
    await writeFile(
      path.join(promptsDir, "agent.system.main.role.md"),
      roleFile,
      "utf8",
    );
    await writeFile(
      path.join(promptsDir, "agent.system.main.communication.md"),
      communicationPrompt,
      "utf8",
    );
  }
};

const resolveAgentZeroPaths = (baseDir: string) => {
  return {
    agentsDir: path.join(baseDir, "agents"),
    skillsDir: path.join(baseDir, "skills", "8x-productivity"),
  };
};

const run = async () => {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(scriptDir, "..");
  const sourceAgentsDir = path.join(repoRoot, "src", "agents");
  const skillsSourceDir = path.join(repoRoot, "src", "skills");
  const communicationPromptPath = path.join(
    repoRoot,
    "src",
    "prompts",
    "agent.system.main.communication.md",
  );

  if (!(await fileExists(communicationPromptPath))) {
    throw new Error(
      `Missing communication prompt: ${communicationPromptPath}`,
    );
  }

  const args = parseArgs(process.argv.slice(2));
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const showHelp = args.help === "true";
  if (showHelp) {
    console.log("Usage: npx 8xp install --platform=<platform> [--path=<path>]");
    console.log("Platforms: opencode, claude-code, cursor, agentzero");
    console.log(
      "Agent Zero: --path should be the base /usr directory containing agents/ and skills/",
    );
    rl.close();
    return;
  }

  let cliName = "";
  let targetDirName = "";

  const platformInput = args.platform?.toLowerCase();
  if (platformInput) {
    switch (platformInput) {
      case "opencode":
        cliName = "opencode";
        targetDirName = ".opencode";
        break;
      case "claude-code":
      case "claude":
        cliName = "claude-code";
        targetDirName = ".claude";
        break;
      case "cursor":
        cliName = "cursor";
        targetDirName = ".cursor";
        break;
      case "agent-zero":
      case "agentzero":
        cliName = "agent-zero";
        break;
      default:
        rl.close();
        throw new Error("Invalid --platform. Use opencode, claude-code, cursor, or agentzero.");
    }
  } else {
    console.log("Select CLI to install agents for:");
    console.log("1) opencode");
    console.log("2) claude-code");
    console.log("3) cursor");
    console.log("4) agent-zero");
    const cliChoice = (await rl.question("")).trim();
    switch (cliChoice) {
      case "1":
      case "opencode":
        cliName = "opencode";
        targetDirName = ".opencode";
        break;
      case "2":
      case "claude-code":
      case "claude":
        cliName = "claude-code";
        targetDirName = ".claude";
        break;
      case "3":
      case "cursor":
        cliName = "cursor";
        targetDirName = ".cursor";
        break;
      case "4":
      case "agent-zero":
      case "agentzero":
        cliName = "agent-zero";
        break;
      default:
        rl.close();
        throw new Error("Invalid selection. Please choose 1, 2, 3, or 4.");
    }
  }

  if (cliName === "agent-zero") {
    const basePath = args.path?.trim();
    const targetBaseDir = basePath
      ? basePath
      : (
          await rl.question(
            `Enter agent-zero base path (leave empty for ${AGENT_ZERO_DEFAULT_BASE_DIR}):\n`,
          )
        ).trim();

    const baseDir = targetBaseDir || AGENT_ZERO_DEFAULT_BASE_DIR;
    const { agentsDir, skillsDir } = resolveAgentZeroPaths(baseDir);
    await scaffoldAgentZero(
      sourceAgentsDir,
      agentsDir,
      communicationPromptPath,
    );
    await copyDirContents(skillsSourceDir, skillsDir);
    rl.close();
    console.log(`Agents installed to ${agentsDir} for ${cliName}.`);
    console.log(`Skills installed to ${skillsDir} for ${cliName}.`);
    return;
  }

  const projectPathInput = args.path
    ? args.path.trim()
    : (
        await rl.question(
          "Enter project path (leave empty for current directory):\n",
        )
      ).trim();
  const projectPath = projectPathInput || process.cwd();
  if (!(await isDirectory(projectPath))) {
    rl.close();
    throw new Error(`Project path does not exist: ${projectPath}`);
  }
  const targetParentDir = path.join(projectPath, targetDirName);
  const targetAgentsDir = path.join(targetParentDir, "agents");
  const targetSkillsDir = path.join(targetParentDir, "skills");
  await ensureDir(targetParentDir);

  await copyAgentFiles(sourceAgentsDir, targetAgentsDir);
  await copyDirContents(skillsSourceDir, targetSkillsDir);

  if (cliName === "opencode") {
    await updateOpencodeAgents(targetAgentsDir);
  }

  rl.close();
  console.log(`Agents installed to ${targetAgentsDir} for ${cliName}.`);
  console.log(`Skills installed to ${targetSkillsDir} for ${cliName}.`);
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
