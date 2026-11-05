# Branch `chore/prune-ffprobe-static` — Prune Dead `ffprobe` Binaries

- **Type:** Chore — packaging / distributable size
- **Status:** Merged into `main`
- **Base:** `main` @ `8be1a76`
- **Branch commits:** afterPack hook + registry docs

## 1. Goal and Scope

`ffprobe-static@3.1.0` ships prebuilt binaries for **every** platform and
arch in its npm package:

| Directory | Size |
| :--- | ---: |
| `darwin/arm64` | 73 MB |
| `darwin/x64` | 59 MB |
| `linux/x64` | 62 MB |
| `linux/ia32` | 38 MB |
| `win32/x64` | 60 MB |
| `win32/ia32` | 43 MB |

At runtime `ffprobe-static/index.js` resolves exactly one of them from
`process.platform` + `process.arch`. Everything else is dead weight:
electron-builder copies all of it into `app.asar.unpacked`, inflating both the
installed app and the installers.

Scope:
- Add an `afterPack` hook that keeps only the target `bin/<platform>/<arch>`
  directory and deletes the rest, after packing and before signing.
- Fail the build loudly if the target binary is missing.
- Document the change and register the branch.

Out of scope:
- Replacing or removing `ffprobe-static` (that is a separate, larger change:
  see "Alternatives" below).
- Pruning `ffmpeg-static` (it already installs a single binary per platform via
  its postinstall download).
- Code signing, notarization, CI workflow changes.

## 2. Implementation

`scripts/afterPack.cjs` runs as the electron-builder `build.afterPack` hook:

1. Resolves the resources directory for the target:
   - macOS: `<appOutDir>/<ProductName>.app/Contents/Resources`
   - Windows/Linux: `<appOutDir>/resources`
   Uses `packager.appInfo.productFilename`, with a `.app` scan as fallback.
2. Maps `context.arch` to the `ffprobe-static` directory name
   (`x64`, `arm64`, `ia32`, `armv7l`); universal macOS builds (`arch: 4`) keep
   both `x64` and `arm64`.
3. **Verifies** the `ffprobe`/`ffprobe.exe` that the app will actually load
   exists; throws before deleting anything if it does not.
4. Deletes every other `bin/<platform>/<arch>` directory, removes empty
   platform folders, and logs the kept/removed paths plus bytes freed.

Hook order matters: `afterPack` runs before code signing/notarization, so the
pruned bundle is the one that gets signed and packed into `.dmg`/`.zip`/`.exe`.

`package.json` adds:

```json
"build": {
  "afterPack": "scripts/afterPack.cjs"
}
```

The runtime dependency is untouched: `electron/services/videoProcessor.ts`
still imports `ffprobe-static` and `resolveUnpackedPath()` still points at
`app.asar.unpacked`, which now contains only the current platform/arch binary.

## 3. Files Created / Modified

| File | Change |
| :--- | :--- |
| `scripts/afterPack.cjs` | **Created** — platform/arch-aware pruning hook with fail-fast checks |
| `package.json` | Modified — `build.afterPack` points to the hook |
| `docs/branches/chore-prune-ffprobe-static.md` | **Created** — this document |
| `PROJECT_STATUS.md` | Modified — branch registry row |

## 4. Tests Performed and Results

Environment: macOS (darwin/arm64), Electron 33.4.11, electron-builder 25.1.8.
Note: the shell used for testing exports `ELECTRON_RUN_AS_NODE=1`, so GUI
launch checks were run with `env -u ELECTRON_RUN_AS_NODE`.

- `npx tsc` → clean.
- `npx vite build` → clean (renderer + `dist-electron/main.js`).
- `npx electron-builder --mac --arm64 --dir --publish never` → hook output:
  - kept `darwin/arm64`;
  - removed `darwin/x64` (59.3 MB), `linux/ia32` (37.8 MB),
    `linux/x64` (61.6 MB);
  - freed **158.7 MB**.
  - `win32/*` is not copied on macOS builds: electron-builder excludes
    `.exe`/`.dll` from `node_modules` on non-Windows targets.
- Installed bundle size: `du -sh` **402 MB** (was **552 MB** for the released
  1.3.0 app), i.e. the full 158.7 MB removed from this build.
- Bundled binary check:
  `.../app.asar.unpacked/node_modules/ffprobe-static/bin/darwin/arm64/ffprobe -version`
  → `ffprobe version 4.4-tessus`, exit 0.
- Full installer build (`electron-builder --mac --arm64 --publish never`):

  | Artifact | Released 1.3.0 | This branch | Saved |
  | :--- | ---: | ---: | ---: |
  | `.dmg` | 213,999,036 B (214.0 MB) | 155,757,590 B (155.8 MB) | 58.2 MB |
  | `.zip` | 205,562,041 B (205.6 MB) | 149,297,524 B (149.3 MB) | 56.3 MB |

- Packaged app boot: main process starts, resolves `preload` and loads
  `app.asar/dist/index.html` (no ffprobe access at startup).
- `node test/testVideoProcessor.js` → all video processing tests pass
  (MP4 + WebM compression, progress events, thumbnail, skip-if-larger guard).
- Hook unit simulation with a fake Windows layout
  (`resources/app.asar.unpacked/node_modules/ffprobe-static/bin/...`):
  - `win32/x64` target kept; `win32/ia32` and `darwin/arm64` removed;
  - a layout without the target `ffprobe.exe` throws
    `Expected ffprobe binary missing`, so a broken build cannot ship.
- Windows installer size not measured locally (no Wine); the CI
  `windows-latest` job exercises the same hook. On Windows, `darwin/*` and
  `linux/*` are also copied by electron-builder (they have no `.exe`
  extension to be filtered), so the expected reduction there is ≈275 MB
  uncompressed (keeps `win32/x64`, 60 MB).

## 5. Decision Log and Commit History

- **`afterPack` over config-only `files` negation:** `files` cannot filter by
  target arch (`arm64` vs `x64` share the same platform folder name), and
  `asarUnpack` is pattern-based. A hook is the only place with access to
  `context.arch`.
- **Delete instead of swapping the dependency for
  `@ffprobe-installer/ffprobe`:** the per-platform package would shrink
  `node_modules`, but it uses optional dependencies resolved at install time,
  which complicates cross-arch packaging (`npm_config_arch`) and adds churn
  for no user-visible gain. The hook keeps the existing runtime contract and
  also trims the packaged app for whatever installer target is built.
- **Fail fast:** a missing target binary silently ships a broken video
  metadata path. The hook throws before deleting, so CI fails at packaging.
- **Universal macOS:** handled explicitly (`arch === 4` keeps both arch
  folders) even though the project does not currently ship a universal build.
- **`.cjs` extension:** `package.json` is `"type": "module"`; the hook is
  CommonJS because electron-builder loads it with `require`.

Commit history:
- `chore(packaging): prune unused ffprobe-static binaries`
- `docs(packaging): document ffprobe pruning branch`
- `chore: merge chore/prune-ffprobe-static into main` (`5e7e86a`)

## 6. Alternatives Considered (not implemented)

1. **Drop `ffprobe` entirely** and read width/height/duration from `ffmpeg`
   (`-i` stderr parsing). Would save another ~73 MB (arm64) but the parsing is
   format-dependent and fragile across MP4/MKV/AVI. Needs its own tests.
2. **Switch to `@ffprobe-installer/ffprobe`** (per-platform optional deps).
   Smaller `node_modules`, but install-time resolution conflicts with building
   another arch from the same checkout and does not help the Windows build
   where electron-builder already copies all platform folders.
3. **Prune at install time** (`postinstall` script). Would shrink
   `node_modules` but break `npm run package:*` for other targets and make
   `npm install` slower/less reproducible; packaging is the correct boundary.
