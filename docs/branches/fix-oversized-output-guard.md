# Branch `fix/oversized-output-guard` — Refuse Compression That Enlarges Files

- **Type:** Fix — output guard (app premise: never return larger files)
- **Status:** In Progress
- **Base:** `main` @ `c18b7a4`

## 1. Goal and Scope

Some inputs (already-optimized PNGs, high-quality re-encodes, JPG→PNG
conversion, `light` video preset on compressed sources) produced outputs
**larger** than the original — against the app's premise. The app now refuses
the compression: discards the oversized output, marks the item `Skipped`, and
suggests trying a different format or keeping the original.

Scope:
- Post-encode guard in `electron/services/imageProcessor.ts` and
  `electron/services/videoProcessor.ts`: if `newSize >= originalSize`
  (and original size is known), unlink the output and return
  `{ success: false, skipped: true }`. Equal size also skips — no benefit,
  no wasted file.
- Types (`src/types/index.ts`): `'skipped'` status on `ImageItem`/`VideoItem`,
  `skipped?: boolean` on both process results, required `skippedCount` on
  `BatchSummary`.
- `src/App.tsx`: both batch loops handle `skipped` (status, `newSize` kept at
  original so saved-bytes math stays 0 for the item, never counted as failed).
- Queues: amber `Skipped` badge + `Original kept (…)` line, tooltip
  "Already optimized — no smaller file could be produced. Try a different
  format or keep the original." (video variant also suggests a lower quality
  preset).
- `SummaryModal`: `(N skipped — already optimized)` line when applicable.
- Tests: guard mirrored in both test scripts + new skip cases.

Out of scope: pre-encode prediction, per-format smart hints (e.g. detecting
JPG→PNG specifically), virtualized queues.

## 2. Files Created / Modified

| File | Change |
| :--- | :--- |
| `electron/services/imageProcessor.ts` | Modified — oversized-output guard + unlink |
| `electron/services/videoProcessor.ts` | Modified — oversized-output guard + unlink |
| `src/types/index.ts` | Modified — `skipped` status/results/summary |
| `src/App.tsx` | Modified — skipped handling in both loops + summaries |
| `src/components/ImageQueue.tsx` | Modified — Skipped badge + Original kept line |
| `src/components/VideoQueue.tsx` | Modified — Skipped badge + Original kept line |
| `src/components/SummaryModal.tsx` | Modified — skipped count line |
| `test/testProcessor.js` | Modified — guard mirror + Test 3 (skip case) |
| `test/testVideoProcessor.js` | Modified — guard mirror + Test 4 (skip case) |
| `docs/branches/fix-oversized-output-guard.md` | Created — este arquivo |
| `PROJECT_STATUS.md` | Modified — registro da branch |

## 3. Tests Performed and Results

- `npx tsc --noEmit` → clean.
- `npx vite build` → green.
- `node test/testProcessor.js` → pass, incl. Test 3: 179 B optimized PNG
  refused (`skipped=true`, output discarded).
- `node test/testVideoProcessor.js` → pass, incl. Test 4: 4.7 KB compressed
  MP4 re-encoded `light` refused (`skipped=true`, output discarded).
- Manual UI verification (badge, tooltip, summary line) → pendente no review.

## 4. Decision Log and Commit History

- Post-encode comparison (not pre-encode estimate): exact, no false refuses.
- Threshold `>=` (not just `>`): equal-size outputs are also refused.
- `success: false + skipped: true` (not a new success variant): App branches
  on `skipped` first, so items never inflate `failedCount`.
- No new i18n: UI copy in English, matching the rest of the app.

| Commit | Message |
| :--- | :--- |
| (preencher) | (preencher) |
