# Plano — Largura "Original" (manter dimensões)

> **Status:** aprovado (com o ajuste de layout do usuário) e implementado na branch
> `feat/original-width` — ver [docs/branches/feat-original-width.md](../branches/feat-original-width.md).
>
> Nova opção de tamanho na receita de imagens: as dimensões de saída são as mesmas das originais;
> compressão e formato continuam seguindo a escolha do usuário.

## 1. Como funciona hoje

- `ResizeConfig.targetWidth: number` é a única alavanca de largura; o processador
  ([imageProcessor.ts:81](../..//electron/services/imageProcessor.ts)) **já pula o `resize()` quando
  `targetWidth <= 0`** — o sentinel `0` representa "não redimensionar" de graça.
- Presets 800/1280/1920/2560/3840 (`WIDTH_PRESETS`) + campo `Custom` (`widthIsCustom`). A seleção de
  preset **não sobrevive a restarts** (só o Custom persiste via `STORAGE_KEYS`).
- O processamento continua aplicando compressão, formato e metadata em qualquer caso.

## 2. Mudanças propostas

| # | Onde | O que |
| :-- | :-- | :-- |
| M1 | `src/App.tsx` | "Original" = `selectWidthPreset(0)` (sentinel). Nenhum novo estado de config, nenhuma chave de storage |
| M2 | `ImageInspector` | nova Choice **"Original"** no grid; selecionada quando `config.targetWidth === 0` |
| M3 | `ImageInspector` | o campo de largura mostra **"Original"** em vez de `0 px`; digitar continua trocando para `Custom` (comportamento de hoje) |
| M4 | `App.tsx` (resumo do processamento) | `1920 px maximum` → **"Original dimensions"** quando 0 |
| M5 | Relatório "Recipe used" | `Output width: 1920 px` → **`Original`** quando 0 |
| M6 | `test/testProcessor.js` | caso novo: `targetWidth: 0` mantém as dimensões e ainda aplica compressão/formato |
| M7 | Harness | verificação visual: grid com 7 células, campo mostrando "Original", sem overflow |

Fora do escopo: aba de vídeos (o pedido é o conversor de imagens), persistência de preset (já não
existe hoje), favicon.

## 3. Layout do grid (decisão do usuário)

- **Escolhido:** `800 · 1280 · 1920` / `2560 · **Original** · Custom` — **Original entra no lugar do
  3840** (penúltimo, antes do Custom). O preset **4K UHD (3840) sai do grid**; quem precisar de
  3840 usa o campo Custom.
- Descartadas: "Original primeiro" e "Original anexado no fim" (suposições minhas; o usuário definiu
  o lugar exato).

## 4. Interações a preservar

- "Never enlarge smaller files": com Original o `resize()` nem roda, então a flag fica inerte
  naquele lote — o checkbox permanece visível e volta a valer ao escolher um preset. Sem mudança.
- Escolher Original e depois digitar no campo → volta a Custom (fluxo existente de foco/digitação).
- Trocar de tab, limpar a fila, relatório: nada muda.

## 5. Verificação

- `tsc`, `vite build`, 3 suítes.
- `testProcessor`: caso `targetWidth: 0` → dimensões de saída == originais, peso < original
  (compressão aplicada), extensão conforme formato.
- Capturas 1280×800 e 1280×720 (Ink e Paper) com o Original selecionado — `LEVE_MEASURE` sem
  overflow.

## 6. Decisões para aprovar

| # | Decisão | Proposta |
| :-- | :-- | :-- |
| D1 | Sentinel `0` em `targetWidth` (sem campo novo em `ResizeConfig`) | o processador já trata `<= 0`; uma única fonte de verdade |
| D2 | Label "Original" no campo de largura | o campo nunca mostra `0 px` |
| D3 | Resumo e relatório dizem "Original dimensions" / `Original` | não inventam número |
| D4 | Sem persistência extra | presets já resetam no restart; Original é simétrico |
| D5 | Escopo: só imagens | pedido explícito do conversor de imagens |
