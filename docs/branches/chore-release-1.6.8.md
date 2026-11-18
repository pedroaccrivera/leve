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

## 4. Decision Log and Commit History

- **Patch:** packaging/instructions only. **F4 (micro-interactions) remains
  planned for `1.7.0`.**
- **Tag after the post-merge docs update:** the tag points at the commit that
  records the release as merged.
- **Homebrew cask:** updated after CI publishes, once the ZIP hash can be
  verified against the downloaded asset.

| Commit | Message |
| :--- | :--- |
| `7948d34` | `chore(release): bump version to 1.6.8` |
| `0f7dfc3` | `chore: merge chore/release-1.6.8 into main` |
| _(this commit)_ | `docs: mark chore/release-1.6.8 as merged` (tagged `v1.6.8`) |
