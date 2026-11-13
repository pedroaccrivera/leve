# `feat/fieldwork-ui` — Fieldwork / Refined UI overhaul

**Status:** In Progress — implementation complete, awaiting merge approval
**Type:** Feature — full interface replacement
**Base:** `main` (`91fc4a3`)
**Reference:** Figma `LEVE` — fileKey `tpwkncQMXCg5zZRdUnBp3m`, section `69:830` ("Fieldwork [polished]", 19 frames)

---

## 1. Goal and scope

Replace the whole `leve` interface with the **Fieldwork / Refined** direction from Figma,
reproduced **1:1** at the design's production window size (1280 × 800):

- **Two themes on one semantic vocabulary:** `Paper` (light) and `Ink` (dark).
- **Type system:** Space Grotesk (display/titles), Inter (body/controls), IBM Plex Mono (technical values).
- **Layout:** 28 px window bar (macOS) · 72 px navigation · workbench = fluid workspace (40 px gutters) + 428 px batch inspector (30 px gutters) · 92 px action footer.
- **States:** start / ready / processing / batch report for all three tabs (Images, Videos, Favicon), plus the locked read-only recipe while a batch runs.

Business logic is untouched: IPC, Sharp, ffmpeg, the custom ICO encoder, output destinations,
queue de-duplication and preset persistence all keep working. All three existing test suites
pass unchanged.

### Reproduced 1:1 (9 designed screens)

| Design frame | Screen |
| --- | --- |
| `64:65` | Images — Start |
| `64:252` | Images — Ready |
| `64:425` | Images — Batch report |
| `64:571` | Videos — Processing |
| `64:696` | Favicon — Editor |
| `64:863` | Images — Paper (theme parity) |
| `73:255` / `73:365` / `73:475` | Videos — Empty / Ready / Report |
| `73:585` / `73:729` / `73:873` | Favicon — Empty / Multiple / Report |
| `73:1017` / `73:1127` / `73:1237` | Images / Videos / Favicon — Processing |

### Decisions approved by the user before implementation

1. `Remove metadata` **unchecked** by default (the design shows it checked; the app keeps the safer default).
2. Windows keeps its **native frame**; macOS uses `hiddenInset` with the real traffic lights.
3. The `SummaryModal` is **removed** — the batch report is now an in-page state.
4. `01 / OUTPUT WIDTH`: typing switches the selection to `Custom`; choosing `Custom` focuses the field;
   the typed value persists across restarts (`leve_custom_width`, `leve_custom_width_selected`).
5. The inspector is **locked/read-only** while a batch runs.
6. The design's copy is the source of truth.
7. The three typefaces are bundled locally (the app stays 100 % offline).
8. Branch name `feat/fieldwork-ui`.

---

## 2. Files

### Created

```
src/styles/tokens.css            Paper/Ink tokens, base layer, the nine text styles
src/styles/fonts.css             @font-face for the six bundled woff2 subsets
src/assets/fonts/*.woff2         Space Grotesk, Inter, IBM Plex Mono + OFL licences
src/components/ui/Button.tsx
src/components/ui/Choice.tsx          Choice, ChoiceRow, ReadOnlyChoice, ReadOnlyChoiceRow
src/components/ui/TextInput.tsx       TextInput, ReadOnlyValue, ResolvedValue
src/components/ui/Checkbox.tsx
src/components/ui/Slider.tsx          Slider + SliderRow
src/components/ui/StatusChip.tsx      + STATUS_MARKS
src/components/ui/FieldSection.tsx    FieldSection, FieldLabel, FieldNote, Divider
src/components/ui/IconButton.tsx
src/components/ui/ProgressBar.tsx
src/components/ui/ThemeSwitch.tsx
src/components/WindowBar.tsx
src/components/WorkbenchLayout.tsx
src/components/ActionFooter.tsx
src/components/WorkspaceBlocks.tsx    IntroBlock, Principles, PrincipleList, OutputBlock, DropHint
src/components/QueueActions.tsx
src/components/QueueRow.tsx           ImageQueueRow, VideoQueueRow, QueueList
src/components/ProcessingCard.tsx
src/components/BatchReport.tsx        BatchReport + RecipeUsed
src/components/ImageInspector.tsx
src/components/VideoInspector.tsx
src/components/FaviconInspector.tsx
src/utils/cx.ts                       clsx + tailwind-merge
src/utils/presets.ts                  width presets, storage helpers
src/utils/devFixtures.ts              dev-only reference states
src/vite-env.d.ts
scripts/screenshot.cjs                dev screenshot harness (1280 × 800)
vite.preview.config.ts                renderer-only preview config (no Electron plugin)
docs/plans/fieldwork-ui-overhaul.md   the approved plan
```

### Rewritten

```
src/App.tsx                  orchestrates the three workbenches, states, footer and inspector
src/components/Header.tsx    window drag region + wordmark + tabs + privacy + theme switch
src/components/MediaTabs.tsx numbered tabs 01/02/03, signal fill on the active one
src/components/DropZone.tsx  dashed surface (large + compact) + `useFilePickers` hook
src/components/FaviconEditor.tsx  master preview, safe area, actual sizes, logo strip, naming blocks
src/index.css                now only app chrome (drag, scrollbars, slider, checkerboard, motion)
tailwind.config.js           semantic tokens, font families, radius md/lg
src/context/ThemeContext.tsx no hardcoded colours; dev-only `?theme=` override
index.html                   body classes removed (tokens own the surface)
src/types/index.ts           `VideoOutputFormat` gained `original`; `BatchSummary.skippedSizes`
electron/main.ts             window 1280 × 800, min 1040 × 720, traffic lights at (20, 8)
electron/services/videoProcessor.ts  `resolveVideoTarget()` implements the `original` container
```

### Removed (superseded)

```
src/components/SettingsPanel.tsx        → ImageInspector
src/components/ImageQueue.tsx           → QueueRow / QueueList
src/components/VideoSettingsPanel.tsx   → VideoInspector
src/components/VideoQueue.tsx           → QueueRow / VideoQueueRow
src/components/FaviconSettingsPanel.tsx → FaviconInspector
src/components/FaviconQueue.tsx         → logo strip inside FaviconEditor
src/components/QueueClearButton.tsx     → inline "Clear queue (N)" button
src/components/SummaryModal.tsx         → BatchReport
```

---

## 3. Design system extracted from Figma

Semantic colours (one vocabulary, two themes):

| Token | Paper | Ink | Use |
| --- | --- | --- | --- |
| `paper` | `#f5f3ec` | `#171b18` | app canvas |
| `panel` | `#eceae1` | `#222823` | block fills, thumbnails, report receipt |
| `surface` | `#fffef9` | `#2b322c` | controls, inputs, choices |
| `subtle` | `#d5d6c9` | `#3d483e` | hairlines, dividers, disabled CTA |
| `line` | `#9a9f91` | `#737f71` | dashed drop outline, progress track |
| `control` | `#879681` | `#76816d` | control borders |
| `ink` | `#1b241d` | `#f5f3ec` | primary text **and** selected fill |
| `muted` | `#586153` | `#b9c2b5` | secondary text |
| `signal` | `#e6f45c` | `#e6f45c` | the single accent (primary action, progress fill, active stage) |
| `on-signal` | `#1b241d` | `#1b241d` | text on signal |
| `danger` / `warning` / `success` | `#9c3428` / `#775016` / `#28643d` | `#ffada0` / `#f5cc84` / `#a3d8ac` | skipped / failed / saved |

Radii: `md` 8 px, `lg` 12 px — **choice controls are square**.

Nine text styles: `Mono 13`, `Display 48/52 −2`, `Title 28/34 −0.6`, `Section 20/26 −0.3`,
`Body 16/24`, `Control 14/20`, `Small 13/20`, `Label 12/16 +0.6`, `Brand 104/104 −6`.

Label rules verified per component: numeric preset rows (width presets, ICO sizes) use
IBM Plex Mono 13; every other choice uses Inter Medium 14.

Keyboard focus follows the design's control-state reference: **2 px ink outline + 2 px offset**.

---

## 4. Implementation notes and composed states

The design did not cover a handful of details; each one was filled only with the direction's own
vocabulary and is listed here for review:

1. **Images processing percentage** — the design shows a per-file `64 %`. Sharp reports no
   progress, so the card shows the batch position (`file n of m`) in the same slot. The bar and
   its signal fill are identical to the design.
2. **Compression notes** for `Light`, `Smallest` and `Lossless` follow the wording pattern of the
   designed `Balanced` note.
3. **Choices that the design does not show selected** (e.g. `Lossless`, `WebM / VP9`) use the same
   selected treatment (ink fill, `paper` text) as the designed ones.
4. **Videos inspector values** read as plain text in the design; they remain editable in place
   (borderless input that reveals the designed focus ring on keyboard focus).
5. **Video rows keep a remove button** on hover-free layout parity with the images rows
   (the design omits it for videos only).
6. **Video `Original` output format** keeps the source container for mp4/mov/m4v/webm and falls
   back to MP4 otherwise (`resolveVideoTarget`), inferred from the engine's capabilities.
7. **Windows** does not render the 28 px window bar (the OS frame supplies the chrome); macOS
   renders it with the real traffic lights positioned at the design's coordinates.
8. **Favicon preview block** shows the resolved source name (read-only) in the slot the design
   labels with the selected logo's base name.
9. Report receipts: Images uses the designed `panel` fill; Videos/Favicon use the designed plain
   three-column layout, exactly as the two references differ.

---

## 5. Tests performed

| Check | Command | Result |
| --- | --- | --- |
| Types | `npx tsc --noEmit` | clean |
| Image engine | `node test/testProcessor.js` | ✓ all tests passed |
| Favicon/ICO engine | `node test/testIcoProcessor.js` | ✓ all tests passed |
| Video engine | `node test/testVideoProcessor.js` | ✓ all tests passed |
| Visual parity | `scripts/screenshot.cjs` at 1280 × 800 for 13 states, both themes | compared against the Figma frames: header, geometry (852/428 columns, 28/72/92 bars, 100 px rows), type styles, token colours, hairlines, dashed surfaces, choices, receipt, stage rail, footer copy |

Bugs found and fixed during the visual pass:

- `padding` / `radius` are stored as fractions (0–0.3 / 0–0.5) — the inspector rendered `800 %` / `2200 %`.
- Report headings showed a literal `\n` (JSX attribute strings do not interpret escapes).
- Video queue rows were missing the `NN / NN` index.
- Processing rows now show the saved path instead of the source dimensions, as designed.

---

## 6. Decision log

| # | Decision | Rationale |
| --- | --- | --- |
| 1 | Semantic CSS variables instead of `dark:` variants | the design swaps whole palettes, not individual colours |
| 2 | Fonts bundled under `src/assets/fonts` | Vite rewrites relative asset URLs, so they resolve under `file://` in the packaged app (a `public/` absolute path would not) |
| 3 | Icon set stays `lucide-react` | the design's upload and theme marks are literally lucide `Upload` / `Sun`; the remaining status marks are text glyphs kept as text |
| 4 | Dev-only fixtures + screenshot harness | the only way to compare non-empty states 1:1 without shipping fake data; gated behind `import.meta.env.DEV` |
| 5 | `BatchReport` replaces the modal | approved; keeps the queue until "Start a new batch" |
| 6 | Cancel support | the designed footer has "Cancel batch"; implemented with a ref flag checked between files |

---

## 7. Commit history

```
feat(ui): Fieldwork design tokens, bundled typefaces and ui primitives
feat(ui): rebuild the shell and all three workbenches for Fieldwork
feat(ui): in-page batch report, locked recipes and cancel support
chore(dev): reference fixtures and screenshot harness for 1:1 checks
docs: record the feat/fieldwork-ui branch
```

---

## 8. Follow-ups / open items

- Confirm the composed states listed in §4 with the user after the first visual review.
- `docs/plans/fieldwork-ui-overhaul.md` can move into `docs/` history once the branch is merged.
- Still on the roadmap: i18n, OS shortcuts, worker-thread batches.
