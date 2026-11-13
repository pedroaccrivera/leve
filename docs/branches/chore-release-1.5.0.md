# Branch `chore/release-1.5.0` — Release 1.5.0 (Fieldwork UI)

- **Type:** Chore — release versioning
- **Status:** Merged into `main` (tagged `v1.5.0`)
- **Base:** `main` @ `7d95268`

## 1. Goal and Scope

Ship the Fieldwork UI overhaul as a **minor** release (`1.4.0 → 1.5.0`). The whole interface is
replaced, but there are no breaking data or API changes: image, video and favicon pipelines,
IPC contract, output strategies and test suites are untouched.

Included since `v1.4.0` (all from `feat/fieldwork-ui`):

- **Fieldwork design system** — one semantic token set (`paper`, `panel`, `surface`, `subtle`,
  `line`, `control`, `ink`, `muted`, `signal`, `on-signal`, `danger`, `warning`, `success`)
  driving both themes (**Paper** light / **Ink** dark), the nine designed text styles and the
  **Space Grotesk / Inter / IBM Plex Mono** families bundled as six offline woff2 subsets.
- **New shell** — 28 px window bar (macOS, real traffic lights), 72 px navigation with numbered
  tabs, workbench with a fluid workspace plus a fixed 428 px batch inspector and a 92 px action
  footer. Keyboard focus follows the design's control-state reference (2 px ink + 2 px offset).
- **All three workbenches rebuilt** with the designed states: start, ready, processing and
  **batch report** (an in-page report that replaces the summary modal), plus the locked,
  read-only recipe while a batch runs and a **Cancel batch** control.
- **Rebuilt application icon** — `leve / l.` master plus the design's optical drawings for
  16/24/32/64 px, applied to `.icns`, `.ico`, the window/favicon and the dev dock.
- **Header trim** — window bar label, no `100% local` note, icon-only theme switch.

### Behaviour changes worth flagging in the release notes

| Change | Detail |
| --- | --- |
| Batch report instead of a modal | "Start a new batch" clears the queue; "Dismiss report" returns to the queue |
| Cancel a running batch | Stops between files; finished files stay saved |
| `Remove metadata` default | Still **unchecked** (the design shows it checked; the safer default was kept) |
| Custom output width | Typing in `01 / OUTPUT WIDTH` switches the selection to `Custom` and the value persists across restarts (`leve_custom_width`); the old named preset list is gone, as the design has no preset manager |
| Video presets | `1280 / 1920 / 3840` (the design listed the matching heights) |
| Video `Original` format | Keeps the source container (mp4/mov/m4v/webm), otherwise MP4 |
| Window size | Defaults to 1280 × 800, minimum 1040 × 720 |

Publish flow: merge into `main`, tag `v1.5.0`, push the tag. The
`.github/workflows/release.yml` job builds and publishes macOS arm64 (`.dmg`/`.zip`) and
Windows x64 (installer/portable) to a public GitHub Release with generated release notes.

## 2. Files Created / Modified

| File | Change |
| :--- | :--- |
| `package.json` | Version `1.5.0` |
| `package-lock.json` | Root + `packages[""]` version `1.5.0` |
| `docs/branches/feat-fieldwork-ui.md` | Status → merged, merge record |
| `docs/branches/chore-release-1.5.0.md` | **Created** — this document |
| `PROJECT_STATUS.md` | Branch registry rows |

## 3. Tests Performed and Results

- `npx tsc --noEmit` → clean.
- `npx vite build` → green (renderer + `dist-electron/main.js`).
- `node test/testProcessor.js` → pass.
- `node test/testIcoProcessor.js` → pass (auto background, padding, radius, preview, SVG upscaling,
  plus the new any-CSS-colour background path).
- `node test/testVideoProcessor.js` → pass.
- Visual parity: 14 states captured at 1280 × 800 through `scripts/screenshot.cjs` and compared
  with the Figma frames, both themes.
- CI run for the pushed tag → **success** on both jobs:
  [43434602826](https://github.com/pedroaccrivera/leve/actions/runs/43434602826)
  (macOS arm64 + Windows x64).
- Published release: <https://github.com/pedroaccrivera/leve/releases/tag/v1.5.0>
  (public, not a draft, release notes generated).
  - `leve-1.5.0-mac-arm64.dmg` — 152,767,179 B
  - `leve-1.5.0-mac-arm64.zip` — 147,571,050 B
  - `leve-1.5.0-win-x64.exe` — 127,629,232 B
  - `leve-1.5.0-win-x64-portable.exe` — 127,479,468 B
- macOS artifacts shrank versus `v1.4.0` (dmg −2.96 MB, zip −1.73 MB): the rebuilt `.icns`
  (83 KB vs 1.32 MB) and `.ico` (7.7 KB vs 285 KB) are vector-derived flat artwork, which more than
  offsets the ~193 KB of bundled typefaces.

## 4. Decision Log and Commit History

- **Minor, not major:** a full visual redesign, but no breaking change to stored settings,
  IPC or file handling. The theme key (`leve_app_theme`) is unchanged, so an existing choice
  survives the upgrade.
- **Release branch instead of tagging `main` directly:** keeps the version bump and its
  documentation reviewable before the tag triggers the public Release workflow.
- **Tag after the post-merge docs update:** the tag points at the commit that records the release
  as merged, matching the `v1.3.x`/`v1.4.0` flow.
- **Homebrew cask:** updated in `pedroaccrivera/homebrew-tap`
  ([`b8901ba2`](https://github.com/pedroaccrivera/homebrew-tap/commit/b8901ba2de8462e2e4e8e599f2e6e8ec828a7d93))
  from `1.4.0` to `1.5.0`, with the published zip `sha256`
  (`dd7ae104…88f531`, 147,571,050 B — size and hash both verified against the release asset
  before committing).

| Commit | Message |
| :--- | :--- |
| `f534a4b` | `chore(release): bump version to 1.5.0` |
| `c5391f5` | `chore: merge chore/release-1.5.0 into main` |
| _(this docs commit)_ | `docs: mark chore/release-1.5.0 as merged` |
