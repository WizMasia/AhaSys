# OCR Setup Guide

The non-vision adapter fallback path needs a server-side OCR engine to read
text out of attached advertisement images. The project uses
[EasyOCR](https://github.com/JaidedAI/EasyOCR) (PyTorch + CRAFT detection +
CRNN recognition) for Korean + English text. EasyOCR is invoked from the
Node server through a Python helper script.

The OCR dependency is **dev-only**. The Render demo deployment ships with
`OCR_ENABLED=false` so the multi-gigabyte Python OCR stack does not have to
fit into the Docker image. Local development with a real key + real ad
images needs the engine enabled.

## 1. What you need

- Python 3.10, 3.11, or 3.12 (3.13+ may work, 3.14 untested)
- pip or [uv](https://docs.astral.sh/uv/) for installing packages
- ~1.5 GB of free disk space for the venv (torch dominates)
- ~150 MB for the first-run model download (CRAFT detector + Korean +
  English CRNN recognizers, cached under `~/.EasyOCR/model/`)

## 2. macOS

### 2.1 Apple Silicon (M1/M2/M3/M4) -- the path that already works

The Python 3.11 wheel from `uv` installs cleanly and PyTorch's macOS arm64
build is solid. We do **not** use the system `python3` (3.14) because
EasyOCR's transitive dependencies have not been published for 3.14 yet.

```bash
cd /path/to/ahasys

# 1. Bootstrap a Python 3.11 venv without pip (the bundled ensurepip on
#    uv-built Python 3.11 sometimes hits an AppleDouble metadata error
#    when the venv lives on a network/external volume).
/Users/$(whoami)/.local/bin/python3.11 -m venv .venv-ocr --without-pip

# 2. Use uv to install pip (and later easyocr) into the venv.
uv pip install --python .venv-ocr/bin/python3.11 pip
uv pip install --python .venv-ocr/bin/python3.11 easyocr --link-mode copy
```

> **AppleDouble note.** macOS Finder auto-creates `._<name>` metadata files
> next to any file it copies. uv reads wheel RECORD files and rejects
> installs when a `._*` sibling appears in `site-packages/`. If pip/uv
> errors with `RECORD file doesn't match wheel contents`, run
> `find .venv-ocr -name '._*' -delete` once and retry. The `--link-mode
> copy` flag also reduces the chance of cross-device hardlink failures.

### 2.2 Intel macOS

Either use the system Python 3 (`brew install python@3.11`) or a uv-managed
3.11 build. The rest of the steps match 2.1.

### 2.3 Verify

```bash
.venv-ocr/bin/python3.11 -c "import easyocr; print(easyocr.__version__)"
# -> 1.7.2  (or whatever the latest is)
```

First run downloads the model to `~/.EasyOCR/model/` (or
`EASYOCR_MODEL_STORAGE` if set).

## 3. Linux (Debian/Ubuntu)

```bash
sudo apt update
sudo apt install -y python3.11 python3.11-venv
cd /path/to/ahasys
python3.11 -m venv .venv-ocr
source .venv-ocr/bin/activate
pip install --upgrade pip
pip install easyocr
```

For GPU servers install the CUDA build of PyTorch before EasyOCR; see
[PyTorch Get Started](https://pytorch.org/get-started/locally/) for the
right `pip install` line, then `EASYOCR_GPU=true` in `.env`.

## 4. Windows

Native Windows is not officially supported by this project -- the
`tsx server.ts` dev path plus Python interop is painful. Use WSL2 with
the Ubuntu instructions above.

```powershell
wsl --install -d Ubuntu
# inside Ubuntu
sudo apt update && sudo apt install -y python3.11 python3.11-venv
# follow section 3
```

## 5. Docker (any host)

The shipped `Dockerfile` does **not** install the OCR stack because the
Render demo deploys with `OCR_ENABLED=false`. To build a local image with
OCR enabled, extend the existing Dockerfile:

```Dockerfile
FROM node:20-bookworm

WORKDIR /app
RUN apt-get update && apt-get install -y python3.11 python3.11-venv && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci
COPY . .

# OCR stack (multi-stage to keep this layer cacheable)
RUN python3.11 -m venv /app/.venv-ocr && \
    /app/.venv-ocr/bin/pip install --no-cache-dir --upgrade pip && \
    /app/.venv-ocr/bin/pip install --no-cache-dir easyocr

ENV OCR_ENABLED=true
ENV OCR_PYTHON_BIN=/app/.venv-ocr/bin/python3.11
ENV NODE_ENV=production
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

The `bookworm` base (Debian 12) is recommended over `alpine` because
PyTorch's official wheels target glibc.

## 6. Environment variables

| Variable          | Default                              | Purpose                                                                  |
|-------------------|--------------------------------------|--------------------------------------------------------------------------|
| `OCR_ENABLED`     | `true` (omitted/false-disables)      | Set to `false` to skip the OCR step entirely (Render demo).              |
| `EASYOCR_LANGS`   | `ko,en`                              | Comma-separated language codes passed to `easyocr.Reader`.              |
| `EASYOCR_GPU`     | `false`                              | `true` enables CUDA. Requires a CUDA-capable PyTorch install.            |
| `OCR_PYTHON_BIN`  | `<repo>/.venv-ocr/bin/python3.11`    | Override the Python interpreter that runs `scripts/ocr_easyocr.py`.      |
| `EASYOCR_MODEL_STORAGE` | `~/.EasyOCR/model`              | Override the model cache location.                                       |

## 7. Smoke test

```bash
# From the project root
cat > /tmp/ocr_test.py << 'PY'
import base64
from PIL import Image, ImageDraw
img = Image.new("RGB", (640, 160), "white")
ImageDraw.Draw(img).text((20, 60), "아하시스턴트 OCR 테스트", fill="black")
buf = __import__("io").BytesIO()
img.save(buf, format="PNG")
print("data:image/png;base64," + base64.b64encode(buf.getvalue()).decode())
PY
TEST_B64=$(/path/to/ahasys/.venv-ocr/bin/python3.11 /tmp/ocr_test.py)

cat > /tmp/ocr_smoke.ts << 'TS'
import { extractTextWithEasyOcr } from "/path/to/ahasys/server/services/easyOcrService";
import { readFileSync } from "node:fs";
(async () => {
  const text = await extractTextWithEasyOcr([readFileSync("/tmp/ocr_b64.txt", "utf8").trim()]);
  console.log(text);
})();
TS

# Save the base64
echo "$TEST_B64" > /tmp/ocr_b64.txt
npx tsx /tmp/ocr_smoke.ts
```

You should see something like:

```
[이미지 1 OCR]
아하시스턴트 OCR 테스트
```

## 8. Troubleshooting

**`Cannot find module './server/services/easyOcrService'`**
You ran the smoke test from outside the project. `cd` into the project
root first.

**`spawn .venv-ocr/bin/python3.11 ENOENT`**
The venv path is wrong. Either re-run section 2/3, or set
`OCR_PYTHON_BIN` to the absolute path of a `python3.11` binary that has
`easyocr` installed.

**`EASYOCR_LANGS` change does nothing**
The reader is cached at the module level inside `ocr_easyocr.py`. Restart
the dev server (`npm run dev`) to pick up a new language list.

**Slow first call (~30s)**
That's the model cold-load. Subsequent calls are 1-3 seconds per image.
The demo on Render disables OCR specifically to keep cold start under 5
seconds.

**Out of memory on Render**
EasyOCR with default `ko,en` languages needs about 800 MB of RAM just for
the PyTorch + model state. Render's free tier (512 MB) cannot run it.
Either upgrade the Render plan to Standard (4 GB) or keep
`OCR_ENABLED=false`.

**Korean accuracy below expectations**
EasyOCR's default Korean model is tuned for printed text in common
sans-serif fonts. Cursive, brush, or heavily stylized typefaces can
score below 50% per character. Switch to PaddleOCR for higher Korean
accuracy, but note it currently has no working arm64 macOS wheel and
requires source build on Apple Silicon.
