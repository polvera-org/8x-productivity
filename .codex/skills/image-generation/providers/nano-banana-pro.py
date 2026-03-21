#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "google-genai>=1.0.0",
#     "pillow>=10.0.0",
# ]
# ///
"""
Generate images using Nano Banana Pro (Gemini 3 Pro Image) API.

Usage:
  uv run nano-banana-pro.py --prompt "your description" --filename "output.png" [--resolution 1K|2K|4K] [--input-image PATH] [--api-key KEY]
"""

import argparse
import os
import sys
from io import BytesIO
from pathlib import Path


def _api_key(provided: str | None) -> str | None:
    return provided or os.environ.get("GEMINI_API_KEY")


def _auto_resolution(input_image, requested: str) -> str:
    if not input_image or requested != "1K":
        return requested
    width, height = input_image.size
    max_dim = max(width, height)
    if max_dim >= 3000:
        return "4K"
    if max_dim >= 1500:
        return "2K"
    return "1K"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate images using Nano Banana Pro (Gemini 3 Pro Image)"
    )
    parser.add_argument("--prompt", "-p", required=True, help="Image description/prompt")
    parser.add_argument("--filename", "-f", required=True, help="Output filename")
    parser.add_argument("--input-image", "-i", help="Input image path for editing")
    parser.add_argument(
        "--resolution",
        "-r",
        choices=["1K", "2K", "4K"],
        default="1K",
        help="Output resolution: 1K (default), 2K, or 4K",
    )
    parser.add_argument("--api-key", "-k", help="Gemini API key")
    args = parser.parse_args()

    api_key = _api_key(args.api_key)
    if not api_key:
        print("Error: No API key provided.", file=sys.stderr)
        print("Set GEMINI_API_KEY or pass --api-key.", file=sys.stderr)
        return 1

    from google import genai  # type: ignore[import-not-found]
    from PIL import Image as PILImage

    client = genai.Client(api_key=api_key)
    output_path = Path(args.filename)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    input_image = None
    if args.input_image:
        try:
            input_image = PILImage.open(args.input_image)
        except Exception as exc:
            print(f"Error loading input image: {exc}", file=sys.stderr)
            return 1

    resolution = _auto_resolution(input_image, args.resolution)
    contents = [input_image, args.prompt] if input_image else args.prompt

    try:
        response = client.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=contents,
            config={
                "response_modalities": ["TEXT", "IMAGE"],
                "image_config": {"image_size": resolution},
            },
        )
    except Exception as exc:
        print(f"Error generating image: {exc}", file=sys.stderr)
        return 1

    image_saved = False
    for part in response.parts:
        if part.text is not None:
            print(f"Model response: {part.text}")
            continue
        if part.inline_data is None:
            continue
        image_data = part.inline_data.data
        if isinstance(image_data, str):
            import base64

            image_data = base64.b64decode(image_data)
        image = PILImage.open(BytesIO(image_data))
        if image.mode == "RGBA":
            rgb_image = PILImage.new("RGB", image.size, (255, 255, 255))
            rgb_image.paste(image, mask=image.split()[3])
            rgb_image.save(str(output_path), "PNG")
        else:
            image.convert("RGB").save(str(output_path), "PNG")
        image_saved = True

    if not image_saved:
        print("Error: No image was generated in the response.", file=sys.stderr)
        return 1

    print(f"Image saved: {output_path.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
