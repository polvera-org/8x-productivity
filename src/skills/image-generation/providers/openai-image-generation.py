#!/usr/bin/env python3

import argparse
import base64
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path


def _api_url() -> str:
    base = (
        os.environ.get("OPENAI_BASE_URL")
        or os.environ.get("OPENAI_API_BASE")
        or "https://api.openai.com"
    ).rstrip("/")
    if base.endswith("/v1"):
        return f"{base}/images/generations"
    return f"{base}/v1/images/generations"


def _post_json(url: str, api_key: str, payload: dict, timeout_s: int) -> dict:
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout_s) as resp:
            raw = resp.read()
    except urllib.error.HTTPError as exc:
        raw = exc.read()
        try:
            data = json.loads(raw.decode("utf-8", errors="replace"))
        except Exception:
            raise SystemExit(f"OpenAI HTTP {exc.code}: {raw[:300]!r}")
        raise SystemExit(f"OpenAI HTTP {exc.code}: {json.dumps(data, indent=2)[:1200]}")
    except Exception as exc:
        raise SystemExit(f"request failed: {exc}")

    try:
        return json.loads(raw)
    except Exception:
        raise SystemExit(f"invalid JSON response: {raw[:300]!r}")


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(
        prog="openai-image-generation",
        description="Generate a single image via OpenAI Images API.",
    )
    parser.add_argument("--prompt", "-p", required=True, help="Image description/prompt")
    parser.add_argument("--filename", "-f", required=True, help="Output filename")
    parser.add_argument("--model", default="gpt-image-1.5")
    parser.add_argument("--size", default="1024x1024")
    parser.add_argument("--quality", default="high", choices=["high", "standard"])
    parser.add_argument("--timeout", type=int, default=180, help="request timeout (seconds)")
    parser.add_argument("--api-key", default=None)
    args = parser.parse_args(argv)

    api_key = args.api_key or os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("missing OPENAI_API_KEY (or --api-key)", file=sys.stderr)
        return 2

    output_path = Path(args.filename)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    payload = {
        "model": args.model,
        "prompt": args.prompt,
        "size": args.size,
        "quality": args.quality,
        "n": 1,
        "response_format": "b64_json",
    }
    data = _post_json(url=_api_url(), api_key=api_key, payload=payload, timeout_s=args.timeout)
    b64 = (data.get("data") or [{}])[0].get("b64_json")
    if not b64:
        raise SystemExit(f"unexpected response: {json.dumps(data, indent=2)[:1200]}")

    output_path.write_bytes(base64.b64decode(b64))
    print(f"Image saved: {output_path.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
