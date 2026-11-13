# Project Plan & Execution State — `leve`

This document tracks the current architecture, implemented modules, execution flows, and roadmap for the **leve** project.

---

## 1. Project Overview

**leve** is a 100% local, offline, privacy-focused desktop application for batch image resizing and compression (macOS and Windows).

- **Core Principle**: No image or data ever leaves the user's machine (zero network calls, zero telemetry).
- **Tech Stack**:
  - **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite.
  - **Desktop Runtime**: Electron (with context isolation and async IPC).
  - **Image Processing**: Sharp (backed by `libvips`, a high-performance native C/C++ library).

---

## 2. Current Execution State (Already Implemented)

### 2.1. Architecture & Code Structure
- [x] **Vite + Electron Setup**: Build pipeline configured with `vite-plugin-electron` and `vite-plugin-electron-renderer`.
- [x] **Security & IPC Communication**:
  - Preload script (`electron/preload.cjs`) exposing `window.electronAPI` via `contextBridge`.
  - Context isolation active (`contextIsolation: true`, `nodeIntegration: false`).
  - IPC handlers in the main process (`electron/main.ts`) for OS dialogs, metadata reading, thumbnail generation, and image processing via Sharp.

### 2.2. Image Processing Engine (`electron/services/imageProcessor.ts`)
- [x] **Proportional Resizing**: Automatic proportional height calculation preserving aspect ratio. Option to prevent upscaling images smaller than the target resolution.
- [x] **Smart Compression Presets**:
  - *Balanced (Recommended)*: Optimal quality-to-size ratio.
  - *Maximum Quality*: Light compression preserving fine photographic detail.
  - *Smallest File Size*: Aggressive optimization with mozjpeg / oxipng / avif.
  - *Lossless*: Zero compression artifacts for PNG and WebP.
  - *Custom*: Manual quality slider (1 to 100).
- [x] **Multi-Format Support**: JPG, PNG, WebP, AVIF, TIFF, GIF, SVG.
- [x] **Format Conversion**: Keep original format or batch-convert to JPG, PNG, WebP, or AVIF.
- [x] **Privacy & Metadata**: Selective or full removal of EXIF data, camera model, and GPS location via `stripMetadata` flag.
- [x] **Output Destination Strategies**:
  - Dedicated subfolder (e.g., `resized/` inside each source image's directory).
  - Suffix in the same directory (e.g., `photo-resized.jpg`).
  - Custom folder chosen by the user, with automatic directory creation.
  - Filename collision resolution to prevent overwriting existing files.

### 2.3. User Interface (`src/`)
- [x] **Fieldwork interface (feat/fieldwork-ui)**: whole UI replaced by the Figma "Fieldwork / Refined" direction — Paper/Ink themes on one semantic token set, Space Grotesk / Inter / IBM Plex Mono bundled locally, 28 px window bar (macOS) + 72 px navigation with numbered tabs, workbench (fluid workspace + 428 px batch inspector) and a 92 px action footer.
- [x] **Workbench screens**: start / ready / processing / batch report states for Images, Videos and Favicon, all reproduced from the design (including the locked read-only recipe while a batch runs and the in-page batch report that replaces the old summary modal).
- [x] **Sequential queue rows**: hairline-separated rows with thumbnail, dimensions, resolved output path and state (`○ Pending`, `✓ Saved`, `↷ Skipped`, `! Failed`).
- [x] **Inspectors**: `Image recipe` (output width with persistent custom value, compression, format, metadata, destination), `Video recipe` (underline choice rows, resolved values, locked variant) and `Favicon recipe` (fit, padding, corner radius, background, ICO sizes).
- [x] **Favicon studio**: 256 px master preview with a dashed safe area, actual-size previews, logo strip, output-name and destination blocks.
- [x] **Batch report**: measured receipt (files saved / space saved / elapsed time), per-file outcome rows and a read-only "Recipe used" inspector.
- [x] **Cancel batch**: the primary action is disabled while a batch runs and a cancel control stops the queue between files.
- [x] **Keyboard focus reference**: 2 px ink outline with 2 px offset on every control.
- [x] **App tone selector**: inline hue spectrum in the header that rotates every semantic colour token, saved across launches, with surface-aware text colours.
- [x] **Tone-aware app icon**: the dock / taskbar artwork is re-tinted with the stored tone at boot and on every change (`tone:setShift` IPC → `sharp.modulate` → `app.dock.setIcon` / `win.setIcon`).

### 2.4. Tests & Packaging
- [x] Automated processing test script (`test/testProcessor.js`).
- [x] Automated favicon/ICO test script (`test/testIcoProcessor.js`).
- [x] `electron-builder` configuration in `package.json` for generating installers (.dmg / .zip for macOS, .exe / portable for Windows).

### 2.5. Favicon Generation Engine (`electron/services/icoProcessor.ts`)
- [x] **Custom ICO Encoder**: Builds a PNG-in-ICO container (ICONDIR + 16-byte entries + PNG payloads) without adding dependencies; 256 px is written as `0` per the ICO spec.
- [x] **Multi-Resolution Output**: 16, 32, 48, 64, 128 and 256 px in one file, with a *Lean (16–64)* preset.
- [x] **Square Rendering**: Crop-to-square (cover) or fit-with-padding (contain), with transparent, auto-contrast or solid-color padding.
- [x] **Auto Background & Padding**: Per-image background picked from the logo's visible pixels (dark → white, light → black), plus a 0–30% padding inset with a live safe-area guide.
- [x] **Corner Radius**: 0–50% rounding (50% = circle) applied in both fits, with Square / 12% / 22% / Circle presets; transparent backgrounds stay transparent in the corners.
- [x] **Live Mini Editor**: A 256 px studio preview with fit/padding/radius/background controls, editable hex color, in-context 16/32/48 px previews, and a batch filmstrip (numbered thumbnails + steppers) when several logos are queued.
- [x] **No Upscaling (raster)**: Sizes above a raster source are skipped and reported; when every selected size is too large, the item fails with an actionable message.
- [x] **Vector Upscaling (SVG)**: `.svg` logos have no native resolution, so they are rendered at every selected size (16–256) instead of being skipped.
- [x] **Efficient Pipeline**: A single square master is rendered at the largest useful size, then downscaled per entry; palette quantization for ≤64 px, truecolor for 128/256.
- [x] **Output Handling**: `favicon.ico` or source-matched name, `favicons/` subfolder by default, same/custom folder options, and `favicon-N.ico` collision resolution.
- [x] **Dedicated UI**: Third **Favicon** tab with its own queue, mini editor, settings panel and summary modal (file size + generated sizes, no savings claim). The editor replaces the empty area as soon as logos are added.
- [x] **IPC Bridge**: `favicon:process` / `favicon:preview` handlers and `generateFavicon` / `renderFaviconPreview` preload methods.

---

## 3. Next Steps & Roadmap

### Short Term
- [ ] **Micro-interactions pass (F4)** — estúdio aprovado em `docs/plans/ui-pass-2.md` §4, com as
      skills `impeccable` (reference/animate.md), `design-motion-principles` e
      `fixing-motion-performance` instaladas; planejado para a **1.7.0**.
- [ ] UI internationalization (i18n: English, Portuguese, Spanish).

### Mid / Long Term
- [ ] OS system shortcuts / context menu integration ("Open with leve").
- [ ] Parallel processing via worker threads for massive batches (1,000+ images).

---

## 4. Branch Registry & History

Each feature, fix, or refactor branch has a dedicated documentation file in the `docs/branches/` directory covering scope, technical decisions, tests, and commit history.

| Branch | Type | Status | Documentation |
| :--- | :--- | :--- | :--- |
| `main` | Main Baseline | Active | — |
| `feat/visual-redesign` | Feature — Visual Redesign | Merged | [docs/branches/feat-visual-redesign.md](docs/branches/feat-visual-redesign.md) |
| `chore/gh-actions-releases` | Chore — CI/CD | Merged | [docs/branches/chore-gh-actions-releases.md](docs/branches/chore-gh-actions-releases.md) |
| `docs/branch-docs-registry` | Docs — Retroactive branch documentation | Merged | — |
| `feat/video-compression` | Feature — Video Compression for Web | Merged | [docs/branches/feat-video-compression.md](docs/branches/feat-video-compression.md) |
| `fix/vite-externals-ffmpeg` | Fix — Electron Main Externals | Merged | [docs/branches/fix-vite-externals-ffmpeg.md](docs/branches/fix-vite-externals-ffmpeg.md) |
| `chore/bump-version-1.1.0` | Chore — Version Bump to 1.1.0 | Merged | [docs/branches/chore-bump-version-1.1.0.md](docs/branches/chore-bump-version-1.1.0.md) |
| `chore/dev-setup-doctor` | Chore — Dev Environment Doctor | Merged | [docs/branches/chore-dev-setup-doctor.md](docs/branches/chore-dev-setup-doctor.md) |
| `feat/app-icon` | Feature — Application Icon | Merged | [docs/branches/feat-app-icon.md](docs/branches/feat-app-icon.md) |
| `chore/release-1.2.0` | Chore — Release 1.2.0 | Merged | [docs/branches/chore-release-1.2.0.md](docs/branches/chore-release-1.2.0.md) |
| `fix/drop-win-arm64` | Fix — Drop Windows ARM64 Target | Merged | [docs/branches/fix-drop-win-arm64.md](docs/branches/fix-drop-win-arm64.md) |
| `fix/mac-install-experience` | Fix — Install Experience & Missing Mac Zip | Merged | [docs/branches/fix-mac-install-experience.md](docs/branches/fix-mac-install-experience.md) |
| `fix/electron-publish-never` | Fix — Explicitly Disable Builder Publish | Merged | [docs/branches/fix-electron-publish-never.md](docs/branches/fix-electron-publish-never.md) |
| `feat/dmg-guided-install` | Feature — Guided DMG Install + Homebrew Tap | Merged | [docs/branches/feat-dmg-guided-install.md](docs/branches/feat-dmg-guided-install.md) |
| `chore/release-1.2.5` | Chore — Release 1.2.5 (Guided DMG) | Merged | [docs/branches/chore-release-1.2.5.md](docs/branches/chore-release-1.2.5.md) |
| `docs/homebrew-cask-readme` | Docs — Spotlight Homebrew Cask in README | Merged | [docs/branches/docs-homebrew-cask-readme.md](docs/branches/docs-homebrew-cask-readme.md) |
| `fix/app-scroll` | Fix — App Scroll + Sticky Action Footer | Merged | [docs/branches/fix-app-scroll.md](docs/branches/fix-app-scroll.md) |
| `chore/release-1.2.7` | Chore — Release 1.2.7 | Merged | [docs/branches/chore-release-1.2.7.md](docs/branches/chore-release-1.2.7.md) |
| `fix/oversized-output-guard` | Fix — Refuse Compression That Enlarges Files | Merged | [docs/branches/fix-oversized-output-guard.md](docs/branches/fix-oversized-output-guard.md) |
| `feat/favicon-ico` | Feature — Favicon `.ico` Generator | Merged | [docs/branches/feat-favicon-ico.md](docs/branches/feat-favicon-ico.md) |
| `chore/release-1.3.0` | Chore — Release 1.3.0 | Merged | [docs/branches/chore-release-1.3.0.md](docs/branches/chore-release-1.3.0.md) |
| `chore/prune-ffprobe-static` | Chore — Prune Dead `ffprobe` Binaries | Merged | [docs/branches/chore-prune-ffprobe-static.md](docs/branches/chore-prune-ffprobe-static.md) |
| `chore/release-1.3.1` | Chore — Release 1.3.1 (Packaging Size) | Merged | [docs/branches/chore-release-1.3.1.md](docs/branches/chore-release-1.3.1.md) |
| `feat/pinned-tabs` | Feature — Pinned Media Tabs in Header | Merged | [docs/branches/feat-pinned-tabs.md](docs/branches/feat-pinned-tabs.md) |
| `feat/favicon-editor` | Feature — Favicon Mini Editor (Preview, Auto Background, Padding, Radius, Vector Upscaling) | Merged | [docs/branches/feat-favicon-editor.md](docs/branches/feat-favicon-editor.md) |
| `feat/header-cleanup` | Feature — Clean Header, Content-Aligned Tabs & Progressive Blur | Merged | [docs/branches/feat-header-cleanup.md](docs/branches/feat-header-cleanup.md) |
| `chore/release-1.4.0` | Chore — Release 1.4.0 (Favicon Editor & Header) | Merged | [docs/branches/chore-release-1.4.0.md](docs/branches/chore-release-1.4.0.md) |
| `feat/fieldwork-ui` | Feature — Fieldwork / Refined UI Overhaul (Figma 1:1) | Merged | [docs/branches/feat-fieldwork-ui.md](docs/branches/feat-fieldwork-ui.md) |
| `chore/release-1.5.0` | Chore — Release 1.5.0 (Fieldwork UI) | Merged | [docs/branches/chore-release-1.5.0.md](docs/branches/chore-release-1.5.0.md) |
| `feat/ui-fit-and-hue` | Feature — Vertical fit (density tiers) + choice gutters | Merged | [docs/branches/feat-ui-fit-and-hue.md](docs/branches/feat-ui-fit-and-hue.md) |
| `feat/hue-selector` | Feature — Hue (tone) selector | Merged | [docs/branches/feat-hue-selector.md](docs/branches/feat-hue-selector.md) |
| `chore/release-1.5.1` | Chore — Release 1.5.1 (UI fit & fixes) | Merged | [docs/branches/chore-release-1.5.1.md](docs/branches/chore-release-1.5.1.md) |
| `chore/release-1.6.0` | Chore — Release 1.6.0 (Tone selector) | Merged | [docs/branches/chore-release-1.6.0.md](docs/branches/chore-release-1.6.0.md) |
| `feat/tone-aware-icon` | Feature — Application icon follows the chosen tone | Merged | [docs/branches/feat-tone-aware-icon.md](docs/branches/feat-tone-aware-icon.md) |
