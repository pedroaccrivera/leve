# Branch `fix/mac-install-experience` — Install Experience & Missing Mac Zip

- **Type:** Fix — release pipeline + install docs
- **Status:** In Progress (awaiting merge approval)
- **Base:** `main` @ `2bd0d82`

## 1. Goal and Scope

Two install-facing issues from the v1.2.x releases:

1. **Missing mac `.zip` in v1.2.1**: the mac job built AND uploaded
   `leve-1.2.1-mac-arm64.zip` (log: `✅ Uploaded`), yet the release ended
   without it. Root cause: double uploader race — electron-builder
   auto-published (GH_TOKEN was passed to the Package step) to its own draft
   while `softprops/action-gh-release` concurrently created/found the release,
   deleted a "duplicate draft", and re-uploaded; the zip was lost in the
   draft juggling (`Using release … instead of duplicate draft` +
   `Removing duplicate draft` in the v1.2.1 mac log).
2. **"leve is damaged" Gatekeeper block + Electron default icon**: the
   reporter's screenshot shows a **28 Aug download = v1.0.0 asset**
   (pre-icon, unsigned). No code fix exists without an Apple Developer
   account — workaround documented instead.

Changes:

- Workflow: **single uploader** — GH_TOKEN no longer passed to the Package
  step (builder skips auto-publish; the gh-release action is the only
  publisher). Node 20 → 22 (silences runner deprecation warning).
- `README.md`: "Installing from GitHub Releases" (use Latest, `xattr -d
  com.apple.quarantine`, SmartScreen note).
- Repaired `v1.2.1` directly: built the zip locally (`npm run package:mac`;
  a stale `/Volumes/leve 1.2.1-arm64` mount had to be ejected first) and
  `gh release upload`ed it — release now has all 4 assets.
- No version bump, no tag (docs + pipeline only).

Out of scope: Developer ID signing/notarization (needs paid Apple account —
future work), DMG layout.

## 2. Files Created / Modified

| File | Change |
| :--- | :--- |
| `.github/workflows/release.yml` | Removed GH_TOKEN from Package step (+ explanatory comment); Node 22 |
| `README.md` | Install-from-release section with quarantine/SmartScreen guidance |

## 3. Tests Performed and Results

- `npx tsc --noEmit` → clean.
- `gh run view 35656572938 --log` forensics (mac/win upload timelines above).
- `npm run package:mac` locally → `leve-1.2.1-mac-arm64.zip` (205 MB, valid
  `leve.app`); uploaded to v1.2.1; `gh release view` confirms 4/4 assets.
- YAML validated by inspection (2-space, single-doc, same schema as before).

## 4. Decision Log and Commit History

- Kept `softprops/action-gh-release` (works correctly alone — the win job
  proves it) instead of switching publishers.
- Alternative (per-job draft releases + consolidate job) rejected as more
  moving parts than removing the redundant publisher.
- Future releases automatically get the fixed flow on next tag push.
