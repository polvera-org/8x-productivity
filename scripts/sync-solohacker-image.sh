#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

SOURCE_DIR="$REPO_ROOT/src"
TARGET_DIR="/Users/nicolas/workspace/code/solohacker/packages/custom/src/docker/src"

if [ ! -d "$SOURCE_DIR" ]; then
  echo "Source directory not found: $SOURCE_DIR" >&2
  exit 1
fi

if [ ! -d "$TARGET_DIR" ]; then
  echo "Target directory not found: $TARGET_DIR" >&2
  exit 1
fi

rsync -a --delete "$SOURCE_DIR/" "$TARGET_DIR/"

echo "Synced $SOURCE_DIR to $TARGET_DIR"
