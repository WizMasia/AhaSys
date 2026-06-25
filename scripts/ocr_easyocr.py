import base64
import json
import os
import re
import sys
import tempfile
from typing import List

import easyocr

_DATA_URI_RE = re.compile(r"^data:[^;]+;base64,(.+)$", re.DOTALL)

_reader: easyocr.Reader | None = None


def _decode_payload(payload: str) -> bytes:
    match = _DATA_URI_RE.match(payload)
    raw = match.group(1) if match else payload
    return base64.b64decode(raw)


def _get_reader() -> easyocr.Reader:
    global _reader
    if _reader is None:
        langs_env = os.environ.get("EASYOCR_LANGS", "ko,en")
        langs = [lang.strip() for lang in langs_env.split(",") if lang.strip()] or ["ko", "en"]
        gpu_env = os.environ.get("EASYOCR_GPU", "false").lower()
        use_gpu = gpu_env in ("1", "true", "yes")
        _reader = easyocr.Reader(langs, gpu=use_gpu, verbose=False)
    return _reader


def _extract_text(image_bytes: bytes) -> str:
    reader = _get_reader()
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp.write(image_bytes)
        tmp_path = tmp.name
    try:
        results: List = reader.readtext(tmp_path, detail=0, paragraph=False)
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
    lines = [text.strip() for text in results if isinstance(text, str) and text.strip()]
    return "\n".join(lines)


def main() -> int:
    payload = sys.stdin.read()
    try:
        request = json.loads(payload)
        images = request.get("images", [])
        if not isinstance(images, list) or not all(isinstance(i, str) for i in images):
            raise ValueError("images must be a list of base64 strings")
    except (ValueError, json.JSONDecodeError) as err:
        sys.stdout.write(json.dumps({"error": f"invalid request: {err}"}))
        return 2

    blocks: List[str] = []
    for index, image in enumerate(images, start=1):
        try:
            image_bytes = _decode_payload(image)
        except Exception as err:
            sys.stdout.write(json.dumps({"error": f"image {index} base64 decode failed: {err}"}))
            return 3
        try:
            text = _extract_text(image_bytes)
        except Exception as err:
            sys.stdout.write(json.dumps({"error": f"image {index} OCR failed: {err}"}))
            return 4
        if text:
            blocks.append(f"[이미지 {index} OCR]\n{text}")

    sys.stdout.write(json.dumps({"text": "\n\n".join(blocks)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
