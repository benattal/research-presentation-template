"""Narrate a script locally: one 48 kHz mono WAV per segment plus manifest.json.

Input script (JSON):
    {"voice": "<preset name in voices.json>" | {inline voice object},
     "segments": [{"id": "intro", "text": "..."}, ...]}

Optional pronunciation map (JSON object, term -> spoken spelling), applied to every
segment before synthesis. Matching is case-sensitive, whole-term (a term is not matched
inside a longer word or hyphenated compound), longest term first.

Each segment is synthesized one sentence group at a time (at most `max_sentences`
sentences and about `max_chars` characters per group) so the model never generates long
runs that drift; the groups are trimmed of edge silence and joined with a fixed pause.
The voice object is loaded once and reused for every group, so the voice is identical
across segments. Every group gets its own seed derived from (seed, segment id, group
index), so a rerun reproduces every file and editing one segment does not change the
audio of the others.

Output per segment: <out>/<id>.wav, 48 kHz mono PCM 24-bit, loudness-normalized to
`--lufs` (default -16 LUFS integrated, true peak kept at or below -1.5 dBTP).
manifest.json lists each segment's spoken text, groups, seeds, duration in seconds,
loudness, and a SHA-256 of the file.

Everything runs on this machine: no text or audio is sent anywhere. The only network
use is the backend fetching its model weights the first time; set HF_HUB_OFFLINE=1
afterwards and nothing is fetched.

Run it with the Python of the venv of the voice's backend (setup.sh creates them;
docs/environments/narration.md), e.g.
    <NARRATION_HOME>/venvs/kokoro/Scripts/python.exe narrate.py script.json --out out/ --pron pron.json
(`bin/python` instead of `Scripts/python.exe` outside Windows).
"""

import os

os.environ.setdefault("CUBLAS_WORKSPACE_CONFIG", ":4096:8")  # deterministic cuBLAS; before torch loads

import argparse
import hashlib
import json
import random
import re
import sys
import time
from pathlib import Path

import numpy as np
import soundfile as sf

from caches import use_home_caches
from spoken_text import apply_pronunciations, sentence_groups

use_home_caches()  # before any backend imports torch or huggingface_hub

HERE = Path(__file__).resolve().parent
OUTPUT_SR = 48000


# ----------------------------------------------------------------------------- audio


def group_seed(seed, segment_id, index):
    digest = hashlib.sha256(f"{seed}|{segment_id}|{index}".encode()).digest()
    return int.from_bytes(digest[:4], "little") & 0x7FFFFFFF


def set_seed(seed):
    random.seed(seed)
    np.random.seed(seed)
    import torch
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)


def trim_edges(x, sr, threshold_db=-50.0, keep_s=0.04):
    """Drop leading/trailing audio below threshold_db (10 ms RMS frames), keeping
    keep_s of margin so soft onsets and decays are not cut."""
    frame = int(0.01 * sr)
    n = len(x) // frame
    if n == 0:
        return x
    env = np.sqrt(np.mean(x[: n * frame].reshape(n, frame) ** 2, axis=1) + 1e-12)
    active = np.where(20 * np.log10(env) > threshold_db)[0]
    if len(active) == 0:
        return x[:0]
    a = max(0, active[0] * frame - int(keep_s * sr))
    b = min(len(x), (active[-1] + 1) * frame + int(keep_s * sr))
    return x[a:b]


def resample(x, sr, target):
    if sr == target:
        return x.astype(np.float32)
    import soxr
    return soxr.resample(x.astype(np.float32), sr, target, quality="VHQ").astype(np.float32)


def true_peak_db(x, sr):
    up = resample(x, sr, sr * 4)
    return 20 * np.log10(float(np.max(np.abs(up))) + 1e-12)


def normalize_loudness(x, sr, target_lufs, max_true_peak_db):
    """Gain only (no limiter): reach target_lufs unless that would push the true peak
    above max_true_peak_db, in which case the gain stops at the peak limit."""
    import pyloudnorm
    meter = pyloudnorm.Meter(sr)
    measured = meter.integrated_loudness(x) if len(x) > 0.5 * sr else float("-inf")
    if not np.isfinite(measured):
        return x, measured, true_peak_db(x, sr)
    gain_db = target_lufs - measured
    peak_after = true_peak_db(x, sr) + gain_db
    if peak_after > max_true_peak_db:
        gain_db -= peak_after - max_true_peak_db
    y = x * (10 ** (gain_db / 20))
    return y, meter.integrated_loudness(y), true_peak_db(y, sr)


# ----------------------------------------------------------------------------- backends


class KokoroBackend:
    """hexgrad/Kokoro-82M via the kokoro package. Deterministic (no sampling).
    Voice fields: speaker (e.g. af_heart), speed (1.0 = default pace), lang_code ('a' US, 'b' UK)."""

    def __init__(self, voice):
        import torch
        from kokoro import KPipeline
        self.voice = voice
        self.pipeline = KPipeline(lang_code=voice.get("lang_code", "a"), repo_id="hexgrad/Kokoro-82M",
                                  device="cuda" if torch.cuda.is_available() else "cpu")
        self.sample_rate = 24000
        self.model_id = "hexgrad/Kokoro-82M"

    def synthesize(self, text):
        pieces = [np.asarray(audio, dtype=np.float32)
                  for _gs, _ps, audio in self.pipeline(text, voice=self.voice["speaker"],
                                                       speed=self.voice.get("speed", 1.0),
                                                       split_pattern=None)]
        return np.concatenate(pieces) if pieces else np.zeros(0, np.float32)


class QwenBackend:
    """Qwen3-TTS via the qwen-tts package.
    CustomVoice model: fields speaker (e.g. Ryan, Aiden), instruct (style prompt).
    Base model: fields ref_audio (path, relative to voices.json) and ref_text (its transcript).
    Sampling fields (passed to generate): temperature, top_p, top_k, repetition_penalty."""

    SAMPLING = ("temperature", "top_p", "top_k", "repetition_penalty", "do_sample",
                "subtalker_dosample", "subtalker_temperature", "subtalker_top_p", "subtalker_top_k",
                "max_new_tokens")

    def __init__(self, voice):
        import torch
        from qwen_tts import Qwen3TTSModel
        self.voice = voice
        self.model_id = voice.get("model", "Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice")
        self.model = Qwen3TTSModel.from_pretrained(self.model_id, device_map="cuda:0", dtype=torch.bfloat16,
                                                   attn_implementation=voice.get("attn", "sdpa"))
        self.kwargs = {k: voice[k] for k in self.SAMPLING if k in voice}
        self.clone_prompt = None
        if "ref_audio" in voice:
            self.clone_prompt = self.model.create_voice_clone_prompt(
                ref_audio=str(voice["_base_dir"] / voice["ref_audio"]), ref_text=voice["ref_text"])
        self.sample_rate = None

    def synthesize(self, text):
        language = self.voice.get("language", "English")
        if self.clone_prompt is not None:
            wavs, sr = self.model.generate_voice_clone(text=text, language=language,
                                                       voice_clone_prompt=self.clone_prompt, **self.kwargs)
        else:
            wavs, sr = self.model.generate_custom_voice(text=text, language=language,
                                                        speaker=self.voice["speaker"],
                                                        instruct=self.voice.get("instruct", ""), **self.kwargs)
        self.sample_rate = sr
        return np.asarray(wavs[0], dtype=np.float32).reshape(-1)


class ChatterboxBackend:
    """Resemble AI Chatterbox (original 0.5B, or turbo) via the chatterbox-tts package.
    Fields: variant ('original' or 'turbo'), ref_audio (path relative to voices.json; omit for
    the built-in voice), exaggeration, cfg_weight, temperature (original only)."""

    def __init__(self, voice):
        self.voice = voice
        if voice.get("variant", "original") == "turbo":
            from chatterbox.tts_turbo import ChatterboxTurboTTS as Model
            self.model_id = "ResembleAI/chatterbox-turbo"
        else:
            from chatterbox.tts import ChatterboxTTS as Model
            self.model_id = "ResembleAI/chatterbox"
        self.model = Model.from_pretrained(device="cuda")
        self.sample_rate = self.model.sr
        self.ref = str(voice["_base_dir"] / voice["ref_audio"]) if voice.get("ref_audio") else None
        if self.ref:
            self.model.prepare_conditionals(self.ref, **({"exaggeration": voice["exaggeration"]}
                                                       if "exaggeration" in voice and voice.get("variant") != "turbo" else {}))

    def synthesize(self, text):
        kwargs = {k: self.voice[k] for k in ("exaggeration", "cfg_weight", "temperature", "top_p", "min_p",
                                              "repetition_penalty") if k in self.voice}
        wav = self.model.generate(text, **kwargs)
        return wav.squeeze(0).detach().cpu().numpy().astype(np.float32)


BACKENDS = {"kokoro": KokoroBackend, "qwen": QwenBackend, "chatterbox": ChatterboxBackend}


# ----------------------------------------------------------------------------- driver


def load_voice(spec, voices_path):
    voices_path = Path(voices_path)
    if isinstance(spec, str):
        presets = json.loads(voices_path.read_text(encoding="utf-8"))
        if spec not in presets:
            raise SystemExit(f"voice '{spec}' is not in {voices_path} (known: {', '.join(presets)})")
        voice = dict(presets[spec], name=spec)
    else:
        voice = dict(spec)
    if voice.get("backend") not in BACKENDS:
        raise SystemExit(f"voice backend must be one of {sorted(BACKENDS)}, got {voice.get('backend')!r}")
    voice["_base_dir"] = voices_path.parent
    return voice


class Narrator:
    """Loads one backend for one voice and renders segments with it."""

    def __init__(self, voice, seed, deterministic=True):
        import torch
        if deterministic:
            torch.backends.cudnn.deterministic = True
            torch.backends.cudnn.benchmark = False
            torch.use_deterministic_algorithms(True, warn_only=True)
        self.voice = voice
        self.seed = seed
        self.backend = BACKENDS[voice["backend"]](voice)
        self.max_sentences = voice.get("max_sentences", 2)
        self.max_chars = voice.get("max_chars", 280)
        self.gap_s = voice.get("sentence_gap_s", 0.45)

    def render(self, segment_id, text):
        groups = sentence_groups(text, self.max_sentences, self.max_chars)
        parts, info = [], []
        for i, g in enumerate(groups):
            s = group_seed(self.seed, segment_id, i)
            set_seed(s)
            t0 = time.time()
            audio = self.backend.synthesize(g)
            audio = trim_edges(audio, self.backend.sample_rate)
            audio = resample(audio, self.backend.sample_rate, OUTPUT_SR)
            info.append({"text": g, "seed": s, "duration_s": round(len(audio) / OUTPUT_SR, 3),
                         "synth_s": round(time.time() - t0, 2)})
            parts.append(audio)
        gap = np.zeros(int(self.gap_s * OUTPUT_SR), np.float32)
        joined = []
        for k, p in enumerate(parts):
            if k:
                joined.append(gap)
            joined.append(p)
        return (np.concatenate(joined) if joined else np.zeros(0, np.float32)), info


def write_segment(path, audio, lead_s, tail_s, lufs, max_tp):
    audio = np.concatenate([np.zeros(int(lead_s * OUTPUT_SR), np.float32), audio,
                            np.zeros(int(tail_s * OUTPUT_SR), np.float32)])
    if lufs is not None:
        audio, measured, tp = normalize_loudness(audio, OUTPUT_SR, lufs, max_tp)
    else:
        import pyloudnorm
        measured, tp = pyloudnorm.Meter(OUTPUT_SR).integrated_loudness(audio), true_peak_db(audio, OUTPUT_SR)
    audio = np.clip(audio, -1.0, 1.0)
    sf.write(str(path), audio, OUTPUT_SR, subtype="PCM_24")
    return len(audio) / OUTPUT_SR, measured, tp


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("script", help="script JSON: {voice, segments: [{id, text}]}")
    ap.add_argument("--out", required=True, help="output directory (created)")
    ap.add_argument("--pron", help="pronunciation map JSON: {term: spoken spelling}")
    ap.add_argument("--voices", default=str(HERE / "voices.json"), help="voice presets (default: voices.json)")
    ap.add_argument("--seed", type=int, default=20261118, help="base seed (default 20261118)")
    ap.add_argument("--lufs", default="-16", help="integrated loudness target per segment, or 'none'")
    ap.add_argument("--max-true-peak", type=float, default=-1.5, help="true-peak ceiling in dBTP")
    ap.add_argument("--lead", type=float, default=0.15, help="silence before each segment, seconds")
    ap.add_argument("--tail", type=float, default=0.35, help="silence after each segment, seconds")
    ap.add_argument("--only", help="comma-separated segment ids to (re)render; others keep their files")
    args = ap.parse_args(argv)

    script_path = Path(args.script)
    script = json.loads(script_path.read_text(encoding="utf-8"))
    voice = load_voice(script["voice"], args.voices)
    pron = json.loads(Path(args.pron).read_text(encoding="utf-8")) if args.pron else {}
    ids = [s["id"] for s in script["segments"]]
    if len(set(ids)) != len(ids):
        raise SystemExit("segment ids must be unique")
    for sid in ids:
        if not re.fullmatch(r"[A-Za-z0-9._-]+", sid):
            raise SystemExit(f"segment id {sid!r} must use only letters, digits, '.', '_' or '-'")
    only = set(args.only.split(",")) if args.only else None
    lufs = None if args.lufs.lower() == "none" else float(args.lufs)

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    manifest_path = out / "manifest.json"
    previous = {}
    if only and manifest_path.exists():
        previous = {s["id"]: s for s in json.loads(manifest_path.read_text(encoding="utf-8"))["segments"]}

    narrator = Narrator(voice, args.seed)
    entries = []
    for seg in script["segments"]:
        sid = seg["id"]
        if only and sid not in only and sid in previous:
            entries.append(previous[sid])
            continue
        spoken = apply_pronunciations(seg["text"], pron)
        audio, groups = narrator.render(sid, spoken)
        path = out / f"{sid}.wav"
        duration, measured, tp = write_segment(path, audio, args.lead, args.tail, lufs, args.max_true_peak)
        entry = {"id": sid, "file": path.name, "duration_s": round(duration, 3), "text": seg["text"],
                 "spoken_text": spoken, "lufs_i": round(measured, 2), "true_peak_dbtp": round(tp, 2),
                 "sha256": hashlib.sha256(path.read_bytes()).hexdigest(), "groups": groups}
        entries.append(entry)
        print(f"{sid}: {duration:.2f} s, {len(groups)} group(s), {measured:.1f} LUFS, {tp:.1f} dBTP", flush=True)

    public_voice = {k: v for k, v in voice.items() if not k.startswith("_")}
    manifest = {
        "script": str(script_path), "voice": public_voice, "model": narrator.backend.model_id,
        "seed": args.seed, "sample_rate": OUTPUT_SR, "channels": 1, "subtype": "PCM_24",
        "loudness_target_lufs": lufs, "max_true_peak_dbtp": args.max_true_peak,
        "lead_s": args.lead, "tail_s": args.tail, "pronunciations": pron,
        "total_duration_s": round(sum(e["duration_s"] for e in entries), 3),
        "segments": entries,
    }
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {len(entries)} segment(s), {manifest['total_duration_s']:.1f} s total -> {manifest_path}")


if __name__ == "__main__":
    sys.exit(main())
