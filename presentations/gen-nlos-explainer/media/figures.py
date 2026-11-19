"""Where the paper's results are on this machine: the group's Dropbox folder
tcig-transient-nvs/figures, which the scripts in this directory read and never change."""
import os
from pathlib import Path


def figures_dir():
    """The figures folder: GEN_NLOS_FIGURES if set, otherwise the Dropbox location on Windows or macOS."""
    candidates = [
        os.environ.get('GEN_NLOS_FIGURES'),
        Path.home() / 'Kyros Group Dropbox/Group Folders/tcig-transient-nvs/figures',
        Path.home() / 'Library/CloudStorage/Dropbox-KyrosGroup/Group Folders/tcig-transient-nvs/figures',
    ]
    for candidate in candidates:
        if candidate and Path(candidate).is_dir():
            return Path(candidate)
    raise SystemExit('The figures folder was not found; set GEN_NLOS_FIGURES to tcig-transient-nvs/figures.')
