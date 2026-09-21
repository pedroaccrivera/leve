# Branch `fix/drop-win-arm64` — Drop Windows ARM64 Target

- **Type:** Fix — release pipeline (CI failure)
- **Status:** In Progress (awaiting merge approval)
- **Base:** `main` @ `be73372`

## 1. Goal and Scope

Fix the `v1.2.0` Release failure on `windows-11-arm`: `npm ci` died with
`ffmpeg-static install failed: No binary found for architecture` — the
package ships no win-arm64 binary. Verified on the npm registry that the
`@ffmpeg-installer` / `@ffprobe-installer` families also lack `win32-arm64`,
so no package swap fixes it. Decision: drop win-arm64 (mac-arm64 + win-x64
remain; the win-x64 build runs on ARM Windows via Prism emulation).

- `.github/workflows/release.yml`: removed `windows-11-arm` entry.
- Version `1.2.0 → 1.2.1` (patch: pipeline fix, no product change).
- `.gitignore`: `logs_*/` (downloaded CI log bundles stay local).
- Publish: push `main`, tag + push `v1.2.1` (releases fully; `v1.2.0` stays
  partial with mac + win-x64 only).

Out of scope: app code, signing, release notes.

## 2. Files Created / Modified

| File | Change |
| :--- | :--- |
| `.github/workflows/release.yml` | Removed win-arm64 matrix entry; refreshed `npm_config_arch` comment |
| `package.json` / `package-lock.json` | Version `1.2.1` |
| `.gitignore` | `logs_*/` |

## 3. Tests Performed and Results

- Evidence from `logs_96533695646` (local only, git-ignored):
  - mac-arm64: 0 errors → `leve-1.2.0-mac-arm64.dmg/.zip` ✓
  - win-x64: 0 errors → `leve-1.2.0-win-x64.exe` + `-portable.exe` ✓
  - win-arm64: `npm error … node install.js` / `No binary found for architecture` ❌
- `npx tsc --noEmit` → clean (workflow + version only).

## 4. Decision Log and Commit History

- Copilot-proposed workaround (ignore-scripts + sharp rebuild + injected x64
  ffmpeg) rejected: forgets `ffprobe-static` (same gap → runtime break),
  emulated encode untested, fragile CI surgery for a marginal segment.
- Alternative of a hand-rolled BtbN ffmpeg download + path override rejected
  for the same cost/benefit reason; revisit if ARM Windows demand appears.
