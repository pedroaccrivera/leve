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
- [x] **Modern Header**: Visual identity, queue status, and quick actions.
- [x] **Interactive DropZone**: Supports drag-and-drop for multiple files and folders, plus native file/folder selection dialogs.
- [x] **Image Queue (`ImageQueue`)**:
  - On-demand thumbnails with original dimensions and file size on disk.
  - Real-time status per item (Pending, Processing, Done, Error).
  - Individual item removal and full queue clear.
- [x] **Settings Panel (`SettingsPanel`)**:
  - Width selection (800px, 1280px, 1920px, 2560px, 3840px, or custom value).
  - Custom preset management (create, select, delete — persisted in `localStorage`).
  - Compression, format conversion, metadata removal, and output destination configuration.
- [x] **Summary Modal (`SummaryModal`)**:
  - Post-processing statistics: total files processed, space saved in bytes/percentage, and elapsed time.
  - One-click shortcut to open the output folder in Finder / Explorer.

### 2.4. Tests & Packaging
- [x] Automated processing test script (`test/testProcessor.js`).
- [x] `electron-builder` configuration in `package.json` for generating installers (.dmg / .zip for macOS, .exe / portable for Windows).

---

## 3. Next Steps & Roadmap

### Short Term
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
