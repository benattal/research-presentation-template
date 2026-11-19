"""The text a narration model is given: script text with its pronunciations
applied, cut into the sentence groups that are synthesized one at a time.

Standard library only, so `test_spoken_text.py` runs under any Python 3,
without a venv, torch, or a model.
"""

import re

ABBREVIATIONS = {"e.g.", "i.e.", "et al.", "etc.", "vs.", "fig.", "figs.", "eq.", "eqs.", "dr.", "prof.",
                 "approx.", "cf.", "sec.", "no.", "mr.", "ms.", "st."}


def apply_pronunciations(text, pron):
    """Replace each term of `pron` by its spoken spelling: whole term, case-sensitive,
    longest first, never inside a word or a hyphenated compound.

    The terms are replaced one after another on the same string, so a spoken spelling
    that contains a shorter term of the map as a whole word is replaced again."""
    for term in sorted(pron, key=len, reverse=True):
        pattern = r"(?<![\w-])" + re.escape(term) + r"(?![\w-])"
        text = re.sub(pattern, lambda _m, s=pron[term]: s, text)
    return text


def split_sentences(text):
    """Split at . ! ? followed by whitespace and an uppercase letter, digit or quote,
    except after known abbreviations and spelled initials such as 'N.L.O.S.'.

    Runs of whitespace, line breaks included, become one space."""
    text = " ".join(text.split())
    sentences, start = [], 0
    for m in re.finditer(r"[.!?]+[\"')\]]*\s+(?=[A-Z0-9\"'(\[])", text):
        before = text[start:m.end()].rstrip()
        last = before.split(" ")[-1].lower()
        if last in ABBREVIATIONS or re.fullmatch(r"(?:[a-z]\.)+", last):
            continue
        sentences.append(before)
        start = m.end()
    if text[start:].strip():
        sentences.append(text[start:].strip())
    return sentences


def sentence_groups(text, max_sentences, max_chars):
    """Greedy grouping of whole sentences: at most max_sentences per group and at most
    max_chars characters, except that a single longer sentence stays whole."""
    groups, current = [], []
    for s in split_sentences(text):
        candidate = " ".join(current + [s])
        if current and (len(current) >= max_sentences or len(candidate) > max_chars):
            groups.append(" ".join(current))
            current = [s]
        else:
            current.append(s)
    if current:
        groups.append(" ".join(current))
    return groups
