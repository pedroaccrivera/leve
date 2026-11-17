# Branch `chore/release-1.6.7` — Release 1.6.7 (Palette drag area)

- **Type:** Chore — release versioning
- **Status:** Merged into `main` (tagged `v1.6.7`)
- **Base:** `main` @ `cd47599`

## 1. Goal and Scope

Ship the header drag-area fix as a **patch** release (`1.6.6 → 1.6.7`). Layout and interaction only:
same engine, same IPC, same stored settings.

Included since `v1.6.6`:

- **The empty right-hand header column drags the window again.** The 360 px block is
  `pointer-events-none`; only the visible tone controls are `pointer-events-auto` / `no-drag`.
- **The tone palette opens only from the theme button.** The hover group is the content-sized control
  cluster, exactly the 44 px theme button when collapsed — not the old 360 px column.
- **No phantom hover gaps.** The palette's 8 px spacing is a margin on whichever slot is visible, so
  the collapsed cluster has no invisible hover target. The gap remains while the trigger/spectrum is
  visible, so the pointer can cross from the theme button to the palette without closing it.
- **Keyboard:** focusing the palette trigger expands it (it used to be focusable but invisible at
  width 0).
- **`LEVE_MEASURE=1` reports `dragArea`** (`blockPointer`, `clusterPointer`, `clusterWidth`,
  `themeWidth`, `emptyHit`, `emptyRegion`) so the regression is a number.

### Behaviour changes worth flagging in the release notes

| Change | Detail |
| --- | --- |
| Header empty area | Dragging anywhere in the right column outside the visible controls moves the window again |
| Palette trigger | Appears only when the pointer is over the theme button; stays open while crossing to it |
| Keyboard | Tab/Shift+Tab to the trigger expands it |

Publish flow: merge into `main`, tag `v1.6.7`, push the tag. The
`.github/workflows/release.yml` job builds and publishes macOS arm64 (`.dmg`/`.zip`) and Windows x64
(installer/portable) to a public GitHub Release with generated release notes.

## 2. Files Created / Modified

| File | Change |
| :--- | :--- |
| `package.json` | Version `1.6.7` |
| `package-lock.json` | Root + `packages[""]` version `1.6.7` |
| `docs/branches/fix-palette-drag-area.md` | Status → merged (via the merge branch) |
| `docs/branches/chore-release-1.6.7.md` | **Created** — this document |
| `PROJECT_STATUS.md` | Branch registry rows |

## 3. Tests Performed and Results

- `npx tsc --noEmit` → clean.
- `npx vite build` → green (renderer + `dist-electron/main.js`).
- `node test/testProcessor.js`, `test/testIcoProcessor.js`, `test/testVideoProcessor.js` → all pass.
- **`LEVE_MEASURE=1`** before the merge (`images-start` @800/@720/@1000, `videos-report` @720,
  `favicon-report` @800): `dragArea` = block `none` / cluster `auto`, cluster 44 / theme 44,
  `emptyHit` = `HEADER` with region `drag`; `edges` unchanged at 1248 / 1252 / 1240; zero horizontal
  overflow in the columns, the document or the body.
- **Hover states** in the harness: closed 44; theme hover 96 (44 + 8 + 44); open 314
  (262 + 8 + 44); focus-within 44/8.
- **Real app** (Electron, 1280 × 800, CoreGraphics mouse events): hovering the theme button revealed
  the palette trigger, hovering the empty area hid it, and dragging from the empty area moved the
  window from `y = 129` to `y = 229` (restored to `129`).
- CI run for the pushed tag → _(pending)_
- Published release: _(pending)_

## 4. Decision Log and Commit History

- **Patch:** one interaction fix on the existing header. **F4 (micro-interactions) remains planned for
  `1.7.0`.**
- **Homebrew cask:** updated silently as usual after the release assets exist (the README still does
  not advertise the tap).
- **Tag after the post-merge docs update:** the tag points at the commit that records the release as
  merged.

| Commit | Message |
| :--- | :--- |
| `f31ad01` | `chore(release): bump version to 1.6.7` |
| `50eb5b6` | `chore: merge chore/release-1.6.7 into main` |
| _(this docs commit)_ | `docs: mark chore/release-1.6.7 as merged` |
