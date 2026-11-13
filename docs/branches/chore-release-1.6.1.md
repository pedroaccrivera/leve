# Branch `chore/release-1.6.1` — Release 1.6.1 (Tone-aware app icon)

- **Type:** Chore — release versioning
- **Status:** In Progress — version bumped, awaiting merge + tag
- **Base:** `main` @ `0c542a8`

## 1. Goal and Scope

Ship the tone-aware application icon as a **patch** release (`1.6.0 → 1.6.1`). It refines the
feature released in `1.6.0` (the tone selector) with no new capability and no breaking change; the
image/video/favicon pipelines, the IPC contract and the stored settings are untouched.

Included since `v1.6.0` (from `feat/tone-aware-icon`):

- **The dock / taskbar icon follows the chosen tone.** The renderer reports its hue shift
  (debounced by 160 ms) and the main process re-tints the base artwork with `sharp.modulate`, then
  sets it through `app.dock.setIcon` (macOS) or `win.setIcon` (Windows/Linux).
- **It survives a restart**: the renderer restores the tone from `localStorage` at boot and reports
  it, so the icon comes back in the chosen colour. A shift of 0 keeps the designed artwork
  untouched, and the initial paint avoids a flash of the previous colour.

### Behaviour changes worth flagging in the release notes

| Change | Detail |
| --- | --- |
| Dock / taskbar icon | Tinted by the tone selector's rotation; the artwork itself is unchanged at the default tone |

Publish flow: merge into `main`, tag `v1.6.1`, push the tag. The
`.github/workflows/release.yml` job builds and publishes macOS arm64 (`.dmg`/`.zip`) and Windows x64
(installer/portable) to a public GitHub Release with generated release notes.

## 2. Files Created / Modified

| File | Change |
| :--- | :--- |
| `package.json` | Version `1.6.1` |
| `package-lock.json` | Root + `packages[""]` version `1.6.1` |
| `docs/branches/feat-tone-aware-icon.md` | Status → merged, merge record |
| `docs/branches/chore-release-1.6.1.md` | **Created** — this document |
| `PROJECT_STATUS.md` | Branch registry rows |

## 3. Tests Performed and Results

- `npx tsc --noEmit` → clean.
- `npx vite build` → green (renderer + `dist-electron/main.js`).
- `node test/testProcessor.js`, `test/testIcoProcessor.js`, `test/testVideoProcessor.js` → all pass.
- Tint pipeline exercised with sharp at shifts `0 / 138 / 214 / −66`: the designed artwork comes out
  untouched at 0, the others follow the palette (the dot turns cyan at 138, mirroring the app's 204°).
- **Live round-trip**: the packaged app (`electron .`) was run for ~14 s and the main process logged

  ```
  [Tone] app icon shifted by 0 degrees
  [Tone] app icon shifted by 284 degrees
  ```

  i.e. the renderer restored a stored tone (284°) and the icon was re-tinted.
- Channel names verified in the compiled artifacts (`tone:setShift` in `dist-electron/main.js` and
  `dist-electron/preload.cjs`; `setToneShift` in the renderer bundle).
- CI run for the pushed tag → _(pending)_
- Published release: _(pending)_

## 4. Decision Log and Commit History

- **Patch, not minor:** the release refines the `1.6.0` feature — same capability, now reflected in
  the icon. **F4 (micro-interactions) remains planned for `1.7.0`.**
- **Release branch instead of tagging `main` directly:** keeps the version bump and its documentation
  reviewable before the tag triggers the public Release workflow.
- **Tag after the post-merge docs update:** the tag points at the commit that records the release as
  merged, matching the previous flow.

| Commit | Message |
| :--- | :--- |
| _(pending)_ | `chore(release): bump version to 1.6.1` |
| _(pending)_ | `chore: merge chore/release-1.6.1 into main` |
| _(pending)_ | `docs: mark chore/release-1.6.1 as merged` |
