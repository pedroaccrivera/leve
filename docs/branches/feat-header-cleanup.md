# Branch `feat/header-cleanup` — Clean Header, Content-Aligned Tabs & Progressive Blur

- **Type:** Feature — UI layout adjustment
- **Status:** In Progress — pending merge approval
- **Base:** `main` @ `a50c46b`

## 1. Goal and Scope

Simplify the top of the app, align the media tabs with the content column, and
give the header a blurred overlay instead of a solid band.

Scope:
- Remove the `100% Local & Offline` badge and the
  `Resize and compress images locally` subtitle from the header, leaving only
  the `leve` wordmark.
- Center the **Images | Videos | Favicon** tab bar with the app content
  column, so it lines up with the DropZone and the settings cards instead of
  floating in whatever space is left between the brand and the actions.
- Move the queue **Clear** action out of the header: it now sits right below
  the file listing it affects, per tab.
- Replace the solid header background with a **progressive blur**: very strong
  at the top of the band, fading to zero at its bottom edge, so page content
  scrolls underneath and gets blurred.
- Keep the brand on the left edge and the theme toggle on the right edge.
- Preserve active-tab styling, disabled state during processing, `no-drag`
  clickability inside the macOS drag region, and the existing tab semantics.

Out of scope:
- Changes to processing logic, queues (internal layout), settings, or the
  footer action.
- Changing the content column width (`max-w-2xl`).
- New header actions.

## 2. Architecture / Behavior

### Header layout (`src/components/Header.tsx`)

The header is now an **overlay**: `position: absolute` at the top of the app
with `z-30`, so the scroll container runs the full window height and content
passes behind it. `src/App.tsx` gives the root `relative` and compensates with
`pt-[5.75rem]` on `main` (the previous header height plus the old `pt-2`, so
the vertical rhythm is unchanged).

Inside, the header is a CSS Grid with three columns:

| Column | Content |
| :--- | :--- |
| `minmax(0, 1fr)` | `leve` wordmark, `justify-self-start` |
| `minmax(0, min(42rem, 100% - 22rem))` | tabs slot |
| `minmax(0, 1fr)` | theme toggle, `justify-self-end` |

- The middle column is capped to the content column width (`42rem` = Tailwind
  `max-w-2xl` used by `main`) and shrinks to `100% - 22rem` so the brand and
  the actions always have room. Both side columns receive an equal share of
  the remaining space, which keeps the tab bar centered on the viewport — and
  therefore centered over the content column.
- At the default 1080px window the middle column resolves to 664px against a
  672px content column (≈4px per side); at 840px (minimum) it resolves to
  424px, still centered and collision-free.
- `src/components/MediaTabs.tsx` drops its own `max-w-[640px]`; the grid
  column now owns the width.

### Progressive blur (`src/index.css`)

- `.app-header-blur` holds three stacked layers, each with its own
  `backdrop-filter` and a vertical `mask-image` gradient. The weakest blur
  (`8px`) reaches the bottom of the band, the strongest (`44px`) only the top,
  so the compounded effect is very strong at the top and decays to zero at the
  bottom edge. `saturate()` on the stronger layers keeps colours from going
  flat.
- `.app-header-tint` adds a soft gradient (0.82 → 0 alpha) so the wordmark and
  the tab labels stay readable over whatever scrolls behind them.
- Both layers use `z-index: -1` inside the header's stacking context: they
  paint behind the header content but above the scrolled page content.
- The header forwards `wheel` events to the scroll container
  (`scrollContainerRef`), because the overlay is not a child of the scroller —
  without it, scrolling with the cursor inside the header band would do
  nothing.

### Clear action (`src/components/QueueClearButton.tsx`)

- New small component rendering a ghost `Clear queue (N)` button.
- `src/App.tsx` wraps each queue with `flex flex-col gap-2` and renders the
  button right below the listing, so clearing lives with the list it affects.
  The queue components themselves are untouched, which keeps this branch
  independent from the in-flight `feat/favicon-editor` queue changes.
- `Header` no longer receives `itemCount` / `onClear` / `isProcessing`.

## 3. Files Created / Modified

| File | Change |
| :--- | :--- |
| `src/components/Header.tsx` | Modified — overlay grid, wordmark only, progressive blur layers, wheel forwarding |
| `src/components/QueueClearButton.tsx` | **Created** — Clear action rendered below each queue |
| `src/components/MediaTabs.tsx` | Modified — width delegated to the header grid |
| `src/App.tsx` | Modified — relative root, `main` ref + top padding, Clear below each queue |
| `src/index.css` | Modified — `.app-header-grid`, `.app-header-blur`, `.app-header-tint` |
| `docs/branches/feat-header-cleanup.md` | **Created** — this document |
| `PROJECT_STATUS.md` | Modified — header note and branch registry |

## 4. Tests Performed and Results

- `npx tsc --noEmit` → clean.
- `npx vite build` → green (renderer + `dist-electron/main.js`).
- Visual check in Electron at 1080×860 → brand on the left edge, tabs centered
  and aligned with the DropZone/queue cards, theme toggle on the right edge,
  no Clear button in the header.
- Visual check at the 840px minimum width → all three zones still fit, the tab
  bar shrinks but stays centered and aligned with the content.
- Progressive blur → verified with the content scrolled under the band: the
  elements behind the header are blurred at the top and become sharp as the
  mask decays, with no hard cut at the bottom edge (checked with a temporarily
  taller band, reverted afterwards).
- Clear action → verified below the queue on the favicon tab
  (`Clear queue (1)`), with the header keeping only the theme toggle.
- Light theme check → pending user review (synthetic clicks are blocked in the
  agent environment).

## 5. Decision Log and Commit History

- **Grid instead of flex:** the previous `flex-1 + justify-center` centered the
  tabs inside the *leftover* space, so the bar sat left of the content column
  whenever the brand was wider than the actions. Equal `1fr` columns make the
  centering independent of both side widths.
- **Cap the middle column to the content width:** `min(42rem, 100% - 22rem)`
  lets the tab bar match the content column on wide windows while guaranteeing
  the brand and actions never collide with it on narrow ones.
- **Keep the wordmark inline:** removing the badge and subtitle already trims
  the header; the wordmark stays so the app keeps its identity and the header
  remains a single row.
- **Overlay header instead of a solid band:** a blur can only be perceived if
  something scrolls behind it, so the header became an absolute overlay and the
  scroll container now spans the full window height.
- **Three stacked masked layers:** a single `backdrop-filter` cannot ramp, so
  the progressive effect comes from layers with increasing blur and decreasing
  reach; masking the same element's output keeps it to plain CSS with no JS
  scroll listeners.
- **Wheel forwarding:** the overlay is outside the scroller, so the header
  forwards wheel deltas to keep scrolling natural when the cursor sits in the
  band.
- **Clear below the queue:** clearing belongs to the list it affects, and the
  header stays focused on navigation and theme.
- **No changes inside the queue components:** rendering the Clear action from
  `App.tsx` avoids touching files that `feat/favicon-editor` is modifying.

| Commit | Message |
| :--- | :--- |
| _this commit_ | `feat(ui): simplify header, center tabs with content, move Clear below queue, add progressive blur` |
| _(this docs commit)_ | `docs(ui): document header cleanup branch and update status` |
