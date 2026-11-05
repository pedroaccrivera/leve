# Branch `chore/release-1.3.0` — Release 1.3.0 (Favicon Generator)

- **Type:** Chore — release versioning
- **Status:** In Progress
- **Base:** `main` @ `14f99ae`

## 1. Goal and Scope

Ship the **Favicon generator** (minor feature) together with the
**oversized-output guard** that was merged but not yet released. Bump
`1.2.7 → 1.3.0`.

Included since `v1.2.7`:
- `feat/favicon-ico`: dedicated Favicon tab, PNG-in-ICO encoder,
  multi-resolution 16–256 px, crop/padding fit, no upscaling, collision-safe
  naming, favicon-specific summary.
- `fix/oversized-output-guard`: images and videos refuse outputs that are
  equal to or larger than the source (`skipped` status).

Publish: push `main`, tag + push `v1.3.0`
(Release: macOS dmg+zip arm64, Windows installer + portable x64 via
`.github/workflows/release.yml`). Afterwards the Homebrew cask needs its
manual version/sha256 bump to `1.3.0`.

## 2. Files Created / Modified

| File | Change |
| :--- | :--- |
| `package.json` / `package-lock.json` | Version `1.3.0` |
| `docs/branches/chore-release-1.3.0.md` | Created — este arquivo |
| `PROJECT_STATUS.md` | Modified — registro da branch |

## 3. Tests Performed and Results

- `npx tsc --noEmit` → clean.
- `npx vite build` → green.
- `node test/testIcoProcessor.js` → pass.
- `node test/testProcessor.js` → pass.
- `node test/testVideoProcessor.js` → pass.
- CI validates build + packaging on tag push (`v1.3.0`).

## 4. Decision Log and Commit History

- **Minor (not patch)**: `feat/favicon-ico` adds a user-facing feature.
- **Includes the unreleased guard fix**: `main` was ahead of `origin/main`
  since `v1.2.7`, so `1.3.0` carries both changes instead of publishing an
  intermediate `1.2.8`.

| Commit | Message |
| :--- | :--- |
| (bump) | chore(release): bump version to 1.3.0 |
| — | docs: update branch registry with chore/release-1.3.0 (merged) |
