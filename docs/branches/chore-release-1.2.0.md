# Branch `chore/release-1.2.0` — Release 1.2.0 (3 Targets, Versioned Artifacts)

- **Type:** Chore — release pipeline + versioning
- **Status:** In Progress (awaiting merge approval)
- **Base:** `main` @ `d11ccfd`

## 1. Goal and Scope

Ship `1.2.0` to GitHub with a trimmed, version-named distributable matrix:

- Drop `mac-x64` (Intel): targets are now **mac-arm64, win-x64, win-arm64**.
- Versioned artifact names: `leve-1.2.0-mac-arm64.dmg/.zip`,
  `leve-1.2.0-win-<arch>.exe` (NSIS), `leve-1.2.0-win-<arch>-portable.exe`.
- Bump `1.1.0 → 1.2.0` (local `v1.1.0` tag stays unpushed at its old commit).
- Push plan: `main` first, then tag `v1.2.0` (tag push triggers the Release workflow).

Out of scope: signing/notarization, auto-update, release notes content.

## 2. Files Created / Modified

| File | Change |
| :--- | :--- |
| `.github/workflows/release.yml` | Removed `macos-26-intel` entry; job names `leve-mac-arm64`, `leve-win-x64`, `leve-win-arm64` |
| `package.json` | `mac.artifactName`, `nsis.artifactName`, `portable.artifactName` with `${productName}-${version}` + os/arch macros; version `1.2.0` |
| `package-lock.json` | Root version synced to `1.2.0` |

Upload globs (`release/*.dmg|*.zip|*.exe`) unchanged — they match the new names.

## 3. Tests Performed and Results

- `npx tsc --noEmit` → clean.
- Artifact names use only documented electron-builder macros
  (`productName/version/arch/ext`); Windows names validate on CI (mac runners
  cannot produce `.exe` installers locally).

## 4. Decision Log and Commit History

- Per-target `artifactName` (mac/nsis/portable) instead of one global pattern:
  NSIS and portable need different shapes (`-portable` suffix).
- Avoided `${os}` macro (uncertain rendering) in favor of literal `mac`/`win`.
- `v1.1.0` superseded without force-push: it never left the local machine, so
  `v1.2.0` simply becomes the published release.
