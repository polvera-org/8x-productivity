---
name: image-generation
description: Unified image-generation skill. Default provider is nano-banana-pro (Gemini 3 Pro Image). Supports text-to-image; edits via nano-banana-pro.
---

# Image Generation (Unified)

Generate a single image per request via a provider script. Default provider is **nano-banana-pro** unless the user asks for OpenAI.

If the user does not provide a prompt, you must generate a random prompt about a cartoon octopus image and pass it to the script.

## Provider Selection

- If user specifies a provider, use it.
- If unspecified, default to **nano-banana-pro**.
- If the user wants edits (image-to-image), use **nano-banana-pro**.

Providers:
- `nano-banana-pro` → `src/skills/image-generation/providers/nano-banana-pro.py`
- `openai` → `src/skills/image-generation/providers/openai-image-generation.py`

## Usage

Run scripts using an absolute path (do NOT cd to the skill directory first). Always run from the user's working directory so outputs land where they are working.

If the user does not specify an API key, assume the runtime already has secrets loaded (e.g., via framework secret storage or environment loading). Do NOT read `.env` directly.

If you need to run a command in a shell that already loads environment variables, you can use:
```bash
bash -lc "set -a; source .env; set +a; <command>"
```

**Generate new image (nano-banana-pro):**
```bash
uv run /absolute/path/to/src/skills/image-generation/providers/nano-banana-pro.py --prompt "your image description" --filename "output-name.png" [--resolution 1K|2K|4K] [--api-key KEY]
```

**Edit existing image (nano-banana-pro):**
```bash
uv run /absolute/path/to/src/skills/image-generation/providers/nano-banana-pro.py --prompt "editing instructions" --filename "output-name.png" --input-image "path/to/input.png" [--resolution 1K|2K|4K] [--api-key KEY]
```

**Generate new image (openai):**
```bash
uv run /absolute/path/to/src/skills/image-generation/providers/openai-image-generation.py --prompt "your image description" --filename "output-name.png" [--size 1024x1024] [--quality high|standard] [--api-key KEY]
```

## Default Workflow (draft → iterate → final)

Goal: fast iteration without burning time on 4K until the prompt is correct.

- Draft (1K): quick feedback loop
  - `uv run /absolute/path/to/src/skills/image-generation/providers/nano-banana-pro.py --prompt "<draft prompt>" --filename "yyyy-mm-dd-hh-mm-ss-draft.png" --resolution 1K`
- Iterate: adjust prompt in small diffs; keep filename new per run
  - If editing: keep the same `--input-image` for every iteration until you’re happy.
- Final (4K): only when prompt is locked
  - `uv run /absolute/path/to/src/skills/image-generation/providers/nano-banana-pro.py --prompt "<final prompt>" --filename "yyyy-mm-dd-hh-mm-ss-final.png" --resolution 4K`

## Resolution / Size Options

**Nano Banana Pro (resolution):**
- **1K** (default) - ~1024px
- **2K** - ~2048px
- **4K** - ~4096px

Map user requests to API parameters:
- No mention of resolution → `1K`
- "low resolution", "1080", "1080p", "1K" → `1K`
- "2K", "2048", "normal", "medium resolution" → `2K`
- "high resolution", "high-res", "hi-res", "4K", "ultra" → `4K`

**OpenAI (size/quality):**
- `--size` default `1024x1024`
- `--quality` default `high`

## API Keys

- Nano Banana Pro uses `GEMINI_API_KEY` or `--api-key`
- OpenAI uses `OPENAI_API_KEY` or `--api-key`
- If no key is provided, rely on existing secret storage or environment loading; do not read `.env` directly
- If a shell command needs environment variables loaded, use `bash -lc "set -a; source .env; set +a; <command>"`

## Prompt Handling

- If user gives a prompt, pass it through.
- If user does not give a prompt, generate a random prompt about a cartoon octopus and pass it in.
- For edits, keep the edit instruction specific and preserve the rest of the image.

Prompt templates (use only when needed):
- Generation: "Create an image of: <subject>. Style: <style>. Composition: <camera/shot>. Lighting: <lighting>. Background: <background>. Color palette: <palette>. Avoid: <list>."
- Edit: "Change ONLY: <single change>. Keep identical: subject, composition/crop, pose, lighting, color palette, background, text, and overall style. Do not add new objects. If text exists, keep it unchanged."

## Output

- Saves PNG to current directory (or specified path if filename includes directory)
- Script outputs the full path to the generated image
- Do not read the image back; just inform the user of the saved path

## Examples

**Generate new image (nano-banana-pro):**
```bash
uv run /absolute/path/to/src/skills/image-generation/providers/nano-banana-pro.py --prompt "A cartoon octopus chef flipping pancakes" --filename "2026-02-02-09-15-00-octopus-chef.png" --resolution 4K
```

**Edit existing image (nano-banana-pro):**
```bash
uv run /absolute/path/to/src/skills/image-generation/providers/nano-banana-pro.py --prompt "make the octopus wear a sailor hat" --filename "2026-02-02-09-20-30-octopus-sailor.png" --input-image "original-octopus.png" --resolution 2K
```

**Generate new image (openai):**
```bash
uv run /absolute/path/to/src/skills/image-generation/providers/openai-image-generation.py --prompt "Cartoon octopus reading a map in a tiny submarine" --filename "2026-02-02-09-25-10-octopus-sub.png" --size 1024x1024 --quality high
```
