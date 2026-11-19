"""Tests of spoken_text.py. Standard library only; from the repository root:

    python -m unittest discover -s narration
"""

import unittest

from spoken_text import apply_pronunciations, sentence_groups, split_sentences


class ApplyPronunciations(unittest.TestCase):
    def test_replaces_whole_terms_case_sensitively(self):
        pron = {"NLOS": "en-loss", "LoRA": "Lora"}
        self.assertEqual(apply_pronunciations("An NLOS volume, fine-tuned with LoRA.", pron),
                         "An en-loss volume, fine-tuned with Lora.")
        self.assertEqual(apply_pronunciations("nlos and lora stay.", pron), "nlos and lora stay.")

    def test_leaves_terms_inside_words_and_hyphenated_compounds(self):
        pron = {"NLOS": "en-loss"}
        self.assertEqual(apply_pronunciations("NLOSNet, non-NLOS, NLOS-like, NLOS.", pron),
                         "NLOSNet, non-NLOS, NLOS-like, en-loss.")

    def test_applies_terms_longest_first_one_after_another(self):
        self.assertEqual(apply_pronunciations("Lyra 2 follows.", {"Lyra 2": "Lyra two"}), "Lyra two follows.")
        # "Lyra 2" is replaced first; the shorter "Lyra" then matches inside its spoken spelling.
        self.assertEqual(apply_pronunciations("Lyra 2 follows.", {"Lyra": "Lie-ra", "Lyra 2": "Lyra two"}),
                         "Lie-ra two follows.")

    def test_terms_with_digits_and_hyphens(self):
        pron = {"HOLI-1-to-3-star": "holy one to three star", "3D-GTR": "three D G T R"}
        self.assertEqual(apply_pronunciations("HOLI-1-to-3-star and 3D-GTR.", pron),
                         "holy one to three star and three D G T R.")

    def test_spoken_spelling_is_literal(self):
        self.assertEqual(apply_pronunciations("Cost in USD.", {"USD": r"dollars \1"}), r"Cost in dollars \1.")


class SplitSentences(unittest.TestCase):
    def test_splits_at_sentence_ends_and_joins_lines(self):
        self.assertEqual(split_sentences("The direct light gives\ndepth.  Is it enough? No! 20 seeds agree."),
                         ["The direct light gives depth.", "Is it enough?", "No!", "20 seeds agree."])

    def test_keeps_abbreviations_and_spelled_initials_together(self):
        self.assertEqual(split_sentences("We compare, e.g. Lyra two. It fails."),
                         ["We compare, e.g. Lyra two.", "It fails."])
        self.assertEqual(split_sentences("An N.L.O.S. Volume is shown."), ["An N.L.O.S. Volume is shown."])

    def test_does_not_split_after_an_abbreviation_or_before_a_lowercase_word(self):
        self.assertEqual(split_sentences("See fig. 3 for approx. values."), ["See fig. 3 for approx. values."])


class SentenceGroups(unittest.TestCase):
    def test_groups_at_most_max_sentences(self):
        self.assertEqual(sentence_groups("One. Two. Three.", max_sentences=2, max_chars=280), ["One. Two.", "Three."])

    def test_starts_a_group_when_the_character_limit_is_passed(self):
        self.assertEqual(sentence_groups("Short one. Another short one.", max_sentences=2, max_chars=15),
                         ["Short one.", "Another short one."])

    def test_keeps_a_long_sentence_whole(self):
        long_sentence = "This sentence is longer than the limit allows."
        self.assertEqual(sentence_groups(long_sentence, max_sentences=2, max_chars=10), [long_sentence])

    def test_empty_text_has_no_groups(self):
        self.assertEqual(sentence_groups("  \n ", max_sentences=2, max_chars=280), [])


if __name__ == "__main__":
    unittest.main()
