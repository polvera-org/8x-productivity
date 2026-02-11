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


def load_spec_steps(spec_path: Path) -> list[dict] | None:
    """Load spec.json and return ordered steps for quick/deep plans."""
    spec_file = spec_path / "spec.json"
    if not spec_file.exists():
        print(f"spec.json not found at {spec_file}")
        return None

    try:
        data = json.loads(spec_file.read_text())
    except json.JSONDecodeError as exc:
        print(f"spec.json has invalid JSON: {exc}")
        return None

    if not isinstance(data, dict) or "plan" not in data:
        print("spec.json is missing a plan object")
        return None

    plan = data.get("plan", {})
    steps: list[dict] = []

    if isinstance(plan, dict) and isinstance(plan.get("steps"), list):
        for step in plan.get("steps", []):
            if isinstance(step, dict):
                steps.append(step)
        return steps

    if isinstance(plan, dict) and isinstance(plan.get("stages"), list):
        for stage in plan.get("stages", []):
            if not isinstance(stage, dict):
                continue
            stage_title = stage.get("title")
            stage_steps = stage.get("steps", [])
            if not isinstance(stage_steps, list):
                continue
            for step in stage_steps:
                if isinstance(step, dict):
                    step_copy = dict(step)
                    if stage_title and "stage_title" not in step_copy:
                        step_copy["stage_title"] = stage_title
                    steps.append(step_copy)
        return steps

    print("spec.json plan must include steps or stages")
    return None


def cmd_implement():
    """Dispatch implementation steps with best-practices preamble."""
    spec = pick_spec()
    if not spec:
        return
    print(f"\nSelected: {spec.name}")

    prompt_file = PROMPTS_DIR / "implement.md"
    if not prompt_file.exists():
        print(f"Prompt file not found: {prompt_file}")
        sys.exit(1)
    preamble = prompt_file.read_text().rstrip() + "\n\n"

    steps = load_spec_steps(spec)
    if not steps:
        return

    print(f"Found {len(steps)} step(s).")
    for idx, step in enumerate(steps, start=1):
        title = step.get("title") or ""
        goal = step.get("goal") or ""
        context = step.get("context") or ""
        instructions = step.get("instructions") or ""
        verification = step.get("verification") or ""
        stage_title = step.get("stage_title")

        label = f"Step {idx}/{len(steps)}"
        if stage_title:
            label = f"{label} ({stage_title})"
        print(f"\n{label}: {title}")

        prompt = preamble + (
            f"Step Title: {title}\n"
            f"Goal: {goal}\n\n"
            f"Context:\n{context}\n\n"
            f"Instructions:\n{instructions}\n\n"
            f"Verification:\n{verification}\n"
        )

        result = subprocess.run(["opencode", "run", prompt])
        if result.returncode != 0:
            print(f"Step failed with exit code {result.returncode}. Stopping.")
            return


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
