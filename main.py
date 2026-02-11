#!/usr/bin/env python3
"""8x planning CLI - Plan, Implement, Review."""

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

SPECS_DIR = Path("specs")
PROMPTS_DIR = Path("src/prompts")


def get_spec_folders() -> list[Path]:
    """Return spec folders sorted by modification time (newest first)."""
    if not SPECS_DIR.exists():
        return []
    folders = [f for f in SPECS_DIR.iterdir() if f.is_dir()]
    folders.sort(key=lambda f: f.stat().st_mtime, reverse=True)
    return folders


def pick_spec() -> Path | None:
    """Prompt user to pick a spec folder. Defaults to the most recent."""
    folders = get_spec_folders()
    if not folders:
        print("No specs found in /specs/")
        return None

    print("\nExisting specs:")
    for i, folder in enumerate(folders):
        default = " (default)" if i == 0 else ""
        print(f"  [{i + 1}] {folder.name}{default}")

    choice = input("\nPick a spec [1]: ").strip()
    if not choice:
        return folders[0]

    try:
        idx = int(choice) - 1
        if 0 <= idx < len(folders):
            return folders[idx]
    except ValueError:
        pass

    print(f"Invalid choice: {choice}")
    return None


def ask_spec_name(task: str) -> Path | None:
    """Ask user for the spec folder name, create it, return the path."""
    slug = task.lower().replace(" ", "-")[:40]
    default_name = slug

    name = input(f"\nSpec folder name [specs/{default_name}]: ").strip()
    if not name:
        name = default_name

    spec_path = SPECS_DIR / name
    spec_path.mkdir(parents=True, exist_ok=True)
    return spec_path


def run_plan(mode: str, task: str):
    """Run a planning session with opencode."""
    spec_path = ask_spec_name(task)
    if not spec_path:
        return

    prompt_file = PROMPTS_DIR / f"{mode}.md"
    if not prompt_file.exists():
        print(f"Prompt file not found: {prompt_file}")
        sys.exit(1)

    system_prompt = prompt_file.read_text()
    output_path = spec_path / "spec.json"

    user_message = (
        f"Task: {task}\n\n"
        f"Explore the codebase, then produce the plan.\n"
        f"Save the JSON output to: {output_path}"
    )

    cmd = [
        "opencode", "run",
        system_prompt + "\n\n" + user_message,
    ]

    print(f"\nPlanning ({mode})...")
    print(f"Output: {output_path}\n")
    subprocess.run(cmd)

    validate_spec_json(output_path)


def validate_spec_json(output_path: Path, max_retries: int = 3):
    """Parse the spec.json and retry with opencode if invalid."""
    for attempt in range(1, max_retries + 1):
        if not output_path.exists():
            print(f"spec.json was not created at {output_path}")
            return

        try:
            json.loads(output_path.read_text())
            print(f"spec.json is valid.")
            return
        except json.JSONDecodeError as e:
            print(f"\nspec.json has invalid JSON (attempt {attempt}/{max_retries}): {e}")
            if attempt == max_retries:
                print("Max retries reached. Please fix the JSON manually.")
                return

            fix_prompt = (
                f"The file at {output_path} contains invalid JSON.\n"
                f"Error: {e}\n\n"
                f"Read the file, fix ONLY the JSON syntax error, and save it back to {output_path}. "
                f"Do not change the content, only fix the formatting to make it valid JSON."
            )
            print("Attempting auto-fix...\n")
            subprocess.run(["opencode", "run", fix_prompt])


def cmd_implement():
    """Placeholder for implementation dispatch."""
    spec = pick_spec()
    if not spec:
        return
    print(f"\nSelected: {spec.name}")
    print("To be implemented")


def cmd_review():
    """Placeholder for QA review dispatch."""
    spec = pick_spec()
    if not spec:
        return
    print(f"\nSelected: {spec.name}")
    print("To be implemented")


def main():
    parser = argparse.ArgumentParser(
        prog="8x",
        description="8x planning CLI - Plan, Implement, Review",
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--quick-plan", metavar="TASK", help="Quick plan for a straightforward task")
    group.add_argument("--deep-plan", metavar="TASK", help="Deep plan for complex, multi-stage work")
    group.add_argument("--implement", action="store_true", help="Run implementation for a spec")
    group.add_argument("--review", action="store_true", help="Run QA review for a spec")

    args = parser.parse_args()

    if args.quick_plan:
        run_plan("quick-plan", args.quick_plan)
    elif args.deep_plan:
        run_plan("deep-plan", args.deep_plan)
    elif args.implement:
        cmd_implement()
    elif args.review:
        cmd_review()


if __name__ == "__main__":
    main()
