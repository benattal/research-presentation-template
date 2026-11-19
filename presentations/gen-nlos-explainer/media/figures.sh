# Where the paper's results are on this machine: the group's Dropbox folder
# tcig-transient-nvs/figures, which these scripts read and never change.
# Sourced by the .sh scripts in this directory; sets W, or stops with what to do.
# Set GEN_NLOS_FIGURES to use another location.
for W in "${GEN_NLOS_FIGURES:-}" \
         "$HOME/Kyros Group Dropbox/Group Folders/tcig-transient-nvs/figures" \
         "$HOME/Library/CloudStorage/Dropbox-KyrosGroup/Group Folders/tcig-transient-nvs/figures"; do
  [ -n "$W" ] && [ -d "$W" ] && break
done
if [ -z "$W" ] || [ ! -d "$W" ]; then
  echo "The figures folder was not found; set GEN_NLOS_FIGURES to tcig-transient-nvs/figures." >&2
  exit 1
fi
