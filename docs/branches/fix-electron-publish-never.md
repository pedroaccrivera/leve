# Branch `fix/electron-publish-never` — Explicitly Disable Builder Publish

- **Type:** Fix — release pipeline (CI failure)
- **Status:** In Progress (awaiting merge approval)
- **Base:** `main` @ `d30e6a2`

## 1. Goal and Scope

The `v1.2.2` Release failed at the Package step: removing `GH_TOKEN` was not
enough — electron-builder detects the tag/repo and still attempts to publish,
erroring with `GitHub Personal Access Token is not set, neither
programmatically, nor using env "GH_TOKEN"`.

- `--publish never` on the electron-builder command: builder only packages.
- Explicit `token: ${{ secrets.GITHUB_TOKEN }}` on the upload step (was
  implicit default; now pinned). `permissions: contents: write` already covers it.
- Single-publisher design from `fix/mac-install-experience` unchanged.

## 2. Files Created / Modified

| File | Change |
| :--- | :--- |
| `.github/workflows/release.yml` | `--publish never` + comment refresh; explicit upload `token` |

## 3. Tests Performed and Results

- `js-yaml` parse → valid.
- Full validation happens on next tag push (builder packaging runs on CI;
  mac packaging already proven locally in prior branches).

## 4. Decision Log and Commit History

- Fix direction credited to Copilot CI diagnosis; verified against
  electron-builder CLI (`--publish <policy>`: `never|onTag|onTagOrDraft|always`).
- Alternative (restore GH_TOKEN to Package step) rejected: reintroduces the
  dual-publisher race that dropped the v1.2.1 mac zip.
