#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
source_dir="$repo_root/src/agents"
skills_source_dir="$repo_root/src/skills"

echo "Select CLI to install agents for:"
echo "1) opencode"
echo "2) claude-code"
echo "3) cursor"
read -r cli_choice

cli_name=""
target_dir_name=""
case "$cli_choice" in
  1|opencode)
    cli_name="opencode"
    target_dir_name=".opencode"
    ;;
  2|claude-code|claude)
    cli_name="claude-code"
    target_dir_name=".claude"
    ;;
  3|cursor)
    cli_name="cursor"
    target_dir_name=".cursor"
    ;;
  *)
    echo "Invalid selection. Please choose 1, 2, or 3."
    exit 1
    ;;
esac

echo "Enter project path (leave empty for current directory):"
read -r project_path

if [ -z "$project_path" ]; then
  project_path="$(pwd)"
fi

if [ ! -d "$project_path" ]; then
  echo "Project path does not exist: $project_path"
  exit 1
fi

target_parent_dir="$project_path/$target_dir_name"
target_dir="$target_parent_dir/agents"
skills_target_dir="$target_parent_dir/skills"
mkdir -p "$target_parent_dir"

cp -R "$source_dir" "$target_parent_dir"/
cp -R "$skills_source_dir" "$target_parent_dir"/

if [ "$cli_name" = "opencode" ]; then
  for file in "$target_dir"/*.md; do
    description="$(awk -F": " '/^description:/ {sub(/^description: /, ""); print; exit}' "$file")"
    temp_file="$(mktemp)"
    cat <<EOF > "$temp_file"
---
description: $description
mode: subagent
tools:
  write: true
  edit: true
  bash: true
---

EOF
    awk 'NR==1 && $0=="---" {in_front=1; next} in_front {if ($0=="---") {in_front=0; next} else {next}} {print}' "$file" >> "$temp_file"
    mv "$temp_file" "$file"
  done
fi

echo "Agents installed to $target_dir for $cli_name."
echo "Skills installed to $skills_target_dir for $cli_name."
