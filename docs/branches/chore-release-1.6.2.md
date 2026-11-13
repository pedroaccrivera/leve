# Branch `chore/release-1.6.2` — Release 1.6.2 (Consistent video recipe)

- **Type:** Chore — release versioning
- **Status:** In Progress — version bumped, awaiting merge + tag
- **Base:** `main` @ `1b01f84`

## 1. Goal and Scope

Ship the video-inspector consistency refactor as a **patch** release (`1.6.1 → 1.6.2`). Presentation
only: same capability, same engine, same IPC and stored settings.

Included since `v1.6.1` (from `refactor/video-inspector-consistency`):

- **The video recipe uses the shared control vocabulary.** It previously used the read-only language
  (underline choices, values as plain text, a bare checkmark) while the image and favicon recipes used
  boxed choices, boxed values and boxed checkboxes. Now all three are identical: a boxed width field
  with the same `Custom` behaviour, a real "Never enlarge smaller videos" checkbox, boxed choice rows
  (numeric labels in mono, text labels in Inter) and the shared destination field / folder picker.
- The **locked** recipe shown while a batch runs was already shared by the three tabs and is unchanged.

### Behaviour changes worth flagging in the release notes

| Change | Detail |
| --- | --- |
| Video inspector | Boxed controls instead of underline tabs; "Smaller videos are never enlarged" is now a real toggle ("Never enlarge smaller videos") |

Publish flow: merge into `main`, tag `v1.6.2`, push the tag. The
`.github/workflows/release.yml` job builds and publishes macOS arm64 (`.dmg`/`.zip`) and Windows x64
(installer/portable) to a public GitHub Release with generated release notes.

## 2. Files Created / Modified

| File | Change |
| :--- | :--- |
| `package.json` | Version `1.6.2` |
| `package-lock.json` | Root + `packages[""]` version `1.6.2` |
| `docs/branches/refactor-video-inspector-consistency.md` | Status → merged, merge record |
| `docs/branches/chore-release-1.6.2.md` | **Created** — this document |
| `PROJECT_STATUS.md` | Branch registry rows |

## 3. Tests Performed and Results

- `npx tsc --noEmit` → clean.
- `npx vite build` → green (renderer + `dist-electron/main.js`).
- `node test/testProcessor.js`, `test/testIcoProcessor.js`, `test/testVideoProcessor.js` → all pass.
- Layout measured (`LEVE_MEASURE=1`) for the three video states — `ready` @800, `empty` @720 and
  `processing` @800: workspace **0**, inspector **0**, no horizontal overflow (the boxed controls are
  44 px tall, like the underline tabs they replaced).
- Visual check of the `ready` state against the image and favicon recipes: same primitives, same
  selection states, same section hierarchy.
- CI run for the pushed tag → _(pending)_
- Published release: _(pending)_

## 4. Decision Log and Commit History

- **Patch, not minor:** a presentation refactor; no new capability. **F4 (micro-interactions) remains
  planned for `1.7.0`.**
- **Release branch instead of tagging `main` directly:** keeps the version bump and its documentation
  reviewable before the tag triggers the public Release workflow.
- **Tag after the post-merge docs update:** the tag points at the commit that records the release as
  merged, matching the previous flow.

| Commit | Message |
| :--- | :--- |
| _(pending)_ | `chore(release): bump version to 1.6.2` |
| _(pending)_ | `chore: merge chore/release-1.6.2 into main` |
| _(pending)_ | `docs: mark chore/release-1.6.2 as merged` |
