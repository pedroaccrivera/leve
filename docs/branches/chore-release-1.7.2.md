# `chore/release-1.7.2` — Release 1.7.2 (Original width + preview fix)

## Goal and scope

Cut the `1.7.2` patch+feature release from `feat/original-width`, carrying
two changes:

- **Original width option** (`feat/original-width`): new "Original" choice
  in the width grid (in the 3840 slot, penultimate; 4K UHD leaves the grid
  and stays available via Custom). Original keeps the source dimensions and
  still applies the chosen compression and format.
- **Preview fix** (`fix/original-format-preview`, planned as 1.7.1 but never
  cut separately — it rides in 1.7.2): queue previews show the real output
  extension for Original instead of a hardcoded `.webp`/`.mp4`.

GitHub Releases only — no cask bump (the Homebrew tap is archived).

## Files created / modified

| File | Change |
| :-- | :-- |
| `package.json` / `package-lock.json` | Version bump `1.7.0 → 1.7.2` |
| `docs/branches/chore-release-1.7.2.md` | This file |
| `PROJECT_STATUS.md` | Branch table row |

## Tests performed

On `feat/original-width` (merged into `main` @ `859d75b` before the bump):

- `npx tsc --noEmit` — clean.
- `node test/testProcessor.js` — pass (Test 4: 3000×2000 kept, JPEG,
  1.5 MB → 18.2 KB with `targetWidth: 0`).
- `node test/testVideoProcessor.js`, `node test/testIcoProcessor.js` — pass.
- DOM harness (`LEVE_MEASURE=1`, fixture `images-original` @ 800/720):
  inspector zero overflow, `edges` unchanged (gutter 32, alignment 768/688),
  grid marks Original (penultimate), field shows "Original", summary shows
  `WEBP · Original dimensions · Balanced`.
- Known pre-existing workspace overflow (49 px @800 / 129 px @720 from the
  `12.4 MB total` chip) is identical on the `main` baseline — not from this
  release; tracked for a later fix.

## Decisions

- **Single release carries both changes**: `1.7.1` was reserved for the
  preview fix but never cut; the user approved one release, so it ships as
  `1.7.2` per the agreed slot for the Original width feature.
- **No cask bump**: tap archived after `1.6.7`; GitHub Releases is the only
  distribution channel.
- **3840 leaves the grid**: Custom still accepts 4K widths; Original takes
  its slot (user decision).

## Commit history

| Commit | Message |
| :-- | :-- |
| `859d75b` | `chore: merge feat/original-width into main` (on `main`) |
| _(bump commit)_ | `chore(release): bump version to 1.7.2` |
| _(docs commit)_ | `docs: record the release-1.7.2 branch` |

## Release record

- **Tag:** `v1.7.2`
- **Release:** _(pending — filled after CI/assets)_
- **CI run:** _(pending)_
