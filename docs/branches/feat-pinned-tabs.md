# Branch `feat/pinned-tabs` — Pinned Media Tabs in the Header

- **Type:** Feature — UI layout adjustment
- **Status:** Done — pending merge approval
- **Base:** `main` @ `8fc83ca`

## 1. Goal and Scope

Move the **Images | Videos | Favicon** switcher out of the scrollable
content area and into the fixed app header, so the primary navigation stays
visible while the user scrolls through queues, the favicon editor, and
settings.

Scope:
- Keep the existing segmented-control look and behavior.
- Place the switcher in the header, between the brand block and the
  Clear/theme actions.
- Preserve active-tab styling, disabled state during processing, and the
  per-tab Clear action.
- Add basic tab semantics (`role="tablist"`, `role="tab"`, `aria-selected`).
- Keep the header draggable on macOS while making the tabs clickable
  (`no-drag`).
- Adjust the main content top spacing after removing the in-content tabs.

Out of scope:
- Changes to processing logic, queues, settings, or the footer action.
- New navigation destinations or keyboard arrow-key tab navigation.
- A full header redesign.

## 2. Architecture / Behavior

- `src/components/MediaTabs.tsx` (new) owns the tab definitions, icons, and
  segmented-control markup. It fills the available header space up to
  `640px` and exposes `activeTab`, `onChange`, and `disabled`.
- `src/components/Header.tsx` becomes a three-zone layout:
  brand (left) · tabs (fluid center) · Clear/theme actions (right).
  The header remains outside the scrollable `<main>`, so the tabs are
  effectively pinned without `position: sticky`.
- `src/App.tsx` renders `<MediaTabs>` through the Header `tabs` slot and
  removes the old in-content tab bar.
- `src/types/index.ts` exports the shared `MediaTab` union.
- `main` receives `pt-2` to keep the original 24px rhythm between the
  header and the DropZone.

Responsive behavior:
- At the default 1080px window, the tab bar fills up to 640px.
- At the 840px minimum window width, the bar shrinks with `flex-1`; labels
  and icons still fit. If the Clear button is visible, the bar shrinks
  further without wrapping.

## 3. Files Created / Modified

| File | Change |
| :--- | :--- |
| `src/components/MediaTabs.tsx` | **Created** — extracted segmented tab control |
| `src/components/Header.tsx` | Modified — three-zone header with a `tabs` slot |
| `src/App.tsx` | Modified — passes tabs to Header, removes in-content tabs, adjusts spacing |
| `src/types/index.ts` | Modified — exports `MediaTab` |
| `docs/branches/feat-pinned-tabs.md` | **Created** — this document |
| `PROJECT_STATUS.md` | Modified — branch registry and UI notes |

## 4. Tests Performed and Results

- `npx tsc --noEmit` → clean.
- `npx vite build` → green (renderer + `dist-electron/main.js`).
- Manual visual check in Electron at 1080px and 840px, light/dark theme,
  scrolling on all tabs, tab switching, Clear, and processing state → pending
  review.

## 5. Decision Log and Commit History

- **Move, don't sticky:** the header is already outside the scroll container,
  so relocating the tabs pins them without extra scroll listeners or
  `position: sticky` edge cases.
- **Separate `MediaTabs` component:** keeps the header generic and avoids
  duplicating the tab definitions between `App` and `Header`.
- **Fluid center zone:** `flex-1` + `max-w-[640px]` mirrors the old
  content-width tab bar and degrades gracefully at the 840px minimum.
- **`no-drag` on the tab bar:** the header is a macOS titlebar drag region;
  the control must opt out to receive clicks.
- **ARIA tabs:** low-cost accessibility improvement while the markup was
  being extracted.

| Commit | Message |
| :--- | :--- |
| `afec304` | `feat(ui): pin media tabs in the app header` |
| _this commit_ | `docs(ui): document pinned tabs branch and register status` |
