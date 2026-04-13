#!/usr/bin/env tsx
/**
 * Build script — reads gitagent-compatible agent definitions from src/agents/
 * and renders them into CLI-specific output formats.
 *
 * Source format per agent (gitagent spec):
 *   src/agents/<name>/agent.yaml  — manifest (name, description, model, tools, agents)
 *   src/agents/<name>/SOUL.md     — agent prompt body
 *
 * Outputs (relative to outRoot, default: project root):
 *   .claude/agents/<name>.md      — Claude Code format
 *   .opencode/agents/<name>.md    — OpenCode format
 *   .openclaw/<name>/SOUL.md      — OpenClaw format
 *   .openclaw/<name>/TOOLS.md     — OpenClaw local notes (preserved if exists)
 *   .a0proj/agents/<name>/        — Agent Zero format
 *   .codex/AGENTS.md              — Codex manifest (copy of root AGENTS.md)
 *
 * Skills and commands are synced to all relevant targets as-is.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import yaml from "js-yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Source root is always relative to this script
const srcRoot = path.resolve(__dirname, "..");
const srcAgents = path.join(srcRoot, "src", "agents");
const srcSkills = path.join(srcRoot, "src", "skills");
const srcCommands = path.join(srcRoot, "src", "commands");
const agentsMdSrc = path.join(srcRoot, "AGENTS.md");

interface AgentMeta {
  spec_version: string;
  name: string;
  version: string;
  description: string;
  model?: { primary?: string; fallback?: string };
  tools?: string[];
  agents?: string[];
}

function readAgent(agentDir: string): { meta: AgentMeta; soul: string } {
  const yamlPath = path.join(agentDir, "agent.yaml");
  const soulPath = path.join(agentDir, "SOUL.md");
  const meta = yaml.load(fs.readFileSync(yamlPath, "utf8")) as AgentMeta;
  const soul = fs.readFileSync(soulPath, "utf8").trimEnd() + "\n";
  return { meta, soul };
}

function resetDir(dir: string): void {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true });
  fs.mkdirSync(dir, { recursive: true });
}

export function copyTree(
  src: string,
  dst: string,
  preserveFiles?: string[]
): void {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === ".DS_Store") continue;
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyTree(srcPath, dstPath, preserveFiles);
    } else {
      if (preserveFiles?.includes(entry.name) && fs.existsSync(dstPath))
        continue;
      fs.mkdirSync(path.dirname(dstPath), { recursive: true });
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

const OPENCLAW_TOOLS_TEMPLATE = `# TOOLS.md - Local Notes

Skills define how tools work. This file is for your specifics -- the stuff that's unique to this agent's setup.

## What Goes Here

Things like:

- SSH hosts and aliases
- Preferred voices for TTS
- Device nicknames
- Machine-local caveats
- Anything environment-specific

## Why Separate?

Skills are shared. This file is local. Keeping them apart means you can update shared skills without losing agent-specific notes.

***

Add whatever helps this agent do its job. This is its cheat sheet.
`;

const claudeDefaultTools = "Read, Edit, Bash, Write, Glob, Grep";

/**
 * Build all agent output formats into outRoot.
 * Source files always come from the package's src/ directory.
 * Outputs go to outRoot/.claude/, outRoot/.opencode/, etc.
 */
export function buildAll(outRoot: string = srcRoot): void {
  // Collect agent directories (sorted for deterministic output)
  const agentDirs = fs
    .readdirSync(srcAgents, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => path.join(srcAgents, e.name))
    .sort();

  const agents = agentDirs.map(readAgent);
  const specialists = agents
    .map((a) => a.meta.name)
    .filter((n) => n !== "nova")
    .sort();

  const claudeNovaTools = `${claudeDefaultTools}, Agent(${specialists.join(", ")})`;

  // Output directories
  const claudeAgentsDir = path.join(outRoot, ".claude", "agents");
  const opencodeAgentsDir = path.join(outRoot, ".opencode", "agents");
  const openclawDir = path.join(outRoot, ".openclaw");
  const a0projAgentsDir = path.join(outRoot, ".a0proj", "agents");
  const claudeSkillsDir = path.join(outRoot, ".claude", "skills");
  const claudeCommandsDir = path.join(outRoot, ".claude", "commands");
  const opencodeSkillsDir = path.join(outRoot, ".opencode", "skills");
  const opencodeCommandsDir = path.join(outRoot, ".opencode", "commands");
  const codexSkillsDir = path.join(outRoot, ".codex", "skills");
  const codexPromptsDir = path.join(outRoot, ".codex", "prompts");
  const a0projSkillsDir = path.join(outRoot, ".a0proj", "skills");

  // Reset output agent directories
  resetDir(claudeAgentsDir);
  resetDir(opencodeAgentsDir);
  resetDir(a0projAgentsDir);
  // Don't reset openclaw root — we preserve TOOLS.md files

  // Render agents
  for (const { meta, soul } of agents) {
    const { name, description } = meta;
    const isNova = name === "nova";

    // ── Claude Code ──────────────────────────────────────────────────────────
    const claudeTools = isNova ? claudeNovaTools : claudeDefaultTools;
    const claudeContent = [
      "---",
      `name: ${name}`,
      `description: ${description}`,
      `tools: ${claudeTools}`,
      "model: inherit",
      "---",
      "",
      soul,
    ].join("\n");
    fs.writeFileSync(path.join(claudeAgentsDir, `${name}.md`), claudeContent);

    // ── OpenCode ─────────────────────────────────────────────────────────────
    const opencodeMode = isNova ? "primary" : "subagent";
    const opencodeContent = [
      "---",
      `description: ${description}`,
      `mode: ${opencodeMode}`,
      "tools:",
      "  read: true",
      "  edit: true",
      "  bash: true",
      "  write: true",
      "---",
      "",
      soul,
    ].join("\n");
    fs.writeFileSync(
      path.join(opencodeAgentsDir, `${name}.md`),
      opencodeContent
    );

    // ── OpenClaw ─────────────────────────────────────────────────────────────
    const openclawAgentDir = path.join(openclawDir, name);
    fs.mkdirSync(openclawAgentDir, { recursive: true });
    fs.writeFileSync(path.join(openclawAgentDir, "SOUL.md"), soul);
    const toolsPath = path.join(openclawAgentDir, "TOOLS.md");
    if (!fs.existsSync(toolsPath)) {
      fs.writeFileSync(toolsPath, OPENCLAW_TOOLS_TEMPLATE);
    }

    // ── Agent Zero ───────────────────────────────────────────────────────────
    const a0AgentDir = path.join(a0projAgentsDir, name);
    const a0PromptsDir = path.join(a0AgentDir, "prompts");
    fs.mkdirSync(a0PromptsDir, { recursive: true });

    // Extract title from first H1 in SOUL.md
    const titleMatch = soul.match(/^#\s+(.+)$/m);
    const title = titleMatch
      ? titleMatch[1].trim()
      : name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    // agent.yaml (Agent Zero v0.9+ format)
    const a0AgentYaml = yaml.dump({
      title,
      description,
      context: description,
    });
    fs.writeFileSync(path.join(a0AgentDir, "agent.yaml"), a0AgentYaml);
    fs.writeFileSync(
      path.join(a0PromptsDir, "agent.system.main.role.md"),
      soul
    );
  }

  // ── Skills sync ─────────────────────────────────────────────────────────────
  for (const dir of [
    claudeSkillsDir,
    opencodeSkillsDir,
    codexSkillsDir,
    a0projSkillsDir,
  ]) {
    resetDir(dir);
    copyTree(srcSkills, dir);
  }

  // ── Commands sync ────────────────────────────────────────────────────────────
  for (const dir of [claudeCommandsDir, opencodeCommandsDir, codexPromptsDir]) {
    resetDir(dir);
    copyTree(srcCommands, dir);
  }

  // ── Codex AGENTS.md manifest ─────────────────────────────────────────────────
  const codexAgentsMd = path.join(outRoot, ".codex", "AGENTS.md");
  fs.mkdirSync(path.dirname(codexAgentsMd), { recursive: true });
  fs.copyFileSync(agentsMdSrc, codexAgentsMd);
}

// ── CLI entry point ───────────────────────────────────────────────────────────
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  buildAll();
  const agentCount = fs
    .readdirSync(srcAgents, { withFileTypes: true })
    .filter((e) => e.isDirectory()).length;
  console.log(
    `Rendered ${agentCount} agents into .claude/, .opencode/, .openclaw/, .a0proj/, .codex/`
  );
  console.log(`Synced skills into .claude/, .opencode/, .codex/, .a0proj/`);
  console.log(`Synced commands into .claude/, .opencode/, .codex/`);
  console.log(`Synced AGENTS.md into .codex/`);
}
