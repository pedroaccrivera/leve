# Branch `feat/app-icon` — Application Icon

- **Type:** Feature — app branding/icon
- **Status:** In Progress (awaiting merge approval)
- **Base:** `main` @ `f564ce6`

## 1. Goal and Scope

Use the provided artwork as the application icon on macOS and Windows:
source `icon-v2.png` (1024×1024; a first attempt with `icon.png` was
discarded by user preference — same pipeline, regenerated).

- `assets/icon.png` (1024px source of truth), `assets/icon.icns` (iconset +
  iconutil, 10 sizes), `assets/icon.ico` (4-size ICO via one-shot
  `npx png-to-ico`, no new dependency), `public/icon.png` (64px favicon).
- `package.json`: `mac.icon`, `win.icon`, plus `assets/icon.png` in `files`
  so the dev/window icon resolves when packaged.
- `electron/main.ts`: `resolveAppIcon()` (resources → cwd fallback) wired
  into `BrowserWindow`; macOS dock icon comes from the bundle `.icns`.
- `index.html`: favicon link.

Out of scope: DMG background, installer graphics, dock badge.

## 2. Files Created / Modified

| File | Change |
| :--- | :--- |
| `assets/icon.png` / `.icns` / `.ico` | **Created** from `icon-v2.png` (root `icon.png`/`icon-v2.png` stay untracked sources) |
| `public/icon.png` | **Created** — 64px favicon |
| `package.json` | `mac.icon`, `win.icon`, `files` += `build/icon.png` |
| `electron/main.ts` | `resolveAppIcon()` + `BrowserWindow` icon |
| `index.html` | favicon link |

## 3. Tests Performed and Results

- `npx tsc --noEmit` → clean.
- `npx tsc && npx vite build` → green.
- `npx electron-builder --mac --dir` → `release/mac-arm64/leve.app`
  `Contents/Resources/icon.icns` md5-identical to `assets/icon.icns`
  (verified for the v2 artwork after the swap).
- (Signing skipped — no Developer ID, same as CI config.)

## 4. Decision Log and Commit History

- Rejected committing only `.png` and converting in CI: binaries must be
  reproducible and reviewable; one-time local conversion, committed artifacts.
- Rejected ICO devDependency: one-shot `npx png-to-ico` keeps the dep tree clean.
- Root `icon.png` / `icon-v2.png` left untracked (working sources, not build inputs).
