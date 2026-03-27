#!/usr/bin/env python3

import os
import re
import shutil
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
home = Path.home()

src_agents = root / "src" / "agents"
src_skills = root / "src" / "skills"
src_commands = root / "src" / "commands"

claude_root = root / ".claude"
opencode_root = root / ".opencode"
codex_root = root / ".codex"
agentzero_root = root / ".a0proj"
openclaw_root = root / ".openclaw"

home_claude_root = home / ".claude"
home_opencode_root = home / ".opencode"
home_codex_root = home / ".codex"

render_targets = [
    {
        "name": ".claude",
        "root": claude_root,
        "agents_dir": claude_root / "agents",
        "skills_dir": claude_root / "skills",
        "commands_dir": claude_root / "commands",
        "agglomerated_agents": True,
    },
    {
        "name": ".opencode",
        "root": opencode_root,
        "agents_dir": opencode_root / "agents",
        "skills_dir": opencode_root / "skills",
        "commands_dir": opencode_root / "commands",
        "agglomerated_agents": False,
    },
    {
        "name": ".codex",
        "root": codex_root,
        "skills_dir": codex_root / "skills",
        "commands_dir": codex_root / "prompts",
        "agents_manifest": codex_root / "AGENTS.md",
    },
    {
        "name": ".a0proj",
        "root": agentzero_root,
        "skills_dir": agentzero_root / "skills",
        "agentzero_agents_dir": agentzero_root / "agents",
    },
    {
        "name": ".openclaw",
        "root": openclaw_root,
        "openclaw_agents_dir": openclaw_root,
    },
    {
        "name": "~/.claude",
        "root": home_claude_root,
        "agents_dir": home_claude_root / "agents",
        "skills_dir": home_claude_root / "skills",
        "commands_dir": home_claude_root / "commands",
        "agglomerated_agents": True,
    },
    {
        "name": "~/.opencode",
        "root": home_opencode_root,
        "agents_dir": home_opencode_root / "agents",
        "skills_dir": home_opencode_root / "skills",
        "commands_dir": home_opencode_root / "commands",
        "agglomerated_agents": False,
    },
    {
        "name": "~/.codex",
        "root": home_codex_root,
        "skills_dir": home_codex_root / "skills",
        "commands_dir": home_codex_root / "prompts",
        "agents_manifest": home_codex_root / "AGENTS.md",
    },
]


def reset_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def copy_tree(src: Path, dst: Path) -> None:
    if not src.exists():
        return
    for item in src.rglob("*"):
        if ".DS_Store" in item.parts:
            continue
        rel = item.relative_to(src)
        target = dst / rel
        if item.is_dir():
            target.mkdir(parents=True, exist_ok=True)
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(item, target)


def parse_agent(source: Path) -> tuple[str, str, str]:
    text = source.read_text()
    match = re.match(r"^---\n(.*?)\n---\n\n?(.*)$", text, re.DOTALL)
    if not match:
        raise SystemExit(f"Missing frontmatter in {source}")

    frontmatter, body = match.groups()
    metadata = {}
    for line in frontmatter.splitlines():
        if not line.strip():
            continue
        key, _, value = line.partition(":")
        metadata[key.strip()] = value.strip()

    name = metadata.get("name")
    description = metadata.get("description")
    if not name or not description:
        raise SystemExit(f"Missing name/description in {source}")

    return name, description, body.rstrip() + "\n"


def extract_agent_title(name: str, body: str) -> str:
    match = re.search(r"^#\s+(.+)$", body, re.MULTILINE)
    if match:
        return match.group(1).strip()
    return name.replace("-", " ").title()


LEGACY_OPENCLAW_TOOLS_TEMPLATE = """# Tools\n\nThis file is for local OpenClaw notes about tools, permissions, and environment specifics for this agent.\n\n## Local Notes\n\n- Add agent-specific tool guidance here when needed.\n- Keep any machine-local setup or caveats in this file.\n"""


OPENCLAW_TOOLS_TEMPLATE = """# TOOLS.md - Local Notes\n\nSkills define how tools work. This file is for your specifics -- the stuff that's unique to this agent's setup.\n\n## What Goes Here\n\nThings like:\n\n- SSH hosts and aliases\n- Preferred voices for TTS\n- Device nicknames\n- Machine-local caveats\n- Anything environment-specific\n\n## Why Separate?\n\nSkills are shared. This file is local. Keeping them apart means you can update shared skills without losing agent-specific notes.\n\n***\n\nAdd whatever helps this agent do its job. This is its cheat sheet.\n"""


for target in render_targets:
    target["root"].mkdir(parents=True, exist_ok=True)
    for key in ("agents_dir", "skills_dir", "commands_dir", "agentzero_agents_dir"):
        directory = target.get(key)
        if directory is not None:
            reset_dir(directory)

for target in render_targets:
    skills_dir = target.get("skills_dir")
    if skills_dir is not None:
        copy_tree(src_skills, skills_dir)

for target in render_targets:
    commands_dir = target.get("commands_dir")
    if commands_dir is not None:
        copy_tree(src_commands, commands_dir)

agent_files = sorted(src_agents.glob("*.md"))
specialists = [path.stem for path in agent_files if path.stem != "nova"]
claude_default_tools = "Read, Edit, Bash, Write, Glob, Grep"
claude_nova_tools = claude_default_tools + ", Agent(" + ", ".join(specialists) + ")"

for source in agent_files:
    name, description, body = parse_agent(source)
    title = extract_agent_title(name, body)

    claude_tools = claude_nova_tools if name == "nova" else claude_default_tools
    claude_text = (
        "---\n"
        f"name: {name}\n"
        f"description: {description}\n"
        f"tools: {claude_tools}\n"
        "model: inherit\n"
        "---\n\n"
        f"{body}"
    )
    opencode_mode = "primary" if name == "nova" else "subagent"
    opencode_text = (
        "---\n"
        f"description: {description}\n"
        f"mode: {opencode_mode}\n"
        "tools:\n"
        "  read: true\n"
        "  edit: true\n"
        "  bash: true\n"
        "  write: true\n"
        "---\n\n"
        f"{body}"
    )

    for target in render_targets:
        agents_dir = target.get("agents_dir")
        if agents_dir is None:
            continue
        if target.get("agglomerated_agents"):
            text = claude_text
        else:
            text = opencode_text
        (agents_dir / f"{name}.md").write_text(text)

    for target in render_targets:
        agentzero_agents_dir = target.get("agentzero_agents_dir")
        if agentzero_agents_dir is None:
            continue

        profile_dir = agentzero_agents_dir / name
        prompts_dir = profile_dir / "prompts"
        prompts_dir.mkdir(parents=True, exist_ok=True)
        (profile_dir / "agent.json").write_text(
            json.dumps(
                {
                    "title": title,
                    "description": description,
                    "context": description,
                },
                indent=2,
            )
            + "\n"
        )
        (prompts_dir / "agent.system.main.role.md").write_text(body)

    for target in render_targets:
        openclaw_agents_dir = target.get("openclaw_agents_dir")
        if openclaw_agents_dir is None:
            continue

        profile_dir = openclaw_agents_dir / name
        profile_dir.mkdir(parents=True, exist_ok=True)
        (profile_dir / "SOUL.md").write_text(body)

        tools_path = profile_dir / "TOOLS.md"
        if not tools_path.exists():
            tools_path.write_text(OPENCLAW_TOOLS_TEMPLATE)
        elif tools_path.read_text() == LEGACY_OPENCLAW_TOOLS_TEMPLATE:
            tools_path.write_text(OPENCLAW_TOOLS_TEMPLATE)

for target in render_targets:
    agents_manifest = target.get("agents_manifest")
    if agents_manifest is not None:
        shutil.copy2(root / "AGENTS.md", agents_manifest)

print(f"Rendered {len(agent_files)} agents into .claude/, .opencode/, .openclaw/, ~/.claude/, and ~/.opencode/")
print("Synced skills into .claude/, .opencode/, .codex/, ~/.claude/, ~/.opencode/, and ~/.codex/")
print("Synced commands into .claude/, .opencode/, .codex/, ~/.claude/, ~/.opencode/, and ~/.codex/")
print("Rendered Agent Zero profiles into .a0proj/agents/ and synced skills into .a0proj/skills/")
print("Rendered OpenClaw agent folders into .openclaw/ and preserved existing TOOLS.md files")
