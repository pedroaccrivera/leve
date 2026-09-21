# Branch `docs/homebrew-cask-readme` — Spotlight Homebrew Cask in README

- **Type:** Docs — README install visibility
- **Status:** In Progress (awaiting merge approval)
- **Base:** `main` @ `6c37661`

## 1. Goal and Scope

Make the Homebrew cask impossible to miss: a callout block right under the
project intro (before Key Features) with tap + install commands and why it is
recommended, plus a pointer from the GitHub Releases section back to the cask.

No code, no version change.

## 2. Files Created / Modified

| File | Change |
| :--- | :--- |
| `README.md` | Homebrew callout after intro; cross-pointer in Releases section |

## 3. Tests Performed and Results

- Markdown rendered by inspection (blockquote + fenced block, no HTML).
- No source changes → `tsc` unaffected.

## 4. Decision Log and Commit History

- Cask placed above features, not buried in install docs: user explicitly
  asked for maximum visibility on Mac.
