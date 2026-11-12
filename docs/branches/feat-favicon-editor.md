# Branch `feat/favicon-editor` — Favicon Mini Editor

- **Type:** Feature — Favicon editing UX
- **Status:** In Progress — pending merge approval
- **Base:** `main` @ `a50c46b`

## 1. Goal and Scope

Add a mini editor to the **Favicon** tab so the user can see the composed
icon before generating it and tune the square rendering without guessing.

Scope:
- The editor replaces the empty area once logos are added: in the empty state
  the tab shows only the drop area, size boxes and output options; as soon as
  one or more files arrive, the editor reveals itself directly below the file
  selector.
- A 256×256 live preview of the selected logo, framed in a "studio" card with
  a floating canvas, ambient glow, `256 px` / fit chips and an in-context
  preview at 16/32/48 px.
- **Fit inside** (contain) as the default, with an optional **Crop to fill**
  (cover) mode.
- Per-side **padding** from 0% to 30%, applied only in contain mode, with a
  live dashed safe-area guide over the preview.
- **Corner radius** from 0% to 50% (50% = circle), applied in both fits, with
  Square / 12% / 22% / Circle presets. Transparent backgrounds stay
  transparent in the rounded corners.
- **Background** modes: **Auto**, White, Black, Custom color, Transparent.
  Custom exposes both a picker and an editable **hex field** (`#rrggbb`,
  uppercase display, validated live with Enter/Escape handling).
- Auto background resolved per image from the visible pixels: dark logos get
  white, light logos get black.
- Multi-file handling: a **Batch Preview** filmstrip with numbered thumbnails,
  previous/next steppers, and row selection in the queue. One logo is previewed
  at a time; fit/padding/background stay global for the batch while Auto
  resolves per logo.
- **SVG upscaling**: vector sources are rendered at every selected size
  (including 128/256), while raster sources keep the no-upscaling rule. The
  editor badges vector sources and hides the "will be skipped" warning for
  them.
- Queue rows become selectable so the user can preview each logo.
- The old Fit/padding controls are removed from the settings panel to avoid
  duplicated UI.

Out of scope:
- Per-item overrides.
- Manual crop/pan positioning.
- Reordering the batch from the filmstrip.
- New output formats.

## 2. Architecture / Behavior

### Rendering engine (`electron/services/icoProcessor.ts`)

- `detectAutoBackground(filePath)` samples the image at 64×64, ignores
  pixels with alpha < 8, and computes alpha-weighted relative sRGB
  luminance. Mean luminance ≥ 0.5 → `#000000`, otherwise `#ffffff`
  (fallback white).
- `resolveFaviconBackground(config, filePath)` maps the configured mode to a
  concrete RGBA background. `cover` always resolves to transparent because
  the image itself fills the square.
- `renderSquareMaster(filePath, config, size, allowUpscale)` is the single
  composition path:
  - `cover`: resize to fill the square (original crop behavior).
  - `contain`: resize the logo to fit inside `size × (1 - 2 × padding)`,
    then center it on the resolved background. Padding is clamped to
    `0–0.45` in the engine.
  - Generation calls it with `allowUpscale = false` for raster sources;
    vectors and the editor preview pass `true`.
- `isVectorSource(filePath)` treats `.svg` as vector art. In
  `processSingleFavicon`, vectors set `usefulDimension = Infinity`, so
  `masterSize` becomes the largest selected size and nothing is skipped.
  Raster sources keep the derived dimension limit and the no-upscale rule.
- `clampRadius(radius)` clamps to `0–0.5`. `roundedMask(size, radius)` builds
  an SVG rounded rectangle that is composited with `blend: 'dest-in'` on the
  square master, so the corners are cut from the alpha channel (transparent
  backgrounds stay transparent). Rounding happens once on the master, which
  keeps the radius fraction identical in every derived entry.
- `processSingleFavicon` renders one square master at the largest useful
  size, then downsamples every selected entry from it.
- `renderFaviconPreview(filePath, config)` returns a PNG data URL at
  `PREVIEW_SIZE = 256`, plus the resolved background hex.

### IPC

- `favicon:preview` (`electron/main.ts`) → `renderFaviconPreview`.
- `window.electronAPI.renderFaviconPreview` exposed by
  `electron/preload.cjs`.
- New types: `FaviconBackgroundMode`, `FaviconConfig.padding`,
  `FaviconConfig.backgroundMode`, `FaviconPreviewResult`.

### UI (`src/components/FaviconEditor.tsx`)

- Studio layout: an ambient-glow card with a floating gradient-framed canvas,
  `256 px` / fit overlay chips, a background chip, and a reveal animation
  (`.favicon-studio-reveal`, disabled under `prefers-reduced-motion`).
- Preview requests are debounced (150 ms) and stale responses are discarded
  with a request counter; a thin progress line replaces the heavy overlay
  while re-rendering.
- The preview card uses a transparency checkerboard
  (`.favicon-checkerboard` in `src/index.css`, light and dark variants).
- In-context strip renders the real 256 px preview scaled to 16/32/48 px.
- Batch filmstrip (`.length > 1`): numbered thumbnails, prev/next steppers and
  a `1 / N` counter; selecting a thumbnail calls `onSelectItem`.
- `src/utils/thumbnailCache.ts` caches thumbnail promises so the filmstrip and
  the queue share one IPC call per file.
- The editor shows source dimensions, resolved auto background, a
  `Vector · upscales` badge for SVG, and warns when raster sizes exceed the
  source.
- Corner radius slider (0–50%) with Square / 12% / 22% / Circle presets; the
  preview reflects the rounding immediately.
- Reset restores contain + 0% padding + 0% radius + Auto.
- Settings apply to the whole batch; `FaviconQueue` highlights the selected
  row and calls `onSelectItem`. Removing the selected row selects its
  neighbour.

## 3. Files Created / Modified

| File | Change |
| :--- | :--- |
| `src/components/FaviconEditor.tsx` | **Created** — studio preview, batch filmstrip, fit/padding/radius/background controls |
| `src/utils/thumbnailCache.ts` | **Created** — shared thumbnail promise cache |
| `src/components/FaviconQueue.tsx` | Modified — selectable rows, selected ring, cached thumbnails |
| `src/components/FaviconSettingsPanel.tsx` | Modified — removed duplicated Fit/background section; vector note |
| `src/App.tsx` | Modified — contain/auto defaults, selected logo state, neighbour selection on remove, editor wiring |
| `src/index.css` | Modified — `.favicon-checkerboard` and studio/preview animations |
| `src/types/index.ts` | Modified — background mode, padding, preview result and API |
| `electron/services/icoProcessor.ts` | Modified — auto background, padding, shared square renderer, preview, SVG upscaling |
| `electron/main.ts` | Modified — `favicon:preview` handler |
| `electron/preload.cjs` | Modified — `renderFaviconPreview` bridge |
| `test/testIcoProcessor.js` | Modified — new config fields and auto/padding/preview tests |
| `docs/branches/feat-favicon-editor.md` | **Created** — this document |
| `PROJECT_STATUS.md` | Modified — branch registry and favicon engine notes |
| `README.md` | Modified — favicon editor documentation |

## 4. Tests Performed and Results

- `npx tsc --noEmit` → clean.
- `npx vite build` → green (renderer + `dist-electron/main.js`).
- `node test/testIcoProcessor.js` → all tests passed, including:
  - ICO container layout and malformed input rejection.
  - Full 16–256 generation (cover) and payload dimension checks.
  - Contain with transparent and custom solid backgrounds.
  - Auto background: dark logo → white, light logo → black.
  - 10% padding insets a landscape logo to ~205px at 256px while corners
    stay transparent.
  - Corner radius: 0% keeps square corners, 50% clears the corner and keeps
    the center opaque, 12% clips only the corner pixel, cover mode rounds
    every entry, and the preview applies the same radius.
  - 256×256 preview data URL, resolved background, and preview-only
    upscale for a 48px source.
  - An 80px SVG rendered at every size (16–256) with no skips, while a 64px
    raster keeps skipping 128/256.
  - Raster no-upscale skipping, too-small error, collision handling, SVG,
    transparency preservation, and output path resolution.
- `node test/testProcessor.js` → all image processing tests passed.
- `node test/testVideoProcessor.js` → all video processing tests passed.
- Manual visual check in Electron: empty state (drop area + sizes + output),
  single-logo editor, 4-logo batch filmstrip with per-logo Auto background,
  SVG vector badge with in-context previews, and the custom hex field → done
  via a temporary dev seed, then verified with real drops → pending user
  review.

## 5. Decision Log and Commit History

- **Editor appears only with files:** the empty state stays focused on
  getting files in (drop area, sizes, output), matching the tab's existing
  hierarchy; the studio card reveals itself below the selector as soon as the
  queue is non-empty.
- **Filmstrip for batches:** with several logos the preview shows one at a
  time, and a numbered strip plus prev/next steppers makes browsing obvious
  without rendering N expensive previews at once. Fit/padding/background stay
  global; Auto is resolved per logo so each icon gets the right contrast.
- **Cached thumbnails:** the filmstrip and the queue ask for the same files,
  so a module-level promise cache prevents duplicate Sharp renders and IPC
  round-trips.
- **Preview upscales, raster generation does not:** the editor must show the
  real 256px composition even for small logos, while generated raster entries
  keep the existing no-upscaling guarantee.
- **Vectors are exempt from no-upscaling:** an SVG has no native resolution,
  so rendering it at 128/256 is quality-preserving, not upscaling; the engine
  detects `.svg` and skips the dimension limit for them only.
- **Hex is editable:** a color picker alone cannot express a brand hex, so the
  Custom mode pairs the picker with a validated `#rrggbb` text field.
- **Global config, not per item:** keeps the batch workflow simple and
  matches the rest of the app; Auto still adapts per image.
- **Auto uses visible pixels only:** alpha-weighted luminance avoids a
  transparent canvas biasing the result toward black.
- **Contain is the default:** the whole logo is never cut in the standard
  path; cover remains available as an explicit crop choice.
- **Padding applies only to contain:** cover fills the square with the
  image, so inset/background have no meaning there.
- **Radius applies to both fits:** rounding is a property of the icon shape,
  not of the padding, so crop-to-fill icons can be rounded too.
- **Round the master, not each entry:** one mask on the square master keeps
  the radius proportional across 16–256 and avoids extra work per size.
- **Mask via SVG + `dest-in`:** sharp has no drawing primitives, and cutting
  the alpha channel keeps transparent backgrounds transparent instead of
  painting the corners with a color.
- **Shared square renderer:** generation and preview use the same
  composition code, so the preview cannot drift from the output.
- **Debounced preview IPC:** avoids spawning a Sharp render on every slider
  tick; a request counter drops out-of-order responses.

| Commit | Message |
| :--- | :--- |
| `04edea9` | `feat(favicon): add live preview studio with auto background, padding and vector upscaling` |
| `c0b6164` | `docs(favicon): document favicon editor branch and update status` |
| `5cc0ed4` | `feat(favicon): add corner radius control to the editor and ICO renderer` |
| `8b2abf7` | `refactor(favicon): move isVectorFile to a util so the editor fast-refreshes` |
