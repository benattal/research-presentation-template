"""Transcribe narration locally, to check it without listening.

    transcribe.py <file.wav>                 print the transcript, one line per
                                             recognized phrase with its start time
    transcribe.py <dir>/manifest.json        transcribe every segment narrate.py wrote
                                             and compare it with its script text

The recognizer is faster-whisper (default model large-v3), run with beam 5 at
temperature 0, the language given, no prompt and no conditioning on earlier
phrases, so it is not biased toward the words the script expects. It runs on the
GPU when torch finds one (float16) and on the CPU otherwise (int8, much slower).
Everything runs on this machine: no text or audio is sent anywhere. The only network
use is fetching the model's weights the first time; set HF_HUB_OFFLINE=1 afterwards
and nothing is fetched.

For a manifest, each segment gets a word error rate (WER): substitutions, deletions
and insertions over the number of words in the script text, after Whisper's English
normalizer on both sides, so case, punctuation, and the spelling of numbers do not
count. Parentheses and brackets are taken out first, because that normalizer deletes
the words inside them, and a voice speaks those words. The reference is the segment's `text` (the script's wording), not its
`spoken_text`, so a term the pronunciation map respells counts as an error when the
recognizer writes what it heard ("NLOS" heard as "en loss"). Read the differences:
the rate finds the segments to look at, and a person decides whether each one is a
mispronunciation or a spelling the recognizer chose.

Run it with the Python of the `eval` venv (setup.sh; docs/environments/narration.md).
"""

import argparse
import json
import os
import sys
from math import gcd
from pathlib import Path

from caches import use_home_caches

use_home_caches()  # before torch or huggingface_hub are imported

WHISPER_SR = 16000
BRACKETS_TO_SPACES = str.maketrans("()[]<>", "      ")


def read_audio(path):
    """The file as mono float32 at 16 kHz, the input the Whisper model takes.

    Read with soundfile and resampled here instead of handing faster-whisper the
    path: its own decoder (faster-whisper 1.2.1) calls `av.open` with an argument,
    `metadata_errors`, that the PyAV it installs (19.0.2) rejects with a TypeError."""
    import soundfile as sf
    from scipy.signal import resample_poly
    audio, sr = sf.read(str(path), dtype="float32", always_2d=True)
    audio = audio.mean(axis=1)
    if sr != WHISPER_SR:
        divisor = gcd(sr, WHISPER_SR)
        audio = resample_poly(audio, WHISPER_SR // divisor, sr // divisor).astype("float32")
    return audio


def load_recognizer(model, device, compute_type):
    """A faster-whisper model on `device` ('cuda', 'cpu', or None to use the GPU
    when torch finds one).

    torch is imported first, and on Windows its `lib` directory is added to the DLL
    search path: ctranslate2, which faster-whisper runs on, needs the CUDA and cuDNN
    libraries but does not ship them, and torch does."""
    import torch
    if hasattr(os, "add_dll_directory"):
        os.add_dll_directory(str(Path(torch.__file__).parent / "lib"))
    from faster_whisper import WhisperModel
    device = device or ("cuda" if torch.cuda.is_available() else "cpu")
    compute_type = compute_type or ("float16" if device == "cuda" else "int8")
    return WhisperModel(model, device=device, compute_type=compute_type)


def transcribe(recognizer, path, language):
    """Recognized phrases of one audio file: [(start in seconds, text)]."""
    phrases, _info = recognizer.transcribe(read_audio(path), language=language, beam_size=5, temperature=0.0,
                                           condition_on_previous_text=False, vad_filter=False)
    return [(phrase.start, phrase.text.strip()) for phrase in phrases]


def compare(reference, heard, normalize):
    """Word error rate of `heard` against `reference`, and the spans that differ.

    Returns (errors, reference word count, differences): `errors` counts substituted,
    deleted and inserted words, so the rate is errors / words; each difference is
    {"type": "substitute" | "delete" | "insert", "script": ..., "heard": ...} in
    normalized words. An empty transcript deletes the whole reference."""
    import jiwer
    ref_words = normalize(reference.translate(BRACKETS_TO_SPACES)).split()
    heard_words = normalize(heard.translate(BRACKETS_TO_SPACES)).split()
    if not ref_words:
        raise SystemExit(f"segment text has no words to compare: {reference!r}")
    if not heard_words:
        return len(ref_words), len(ref_words), [{"type": "delete", "script": " ".join(ref_words), "heard": ""}]
    aligned = jiwer.process_words(" ".join(ref_words), " ".join(heard_words))
    differences = [{"type": chunk.type,
                    "script": " ".join(ref_words[chunk.ref_start_idx:chunk.ref_end_idx]),
                    "heard": " ".join(heard_words[chunk.hyp_start_idx:chunk.hyp_end_idx])}
                   for chunk in aligned.alignments[0] if chunk.type != "equal"]
    return aligned.substitutions + aligned.deletions + aligned.insertions, len(ref_words), differences


def check_manifest(recognizer, manifest_path, only, language):
    """Transcribe the segments of a manifest (all, or the ids in `only`) and compare
    each with its script text; prints one line per segment as it finishes.

    Returns one report per segment: id, file, text, heard, errors, words, wer,
    differences."""
    from whisper_normalizer.english import EnglishTextNormalizer
    normalize = EnglishTextNormalizer()
    segments = json.loads(manifest_path.read_text(encoding="utf-8"))["segments"]
    unknown = (only or set()) - {segment["id"] for segment in segments}
    if unknown:
        raise SystemExit(f"not in {manifest_path}: {', '.join(sorted(unknown))}")
    reports = []
    for segment in segments:
        if only and segment["id"] not in only:
            continue
        heard = " ".join(text for _start, text in transcribe(recognizer, manifest_path.parent / segment["file"], language))
        errors, words, differences = compare(segment["text"], heard, normalize)
        reports.append({"id": segment["id"], "file": segment["file"], "text": segment["text"], "heard": heard,
                        "errors": errors, "words": words, "wer": round(errors / words, 4),
                        "differences": differences})
        print(f"{segment['id']}: WER {100 * errors / words:.1f}% ({errors} of {words} words)", flush=True)
        for difference in differences:
            print(f"    {difference['type']}: script \"{difference['script']}\" heard \"{difference['heard']}\"", flush=True)
    return reports


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("input", help="a WAV file, or the manifest.json narrate.py wrote")
    ap.add_argument("--only", help="comma-separated segment ids of the manifest to check")
    ap.add_argument("--out", help="with a manifest: write the per-segment reports to this JSON file")
    ap.add_argument("--model", default="large-v3", help="faster-whisper model (default large-v3)")
    ap.add_argument("--language", default="en", help="language spoken (default en)")
    ap.add_argument("--device", choices=("cuda", "cpu"), help="default: cuda when torch finds a GPU, else cpu")
    ap.add_argument("--compute-type", help="default: float16 on cuda, int8 on cpu; int8_float16 saves GPU memory")
    args = ap.parse_args(argv)

    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # transcripts are not always in the console's code page
    path = Path(args.input)
    recognizer = load_recognizer(args.model, args.device, args.compute_type)

    if path.suffix.lower() != ".json":
        for start, text in transcribe(recognizer, path, args.language):
            print(f"[{start:6.1f}] {text}")
        return

    reports = check_manifest(recognizer, path, set(args.only.split(",")) if args.only else None, args.language)
    errors = sum(report["errors"] for report in reports)
    words = sum(report["words"] for report in reports)
    differing = sum(1 for report in reports if report["differences"])
    print(f"{len(reports)} segment(s), {words} words: WER {100 * errors / words:.1f}%, {differing} segment(s) differ from the script")
    if args.out:
        Path(args.out).write_text(json.dumps(reports, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"wrote {args.out}")


if __name__ == "__main__":
    sys.exit(main())
