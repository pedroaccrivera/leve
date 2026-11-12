# Branch `chore/release-1.4.0` — Release 1.4.0 (Favicon Editor & Header)

- **Type:** Chore — release versioning
- **Status:** In Progress — pending merge and tag
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
- CI run for the pushed tag → pending.

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
| _this commit_ | `chore(release): bump version to 1.4.0` |
| _pending_ | `chore: merge chore/release-1.4.0 into main` |
| _pending_ | `docs: mark chore/release-1.4.0 as merged` |
