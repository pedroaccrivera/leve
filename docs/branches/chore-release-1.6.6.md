# Branch `chore/release-1.6.6` — Release 1.6.6 (Header as window bar + window gutters)

- **Type:** Chore — release versioning
- **Status:** In Progress — version bumped, awaiting merge + tag
- **Base:** `main` @ `62e77d0`

## 1. Goal and Scope

Ship the header/window-bar refactor **and** the outer-padding pass as one **patch** release
(`1.6.5 → 1.6.6`). Layout only: same engine, same IPC, same stored settings.

Included since `v1.6.5`:

- **The 28 px window bar is gone.** The header is the window bar on macOS: the media tabs fill its
  entire height, the traffic lights sit on its centre line (re-synced when the density tier changes),
  and the wordmark clears them at x = 84.
- **The brand reads `leve.`** — the full stop is the accent, follows the tone picked in the theme
  control and deepens on Paper so it stays legible. `LOCAL MEDIA TOOLKIT` went with the bar.
- **One window gutter.** The theme button, the footer CTA and the inspector's fields now end on the
  same line: 1248 @800 (32 px), 1252 @720 (28), 1240 @1000 (40). The inspector keeps its 26 px left
  inset from the divider.
- **Hairlines left the content box.** The header and footer rules are pseudo-elements, so the theme
  button breathes 12/12 (was 11,5/12,5) and the CTA 19/19 (was 19,5/18,5); the tabs' `-mb-px` went
  away with the border.
- **Traffic lights measured on the real window:** the visible circles start at x = 20,04 with the
  centre at y = 34,07 in a 68 px header (centre 34).
- `LEVE_MEASURE=1` now reports an `edges` block (gutter, right edges, control gaps) so a future
  misalignment shows up as a number.

### Behaviour changes worth flagging in the release notes

| Change | Detail |
| --- | --- |
| Window bar | The app has no titlebar strip; the header drags the window and hosts the traffic lights |
| Brand | `leve.` — the accent full stop replaces `LOCAL MEDIA TOOLKIT` |
| Inspector | Its fields end 6 px further left, aligned with the theme button and the CTA |

Publish flow: merge into `main`, tag `v1.6.6`, push the tag. The
`.github/workflows/release.yml` job builds and publishes macOS arm64 (`.dmg`/`.zip`) and Windows x64
(installer/portable) to a public GitHub Release with generated release notes.

## 2. Files Created / Modified

| File | Change |
| :--- | :--- |
| `package.json` | Version `1.6.6` |
| `package-lock.json` | Root + `packages[""]` version `1.6.6` |
| `docs/branches/refactor-header-as-titlebar.md` | Status → merged (via the merge branch) |
| `docs/branches/style-window-paddings.md` | Status → merged (via the merge branch) |
| `docs/plans/header-as-titlebar.md` | Status → implemented |
| `docs/plans/window-paddings.md` | Status → implemented |
| `docs/branches/chore-release-1.6.6.md` | **Created** — this document |
| `PROJECT_STATUS.md` | Branch registry rows |

## 3. Tests Performed and Results

- `npx tsc --noEmit` → clean.
- `npx vite build` → green (renderer + `dist-electron/main.js`).
- `node test/testProcessor.js`, `test/testIcoProcessor.js`, `test/testVideoProcessor.js` → all pass.
- **`edges` + overflow** (`LEVE_MEASURE=1`): `images-start` @800 → 32 / 1248 / 12-12 / 19-19;
  @720 → 28 / 1252 / 10-10 / 17-17; @1000 → 40 / 1240 / 14-14 / 22-22. Reports at 800 and 720 show
  the same gutters; zero horizontal overflow in the columns, the document or the body.
- **Real app** (production window): traffic lights at x = 20,04 and centre y = 34,07; header drags;
  no 28 px strip; `leve.` with the accent dot.
- CI run for the pushed tag → _(pending)_
- Published release: _(pending)_

## 4. Decision Log and Commit History

- **Patch:** two layout iterations on existing screens. **F4 (micro-interactions) remains planned for
  `1.7.0`.**
- **Homebrew cask:** still updated (the README no longer advertises it).
- **Merge order:** `refactor/header-as-titlebar` first, then `style/window-paddings` (cut from it).
- **Tag after the post-merge docs update:** the tag points at the commit that records the release as
  merged.

| Commit | Message |
| :--- | :--- |
| _(pending)_ | `chore(release): bump version to 1.6.6` |
| _(pending)_ | `chore: merge chore/release-1.6.6 into main` |
| _(pending)_ | `docs: mark chore/release-1.6.6 as merged` |
