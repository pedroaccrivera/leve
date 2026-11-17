# Branch `chore/release-1.6.4` — Release 1.6.4 (Report actions in the footer)

- **Type:** Chore — release versioning
- **Status:** In Progress — version bumped, awaiting merge + tag
- **Base:** `main` @ `4297e09`

## 1. Goal and Scope

Ship the batch-report footer refactor as a **patch** release (`1.6.3 → 1.6.4`). Layout only: same
capability, same engine, same IPC and stored settings.

Included since `v1.6.3` (from `refactor/report-actions-in-footer`):

- **The report's batch actions moved to the action footer**, beside the primary CTA:
  `[Start a new batch] [Dismiss report] [Open output folder ↗]`. They were at the end of the report
  itself; the report now ends on its results. Applies to the three tabs, since the footer is shared.
- The footer's status block flexes instead of holding a fixed 700 px, so the three buttons fit at
  1280 px without touching the primary CTA's 280 px. The report's workspace is ~72 px shorter, which
  helps the vertical fit on short windows.

### Behaviour changes worth flagging in the release notes

| Change | Detail |
| --- | --- |
| Batch report | The two secondary actions live in the footer next to "Open output folder" |

Publish flow: merge into `main`, tag `v1.6.4`, push the tag. The
`.github/workflows/release.yml` job builds and publishes macOS arm64 (`.dmg`/`.zip`) and Windows x64
(installer/portable) to a public GitHub Release with generated release notes.

## 2. Files Created / Modified

| File | Change |
| :--- | :--- |
| `package.json` | Version `1.6.4` |
| `package-lock.json` | Root + `packages[""]` version `1.6.4` |
| `docs/branches/refactor-report-actions-in-footer.md` | Status → merged, merge record |
| `docs/branches/chore-release-1.6.4.md` | **Created** — this document |
| `PROJECT_STATUS.md` | Branch registry rows |

## 3. Tests Performed and Results

- `npx tsc --noEmit` → clean.
- `npx vite build` → green (renderer + `dist-electron/main.js`).
- `node test/testProcessor.js`, `test/testIcoProcessor.js`, `test/testVideoProcessor.js` → all pass.
- Layout measured (`LEVE_MEASURE=1`): `images-report` @800 → 0 / 0; `videos-report` @800 → 0 / 0;
  `favicon-report` @720 → 22 / 22 (list scrolling, per D4). No horizontal overflow in the columns,
  the document or the body.
- Visual check of the footer at 1280 × 800: the three buttons fit with the status text on the left,
  no truncation and the primary CTA keeps its place.
- CI run for the pushed tag → _(pending)_
- Published release: _(pending)_

## 4. Decision Log and Commit History

- **Patch:** a layout refactor of an existing screen. **F4 (micro-interactions) remains planned for
  `1.7.0`.**
- **Homebrew cask:** still updated so existing cask users keep getting upgrades (the README no longer
  advertises it).
- **Tag after the post-merge docs update:** the tag points at the commit that records the release as
  merged, matching the previous flow.

| Commit | Message |
| :--- | :--- |
| _(pending)_ | `chore(release): bump version to 1.6.4` |
| _(pending)_ | `chore: merge chore/release-1.6.4 into main` |
| _(pending)_ | `docs: mark chore/release-1.6.4 as merged` |
