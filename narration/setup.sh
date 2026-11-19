#!/usr/bin/env bash
# Creates the Python environments of the narration tools: one venv per backend,
# in $NARRATION_HOME/venvs/<backend>/, with the versions the tools were run with.
#
#   bash narration/setup.sh [kokoro] [eval] [qwen] [chatterbox]   (default: kokoro eval)
#
#   kokoro      Kokoro-82M, the voice of the default preset   (narrate.py)
#   eval        faster-whisper, for checking by transcription (transcribe.py)
#   qwen        Qwen3-TTS presets                             (narrate.py)
#   chatterbox  Chatterbox presets                            (narrate.py)
#
# NARRATION_HOME defaults to ~/.research-presentation-narration: outside the
# repository, because the venvs and the model weights take several gigabytes.
# Needs uv (https://docs.astral.sh/uv/) on PATH or in $NARRATION_HOME/bin; uv
# installs the Python versions itself, under $NARRATION_HOME/python.
#
# torch comes from the CUDA 12.8 wheel index by default. On a machine with
# another CUDA version or none, name the index:
#   NARRATION_TORCH_INDEX=https://download.pytorch.org/whl/cpu bash narration/setup.sh
# (chatterbox-tts 0.1.7 pins torch 2.6.0, which has no CUDA 12.8 wheel; its
# venv uses the CUDA 12.4 index unless NARRATION_TORCH_INDEX is set.)
#
# A venv that exists is left as it is; remove its directory to rebuild it.
# Model weights are not fetched here: each tool downloads its own on first use,
# into $NARRATION_HOME/hf-cache (see caches.py).
set -euo pipefail

NARRATION_HOME="${NARRATION_HOME:-$HOME/.research-presentation-narration}"
VENVS="$NARRATION_HOME/venvs"

export UV_CACHE_DIR="${UV_CACHE_DIR:-$NARRATION_HOME/uv-cache}"
export UV_PYTHON_INSTALL_DIR="${UV_PYTHON_INSTALL_DIR:-$NARRATION_HOME/python}"
PATH="$NARRATION_HOME/bin:$PATH"

if ! command -v uv >/dev/null; then
  echo "uv not found: install it (https://docs.astral.sh/uv/) or put it in $NARRATION_HOME/bin" >&2
  exit 1
fi

# The audio packages narrate.py imports, the same in every synthesis venv.
AUDIO_PACKAGES=(soundfile==0.14.0 scipy==1.18.1 soxr==1.1.0 pyloudnorm==0.2.0)

# create_venv <name> <python version> <torch index> <torch packages...>
create_venv() {
  local name="$1" python="$2" index="$3"
  shift 3
  mkdir -p "$VENVS"
  uv venv --python "$python" "$VENVS/$name"
  uv pip install --python "$VENVS/$name" --index-url "$index" "$@"
}

setup_kokoro() {
  create_venv kokoro 3.12 "${NARRATION_TORCH_INDEX:-https://download.pytorch.org/whl/cu128}" torch==2.8.0
  # misaki, Kokoro's text front end, loads spaCy's small English model; installed
  # here so nothing is downloaded while narrating.
  uv pip install --python "$VENVS/kokoro" kokoro==0.9.4 "misaki[en]==0.9.4" numpy==2.5.5 "${AUDIO_PACKAGES[@]}" \
    "en_core_web_sm @ https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl"
}

setup_eval() {
  # torch is here for its CUDA and cuDNN libraries, which ctranslate2 loads.
  create_venv eval 3.12 "${NARRATION_TORCH_INDEX:-https://download.pytorch.org/whl/cu128}" torch==2.8.0
  uv pip install --python "$VENVS/eval" faster-whisper==1.2.1 ctranslate2==4.9.0 jiwer==4.0.0 whisper-normalizer==1.0.1 \
    numpy==2.5.5 soundfile==0.14.0 scipy==1.18.1
}

setup_qwen() {
  create_venv qwen 3.12 "${NARRATION_TORCH_INDEX:-https://download.pytorch.org/whl/cu128}" torch==2.8.0 torchaudio==2.8.0
  uv pip install --python "$VENVS/qwen" qwen-tts==0.1.1 numpy==2.5.5 "${AUDIO_PACKAGES[@]}"
}

setup_chatterbox() {
  create_venv chatterbox 3.11 "${NARRATION_TORCH_INDEX:-https://download.pytorch.org/whl/cu124}" torch==2.6.0 torchaudio==2.6.0
  # chatterbox-tts pins its own numpy; scipy follows what that numpy allows.
  uv pip install --python "$VENVS/chatterbox" chatterbox-tts==0.1.7 soundfile==0.14.0 scipy==1.17.1 soxr==1.1.0 pyloudnorm==0.2.0
}

if [ "$#" -eq 0 ]; then
  set -- kokoro eval
fi
for backend in "$@"; do
  case "$backend" in
    kokoro|eval|qwen|chatterbox) ;;
    *) echo "unknown backend '$backend' (kokoro, eval, qwen, chatterbox)" >&2; exit 1 ;;
  esac
  if [ -e "$VENVS/$backend" ]; then
    echo "$VENVS/$backend exists; left as it is"
  else
    "setup_$backend"
  fi
done
echo "narration environments are in $VENVS"
