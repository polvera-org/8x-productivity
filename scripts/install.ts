#!/usr/bin/env tsx
/**
 * Interactive install wizard for 8x-productivity agents.
 * Run via: npm run setup
 */

import { checkbox, input, select } from "@inquirer/prompts";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { fileURLToPath } from "url";
import { buildAll, copyTree } from "./build.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const home = os.homedir();

// ── ANSI helpers ──────────────────────────────────────────────────────────────
const reset = "\x1b[0m";
const bold = (s: string) => `\x1b[1m${s}${reset}`;
const dim = (s: string) => `\x1b[2m${s}${reset}`;
const green = (s: string) => `\x1b[32m${s}${reset}`;
const cyan = (s: string) => `\x1b[36m${s}${reset}`;
const yellow = (s: string) => `\x1b[33m${s}${reset}`;

function tilde(p: string): string {
  return p.startsWith(home) ? p.replace(home, "~") : p;
}

function resolvePath(p: string): string {
  return path.resolve(p.replace(/^~/, home));
}

// ── Banner ────────────────────────────────────────────────────────────────────
function printBanner(): void {
  console.log("");
  console.log("  ┌─────────────────────────────────────────┐");
  console.log(
    `  │  ${bold("8x-productivity")} · Agent Installer        │`
  );
  console.log("  └─────────────────────────────────────────┘");
  console.log("");
}

// ── Install step ──────────────────────────────────────────────────────────────
function installStep(
  label: string,
  src: string,
  dst: string,
  preserveFiles?: string[]
): void {
  process.stdout.write(`  ${dim("Installing")} ${cyan(label)} ${dim("→")} ${dim(tilde(dst))} `);
  copyTree(src, dst, preserveFiles);
  console.log(green("✓"));
}

// ── Main wizard ───────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  printBanner();

  // ── Step 1: Scope (for standard coding CLIs) ──────────────────────────────
  const scope = await select({
    message: "Install Claude / OpenCode / Codex agents",
    choices: [
      {
        name: `Global  ${dim("— ~/.claude, ~/.opencode, ~/.codex  (all projects)")}`,
        value: "global",
      },
      {
        name: `Project ${dim("— install into a specific project directory")}`,
        value: "project",
      },
    ],
  });

  let projectDir = "";
  if (scope === "project") {
    const raw = await input({
      message: "Project directory",
      default: process.cwd(),
    });
    projectDir = resolvePath(raw);
    if (!fs.existsSync(projectDir)) {
      console.log(yellow(`\n  Directory not found: ${projectDir}\n`));
      process.exit(1);
    }
  }

  // ── Step 2: Which targets ────────────────────────────────────────────────
  console.log("");
  const targets = await checkbox({
    message: "Which CLIs do you want to install for?",
    choices: [
      { name: "Claude Code", value: "claude", checked: true },
      { name: "OpenCode", value: "opencode", checked: true },
      { name: "Codex", value: "codex", checked: false },
      { name: "OpenClaw  (custom path)", value: "openclaw", checked: false },
      {
        name: "Agent Zero  (custom usr path)",
        value: "agentzero",
        checked: false,
      },
    ],
  });

  if (targets.length === 0) {
    console.log(yellow("\n  No targets selected. Nothing to install.\n"));
    process.exit(0);
  }

  // ── Step 3: Custom paths ─────────────────────────────────────────────────
  let openclawPath = "";
  let agentzeroPath = "";

  if (targets.includes("openclaw")) {
    console.log("");
    const raw = await input({
      message: "OpenClaw install path",
      default: path.join(home, ".openclaw"),
    });
    openclawPath = resolvePath(raw);
  }

  if (targets.includes("agentzero")) {
    console.log("");
    const raw = await input({
      message: "Agent Zero usr path",
      default: path.join(home, ".agent-zero", "agent-zero", "usr"),
    });
    agentzeroPath = resolvePath(raw);
  }

  // ── Step 4: Build ────────────────────────────────────────────────────────
  console.log("");
  process.stdout.write(`  ${dim("Building agents...")} `);
  buildAll();
  console.log(green("✓"));
  console.log("");

  // ── Step 5: Install selected targets ─────────────────────────────────────
  let installedCount = 0;

  for (const target of targets) {
    switch (target) {
      case "claude": {
        const src = path.join(root, ".claude");
        const dst =
          scope === "global"
            ? path.join(home, ".claude")
            : path.join(projectDir, ".claude");
        installStep("Claude Code", src, dst);
        installedCount++;
        break;
      }
      case "opencode": {
        const src = path.join(root, ".opencode");
        const dst =
          scope === "global"
            ? path.join(home, ".opencode")
            : path.join(projectDir, ".opencode");
        installStep("OpenCode  ", src, dst);
        installedCount++;
        break;
      }
      case "codex": {
        const src = path.join(root, ".codex");
        const dst =
          scope === "global"
            ? path.join(home, ".codex")
            : path.join(projectDir, ".codex");
        installStep("Codex     ", src, dst);
        installedCount++;
        break;
      }
      case "openclaw": {
        const src = path.join(root, ".openclaw");
        installStep("OpenClaw  ", src, openclawPath, ["TOOLS.md"]);
        installedCount++;
        break;
      }
      case "agentzero": {
        const src = path.join(root, ".a0proj");
        installStep("Agent Zero", src, agentzeroPath);
        installedCount++;
        break;
      }
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const agentCount = fs
    .readdirSync(path.join(root, "src", "agents"), { withFileTypes: true })
    .filter((e) => e.isDirectory()).length;

  console.log("");
  console.log(
    `  ${green("✓")} ${bold("Done.")} ${bold(String(agentCount))} agents installed to ${bold(String(installedCount))} target${installedCount !== 1 ? "s" : ""}.`
  );
  console.log("");
}

main().catch((err: Error) => {
  console.error(`\n  ${yellow("Error:")} ${err.message}\n`);
  process.exit(1);
});
