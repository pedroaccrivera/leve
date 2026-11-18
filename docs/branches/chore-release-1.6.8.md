# Branch `chore/release-1.6.8` — Release 1.6.8 (macOS 26/27 install)

- **Type:** Chore — release versioning
- **Status:** Merged into `main` (tagged `v1.6.8`)
- **Base:** `main` @ `ccaf9b1`

## 1. Goal and Scope

Ship the macOS 26/27 install fix as a **patch** release (`1.6.7 → 1.6.8`). No
application code, engine, IPC or stored setting changed; only packaging and the
install instructions.

Included since `v1.6.7`:

- **The `.app` is ad-hoc signed during packaging.** `scripts/afterPack.cjs`
  cleans extended attributes (`xattr -cr`) and signs the bundle inside-out with
  `@electron/osx-sign` (`identity: '-'`, `hardenedRuntime: false`), so
  `codesign --verify --deep --strict` passes and macOS no longer classifies the
  app as damaged. A configured Developer ID, when present, still replaces the
  ad-hoc signature in electron-builder's own signing pass.
- **The 1-click helper is gone.** `Fix-leve.command` was a quarantined shell
  script, which macOS 26/27 refuses to run (and right-click → Open no longer
  exists). The DMG now carries `paste-the-content-into-terminal.txt`, a plain
  text file whose filename is the instruction and whose only content is
  `xattr -dr com.apple.quarantine /Applications/leve.app`.
- **One install path in the README.** Drag to Applications → open the text file
  → paste the command in Terminal → run it → open the app.
- **DMG contents:** `leve.app`, the `Applications` link and the helper text file
  only (no README, no `.command`).

### Behaviour changes worth flagging in the release notes

| Change | Detail |
| --- | --- |
| macOS install | The app bundle is ad-hoc signed, so it opens after clearing quarantine instead of being reported as damaged |
| DMG helper | `Fix-leve.command` replaced by `paste-the-content-into-terminal.txt` (copy the single command into Terminal) |
| macOS 26/27 | The documented path no longer depends on right-click → Open, which Apple removed |

Publish flow: merge into `main`, tag `v1.6.8`, push the tag. The
`.github/workflows/release.yml` job builds and publishes macOS arm64
(`.dmg`/`.zip`) and Windows x64 (installer/portable) to a public GitHub Release
with generated release notes.

## 2. Files Created / Modified

| File | Change |
| :--- | :--- |
| `package.json` | Version `1.6.8` |
| `package-lock.json` | Root + `packages[""]` version `1.6.8` |
| `docs/branches/fix-macos-26-27-install.md` | Status → merged (via the merge branch) |
| `docs/branches/chore-release-1.6.8.md` | **Created** — this document |
| `PROJECT_STATUS.md` | Branch registry rows |

## 3. Tests Performed and Results

- `node --check scripts/afterPack.cjs` → clean (already green on the fix
  branch; nothing changed here).
- `npx tsc --noEmit` → clean.
- `node test/testProcessor.js`, `node test/testIcoProcessor.js`,
  `node test/testVideoProcessor.js` → all pass.
- **Version consistency:** `package.json` and both `package-lock.json` entries
  report `1.6.8`; no `1.6.7` string remains in the lockfile.
- **Packaging** was validated end-to-end on the fix branch: local DMG build with
  `[afterPack] ad-hoc signature applied`, three DMG items, valid signature, and
  a real install on macOS 27.0.1 (26A434) after simulating Safari quarantine.
- **CI run** [`44336074434`](https://github.com/pedroaccrivera/leve/actions/runs/44336074434) →
  `completed / success`; both matrix jobs green (`Build · leve-mac-arm64`,
  `Build · leve-win-x64`). The macOS log shows
  `[afterPack] ad-hoc signing …/release/mac-arm64/leve.app` followed by
  `[afterPack] ad-hoc signature applied`, then electron-builder skipping its own
  pass (`CSC_IDENTITY_AUTO_DISCOVERY=false`) and leaving the ad-hoc seal in
  place.
- **Published release:** <https://github.com/pedroaccrivera/leve/releases/tag/v1.6.8>
  (public, 4 assets):
  - `leve-1.6.8-mac-arm64.dmg` — 152,430,670 B ·
    `sha256 4f568c58c09ea685c250c78440a88399a1cf5675bab266fa80f89ee43bf13049`
  - `leve-1.6.8-mac-arm64.zip` — 147,262,237 B ·
    `sha256 0365d3ccbb5a67ffbe7aea946fd59c531a94aa29f5fab74525a5c6a3b7e365eb`
  - `leve-1.6.8-win-x64.exe` — 127,633,762 B
  - `leve-1.6.8-win-x64-portable.exe` — 127,483,993 B
- **Downloaded artifacts verified locally:** sizes and hashes match the release
  metadata. The ZIP's `leve.app` reports
  `CFBundleShortVersionString` / `CFBundleVersion` = `1.6.8`,
  `codesign --verify --deep --strict` → `valid on disk` /
  `satisfies its Designated Requirement`, `codesign -dv` → `flags=0x2(adhoc)`,
  `Sealed Resources version=2 rules=13 files=119`. The mounted DMG exposes only
  `leve.app`, the `Applications` link and
  `paste-the-content-into-terminal.txt` (54 B) containing exactly
  `xattr -dr com.apple.quarantine /Applications/leve.app`; the app inside the
  DMG also verifies.

## 4. Decision Log and Commit History

- **Patch:** packaging/instructions only. **F4 (micro-interactions) remains
  planned for `1.7.0`.**
- **Tag after the post-merge docs update:** the tag points at the commit that
  records the release as merged.
- **Homebrew cask:** **not updated — the tap is archived.** The prepared bump
  (`1.6.7 → 1.6.8`, `sha256 0365d3cc…65eb`, verified against the downloaded
  ZIP) could not be pushed: `pedroaccrivera/homebrew-tap` was archived on
  2026-11-18 at 00:12 UTC and rejects writes (`remote: This repository was
  archived so it is read-only`, HTTP 403). The README does not advertise the
  tap, so the release is unaffected. The prepared change is a two-line edit to
  `Casks/leve.rb` if the tap is ever unarchived.
- **Release notes:** generated automatically by the workflow; they include the
  ad-hoc signing and helper changes from the merged fix branch.

| Commit | Message |
| :--- | :--- |
| `7948d34` | `chore(release): bump version to 1.6.8` |
| `0f7dfc3` | `chore: merge chore/release-1.6.8 into main` |
| `917e369` | `docs: mark chore/release-1.6.8 as merged` (tagged `v1.6.8`) |
| _(this docs commit)_ | `docs(release): record v1.6.8 CI run, assets and cask status` |
