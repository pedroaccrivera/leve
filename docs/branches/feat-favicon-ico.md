# Branch `feat/favicon-ico` — Favicon `.ico` Generator

- **Type:** Feature — dedicated favicon generation flow
- **Status:** In Progress (implemented and tested; awaiting merge approval)
- **Base:** `main` @ `492b135`

## 1. Goal and Scope

Add a third **Favicon** tab that converts an image or logo into a single
multi-resolution `favicon.ico`, fully local and offline.

Scope:
- Dedicated `Images | Videos | Favicon` tab with its own queue and summary.
- Default sizes **16, 32, 48, 64, 128, 256 px**; **Lean (16–64)** preset.
- **No upscaling**: sizes above the source are skipped and reported; if no
  selected size can be generated, the item fails with an actionable message.
- Crop-to-square (default) or fit-with-padding (transparent or solid color).
- Output `favicon.ico` or source-matched name (`logo.ico`); collisions become
  `favicon-2.ico`, `favicon-3.ico`, never overwriting.
- Destination: `favicons/` subfolder by default; same folder or custom folder.
- PNG entries inside the ICO (modern browsers + Windows Vista+).
- No new dependencies: the ICO container is encoded by the app.

Out of scope:
- Legacy IE / Windows XP BMP-in-ICO compatibility.
- Arbitrary per-size fixes or custom sizes outside the 16–256 set.
- A favicon preview generator in the UI.

## 2. Architecture

- `electron/services/icoProcessor.ts`
  - `buildIco(entries)` writes `ICONDIR` (6 bytes) + one 16-byte
    `ICONDIRENTRY` per size + PNG payloads. 256 px is stored as `0`.
  - `processSingleFavicon(item, config)` reads metadata once, computes the
    largest useful square (respecting EXIF orientation), renders a single
    square master, and derives every entry from it.
  - `determineFaviconOutputPath()` resolves subfolder / same-folder /
    custom-folder destinations; `uniqueOutputPath()` handles collisions.
- `electron/main.ts`: `favicon:process` IPC handler.
- `electron/preload.cjs`: `generateFavicon(item, config)` bridge.
- `src/types/index.ts`: `FAVICON_SIZES`, `FaviconConfig`, `FaviconItem`,
  `FaviconResult`, `BatchSummary.mode`/`generatedSizes`.
- `src/App.tsx`: third tab, favicon state, sequential processing loop, done
  banner, CTA, summary selection.
- `src/components/FaviconSettingsPanel.tsx`: sizes, fit/padding, output name,
  destination.
- `src/components/FaviconQueue.tsx`: thumbnails, output name, generated and
  skipped sizes, ICO size, per-item actions.
- `src/components/DropZone.tsx`: `favicon` media type and copy.
- `src/components/SummaryModal.tsx`: favicon mode (Globe icon, "Favicon
  Complete!", ICO size and sizes, no "Disk Space Saved").
- `test/testIcoProcessor.js`: bundles the real TypeScript service with the
  esbuild already shipped by Vite and validates the output container.

## 3. Files Created / Modified

| File | Change |
| :--- | :--- |
| `electron/services/icoProcessor.ts` | **Created** — ICO encoder, square master pipeline, destination/collision logic |
| `electron/main.ts` | Modified — `favicon:process` IPC handler and imports |
| `electron/preload.cjs` | Modified — `generateFavicon` bridge |
| `src/types/index.ts` | Modified — favicon types, sizes, `ElectronAPI.generateFavicon`, summary mode |
| `src/App.tsx` | Modified — Favicon tab, state, handlers, processing loop, CTA, summary |
| `src/components/FaviconSettingsPanel.tsx` | **Created** — sizes/fit/name/destination controls |
| `src/components/FaviconQueue.tsx` | **Created** — favicon queue and per-item status |
| `src/components/DropZone.tsx` | Modified — `favicon` media type and labels |
| `src/components/SummaryModal.tsx` | Modified — favicon summary variant |
| `test/testIcoProcessor.js` | **Created** — container and processing tests |
| `README.md` | Modified — feature list + favicon section |
| `PROJECT_STATUS.md` | Modified — engine section + branch registry |
| `docs/branches/feat-favicon-ico.md` | **Created** — this document |

## 4. Tests Performed and Results

- `npx tsc --noEmit` → clean.
- `npx vite build` → green (renderer + `dist-electron/main.js`).
- `node test/testIcoProcessor.js` → pass:
  - ICO header/directory/offsets/PNG signatures and 256→`0` encoding.
  - Duplicate sizes and non-PNG payloads rejected.
  - 1024×768 source → all 6 sizes generated with matching payload dimensions.
  - Crop corner opaque; transparent padding corner alpha = 0; solid red
    padding applied.
  - 64 px source → 16/32/48/64 generated, 128/256 skipped.
  - 8 px source → clear "too small" error.
  - `favicon.ico` → `favicon-2.ico` → `favicon-3.ico` without overwriting.
  - SVG rasterized into a 6-size ICO.
  - Transparent source keeps alpha in the generated entries.
  - Subfolder, same-folder, custom-folder and source-name paths resolve.
- `node test/testProcessor.js` → pass (images, incl. oversized-output skip).
- `node test/testVideoProcessor.js` → pass (videos, incl. oversized-output skip).
- Manual browser/Explorer checks of the generated ICO → pending review.

## 5. Decision Log and Commit History

- **Dedicated tab instead of an ICO option under Images**: keeps width,
  compression presets and savings math out of a format-conversion flow.
- **PNG-in-ICO for every entry**: much smaller than BMP entries; supported by
  modern browsers and Windows Vista+. Legacy BMP compatibility deliberately
  excluded.
- **Single master render**: decode/rotate/colour-convert once at the largest
  useful size, then downscale per entry; avoids decoding the source 6 times.
- **Palette for ≤64 px, truecolor for 128/256**: small entries shrink without
  visible banding in the sizes users actually see at large dimensions.
- **No upscaling by default**: skipping larger sizes avoids blurry icons and
  gives an explicit, discoverable signal in the queue.
- **No oversized-output guard**: a favicon is a multi-resolution container,
  not a compression target. It may legitimately be larger than the source;
  the summary reports file size instead of savings.
- **Collision suffix instead of overwrite**: safe for repeated batches and
  consistent with the image flow's no-overwrite policy.
- **Test against the real service**: `test/testIcoProcessor.js` uses esbuild
  (already a Vite dependency) to bundle `icoProcessor.ts`, so tests exercise
  shipping code rather than a duplicated implementation.

| Commit | Message |
| :--- | :--- |
| `c3aa174` | feat(favicon): add PNG-in-ICO processing service |
| `8800afe` | feat(favicon): add dedicated Favicon tab and queue |
| `26578e2` | test(favicon): cover ICO container and processing edge cases |
| — | docs(favicon): document feature and register branch |
