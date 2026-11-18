# Branch `fix/macos-26-27-install` — Install on macOS 26/27

- **Type:** Fix — macOS packaging + install instructions
- **Status:** Merged into `main` (released in `v1.6.8`)
- **Base:** `main` @ `857f80d`

## 1. Goal and Scope

Two separate failures made the DMG install unusable on macOS 26 (Tahoe) and 27:

1. **The `.app` had no bundle signature.** The release workflow sets
   `CSC_IDENTITY_AUTO_DISCOVERY: false` (there is no Apple Developer
   certificate), so `electron-builder` skipped signing entirely. The Electron
   binary kept only its linker ad-hoc signature:
   `flags=0x20002(adhoc,linker-signed)`, `Info.plist=not bound`,
   `Sealed Resources=none`. `codesign --verify` failed with
   `code has no resources but signature indicates they must be present` — the
   state macOS reports as "leve is damaged and can't be opened". Removing
   `com.apple.quarantine` does not repair a broken bundle seal.
2. **The 1-click helper was blocked by Gatekeeper.** `Fix-leve.command` is a
   shell script downloaded inside the DMG, so it carries quarantine too. macOS
   26/27 refuses to open it, showing the same "damaged / unidentified
   developer" error. The "right-click → Open" escape hatch described in the
   old README was removed in macOS 26, so the instructions were impossible to
   follow.

Changes:

- `scripts/afterPack.cjs`: ad-hoc sign the macOS bundle after pruning
  `ffprobe-static`, using `@electron/osx-sign` (`identity: '-'`,
  `hardenedRuntime: false`). `xattr -cr` runs first because cloud-synced
  checkouts (Google Drive, iCloud) and Finder add `com.apple.FinderInfo` /
  file-provider attributes that `codesign` rejects as "resource fork, Finder
  information, or similar detritus not allowed".
- `@electron/osx-sign` (`^1.3.1`) added as a direct devDependency (it was
  already a transitive dependency of `electron-builder`).
- Removed `assets/Fix-leve.command`.
- `assets/README-If-blocked.txt` → `assets/paste-the-content-into-terminal.txt`,
  containing only:

  ```bash
  xattr -dr com.apple.quarantine /Applications/leve.app
  ```

- `package.json` DMG contents: app + `/Applications` link +
  `paste-the-content-into-terminal.txt` only (no README, no `.command`).
- `README.md`: one install path — drag to Applications, open the text file,
  copy the command into Terminal, run it, open the app.

Out of scope: Developer ID signing + notarization (needs a paid Apple account;
a real identity, when configured, is applied by electron-builder after this
hook and replaces the ad-hoc signature).

## 2. Files Created / Modified

| File | Change |
| :--- | :--- |
| `scripts/afterPack.cjs` | Ad-hoc signing hook + `xattr -cr` before signing |
| `package.json` | `@electron/osx-sign` devDependency; DMG helper file replaced |
| `package-lock.json` | Direct dependency entry |
| `assets/Fix-leve.command` | **Deleted** (Gatekeeper blocks the script itself) |
| `assets/README-If-blocked.txt` → `assets/paste-the-content-into-terminal.txt` | **Renamed**; content is only the command |
| `README.md` | Single macOS install path for 26/27 |
| `docs/branches/fix-macos-26-27-install.md` | **Created** — this document |
| `PROJECT_STATUS.md` | Branch registry row |

## 3. Tests Performed and Results

- `node --check scripts/afterPack.cjs` → clean.
- `npx tsc --noEmit` → clean.
- `node test/testProcessor.js`, `node test/testIcoProcessor.js`,
  `node test/testVideoProcessor.js` → all pass.
- **Build:** `npx tsc && npx vite build && npx electron-builder --mac
  --config.directories.output=<temp outside Google Drive>` → green. The hook
  logged `[afterPack] ad-hoc signature applied`; electron-builder then skipped
  its own signing (no Developer ID), leaving the ad-hoc signature in place.
  A local build directly into the repo's `release/` folder failed with
  `resource fork, Finder information, or similar detritus not allowed` because
  Google Drive re-adds `com.apple.FinderInfo` while `codesign` runs (and even
  created " 2.framework" conflict copies). CI runners are not cloud-synced;
  the hook's `xattr -cr` covers the normal case.
- **DMG contents** (`leve-1.6.7-mac-arm64.dmg`): `leve.app`, `Applications`
  symlink, `paste-the-content-into-terminal.txt` (54 B, `-rw-r--r--`), no
  README and no `.command`.
- **Signature inside the DMG:**
  `codesign --verify --deep --strict` → `valid on disk` /
  `satisfies its Designated Requirement`; `codesign -dv` →
  `Identifier=com.local.leve`, `flags=0x2(adhoc)`,
  `Sealed Resources version=2 rules=13 files=119`.
- **Real install on macOS 27.0.1 (26A434):** copied the app to
  `/Applications/leve.app`, added a Safari-style
  `com.apple.quarantine`, ran the exact line from
  `paste-the-content-into-terminal.txt` → `xattr` reports no quarantine left,
  `open /Applications/leve.app` launched the app, the window rendered, and the
  unified log showed no `leve` errors. `sharp` loads in the signed bundle
  (it is a static import in the main process, and the window only appears
  after it succeeds).

## 4. Decision Log and Commit History

- **Ad-hoc signature instead of only the `xattr` command:** a valid bundle
  seal removes the "damaged" classification and keeps `codesign --verify`
  healthy; the quarantine command remains the Gatekeeper bypass.
- **`@electron/osx-sign` instead of `codesign --deep`:** signs nested
  frameworks/helpers inside-out and verifies at the end. `--deep` is
  documented for verification, not signing.
- **`hardenedRuntime: false` for the ad-hoc pass:** without a Developer ID,
  library validation rejects the unsigned Sharp `.node` at launch. A real
  signing pass re-enables the runtime and entitlements.
- **`-dr` (recursive) instead of `-d`:** also clears nested quarantine flags
  when the app arrives from a ZIP.
- **Text file instead of `.command`:** a plain text file is not executable, so
  Gatekeeper never blocks it; the filename is the instruction. `.txt` is kept
  so double-clicking opens TextEdit.
- **One helper file only:** the old README duplicated the instructions and
  offered a broken 1-click path, which was the main source of confusion.

| Commit | Message |
| :--- | :--- |
| `a2629ca` | `fix(install): ad-hoc sign the macOS app and replace the blocked helper` |
| `5d00943` | `docs: record the macos-26-27-install branch` |
| `0f07655` | `chore: merge fix/macos-26-27-install into main` |
