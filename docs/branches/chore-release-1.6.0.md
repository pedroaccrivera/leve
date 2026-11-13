# Branch `chore/release-1.6.0` — Release 1.6.0 (Tone selector)

- **Type:** Chore — release versioning
- **Status:** Merged into `main` (tagged `v1.6.0`)
- **Base:** `main` @ `cfb601c`

## 1. Goal and Scope

Ship the app tone (hue) selector as a **minor** release (`1.5.1 → 1.6.0`). New user-facing capability,
no breaking change: the image/video/favicon pipelines, the IPC contract and the stored settings are
untouched, and the default tone reproduces the designed palette exactly.

Included since `v1.5.1` (all from `feat/hue-selector`):

- **Inline tone control in the header** (design frame `79:1616`, "an expanded button, not a separate
  settings panel"): hovering the theme switch reveals a bright palette trigger (signal at 50 % over
  the surface, solid signal border, mockup `79:1323`); clicking it expands the same slot into a
  262 px spectrum with a precision marker and the hue value in mono; hovering the value swaps it for
  a reset; the choice is saved automatically (`leve_hue`).
- **The whole palette rotates.** The 13 semantic tokens are rewritten as `hsl(base + Δ)`, so every
  surface, border and state colour follows the tone. Rotation happens on the tokens — never with a
  global `filter: hue-rotate` — so logo previews and file thumbnails keep their own colours. With
  Δ = 0 the inline values are removed and the app is byte-identical to the design.
- **Text colours adapt to their surface** (accessibility): rotating hue at constant saturation and
  lightness does not preserve contrast, so `on-signal` is derived from the accent's relative
  luminance — pairing it with the dark neutral the design uses — and the accent's lightness is
  nudged only as far as WCAG AA requires. A new `signal-text` token pulls the accent towards ink
  where the accent *is* text (the processing stage rail), which also fixed a pre-existing
  lime-on-white case on the Paper theme.

### Behaviour changes worth flagging in the release notes

| Change | Detail |
| --- | --- |
| Tone selector | Hover the theme switch → palette → drag the spectrum; affects every colour in the shell, saved across launches |
| Default tone | 66° (`#E6F45C`); a "reset" returns to it from the value itself |
| Accent text | Brightness of the accent may shift by a few points at some hues (blue/violet) so its label keeps ≥ 4.6:1 |

Publish flow: merge into `main`, tag `v1.6.0`, push the tag. The
`.github/workflows/release.yml` job builds and publishes macOS arm64 (`.dmg`/`.zip`) and Windows x64
(installer/portable) to a public GitHub Release with generated release notes.

## 2. Files Created / Modified

| File | Change |
| :--- | :--- |
| `package.json` | Version `1.6.0` |
| `package-lock.json` | Root + `packages[""]` version `1.6.0` |
| `docs/branches/feat-hue-selector.md` | Status → merged, merge record |
| `docs/branches/chore-release-1.6.0.md` | **Created** — this document |
| `PROJECT_STATUS.md` | Branch registry rows + F4 planned for 1.7.0 |

## 3. Tests Performed and Results

- `npx tsc --noEmit` → clean.
- `npx vite build` → green (renderer + `dist-electron/main.js`).
- `node test/testProcessor.js`, `test/testIcoProcessor.js`, `test/testVideoProcessor.js` → all pass.
- Contrast sweep (`scripts/screenshot.cjs`, `LEVE_MEASURE=1`, real elements, text resolved against
  its effective background): 13 hues × 2 themes. Accent label **4.72 – 16.59** (minimum at 240°,
  above AA 4.5), body text **13.5 – 16**, and the accent colour is the exact design value at the
  default tone (`rgb(230,244,92)`) and indistinguishable at 65°.
- Visual checks: trigger revealed on hover, expanded at the default tone, value-hover reset,
  0/65/66/120/200/240/280 degrees, Ink and Paper.
- CI run for the pushed tag → _(pending)_
- Published release: _(pending)_

## 4. Decision Log and Commit History

- **Minor, not patch:** a new user-facing capability (the tone selector), additive and reversible.
- **F4 (micro-interactions) moved to `1.7.0`** by the user's decision; the study and the three
  installed skills are recorded in `docs/plans/ui-pass-2.md` §4.
- **Release branch instead of tagging `main` directly:** keeps the version bump and its documentation
  reviewable before the tag triggers the public Release workflow.
- **Tag after the post-merge docs update:** the tag points at the commit that records the release as
  merged, matching the previous flow.

| Commit | Message |
| :--- | :--- |
| `0b68ab1` | `chore(release): bump version to 1.6.0` |
| `d756869` | `chore: merge chore/release-1.6.0 into main` |
| _(this docs commit)_ | `docs: mark chore/release-1.6.0 as merged` |
