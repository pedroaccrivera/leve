# Branch `feat/dmg-guided-install` — Guided DMG Install (A) + Homebrew Tap (B)

- **Type:** Feature — install experience (macOS Gatekeeper workaround)
- **Status:** In Progress (awaiting merge approval)
- **Base:** `main` @ `8f071db`

## 1. Goal and Scope

Context: the app cannot clear its own quarantine flag (Gatekeeper blocks
execution before any app code runs), and there is no Apple Developer account
for signing. Two friction reducers:

**A — Guided DMG (this repo):**
- `assets/Fix-leve.command` (executable): 1-click `xattr -d` on
  `/Applications/leve.app` with native success/failure dialogs; handles the
  "app not in Applications yet" case.
- `assets/README-If-blocked.txt`: EN instructions (1-click vs Terminal).
- `package.json` `dmg` config: dark background (`#121624`), 660×420 window,
  layout (app + Applications link top row, README + Fix bottom row).
- `README.md`: Fix-leve as the primary option, manual command as fallback.

**B — Homebrew tap (separate repo `pedroaccrivera/homebrew-tap`):**
- `Casks/leve.rb`: version/sha256-pinned cask on the release `.zip`
  (Homebrew strips quarantine on install → zero Gatekeeper friction).
- Cask version bumps stay manual per release until automated.

## 2. Files Created / Modified

| File | Change |
| :--- | :--- |
| `assets/Fix-leve.command` | **Created** (+x) |
| `assets/README-If-blocked.txt` | **Created** |
| `package.json` | `dmg` section (background, window, contents) |
| `README.md` | 1-click fix as primary guidance |
| `homebrew-tap:Casks/leve.rb` | **Created** (other repo, pushed to its `main`) |

## 3. Tests Performed and Results

- `npm run package:mac` → DMG mounted and listed: `leve.app`,
  `Applications` link, `Fix-leve.command` (executable bit preserved),
  `README-If-blocked.txt` — all present.
- `npx tsc --noEmit` → clean.
- Tap: `brew tap` + `brew fetch --cask` validate (URL + sha256); full install
  test left to the user (installs into /Applications).

## 4. Decision Log and Commit History

- `.command` over plain instructions: right-click → Open runs it with one
  confirmation; no Terminal typing.
- `backgroundColor` over a designed background image: no art asset needed,
  matches app dark theme.
- Cask tracks the `.zip` (not `.dmg`): casks prefer zips; `app "leve.app"`.
