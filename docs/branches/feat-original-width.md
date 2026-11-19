# `feat/original-width` — Largura "Original" (manter dimensões)

- **Type:** Feature — conversor de imagens
- **Status:** In Progress — implementado e verificado, aguardando merge
- **Base:** `feat/original-format-preview` @ `a8db331` (o fix do preview segue nesta branch)
- **Plano:** [docs/plans/original-width.md](../plans/original-width.md)

## 1. Pedido

> "vamos adicionar uma nova opção de tamanho: original. isso resultará em imagens com as mesmas
> dimensões das originais, porém com a opção de compressão e formato escolhida pelo usuário."

E a decisão de layout: **"o 'Original' entra no lugar do 3840, portanto será o penúltimo"**.

## 2. Escopo

- Nova Choice **"Original"** no grid de larguras, ocupando o lugar do 4K UHD:
  `800 · 1280 · 1920` / `2560 · Original · Custom`.
- **3840 sai do grid** — quem precisar de 4K usa o campo Custom (o valor continua válido).
- Com Original, o processador mantém as dimensões de saída e aplica compressão, formato e
  metadata como em qualquer receita.
- Fora do escopo: aba de vídeos, favicon, persistência da escolha (simétrico aos presets, que
  já resetam no restart).

## 3. Implementação

| # | Onde | O que |
| :-- | :-- | :-- |
| M1 | `src/utils/presets.ts` | Remove o preset `3840 · 4K UHD` do grid |
| M2 | `src/components/ImageInspector.tsx` | Choice "Original" (`onSelectPreset(0)`); selecionada quando `targetWidth === 0`; campo mostra **"Original"** (nunca `0 px`); foco com draft vazio |
| M3 | `src/App.tsx` | Resumo do processamento: `… px maximum` → **"Original dimensions"**; relatório "Recipe used": `Output width: Original` (2 lugares) |
| M4 | `test/testProcessor.js` | Test 4: `targetWidth: 0` → dimensões idênticas, compressão e formato aplicados |

O motor **não mudou**: `imageProcessor.ts` já pula o `resize()` quando `targetWidth <= 0`, então o
sentinel `0` é a única fonte de verdade — nenhum campo novo em `ResizeConfig`, nenhuma chave de
storage.

## 4. Verificação

- **Motor (Test 4):** PNG 3000×2000, `targetWidth: 0`, JPEG, compressão light → saída
  **3000×2000**, formato `jpeg`, 1.5 MB → **18.2 KB**. Todas as 3 suítes passando.
- **DOM real** (harness + fixture `images-original`):
  - Grid marca **Original** (penúltimo, antes do Custom) — `selected: ["Original", "Balanced", "WebP", "Subfolder"]`.
  - Campo mostra **"Original"** — nunca `0 px`.
  - Resumo do processamento: **`WEBP · Original dimensions · Balanced`** (painel travado
    "Recipe in use—locked" mostra `OUTPUT WIDTH: Original`).
  - Preview de processamento inalterado (meta `3000 × 2000 px · 2.4 MB`).
- **`LEVE_MEASURE`** (800/720): inspector **zero overflow**; `edges` inalterados (gutter 32,
  alinhamentos 768/688). *Achado fora do escopo:* o workspace acusa overflow horizontal
  (49 px @800, 129 px @720) do `12.4 MB total` do `QueueActions` — **idêntico na baseline**
  (`images-ready`), pré-existe na `main`; registrado para tratar depois, não é desta branch.
- `npx tsc --noEmit` limpo · 3 suítes passando.

## 5. Arquivos

```
src/utils/presets.ts                     remove 3840
src/components/ImageInspector.tsx        Choice Original + campo "Original"
src/App.tsx                              resumo "Original dimensions" + relatório "Original"
test/testProcessor.js                    Test 4
src/utils/devFixtures.ts                 fixtures dev-only: images-original, images-processing-original
scripts/screenshot.cjs                   LEVE_WIDTH (largura arbitrária no harness)
docs/plans/original-width.md             plano (status: implementado)
docs/branches/feat-original-width.md     este doc
PROJECT_STATUS.md                        tabela de branches
```

## 6. Decisões

| # | Decisão | Justificativa |
| :-- | :-- | :-- |
| 1 | Sentinel `0` em `targetWidth` | o processador já trata `<= 0`; uma única fonte de verdade |
| 2 | Original no lugar do 3840 (penúltimo) | decisão do usuário; 4K sai do grid e vira Custom |
| 3 | Campo mostra "Original", nunca `0 px` | o número sentinela não deve vazar para a UI |
| 4 | Resumo/relatório: "Original dimensions" / `Original` | não inventar número que não existe |
| 5 | Sem persistência da escolha | presets já resetam no restart; Original é simétrico |
| 6 | Escopo só imagens | pedido explícito do conversor de imagens |

## 7. Commit history

| Commit | Message |
| :-- | :-- |
| `07ce53f` | `fix(ui): queue previews show the real output extension for Original` (da branch de preview) |
| `a8db331` | `docs: record the original-format-preview branch` |
| _(feature commit)_ | `feat(images): add Original width option to the recipe` |
| _(harness commit)_ | `chore(dev): add LEVE_WIDTH to the harness and Original fixtures` |
| _(this docs commit)_ | `docs: record the original-width branch` |
