#!/usr/bin/env bash
set -e

echo "Installing Specstory wrapper..."

# --- 1. Locate real specstory binary ---
REAL_BIN="$(command -v specstory || true)"
if [[ -z "$REAL_BIN" ]]; then
  echo "Specstory not found in PATH. Install it first (brew install specstoryai/tap/specstory)."
  exit 1
fi

REAL_DIR="$(dirname "$REAL_BIN")"
REAL_WRAPPED="$REAL_DIR/specstory-real"

# --- 2. Rename real binary (if not already renamed) ---
if [[ ! -f "$REAL_WRAPPED" ]]; then
  echo "➡ Renaming $REAL_BIN → $REAL_WRAPPED"
  mv "$REAL_BIN" "$REAL_WRAPPED"
else
  echo "✔ Real binary already renamed."
fi

# --- 3. Install wrapper to ~/bin/specstory ---
mkdir -p "$HOME/bin"
WRAPPER_BIN="$HOME/bin/specstory"

echo "➡ Installing wrapper launcher → $WRAPPER_BIN"
cat > "$WRAPPER_BIN" <<'EOF'
#!/usr/bin/env bash
python3 "$HOME/.specstory_wrapper/specstory_wrapper.py" "$@"
EOF

chmod +x "$WRAPPER_BIN"

# --- 4. Install Python wrapper script ---
if [[ ! -f "specstory_wrapper.py" ]]; then
  echo "specstory_wrapper.py not found in the current directory."
  echo "Please place it next to this installer."
  exit 1
fi

echo "➡ Copying specstory_wrapper.py → ~/.specstory_wrapper/"
mkdir -p "$HOME/.specstory_wrapper"
cp specstory_wrapper.py "$HOME/.specstory_wrapper/specstory_wrapper.py"

if ! echo "$PATH" | grep -q "$HOME/bin"; then
  echo "➡ Adding ~/bin to PATH in your shell config (bash/zsh)"

  PROFILE_FILES=()

  # Always consider both common rc files so it works even if you switch shells
  PROFILE_FILES+=("$HOME/.zshrc" "$HOME/.bashrc")

  # De-duplicate list
  UNIQUE_PROFILES=()
  for P in "${PROFILE_FILES[@]}"; do
    SKIP=false
    for U in "${UNIQUE_PROFILES[@]}"; do
      if [[ "$P" == "$U" ]]; then
        SKIP=true
        break
      fi
    done
    $SKIP && continue
    UNIQUE_PROFILES+=("$P")
  done

  for PROFILE in "${UNIQUE_PROFILES[@]}"; do
    [[ -z "$PROFILE" ]] && continue

    # Create the profile file if it doesn't exist yet
    if [[ ! -f "$PROFILE" ]]; then
      touch "$PROFILE"
    fi

    if ! grep -q 'export PATH="$HOME/bin:$PATH"' "$PROFILE" 2>/dev/null; then
      echo "➡ Updating $PROFILE"
      echo 'export PATH="$HOME/bin:$PATH"' >> "$PROFILE"
    else
      echo "✔ ~/bin already configured in $PROFILE"
    fi
  done
fi

# --- 6. Virtual environment activation hooks ---
echo
echo "═══════════════════════════════════════════════════════════════"
echo "VIRTUAL ENVIRONMENT SETUP"
echo "═══════════════════════════════════════════════════════════════"
echo
echo "Which virtual environment manager do you use?"
echo "  1) conda"
echo "  2) venv / virtualenv"
echo "  3) None / Manual setup"
echo
printf "Enter choice [1-3]: "
read VENV_CHOICE

case "$VENV_CHOICE" in
  1)
    # --- Conda ---
    if ! command -v conda >/dev/null 2>&1; then
      echo "Error: conda not found in PATH."
      exit 1
    fi

    echo
    echo "Enter the name of the conda environment where Specstory capture should be active."
    echo "(Example: base or your dev environment name)"
    printf "Environment name: "
    read ENV_NAME

    # Validate environment name
    if [[ -z "$ENV_NAME" ]] || [[ "$ENV_NAME" =~ [^a-zA-Z0-9_-] ]]; then
      echo "Error: Invalid environment name. Use only alphanumeric characters, underscores, and hyphens."
      exit 1
    fi

    # Validate environment exists and get its path
    ENV_PATH="$(conda env list | grep -E "^${ENV_NAME}[[:space:]]" | awk '{print $NF}')"

    if [[ -z "$ENV_PATH" ]]; then
      echo "Conda environment '$ENV_NAME' not found."
      echo "Available environments:"
      conda env list
      exit 1
    fi

    if [[ ! -d "$ENV_PATH" ]]; then
      echo "Error: Environment path '$ENV_PATH' is not a valid directory."
      exit 1
    fi

    HOOK_DIR="$ENV_PATH/etc/conda/activate.d"
    mkdir -p "$HOOK_DIR"

    echo "➡ Adding activation hook → $HOOK_DIR/specstory.sh"

    cat > "$HOOK_DIR/specstory.sh" <<'EOF'
export PATH="$HOME/bin:$PATH"
alias claude="specstory run claude --no-cloud-sync"
EOF

    DEACTIVATE_HOOK_DIR="$ENV_PATH/etc/conda/deactivate.d"
    mkdir -p "$DEACTIVATE_HOOK_DIR"

    echo "➡ Adding deactivation hook → $DEACTIVATE_HOOK_DIR/specstory.sh"

    cat > "$DEACTIVATE_HOOK_DIR/specstory.sh" <<'EOF'
unalias claude 2>/dev/null || true
EOF

    echo "✔ Hooks installed for conda environment: $ENV_NAME"
    echo "➡ Run: conda activate $ENV_NAME"
    ;;

  2)
    # --- venv / virtualenv ---
    echo
    echo "Enter the full path to your virtual environment directory."
    echo "(Example: /path/to/project/.venv or ~/myproject/venv)"
    printf "Path: "
    read VENV_PATH

    # Expand ~ if present
    VENV_PATH="${VENV_PATH/#\~/$HOME}"

    if [[ ! -d "$VENV_PATH" ]]; then
      echo "Error: Directory '$VENV_PATH' does not exist."
      exit 1
    fi

    ACTIVATE_SCRIPT="$VENV_PATH/bin/activate"
    if [[ ! -f "$ACTIVATE_SCRIPT" ]]; then
      echo "Error: activate script not found at '$ACTIVATE_SCRIPT'."
      exit 1
    fi

    # Check if already patched
    if grep -q "# SPECSTORY HOOK START" "$ACTIVATE_SCRIPT" 2>/dev/null; then
      echo "✔ Specstory hook already present in $ACTIVATE_SCRIPT"
    else
      echo "➡ Patching $ACTIVATE_SCRIPT"

      cat >> "$ACTIVATE_SCRIPT" <<'EOF'

# SPECSTORY HOOK START
export PATH="$HOME/bin:$PATH"
alias claude="specstory run claude --no-cloud-sync"
# SPECSTORY HOOK END
EOF

      echo "✔ Activation hook added to $ACTIVATE_SCRIPT"
    fi

    # Patch deactivate script if it exists, otherwise patch the deactivate function in activate
    DEACTIVATE_SCRIPT="$VENV_PATH/bin/deactivate"
    if [[ -f "$DEACTIVATE_SCRIPT" ]]; then
      # Standalone deactivate script exists
      if grep -q "# SPECSTORY DEACTIVATE HOOK" "$DEACTIVATE_SCRIPT" 2>/dev/null; then
        echo "✔ Deactivation hook already present in $DEACTIVATE_SCRIPT"
      else
        echo "➡ Patching $DEACTIVATE_SCRIPT"
        cat >> "$DEACTIVATE_SCRIPT" <<'EOF'

# SPECSTORY DEACTIVATE HOOK
unalias claude 2>/dev/null || true
EOF
        echo "✔ Deactivation hook added to $DEACTIVATE_SCRIPT"
      fi
    else
      # No standalone deactivate script, patch the deactivate function in activate
      if grep -q "# SPECSTORY DEACTIVATE HOOK" "$ACTIVATE_SCRIPT" 2>/dev/null; then
        echo "✔ Deactivation hook already present."
      else
        # Insert unalias into the deactivate function
        if grep -q "^deactivate ()" "$ACTIVATE_SCRIPT"; then
          sed -i.bak '/^deactivate ()/,/^}/ {
            /^}/i\
    # SPECSTORY DEACTIVATE HOOK\
    unalias claude 2>/dev/null || true
          }' "$ACTIVATE_SCRIPT"
          rm -f "$ACTIVATE_SCRIPT.bak"
          echo "✔ Deactivation hook added to deactivate function."
        else
          echo "⚠ Could not patch deactivate. Add manually to your deactivate workflow:"
          echo '   unalias claude 2>/dev/null || true'
        fi
      fi
    fi

    echo "➡ Run: source $ACTIVATE_SCRIPT"
    ;;

  3)
    # --- Manual / None ---
    echo
    echo "Manual setup instructions:"
    echo "─────────────────────────────────────────────────────────────"
    echo "Add the following lines to your shell profile or activate script:"
    echo
    echo '  export PATH="$HOME/bin:$PATH"'
    echo '  alias claude="specstory run claude --no-cloud-sync"'
    echo
    echo "To remove the alias when deactivating, add:"
    echo '  unalias claude 2>/dev/null || true'
    echo "─────────────────────────────────────────────────────────────"
    ;;

  *)
    echo "Invalid choice. Skipping virtual environment setup."
    echo "You can run this script again or configure manually."
    ;;
esac

echo
echo "Installation complete!"
echo "Your Specstory wrapper is ready."
echo "Restart your terminal or 'source ~/.zshrc' / 'source ~/.bashrc' if needed."
echo