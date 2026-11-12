# Branch `chore/release-1.4.0` — Release 1.4.0 (Favicon Editor & Header)

- **Type:** Chore — release versioning
- **Status:** Merged into `main` (tagged `v1.4.0`)
- **Base:** `main` @ `e747698`

## 1. Goal and Scope

Ship the favicon editing workflow and the header redesign as a minor release
(`1.3.1 → 1.4.0`). No breaking changes: both features are additive, and the
existing image/video pipelines are untouched.

Included since `v1.3.1`:

- `feat/pinned-tabs` (`afec304`) — **Images | Videos | Favicon** moved into
  the fixed header, so navigation stays visible while scrolling.
- `feat/favicon-editor` (`04edea9`, `5cc0ed4`) — live 256 px mini editor with:
  - per-image **Auto** background (dark logos → white, light logos → black),
    plus White / Black / Custom (**editable `#rrggbb` hex**) / Transparent;
  - **Padding** 0–30% with a live safe-area guide (Fit inside only);
  - **Corner radius** 0–50% with Square / 12% / 22% / Circle presets;
  - **batch filmstrip** (numbered thumbnails + steppers) when several logos
    are queued, with per-row selection in the queue;
  - **SVG upscaling** — vectors render at every selected size, while raster
    sources keep the no-upscaling rule;
  - new `favicon:preview` IPC channel (`renderFaviconPreview`).
- `feat/header-cleanup` (`bcd2f7f`) — header trimmed to the wordmark with the
  tabs centered over the content column, a **progressive blur** backdrop
  (strong at the top → 0 at the bottom edge), and the queue **Clear** action
  moved below each file listing (`QueueClearButton`).

Publish flow: merge into `main`, tag `v1.4.0`, push the tag. The
`.github/workflows/release.yml` job builds and publishes macOS arm64
(`.dmg`/`.zip`) and Windows x64 (installer/portable) to a public GitHub
Release with generated release notes.

## 2. Files Created / Modified

| File | Change |
| :--- | :--- |
| `package.json` | Version `1.4.0` |
| `package-lock.json` | Root version `1.4.0` |
| `docs/branches/chore-release-1.4.0.md` | **Created** — this document |
| `PROJECT_STATUS.md` | Modified — branch registry row |

## 3. Tests Performed and Results

- `npx tsc --noEmit` → clean.
- `npx vite build` → green (renderer + `dist-electron/main.js`).
- `node test/testProcessor.js` → pass.
- `node test/testIcoProcessor.js` → pass (including auto background, padding,
  corner radius, preview and SVG upscaling).
- `node test/testVideoProcessor.js` → pass.
- CI run for the pushed tag → **success** on both jobs:
  [43316426768](https://github.com/pedroaccrivera/leve/actions/runs/43316426768)
  (macOS arm64 + Windows x64).
- Published release: <https://github.com/pedroaccrivera/leve/releases/tag/v1.4.0>
  (public, not a draft, release notes generated).
  - `leve-1.4.0-mac-arm64.dmg` — 155,722,918 B
  - `leve-1.4.0-mac-arm64.zip` — 149,305,499 B
  - `leve-1.4.0-win-x64.exe` — 128,494,145 B
  - `leve-1.4.0-win-x64-portable.exe` — 128,269,374 B
- Sizes are essentially unchanged from `v1.3.1` (±0.1 MB), so the packaging work
  from `chore/prune-ffprobe-static` still holds with the new favicon code.
- CI annotation (informational): Node.js 20 deprecation warnings for
  `actions/checkout@v4`, `actions/setup-node@v4` and
  `softprops/action-gh-release@v2`; no action required yet.

## 4. Decision Log and Commit History

- **Minor bump:** two user-facing features (favicon editor, header redesign)
  land since `v1.3.1`; `1.4.0` is the smallest correct bump.
- **Release branch instead of tagging `main` directly:** keeps the version
  bump and its documentation reviewable before the tag triggers the public
  Release workflow.
- **Tag after the post-merge docs update:** the tag points at the commit that
  records the release as merged, matching the `v1.3.0`/`v1.3.1` flow.
- **Homebrew cask:** bumping the tap to `1.4.0` needs the published zip
  `sha256` and happens after CI artifacts exist (separate repository).

| Commit | Message |
| :--- | :--- |
| `260fd0e` | `chore(release): bump version to 1.4.0` |
| `8ccf6c0` | `chore: merge chore/release-1.4.0 into main` (PR [#1](https://github.com/pedroaccrivera/leve/pull/1)) |
| _(this docs commit)_ | `docs: mark chore/release-1.4.0 as merged` |
