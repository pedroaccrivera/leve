# `chore/release-1.7.0` — Release 1.7.0 (F4: microinteractions)

## Goal and scope

Cut the `1.7.0` minor release from `feat/microinteractions` (F4 of the
UI pass): motion tokens, per-control microinteractions, view transitions,
queue/dropzone/progress feedback, report cascade, global reduced-motion,
and the motion audit pass. Also retires the Homebrew tap (archived after
`1.6.7`), so this release ships GitHub Releases only — no cask bump.

## Files created / modified

| File | Change |
| :-- | :-- |
| `package.json` / `package-lock.json` | Version bump `1.6.8 → 1.7.0` |
| `docs/branches/chore-release-1.7.0.md` | This file |
| `PROJECT_STATUS.md` | Branch table row |

## Tests performed

On `feat/microinteractions` (per phase and final sweep):

- `npx tsc --noEmit` — clean.
- `npx vite build` — green.
- `node test/testProcessor.js`, `node test/testIcoProcessor.js`,
  `node test/testVideoProcessor.js` — all pass.
- `LEVE_MEASURE=1` sweep over 8 states (images-start, videos-report,
  favicon-multiple, etc. at 800/720/1000): `edges` identical to the 1.6.7
  baseline (1248 / 1252 / 1240), `dragArea` cluster 44 px with the empty
  region resolving to `drag` everywhere, horizontal overflow 0.
- `LEVE_REDUCED_MOTION=1` capture renders byte-identical to the normal run
  (the global reduced-motion rule collapses animations without changing
  final state).

## Decisions

- **No cask bump**: the Homebrew tap `pedroaccrivera/homebrew-tap` was
  archived (read-only) after the `1.6.7` bump, per the user's decision to
  keep GitHub Releases as the single distribution channel. Its README
  links stay intact.
- **Row exits stay instant**: queue-row removal is a high-frequency
  action; a fade would lag the curation (recorded in the branch doc, §8).
- **Report cascade capped at the 10th row** so a long report never turns
  into a motion showcase.
- **`HueControl` excluded** from the token migration: its choreography was
  approved in 1.6.0 (plan D7).
- Motion is limited to `transform`/`opacity`; the only layout transition
  that existed (progress width) became a composited `scaleX`.

## Commit history

| Commit | Message |
| :-- | :-- |
| `4c2f388` | `chore(release): bump version to 1.7.0` |
| *(docs commit)* | `docs: record the release-1.7.0 branch` |

## Release record

*(to be filled after CI: run link, assets, status)*
