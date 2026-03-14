#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$REPO_ROOT/src/agents"
CLAUDE_DIR="$REPO_ROOT/.claude/agents"
OPENCODE_DIR="$REPO_ROOT/.opencode/agents"

# Clean and recreate output directories
rm -rf "$CLAUDE_DIR" "$OPENCODE_DIR"
mkdir -p "$CLAUDE_DIR" "$OPENCODE_DIR"

# Non-nova agents list (for checking nova special case)
NOVA_DELEGATES="kepler, turing, euclid, ada, nebula, rosetta, comet"

for src_file in "$SRC_DIR"/*.md; do
  filename="$(basename "$src_file")"
  agent_name="$(basename "$src_file" .md)"

  # Parse description from YAML frontmatter
  description="$(awk '/^---$/{n++; next} n==1 && /^description:/{sub(/^description: */, ""); print}' "$src_file")"

  # Extract markdown body (everything after second ---)
  body="$(awk '/^---$/{n++; next} n>=2{print}' "$src_file")"

  # --- Claude Code config ---
  claude_file="$CLAUDE_DIR/$filename"
  if [ "$agent_name" = "nova" ]; then
    tools="Read, Edit, Bash, Write, Glob, Grep, Agent($NOVA_DELEGATES)"
  else
    tools="Read, Edit, Bash, Write, Glob, Grep"
  fi

  {
    printf '%s\n' '---'
    printf '%s\n' "name: $agent_name"
    printf 'description: %s\n' "$description"
    printf '%s\n' "tools: $tools"
    printf '%s\n' 'model: inherit'
    printf '%s\n' '---'
    printf '%s\n' "$body"
  } > "$claude_file"

  # --- OpenCode config ---
  opencode_file="$OPENCODE_DIR/$filename"

  {
    printf '%s\n' '---'
    printf 'description: %s\n' "$description"
    printf '%s\n' 'mode: subagent'
    printf '%s\n' 'tools:'
    printf '%s\n' '  read: true'
    printf '%s\n' '  edit: true'
    printf '%s\n' '  bash: true'
    printf '%s\n' '  write: true'
    printf '%s\n' '---'
    printf '%s\n' "$body"
  } > "$opencode_file"

  echo "  $agent_name -> .claude/agents/$filename + .opencode/agents/$filename"
done

echo ""
echo "Built $(ls "$CLAUDE_DIR"/*.md | wc -l | tr -d ' ') Claude Code configs in .claude/agents/"
echo "Built $(ls "$OPENCODE_DIR"/*.md | wc -l | tr -d ' ') OpenCode configs in .opencode/agents/"
