# Narration environments

[Narration](../implementation/narration.md) runs two Python tools from
`narration/`: `narrate.py` (text to speech) and `transcribe.py` (speech
back to text, for checking). Exporting the script (`npm run narration`)
needs only Node; this guide sets up the Python side. Everything it installs
lives outside the repository.

## What gets installed, and where

The text-to-speech models pin different versions of torch, so each backend
has its own virtual environment (venv), and each venv is several gigabytes.
`narration/setup.sh` creates them under one directory, `NARRATION_HOME`,
which defaults to `~/.research-presentation-narration`:

```text
$NARRATION_HOME/
  venvs/kokoro/       Kokoro-82M: the default voice           (7.4 GB)
  venvs/eval/         faster-whisper: transcription           (7.5 GB)
  venvs/qwen/         Qwen3-TTS presets                       (on request)
  venvs/chatterbox/   Chatterbox presets                      (on request)
  hf-cache/           model weights, fetched on first use     (Kokoro 0.3 GB, Whisper large-v3 2.9 GB)
  torch-cache/        torch.hub downloads
  uv-cache/, python/  uv's package cache and the Pythons it installs
```

`NARRATION_HOME` is read by `setup.sh` and by `npm run narration`, which
prints commands with the venv paths filled in. The Python tools do not read
it: `narration/caches.py` puts the caches beside the venv that runs the
tool, so a tool always finds the weights of its own home. Set `HF_HOME`
yourself to keep the weights elsewhere.

## Setup

Install [uv](https://docs.astral.sh/uv/) (it creates the venvs and installs
the Python versions they need), then, from the repository root in a POSIX
shell (Git Bash on Windows):

```bash
export NARRATION_HOME=~/.research-presentation-narration   # optional: this is the default
bash narration/setup.sh                                     # venvs kokoro and eval
bash narration/setup.sh qwen chatterbox                     # the other backends, when wanted
```

`setup.sh` pins the version of every package it names (torch 2.8.0, or
2.6.0 in the `chatterbox` environment, whose package requires it;
kokoro 0.9.4, faster-whisper 1.2.1, ctranslate2 4.9.0, and the audio
libraries); the packages those depend on resolve at install time. A venv
that exists is left as it is; remove its directory to rebuild it. `uv` is
found on `PATH` or in `$NARRATION_HOME/bin`.

The `kokoro` and `eval` venvs were built this way on 2026-11-19 (Windows
11, uv 0.13.9): the new `kokoro` venv rendered the example presentation's
five segments with the same SHA-256 as the venv the pins were read from,
and the new `eval` venv transcribed one of them without a word error. The
`qwen` and `chatterbox` venvs have not been rebuilt from `setup.sh`.

A machine that already has a directory with this layout uses it by setting
`NARRATION_HOME` to it; `setup.sh` then creates only the venvs it lacks.

Then follow the commands `npm run narration -- <id>` prints. The first
run of each tool downloads its model weights from Hugging Face into
`hf-cache/`.

## Staying offline

No tool sends text or audio anywhere. The Hugging Face client can still
contact the hub when a model loads, to see whether the cached weights are
current. Once the weights are cached, turn that off, so a run fails
instead of fetching:

```bash
export HF_HUB_OFFLINE=1
```

`caches.py` also sets `HF_HUB_DISABLE_TELEMETRY=1`, which stops the
client's usage reporting.

## GPU

`setup.sh` installs torch built for CUDA 12.8 (CUDA 12.4 in the
`chatterbox` environment). For another CUDA version,
or a machine without an NVIDIA GPU, name the wheel index:

```bash
NARRATION_TORCH_INDEX=https://download.pytorch.org/whl/cpu bash narration/setup.sh
```

| Tool | With a CUDA GPU | Without |
|---|---|---|
| `narrate.py`, Kokoro | about 29 times faster than real time on an RTX 4070 Laptop GPU | runs on the CPU (the backend picks it); not timed |
| `narrate.py`, Qwen3-TTS and Chatterbox | required | does not run |
| `transcribe.py` | `float16`; five segments (33 s of audio) in 16 s, model load included | `--device cpu` uses `int8`; one 2.7 s segment took 93 s, model load included |

The timings are single runs on one laptop (Windows 11, 2026-11-19) and
vary with its load. The CPU wheel index, Linux, and macOS have not been
tried: the tools have run only on that machine.

## Windows

- Run `setup.sh` from Git Bash. The Python tools run from any shell: call
  the venv's interpreter directly
  (`$NARRATION_HOME/venvs/<backend>/Scripts/python.exe`), without
  activating the venv.
- `transcribe.py` imports torch before faster-whisper and adds torch's
  `lib` directory to the DLL search path. faster-whisper runs on
  ctranslate2, which needs the CUDA 12 and cuDNN 9 libraries and does not
  ship them; torch does. Without that step the first transcription stops
  with `RuntimeError: Library cublas64_12.dll is not found or cannot be
  loaded`.
- `transcribe.py` reads audio with soundfile and resamples it itself.
  faster-whisper 1.2.1's own decoder calls `av.open` with an argument
  (`metadata_errors`) that PyAV 19.0.2, the version it installs, rejects.

## Tests

```bash
python -m unittest discover -s narration                              # text functions; any Python 3, no venv
python -m py_compile narration/narrate.py narration/transcribe.py     # syntax
```
