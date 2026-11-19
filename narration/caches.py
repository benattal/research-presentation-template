"""Where the narration tools keep downloaded model weights.

`setup.sh` creates one venv per backend in `<NARRATION_HOME>/venvs/<backend>/`.
The weights those backends download go beside the venvs, in
`<NARRATION_HOME>/hf-cache/` (Hugging Face) and `<NARRATION_HOME>/torch-cache/`
(torch.hub), so one directory outside the repository holds everything large.
"""

import os
import sys
from pathlib import Path


def use_home_caches():
    """Point Hugging Face and torch at the caches beside the running venv, and
    turn the Hugging Face client's usage reporting off.

    Call it before importing torch or a backend: the libraries read these
    variables when they are imported. The home is the directory two levels above
    the interpreter's venv (`<home>/venvs/<backend>/`), not the value of
    `NARRATION_HOME`, so a script uses the weights that belong to the venv running
    it. A variable the caller has already set is kept. Under an interpreter that is
    not in a `venvs/` directory nothing is set.

    Returns the home directory, or None."""
    venv = Path(sys.prefix)
    if venv.parent.name != "venvs":
        return None
    home = venv.parent.parent
    os.environ.setdefault("HF_HOME", str(home / "hf-cache"))
    os.environ.setdefault("TORCH_HOME", str(home / "torch-cache"))
    os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")
    return home
