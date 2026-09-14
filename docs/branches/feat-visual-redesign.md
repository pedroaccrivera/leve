# Branch `feat/visual-redesign` — Visual Redesign

- **Type:** Feature — UI / Visual Redesign
- **Status:** Merged into `main`
- **Base:** `main` @ `6fc0e1a`
- **Branch commit:** `56e8442` — `feat(ui): implement modern visual redesign with unified macOS titlebar and dual themes`

## 1. Goal and Scope

Modernize the `leve` desktop UI without changing the image-processing engine:

- Unified macOS titlebar (`hiddenInset` + traffic-light position) and neutral window background.
- Dual themes (dark default / light / system) via a new `ThemeContext` persisted in `localStorage`.
- Tailwind `darkMode: 'class'` + new `dark*` palette and brand blues.
- Visual overhaul of `App`, `Header`, `DropZone`, `ImageQueue`, `SettingsPanel`, `SummaryModal`, global CSS and app bootstrap.
- Register the branch in `PROJECT_STATUS.md` as In Progress (status later flipped to Merged by `78de1ad` on `main`).

Out of scope: no changes to `electron/services/imageProcessor.ts`, no IPC changes, no packaging changes.

## 2. Files Created / Modified

Reconstructed from `git show --stat 56e8442` (12 files, +615 / −560):

| File | Change |
| :--- | :--- |
| `src/context/ThemeContext.tsx` | **Created** — `ThemeProvider`, `useTheme`, `dark`/`light`/`system` modes, `prefers-color-scheme` listener, `leve_app_theme` persistence |
| `electron/main.ts` | Modified — window 1080×860 (min 840×680), `titleBarStyle: hiddenInset` on darwin, `trafficLightPosition {x:18,y:18}`, `backgroundColor #121624` |
| `src/App.tsx` | Modified — layout restructure for new theme/header |
| `src/components/DropZone.tsx` | Modified — restyle |
| `src/components/Header.tsx` | Modified — restyle + theme toggle integration |
| `src/components/ImageQueue.tsx` | Modified — restyle |
| `src/components/SettingsPanel.tsx` | Modified — large restyle/simplification (567-line diff) |
| `src/components/SummaryModal.tsx` | Modified — restyle |
| `src/index.css` | Modified — theme base styles |
| `src/main.tsx` | Modified — wrap app in `ThemeProvider` |
| `tailwind.config.js` | Modified — `darkMode: 'class'`, `darkBg/darkCard/darkBorder/...` colors, brand palette green → blue |
| `PROJECT_STATUS.md` | Modified — add `feat/visual-redesign` row (In Progress) |

No `docs/branches/` file was created at the time (gap fixed retroactively by this document on `docs/branch-docs-registry`).

## 3. Tests Performed and Results

Historical run (Aug 2026, reconstructed from evidence — no test log was committed with the branch):

- **Type check / build:** `tsc` + `vite build` path is the standard gate for UI changes in this repo; `release/` artifacts dated 27 Aug 2026 (`leve-1.0.0-arm64.dmg/.zip`, `leve Setup 1.0.0.exe`) indicate a successful post-merge packaging run.
- **Manual UI verification (implied):** dark/light/system switching, macOS hiddenInset traffic lights, queue/settings/summary rendering.
- **Result:** Merged into `main` without revert; current `main` retains `ThemeContext`, `darkMode: 'class'`, and the resized window defaults.

> Note: this section is a retroactive reconstruction. For future branches, attach the exact `npm` / `tsc` / manual checklist output at merge time.

## 4. Decision Log and Commit History

- `6fc0e1a` (`main`) — established `AGENTS.md`/`GEMINI.md` branch policy requiring `docs/branches/` per branch; announced `docs/branches` initialization but committed no files under `docs/` (root cause of the missing-docs gap).
- `56e8442` (`feat/visual-redesign`) — the single feature commit listed above.
- `78de1ad` (`main`) — `docs: update branch status to merged for feat/visual-redesign` (1-line `PROJECT_STATUS.md` flip, no code change).
- Follow-ups on `main` (`b7a8169`, `a217923`) translated docs to English and trimmed the roadmap; they did not alter this feature's code.

### Key decisions

- Dark-first default (`dark`) to match the design, with `system` as opt-in via media query.
- `class`-based dark mode (not `media`) so the user override persists via `localStorage`.
- macOS-only `hiddenInset`; Windows keeps native titlebar (`default`).
- Brand palette shifted from green (`#22c55e` family) to blue (`#3b82f6` family) for the new identity.
