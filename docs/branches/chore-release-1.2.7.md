# Branch `chore/release-1.2.7` — Release 1.2.7 (App Scroll Fix)

- **Type:** Chore — release versioning
- **Status:** Merged into `main`
- **Base:** `main` @ `fa25a74`

## 1. Goal and Scope

Ship the `fix/app-scroll` layout correction (restored main scroll + sticky
action footer) in a new patch release. Bump `1.2.6 → 1.2.7`.

Publish: push `main`, tag + push `v1.2.7` (Release: mac dmg+zip arm64, win
installer + portable x64 via `.github/workflows/release.yml`). Afterwards the
Homebrew cask gets its manual version/sha256 bump to `1.2.7`.

## 2. Files Created / Modified

| File | Change |
| :--- | :--- |
| `package.json` / `package-lock.json` | Version `1.2.7` |
| `docs/branches/chore-release-1.2.7.md` | Created — este arquivo |
| `PROJECT_STATUS.md` | Modified — registro da branch |

## 3. Tests Performed and Results

- `npx tsc --noEmit` → clean (version-only change).
- CI validates build + packaging on tag push (`v1.2.7`).

## 4. Decision Log and Commit History

- Patch (not minor): functional fix already reviewed/merged via `fix/app-scroll`; this branch is release vehicle only.

| Commit | Message |
| :--- | :--- |
| (bump) | chore(release): bump version to 1.2.7 |
