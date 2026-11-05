# Branch `chore/release-1.3.1` — Release 1.3.1 (Packaging Size)

- **Type:** Chore — release versioning
- **Status:** Merged into `main`
- **Base:** `main` @ `c5bf36c`

## 1. Goal and Scope

Ship the packaging improvement from `chore/prune-ffprobe-static` as a patch
release (`1.3.0 → 1.3.1`). No application behavior changes: the only
difference is that the bundled `ffprobe` now includes just the target
platform/arch instead of all six prebuilt binaries.

Included since `v1.3.0`:
- `chore/prune-ffprobe-static`: `afterPack` hook keeps
  `bin/<platform>/<arch>` and removes the rest before signing.
  - Installed macOS app: **552 MB → 402 MB**.
  - macOS `.dmg`: **214.0 MB → 155.8 MB** (-58.2 MB).
  - macOS `.zip`: **205.6 MB → 149.3 MB** (-56.3 MB).
  - Windows (expected, verified in CI): keeps `win32/x64` (60 MB) and removes
    `win32/ia32` + `darwin/*` + `linux/*` (≈275 MB uncompressed).

Publish: merge into `main`, tag `v1.3.1`, push the tag. The
`.github/workflows/release.yml` job builds and publishes macOS arm64
(`.dmg`/`.zip`) and Windows x64 (installer/portable) to a public GitHub
Release.

## 2. Files Created / Modified

| File | Change |
| :--- | :--- |
| `package.json` | Version `1.3.1` |
| `package-lock.json` | Root version `1.3.1` |
| `docs/branches/chore-release-1.3.1.md` | **Created** — this document |
| `PROJECT_STATUS.md` | Modified — branch registry row |

## 3. Tests Performed and Results

- `npx tsc --noEmit` → clean.
- `npx vite build` → green.
- `node test/testProcessor.js` → pass.
- `node test/testIcoProcessor.js` → pass.
- `node test/testVideoProcessor.js` → pass.
- Local packaging (macOS arm64) was validated on the base branch:
  hook freed 158.7 MB; DMG/ZIP measured above; bundled `ffprobe -version`
  works; packaged app boots and loads `app.asar/dist/index.html`.
- CI run [42117728329](https://github.com/pedroaccrivera/leve/actions/runs/42117728329)
  → success on both jobs:
  - macOS arm64: hook freed 158.7 MB.
  - Windows x64: hook freed **275.1 MB** (kept `win32\x64`; removed
    `darwin\arm64`, `darwin\x64`, `linux\ia32`, `linux\x64`, `win32\ia32`).
- Published assets (v1.3.1): `dmg` 155,753,763 B, `zip` 149,297,404 B,
  `win-x64.exe` 128,487,177 B, `win-x64-portable.exe` 128,262,402 B.

## 4. Decision Log and Commit History

- **Patch (not minor):** no new user-facing capability; only distributable
  size. `1.3.1` is the smallest correct bump.
- **Tag after the post-merge docs update:** the tag points at the commit that
  records the release as merged, matching the `v1.3.0` flow.
- **Homebrew cask:** bumping the tap to `1.3.1` requires the published zip
  sha256 and is handled after the CI artifacts exist (separate repository).

| Commit | Message |
| :--- | :--- |
| `6de9965` | `chore(release): bump version to 1.3.1` |
| `0eae660` | `chore: merge chore/release-1.3.1 into main` |
| — | `docs: mark chore/release-1.3.1 as merged` |
