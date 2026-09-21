# Branch `chore/bump-version-1.1.0` — Version Bump to 1.1.0

- **Type:** Chore — release versioning
- **Status:** In Progress (awaiting merge approval)
- **Base:** `main` @ `03d1fd0`
- **Branch commit:** `ee3a143` — `chore(release): bump version to 1.1.0`

## 1. Goal and Scope

Bump the app from `1.0.0` to `1.1.0` (semver minor: new backwards-compatible
feature — batch video compression for web — plus the Electron externals fix).
Tag `v1.0.0` was stuck on the old `118cf6c` while `main` had moved 10 commits
ahead, so a minor release was overdue.

Deliberately local-only: no push of branch or tag (tag push would trigger the
GitHub Release workflow; build errors are under separate investigation).

## 2. Files Created / Modified

| File | Change |
| :--- | :--- |
| `package.json` | `version: 1.0.0 → 1.1.0` (via `npm version minor --no-git-tag-version`) |
| `package-lock.json` | Root `version` fields synced to `1.1.0` (same command) |

No code changes. electron-builder and the release workflow read the version
from `package.json`, so distributable filenames pick it up automatically.

## 3. Tests Performed and Results

- `grep '"version"' package.json package-lock.json` → consistent `1.1.0` (3 hits, root entries).
- `npx tsc --noEmit` → clean (version bump touches no source).
- Tag `v1.1.0` to be created locally on the merge commit after approval; no push.

## 4. Decision Log and Commit History

- `ee3a143` — the bump commit (this branch).
- `1.1.0` over `2.0.0`: no breaking changes; video support is purely additive.
- Push/tag publication deferred by explicit user decision pending build-error investigation.
