# Branch `chore/release-1.2.5` — Release 1.2.5 (Guided DMG)

- **Type:** Chore — release versioning
- **Status:** In Progress (awaiting merge approval)
- **Base:** `main` @ `fb6678a`

## 1. Goal and Scope

Ship the guided-DMG install experience (`feat/dmg-guided-install`: Fix-leve,
README-If-blocked, DMG layout) in a new patch release. No product code
changes since `1.2.4` — bump `1.2.4 → 1.2.5` per standing rule (every push
carries a version bump).

Publish: push `main`, tag + push `v1.2.5` (Release: mac dmg+zip with new DMG
content, win installer + portable). Afterwards the Homebrew cask gets its
manual version/sha256 bump to `1.2.5`.

## 2. Files Created / Modified

| File | Change |
| :--- | :--- |
| `package.json` / `package-lock.json` | Version `1.2.5` |

## 3. Tests Performed and Results

- `npx tsc --noEmit` → clean (version-only change).
- DMG content itself was verified on `feat/dmg-guided-install` (mounted DMG
  listing); CI validates the rest on tag push.

## 4. Decision Log and Commit History

- Patch (not minor): no functional change, release vehicle only.
