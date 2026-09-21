# Branch `fix/vite-externals-ffmpeg` — Electron Main Externals

- **Type:** Fix — dev/packaging build
- **Status:** In Progress (awaiting merge approval)
- **Base:** `main` @ `ed1e1f4`
- **Branch commit:** `b1dfa21` — `fix(build): keep ffmpeg/ffprobe external in electron main bundle`

## 1. Goal and Scope

Fix `npm run dev` crash introduced by `feat/video-compression`: vite bundled
`ffmpeg-static` (CJS, uses `__dirname`) into the ESM `dist-electron/main.js`,
and Electron aborted on startup with
`ReferenceError: __dirname is not defined in ES module scope`.

One-line change in `vite.config.ts`: add `ffmpeg-static` + `ffprobe-static`
to `rollupOptions.external` (same treatment already given to `sharp` and
`electron`). At runtime they resolve from `node_modules` in dev and from the
unpacked asar in production (covered by `asarUnpack`).

Out of scope: packaging `files` list, CI workflow, any app behavior.

## 2. Files Created / Modified

| File | Change |
| :--- | :--- |
| `vite.config.ts` | +2 externals in electron-main rollup options |

## 3. Tests Performed and Results

- Before: `npm run dev` → bundled `main.js` (24.52 kB) → `App threw an error during load: __dirname is not defined`.
- After: `npm run dev` → `main.js` (21.19 kB) → `[Main Process] Loading Dev URL: http://localhost:5174/`, window opens, no errors in `/tmp/leve-dev.log`.
- `npx tsc --noEmit` → clean.
- User manual test: Images flow intact, Videos tab (queue, settings, compress, progress, summary) working.

## 4. Decision Log and Commit History

- `b1dfa21` — the fix commit (this branch).
- Alternative considered: `banner`/`footer` shims defining `__dirname` in the bundle — rejected, externals match the existing `sharp` precedent and keep native path resolution (arch-specific binaries) intact.
