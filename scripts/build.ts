#!/usr/bin/env tsx
/**
 * Build script — reads gitagent-compatible agent definitions from src/agents/
 * and renders them into CLI-specific output formats.
 *
 * Source format per agent (gitagent spec):
 *   src/agents/<name>/agent.yaml  — manifest (name, description, model, tools, agents)
 *   src/agents/<name>/SOUL.md     — agent prompt body
 *
 * Outputs:
 *   .claude/agents/<name>.md      — Claude Code format
 *   .opencode/agents/<name>.md    — OpenCode format
 *   .openclaw/<name>/SOUL.md      — OpenClaw format
 *   .openclaw/<name>/TOOLS.md     — OpenClaw local notes (preserved if exists)
 *   .a0proj/agents/<name>/        — Agent Zero format
 *   .codex/AGENTS.md              — Codex manifest (copy of root AGENTS.md)
 *   ~/.claude/agents/             — Global Claude Code install
 *   ~/.opencode/agents/           — Global OpenCode install
 *   ~/.codex/AGENTS.md            — Global Codex manifest
 *
 * Skills and commands are synced to all relevant targets as-is.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import yaml from "js-yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const home = process.env.HOME!;

const srcAgents = path.join(root, "src", "agents");
const srcSkills = path.join(root, "src", "skills");
const srcCommands = path.join(root, "src", "commands");

interface AgentMeta {
  spec_version: string;
  name: string;
  version: string;
  description: string;
  model?: { primary?: string; fallback?: string };
  tools?: string[];
  agents?: string[]; // sub-agents (orchestrator only)
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

function copyTree(src: string, dst: string): void {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === ".DS_Store") continue;
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyTree(srcPath, dstPath);
    } else {
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

const claudeDefaultTools = "Read, Edit, Bash, Write, Glob, Grep";
const claudeNovaTools = `${claudeDefaultTools}, Agent(${specialists.join(", ")})`;

// Output directories
const claudeAgentsDir = path.join(root, ".claude", "agents");
const opencodAgentsDir = path.join(root, ".opencode", "agents");
const openclawDir = path.join(root, ".openclaw");
const a0projAgentsDir = path.join(root, ".a0proj", "agents");
const codexSkillsDir = path.join(root, ".codex", "skills");
const codexPromptsDir = path.join(root, ".codex", "prompts");
const claudeSkillsDir = path.join(root, ".claude", "skills");
const claudeCommandsDir = path.join(root, ".claude", "commands");
const opencodeSkillsDir = path.join(root, ".opencode", "skills");
const opencodeCommandsDir = path.join(root, ".opencode", "commands");
const a0projSkillsDir = path.join(root, ".a0proj", "skills");
const homeClaudeAgentsDir = path.join(home, ".claude", "agents");
const homeClaudeSkillsDir = path.join(home, ".claude", "skills");
const homeClaudeCommandsDir = path.join(home, ".claude", "commands");
const homeOpencodeAgentsDir = path.join(home, ".opencode", "agents");
const homeOpencodeSkillsDir = path.join(home, ".opencode", "skills");
const homeOpencodeCommandsDir = path.join(home, ".opencode", "commands");
const homeCodexSkillsDir = path.join(home, ".codex", "skills");
const homeCodexPromptsDir = path.join(home, ".codex", "prompts");

// Reset output agent directories
resetDir(claudeAgentsDir);
resetDir(opencodAgentsDir);
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
  fs.writeFileSync(path.join(opencodAgentsDir, `${name}.md`), opencodeContent);

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

  fs.writeFileSync(
    path.join(a0AgentDir, "agent.json"),
    JSON.stringify({ title, description, context: description }, null, 2) + "\n"
  );
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
  homeClaudeSkillsDir,
  homeOpencodeSkillsDir,
  homeCodexSkillsDir,
]) {
  resetDir(dir);
  copyTree(srcSkills, dir);
}

// ── Commands sync ────────────────────────────────────────────────────────────
for (const dir of [
  claudeCommandsDir,
  opencodeCommandsDir,
  codexPromptsDir,
  homeClaudeCommandsDir,
  homeOpencodeCommandsDir,
  homeCodexPromptsDir,
]) {
  resetDir(dir);
  copyTree(srcCommands, dir);
}

// ── Codex AGENTS.md manifest ─────────────────────────────────────────────────
const agentsMdSrc = path.join(root, "AGENTS.md");
const codexAgentsMd = path.join(root, ".codex", "AGENTS.md");
const homeCodexAgentsMd = path.join(home, ".codex", "AGENTS.md");
fs.mkdirSync(path.dirname(codexAgentsMd), { recursive: true });
fs.mkdirSync(path.dirname(homeCodexAgentsMd), { recursive: true });
fs.copyFileSync(agentsMdSrc, codexAgentsMd);
fs.copyFileSync(agentsMdSrc, homeCodexAgentsMd);

// ── Home dir agent sync (claude + opencode) ──────────────────────────────────
resetDir(homeClaudeAgentsDir);
copyTree(claudeAgentsDir, homeClaudeAgentsDir);

resetDir(homeOpencodeAgentsDir);
copyTree(opencodAgentsDir, homeOpencodeAgentsDir);

console.log(
  `Rendered ${agents.length} agents into .claude/, .opencode/, .openclaw/, .a0proj/, ~/.claude/, ~/.opencode/`
);
console.log(
  `Synced skills into .claude/, .opencode/, .codex/, .a0proj/, ~/.claude/, ~/.opencode/, ~/.codex/`
);
console.log(
  `Synced commands into .claude/, .opencode/, .codex/, ~/.claude/, ~/.opencode/, ~/.codex/`
);
console.log(`Synced AGENTS.md into .codex/ and ~/.codex/`);
