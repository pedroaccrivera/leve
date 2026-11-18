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

- **Release:** <https://github.com/pedroaccrivera/leve/releases/tag/v1.7.0> (public, 4 assets)
- **CI run** [`44339585718`](https://github.com/pedroaccrivera/leve/actions/runs/44339585718):
  - `Build · leve-win-x64` — **success** (attempt 1).
  - `Build · leve-mac-arm64` — cancelled in attempts 1–3 **without running any step**; GitHub's
    annotations read *"The job was not acquired by Runner of type hosted even after multiple
    attempts"* + *"Due to capacity constraints, jobs targeting macOS arm64 runners may experience
    longer queue times"*. GitHub-hosted runner capacity outage, not code. Attempt 4 (rerun) was
    left queued.
- **macOS assets delivered by a local fallback build** (same commit `d103ba9`, same
  `electron-builder --mac --arm64 --publish never` config as the workflow), built to a directory
  outside the Drive-synced folder — the first local attempt failed at electron-builder's final
  `codesign --verify` with "resource fork, Finder information, or similar detritus", because
  Google Drive re-adds xattrs on the output *while* the build runs (in CI the checkout is not
  Drive-synced, so the 1.6.8 ad-hoc signing hook never hit this). The relocated build passed
  `codesign --verify --deep --strict` on the bundled app.

| Asset | Size | sha256 |
| :-- | --: | :-- |
| `leve-1.7.0-mac-arm64.dmg` | 152,327,703 B | `4c5296d8ca7bda1604ff090f7303bb558ca6ec72f08b63934fa80288e58c3eae` |
| `leve-1.7.0-mac-arm64.zip` | 147,150,745 B | `5b9888534ef3b553b1a8185b5b202372c07ce7597b5cdb1544d778eb013a3325` |
| `leve-1.7.0-win-x64.exe` | 127,634,288 B | — (CI) |
| `leve-1.7.0-win-x64-portable.exe` | 127,484,525 B | — (CI) |

- **Homebrew cask:** no bump — the tap `pedroaccrivera/homebrew-tap` is archived (read-only) since
  the 1.7.0 scope decision; GitHub Releases is the single distribution channel.
