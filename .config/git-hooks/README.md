# AI-Blocking Git Hooks

Git hooks that prevent AI indicators from being committed to your repository.

## What These Hooks Block

The hooks scan for over AI references including:

- AI tool names (Claude, Cursor, Copilot, ChatGPT, Gemini, etc.)
- AI-related phrases ("ai-generated", "ai-assisted", "generated with", etc.)
- Model names (GPT-4, Claude Sonnet, Claude Code, etc.)
- Company names (OpenAI, Anthropic, etc.)
- Co-authorship markers (Co-Authored-By: Claude, noreply@anthropic.com, etc.)

## Installation

All hooks are managed through the repository’s `.pre-commit-config.yaml`. From the repo root run:

```bash
pip install pre-commit # if not already installed
chmod +x .config/ai-hooks/ai_guard.py
pre-commit install
```

This registers two hooks that both call `ai_guard.py`:

- **pre-commit** – scans staged diffs for AI indicators before each commit.
- **commit-msg** – blocks commit messages containing AI indicators.

## Uninstallation

To remove the hooks from a repository:

```bash
pre-commit uninstall --hook-type pre-commit --hook-type commit-msg
```

## Testing

To verify the hooks are working:

1. Create a test file with AI indicators:

   ```bash
   echo "Generated with Claude Code" > test.txt
   git add test.txt
   git commit -m "test"
   ```

2. You should see an error message blocking the commit

3. Clean up:
   ```bash
   git reset HEAD test.txt
   rm test.txt
   ```

## Bypassing Hooks When Needed

In rare cases where you need to commit content with AI indicators, you can bypass the hooks using the `--no-verify` flag:

```bash
git commit --no-verify -m "your commit message"
```

## Notes

- These hooks are **repository-specific**; run `pre-commit install` in each repo where you want the guard active.
- `pre-commit` stores the generated hook scripts under `.git/hooks/`; they are not tracked by git.
- All pattern matching is case-insensitive
