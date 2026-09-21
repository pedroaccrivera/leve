# Branch `chore/dev-setup-doctor` — Dev Environment Doctor

- **Type:** Chore — developer experience / setup diagnostics
- **Status:** In Progress (awaiting merge approval)
- **Base:** `main` @ `0ef4993`
- **Branch commits:** doctor + wiring, README, registry docs

## 1. Goal and Scope

A teammate on `v1.0.0` sources hit `Error: Electron failed to install
correctly` on `npm run dev` — the `electron` package postinstall binary
download had not completed on her machine, and the raw stack trace gave no
remediation. This branch makes setup failures self-diagnosing:

- `scripts/doctor.cjs` + `npm run doctor`: checks Node ≥ 20, Electron binary,
  Sharp binding, ffmpeg/ffprobe binaries; each failure prints the exact fix.
- `predev` hook: `npm run dev` fails fast with the actionable message instead
  of an obscure stack (healthy path costs < 2s).
- `.nvmrc` (20) + `engines: node >= 20` in `package.json`.
- `README.md` Troubleshooting section (Electron mirror/proxy, Sharp,
  ffmpeg/ffprobe, never copy `node_modules` across OS/arch).

Out of scope: CI changes, packaging, app behavior. Also flagged (not fixed
here): the teammate's sources are `v1.0.0` — she should sync to current `main`.

## 2. Files Created / Modified

| File | Change |
| :--- | :--- |
| `scripts/doctor.cjs` | **Created** — dependency-free CJS checks, exit 0/1 |
| `package.json` | `doctor` + `predev` scripts, `engines` field |
| `.nvmrc` | **Created** — `20` |
| `README.md` | Dev prerequisites note + Troubleshooting section |

## 3. Tests Performed and Results

- `node scripts/doctor.cjs` on healthy darwin/arm64 → 5/5 pass, exit 0.
- Simulated teammate failure (`node_modules/electron/dist` hidden) → `✗ Electron binary path missing` + reinstall guidance, exit 1; environment restored and re-verified after.
- `npx tsc --noEmit` → clean (no source changes under `src`/`electron`).

## 4. Decision Log and Commit History

- `require('electron')` is wrapped in try/catch because the package itself
  throws when the binary is missing (the teammate's exact stack) — the doctor
  converts both throw-paths into the same remediation.
- `predev` over docs-only: the failure mode is common enough (fresh clones,
  proxies) that a fail-fast gate pays for itself.
- Mirror documented as opt-in env var (`ELECTRON_MIRROR`), not a committed
  `.npmrc`, to avoid forcing a mirror on everyone.
