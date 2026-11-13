# Branch `chore/release-1.5.1` — Release 1.5.1 (UI fit & fixes)

- **Type:** Chore — release versioning
- **Status:** Merged into `main` (tagged `v1.5.1`)
- **Base:** `main` @ `56a2831`

## 1. Goal and Scope

Ship the second UI pass as a **patch** release (`1.5.0 → 1.5.1`). Nothing new is introduced to the
product's behaviour: the release is the interface fitting a short window plus three fixes. The
image/video/favicon pipelines, IPC contract and storage keys are untouched.

Included since `v1.5.0` (all from `feat/ui-fit-and-hue`):

- **The whole app now fits the window.** Measured before the change: the empty Images screen
  overflowed by 113 px (workspace) and 214 px (inspector) at the default 1280 × 800 — scrolling was
  the design's assumption, not a bug, but the app no longer needs it.
- **Three viewport-height density tiers** (tall ≥ 1000, compact ≤ 999, short ≤ 759) drive every
  vertical measurement from CSS custom properties: page/section/field rhythm, control heights
  (44 → 40 px only in the short tier), navigation and footer heights, drop-zone height, list row
  heights and the display/title sizes. Result: **0 overflow in 10/10 combinations** (3 tabs ×
  1060/900/800/720) and the inspectors stay at 0 in every state, including queues and reports.
- **Inspector notes** move into an info tooltip below 1000 px tall, so the copy stays available
  instead of being dropped.
- **The window opens at `min(1280 × 800, work area)`**, so it never has to be resized just to be
  usable on a short screen.
- **Equal gutters between stacked choice rows** (4 px, as the design's `64:121` frame specifies)
  in the width presets, favicon background and ICO size groups.
- **No horizontal scrolling anywhere**: the inspector tooltip is anchored to the section's right
  edge, both columns clip horizontally and `html`/`body` are locked to the fixed-height shell.
- **Custom output folder is asked once for the whole batch.** The destination field used to open the
  native picker from `onFocus`, so the dialog returned every time the field regained focus; the
  picker now opens only from an explicit action, the folder is stored once in the recipe and applies
  to every file, and cancelling keeps the previous destination. Videos and favicon get the same
  `FolderPickerField` (they previously showed an empty text input for a path).

### Behaviour changes worth flagging in the release notes

| Change | Detail |
| --- | --- |
| Compact/condensed layout | Below 1000 px tall the rhythm tightens and the inspector helper text becomes an ⓘ tooltip; below 760 px controls drop to 40 px |
| Custom destination | One folder per batch, chosen from a picker instead of typing a path per field |
| Queue/report rows | Shorter in the condensed tiers (100 → 84 → 76 px); long lists still scroll |

Publish flow: merge into `main`, tag `v1.5.1`, push the tag. The
`.github/workflows/release.yml` job builds and publishes macOS arm64 (`.dmg`/`.zip`) and Windows x64
(installer/portable) to a public GitHub Release with generated release notes.

## 2. Files Created / Modified

| File | Change |
| :--- | :--- |
| `package.json` | Version `1.5.1` |
| `package-lock.json` | Root + `packages[""]` version `1.5.1` |
| `docs/branches/feat-ui-fit-and-hue.md` | Status → merged, merge record |
| `docs/branches/chore-release-1.5.1.md` | **Created** — this document |
| `PROJECT_STATUS.md` | Branch registry rows |

## 3. Tests Performed and Results

- `npx tsc --noEmit` → clean.
- `npx vite build` → green (renderer + `dist-electron/main.js`).
- `node test/testProcessor.js`, `test/testIcoProcessor.js`, `test/testVideoProcessor.js` → all pass.
- Layout matrix (`scripts/screenshot.cjs` with `LEVE_MEASURE=1`): workspace + inspector overflow `0`
  for the three tabs at 1060/900/800/720, and horizontal overflow `0` for the columns, the document
  and the body across 10 state/height/theme combinations.
- CI run for the pushed tag → **success** on both jobs:
  [43448975809](https://github.com/pedroaccrivera/leve/actions/runs/43448975809)
  (macOS arm64 + Windows x64).
- Published release: <https://github.com/pedroaccrivera/leve/releases/tag/v1.5.1>
  (public, not a draft, release notes generated).
  - `leve-1.5.1-mac-arm64.dmg` — 152,777,198 B
  - `leve-1.5.1-mac-arm64.zip` — 147,572,551 B
  - `leve-1.5.1-win-x64.exe` — 127,630,493 B
  - `leve-1.5.1-win-x64-portable.exe` — 127,480,719 B
- Sizes are within ~10 KB of `v1.5.0` — the release is layout and behaviour only.

## 4. Decision Log and Commit History

- **Patch, not minor:** no new user-facing capability — the app fits better and three defects are
  fixed. The hue selector (a feature) is being built on its own branch and will take the next minor.
- **Release branch instead of tagging `main` directly:** keeps the version bump and its documentation
  reviewable before the tag triggers the public Release workflow.
- **Tag after the post-merge docs update:** the tag points at the commit that records the release as
  merged, matching the previous flow.
- **Homebrew cask:** updated in `pedroaccrivera/homebrew-tap`
  ([`37b605bf`](https://github.com/pedroaccrivera/homebrew-tap/commit/37b605bf9ab3bfc6791412736e47454a3079589b))
  from `1.5.0` to `1.5.1`, with the published zip `sha256`
  (`b9941501…1a3bf5`, 147,572,551 B — size and hash verified against the release asset before
  committing).

| Commit | Message |
| :--- | :--- |
| `0d4c11c` | `chore(release): bump version to 1.5.1` |
| `aa2681e` | `chore: merge chore/release-1.5.1 into main` |
| _(this docs commit)_ | `docs: mark chore/release-1.5.1 as merged` |
