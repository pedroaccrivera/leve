# Branch `feat/video-compression` — Video Compression for Web

- **Type:** Feature — video compression (MP4/WebM) via bundled ffmpeg
- **Status:** In Progress (awaiting merge approval)
- **Base:** `main` @ `b8ab911`

## 1. Goal and Scope

Add web-oriented batch video compression while keeping the app as simple as the image flow:

- Bundled `ffmpeg-static` + `ffprobe-static` (100% local/offline; accepted cost +70–120MB per platform).
- Input: mp4/mov/mkv/webm/avi/m4v. Output v1: **MP4 (H.264+AAC)** and **WebM (VP9+Opus)**.
- Opinionated settings only: max width (720/1080/2160 presets + custom), 3 quality cards, format toggle, keep-metadata checkbox, mute-audio toggle, reused destination strategies (subfolder/suffix/custom).
- UI: `Images | Videos` tabs with independent queues, settings, and summaries. Image flow untouched.
- Live per-item progress via new `video:progress` IPC event (ffmpeg `time=` parsing).
- No v1 scope: trim/crop/fps/bitrate controls, lossless video, parallel jobs (sequential like images), cancellation.

## 2. Files Created / Modified

| File | Change |
| :--- | :--- |
| `electron/services/videoProcessor.ts` | **Created** — ffprobe metadata, ffmpeg arg builder (CRF map), spawn runner with progress, single-frame thumbnails, `app.asar.unpacked` path resolution |
| `electron/vendor.d.ts` | **Created** — `declare module 'ffprobe-static'` (no bundled types) |
| `electron/main.ts` | Modified — video dir scan, `buildVideoItems`, 5 IPC handlers (`selectVideoFiles/Folder`, `scanDroppedVideoPaths`, `getThumbnail`, `process` + progress forward) |
| `electron/preload.cjs` | Modified — video bridge + `onVideoProgress` subscribe/unsubscribe |
| `src/types/index.ts` | Modified (additive) — `VideoQuality/OutputFormat`, `VideoItem/Config/ProcessResult`, `BatchSummary.mediaLabel`, ElectronAPI video methods |
| `src/components/VideoSettingsPanel.tsx` | **Created** — mirror of SettingsPanel for video |
| `src/components/VideoQueue.tsx` | **Created** — rows with duration badge + live progress bar |
| `src/components/DropZone.tsx` | Modified — `mediaType` prop routes to video or image IPC + labels |
| `src/components/SummaryModal.tsx` | Modified — generic `mediaLabel` ("Images"/"Videos") |
| `src/utils/formatters.ts` | Modified — added `formatDuration` |
| `src/App.tsx` | Modified — tabs, independent video state/loop/summary, progress subscription |
| `package.json` / `package-lock.json` | Modified — `ffmpeg-static`, `ffprobe-static` deps; `asarUnpack` extended |
| `test/testVideoProcessor.js` | **Created** — sample generation + MP4/WebM/mute/thumbnail asserts |

## 3. Tests Performed and Results

- `npx tsc --noEmit` → clean (after adding `vendor.d.ts`).
- `npx tsc && npx vite build` (CI command) → green, `dist-electron/main.js` 18.42 kB.
- `node test/testVideoProcessor.js` → all pass on darwin/arm64:
  - MP4 balanced 1280x720→640x360, duration ~5s preserved, audio kept, progress final 100 received.
  - WebM balanced + mute → VP9, no audio stream, width untouched when under maxWidth.
  - Thumbnail → 6.1 KB JPEG data.
- Manual UI verification (tabs, queue, settings, summary) pending at review time.

## 4. Decision Log and Commit History

- Spike validated `ffmpeg-static` 5.x encodes libx264 + libvpx-vp9 on darwin/arm64 before any UI work.
- Chose raw `spawn` over `fluent-ffmpeg` (one less dependency, exact arg control).
- Scale filter `scale=min(iw\,MAX):-2`: backslash required for ffmpeg's own filtergraph parser (no shell involved); verified in tests.
- Sequential processing: ffmpeg already saturates cores; parallel jobs would thrash batch runs.
- No `lossless` video quality: meaningless for web delivery.
- `withoutEnlargement` kept in `VideoConfig` for parity but behavior is always no-upscale via `min(iw,MAX)`.
- Open risks: Win-arm64 static binary availability (CI will confirm), ffmpeg redistribution licensing before release.
