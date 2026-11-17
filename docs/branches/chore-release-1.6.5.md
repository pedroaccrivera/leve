# Branch `chore/release-1.6.5` — Release 1.6.5 (Media tabs fill the header)

- **Type:** Chore — release versioning
- **Status:** Merged into `main` (tagged `v1.6.5`)
- **Base:** `main` @ `8537985`

## 1. Goal and Scope

Ship the media-tab refactor as a **patch** release (`1.6.4 → 1.6.5`). Layout only.

Included since `v1.6.4` (from `refactor/tabs-to-header-rule`):

- **The media tabs fill the header.** They used to occupy a 48 px band centred in the 72 px bar,
  leaving ~12 px of dead space above and below. They now span the header's height with the label
  centred in the whole block — the same vertical line as the wordmark and the theme switch — and the
  active tab's signal fill reaches from the top of the bar to its bottom rule. The tab block overlaps
  that hairline by 1 px so the active tab's ink underline lands on it instead of above it.
- The click target grows with them (48 → 72 px tall).

### Behaviour changes worth flagging in the release notes

| Change | Detail |
| --- | --- |
| Header | The media tabs are full height; the active fill reaches the header's bottom rule |

Publish flow: merge into `main`, tag `v1.6.5`, push the tag. The
`.github/workflows/release.yml` job builds and publishes macOS arm64 (`.dmg`/`.zip`) and Windows x64
(installer/portable) to a public GitHub Release with generated release notes.

## 2. Files Created / Modified

| File | Change |
| :--- | :--- |
| `package.json` | Version `1.6.5` |
| `package-lock.json` | Root + `packages[""]` version `1.6.5` |
| `docs/branches/refactor-tabs-to-header-rule.md` | Status → merged, merge record |
| `docs/branches/chore-release-1.6.5.md` | **Created** — this document |
| `PROJECT_STATUS.md` | Branch registry rows |

## 3. Tests Performed and Results

- `npx tsc --noEmit` → clean.
- `npx vite build` → green (renderer + `dist-electron/main.js`).
- `node test/testProcessor.js`, `test/testIcoProcessor.js`, `test/testVideoProcessor.js` → all pass.
- Layout measured (`LEVE_MEASURE=1`) in Ink and Paper @800: workspace 0, inspector 0, no horizontal
  overflow in the columns, the document or the body.
- Visual check of the header in both themes (the full-height fill, the merged underline, the label on
  the wordmark's line), plus a run of the app in dev for the user to review.
- CI run for the pushed tag → **success** on both jobs:
  [44189189778](https://github.com/pedroaccrivera/leve/actions/runs/44189189778) (macOS arm64 + Windows x64).
- Published release: <https://github.com/pedroaccrivera/leve/releases/tag/v1.6.5>
  (public, not a draft, release notes generated).
  - `leve-1.6.5-mac-arm64.dmg` — 152,771,697 B
  - `leve-1.6.5-mac-arm64.zip` — 147,575,563 B
  - `leve-1.6.5-win-x64.exe` — 127,633,372 B
  - `leve-1.6.5-win-x64-portable.exe` — 127,483,603 B
- Sizes are within ~2 KB of `v1.6.4` — the release changes the header's height only.

## 4. Decision Log and Commit History

- **Patch:** a layout refinement of the header. **F4 (micro-interactions) remains planned for
  `1.7.0`.**
- **Homebrew cask:** still updated (`1.6.4 → 1.6.5`, zip `sha256` `76a629b0…1af937`, 147,575,563 B —
  size and hash verified against the release asset before committing). The README no longer
  advertises it.
- **Tag after the post-merge docs update:** the tag points at the commit that records the release as
  merged.

| Commit | Message |
| :--- | :--- |
| `7d3321f` | `chore(release): bump version to 1.6.5` |
| `dbb8b75` | `chore: merge chore/release-1.6.5 into main` |
| _(this docs commit)_ | `docs: mark chore/release-1.6.5 as merged` |

## 5. Next

`1.6.6` is planned as the **titlebar removal** iteration (the header becomes the window bar, the
traffic lights align with the brand, the brand gains the accent full stop). Plan presented separately.
