# Branch `fix/app-scroll` — App Scroll + Sticky Action Footer

- **Type:** Fix — layout/scroll (CTA unreachable with long queues)
- **Status:** In Progress
- **Base:** `main` @ `6ba7b50`
- **Decisões do usuário (09/10/2026):** roadmap (i18n, worker-threads) fica para depois; manter app sem assinatura Apple/Microsoft; ignorar via `.gitignore` os artefatos locais `.opencode/`, `.stitch/`, `icon.png`, `icon-v2.png`.

## 1. Goal and Scope

Corrigir bug prioritário: com várias mídias na fila, o botão de ação (Resize/Compress) ficava abaixo da dobra e era inalcançável sem redimensionar a janela — em monitores pequenos, nem isso resolvia.

Causa raiz: `index.html` define `overflow-hidden` no `body` (correto para Electron), mas o shell do app usava `min-h-screen` sem altura limitada — o `main` com `overflow-y-auto` nunca tinha altura delimitada para rolar, então o conteúdo apenas transbordava e era cortado.

Escopo da correção (só layout, sem mudança de comportamento):
- `src/App.tsx` — shell passa a `h-screen overflow-hidden`; `main` ganha `min-h-0` (essencial para scroll em flexbox); bloco do CTA sai do fluxo rolável para um `<footer>` fixo (`flex-shrink-0` + border + backdrop), sempre visível independente do tamanho da fila ou da janela.
- Filas (`ImageQueue`/`VideoQueue`) já têm scroll interno próprio (`max-h-[320px]`) — mantidas como estão.
- Secundário (aprovado junto): `docs/branches/feat-video-compression.md` status → Merged; `.gitignore` passa a ignorar `.opencode/`, `.stitch/`, `icon.png`, `icon-v2.png`.

Fora de escopo: virtualização da fila, paginação, mudanças visuais no CTA, assinatura de instaladores.

## 2. Files Created / Modified

| File | Change |
| :--- | :--- |
| `src/App.tsx` | Modified — `h-screen overflow-hidden` no shell, `min-h-0` no `main`, CTA movido para `<footer>` fixo |
| `docs/branches/feat-video-compression.md` | Modified — status corrigido para Merged |
| `.gitignore` | Modified — ignora `.opencode/`, `.stitch/`, `icon.png`, `icon-v2.png` |
| `docs/branches/fix-app-scroll.md` | Created — este arquivo |
| `PROJECT_STATUS.md` | Modified — registro da branch |

## 3. Tests Performed and Results

- `npx tsc --noEmit` → clean (exit 0).
- `npx vite build` → green (`dist-electron/main.js` 16.05 kB).
- Verificação manual com fila longa + janela pequena (680px altura mínima) → pendente no review do usuário.

## 4. Decision Log and Commit History

- Mantido `overflow-hidden` no `body` do Electron (evita scroll duplo); o scroll passa a viver no `main` delimitado.
- CTA em footer fixo em vez de apenas restaurar o scroll: garante ação sempre alcançável mesmo em monitores muito pequenos.
- Sem assinatura Apple/Microsoft por decisão do usuário — Gatekeeper/SmartScreen seguem com workarounds documentados no README.

| Commit | Message |
| :--- | :--- |
| `087d176` | fix(layout): restore app scroll and keep action button always visible |
| `5019bd1` | docs: mark video-compression merged and register fix/app-scroll |
| `8656002` | chore: ignore local tooling dirs and icon drafts |
