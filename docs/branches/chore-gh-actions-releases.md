# Branch `chore/gh-actions-releases` — CI/CD Release Workflow

- **Type:** Chore — CI/CD
- **Status:** Merged into `main`
- **Base:** `main` @ `a217923`
- **Branch commit:** `80a5e28` — `chore: add GitHub Actions release workflow for macOS arm64/x64 and Windows x64/arm64`

## 1. Goal and Scope

Automate distributable builds on tag push (`v*`) for the four supported targets:

- macOS arm64 + x64 (`--mac` → `.dmg`, `.zip`)
- Windows x64 + arm64 (`--win` → `.exe`, portable)
- Single `Release` job with a 4-entry matrix, Node 20, `npm ci` with `npm_config_arch` (correct Sharp prebuilt, notably for Win arm64 cross-compile), `npx tsc && npx vite build`, `npx electron-builder <platform> --<arch>` with `CSC_IDENTITY_AUTO_DISCOVERY: false`, upload via `softprops/action-gh-release@v2`.
- Add arch-specific packaging scripts to `package.json` so CI and local runs share the same commands.
- Merge path: `8e98464` (merge into `main`) → `118cf6c` registry update → `b593ffd` runner-image fix on `main`.

Out of scope: no app code, no signing/notarization, no auto-update feed.

## 2. Files Created / Modified

Reconstructed from `git show --stat 80a5e28` (2 files, +84):

| File | Change |
| :--- | :--- |
| `.github/workflows/release.yml` | **Created** (80 lines) — tag-triggered matrix release workflow described above |
| `package.json` | Modified (+4 scripts): `package:mac:arm64`, `package:mac:x64`, `package:win:x64`, `package:win:arm64` (`tsc && vite build && electron-builder --<platform> --<arch>`) |

Post-merge follow-up on `main` (not part of this branch, documented for traceability):

| Commit | Change |
| :--- | :--- |
| `b593ffd` — `chore: update release workflow runner operating systems to macos-14 and windows-11-arm` | `macos-latest` kept for arm64; `macos-13` → `macos-26-intel` (x64); `windows-latest` → `windows-11-arm` (arm64). Current `release.yml` matrix: `macos-latest/arm64`, `macos-26-intel/x64`, `windows-latest/x64`, `windows-11-arm/arm64` |

No `docs/branches/` file was created at the time (gap fixed retroactively by this document on `docs/branch-docs-registry`).

## 3. Tests Performed and Results

Historical run (Aug 2026, reconstructed from evidence — no CI log was attached to the branch):

- **Local packaging evidence:** `release/` (git-ignored) contains 27–31 Aug 2026 outputs — `leve-1.0.0-arm64.dmg` (~104 MB), `leve-1.0.0-arm64-mac.zip` (~101 MB), `leve 1.0.0.exe` / `leve Setup 1.0.0.exe` (~91 MB) — consistent with a successful `electron-builder` run after this change.
- **Workflow validation (implied):** tag-triggered matrix syntax, `softprops/action-gh-release@v2` upload globs (`release/*.dmg|*.zip|*.exe`).
- **Result:** Merged via `8e98464`, registry marked Merged in `118cf6c`, tag `v1.0.0` present on `main`. Runner-image correction (`b593ffd`) applied afterward on `main`.

> Note: this section is a retroactive reconstruction. For future CI branches, link the passing Actions run URL at merge time.

## 4. Decision Log and Commit History

- `80a5e28` (`chore/gh-actions-releases`) — the single branch commit: new workflow + 4 packaging scripts.
- `8e98464` (`main`) — `chore: merge chore/gh-actions-releases into main` (merge commit).
- `118cf6c` (`main`, tagged `v1.0.0`) — `docs: update branch registry with chore/gh-actions-releases (merged)`.
- `b593ffd` (`main`, HEAD) — runner OS pin update (see table above); motivation: replace EOL/ambiguous runner labels (`macos-13`, generic `windows-latest` for arm64) with explicit images.

### Key decisions

- Matrix over four separate workflows: one tag push fans out to all targets, all uploading to the same GitHub Release.
- `fail-fast: false` so one platform failure doesn't cancel the others.
- `npm_config_arch` env for `npm ci`: required for the correct Sharp/libvips prebuilt on the Win arm64 job.
- No code signing configured (`CSC_IDENTITY_AUTO_DISCOVERY: false`); unsigned distributables are the accepted v1.0.0 tradeoff.
