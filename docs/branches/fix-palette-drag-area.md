# `fix/palette-drag-area` — Paleta só no botão de tema, header arrastável

- **Type:** Fix — UI / interação
- **Status:** In Progress — implementado e verificado, aguardando merge
- **Base:** `main` @ `9091481` (depois da release `1.6.6`)

## 1. Pedido

> "toda a área da paleta está impossibilitada de arrastar a janela. a paleta deve abrir *somente* ao
> passar o mouse por cima do botão de tema, e a área de `pointer-events: none` deve se restringir aos
> controles visíveis."

O print mostrava a faixa de 360 px à direita do header capturando o ponteiro: dava para abrir a
paleta em qualquer ponto dela e não dava para arrastar a janela por ali.

## 2. Diagnóstico

- `Header.tsx` tinha `no-drag group w-[360px]` no bloco direito inteiro. Os ~250 px vazios à esquerda
  dos botões ficavam fora do `titlebar-drag-region`, e o `group` fazia o `group-hover` da paleta
  disparar de qualquer ponto do bloco.
- O `HueControl` somava **dois gaps fantasmas de 8 px** quando fechado: um `gap-2` na raiz (entre os
  dois slots de largura 0) e outro `gap-2` no bloco do header. Na prática o alvo de hover não era o
  botão de 44 px, e sim uma faixa de 60 px que incluía espaços invisíveis.

## 3. Mudanças

### Só os controles visíveis capturam o ponteiro

- `Header`: o bloco de 360 px perdeu `no-drag` e `group` e ganhou `pointer-events-none`. O cluster
  interno (`HueControl` + `ThemeSwitch`) é `pointer-events-auto no-drag group`.
- Resultado: um clique no vazio do bloco atravessa para o `header` (`titlebar-drag-region`) e arrasta
  a janela; o cluster continua clicável e fora da região de arrasto.

### A paleta abre só no botão de tema

- O `group` passou a ser o cluster do tamanho do conteúdo, então fechado ele mede **44 px** — exatamente
  o botão de tema. Hover no vazio não revela mais nada.
- O `HueControl` perdeu o `gap-2` da raiz. O espaçamento de 8 px virou margem no slot visível:
  - gatilho da paleta: `group-hover:mr-2 group-hover:w-11`;
  - espectro aberto: `open ? 'mr-2 w-[262px]' : 'w-0'`.
- Assim o vão de 8 px só existe quando o controle está visível. Ele mantém a paleta aberta enquanto o
  ponteiro atravessa do botão de tema até o gatilho (e o botão de tema continua ancorado na borda
  direita, sem deslocar).
- `focus-within` no slot do gatilho: com Tab, o botão de 0 px recebe foco e o slot expande para 44 px —
  antes ele era focável mas ficava invisível.

### Trava de regressão

- `LEVE_MEASURE=1` ganhou o bloco `dragArea`:
  `blockPointer`, `clusterPointer`, `clusterWidth`, `themeWidth`, `emptyHit`, `emptyRegion`. Um
  `no-drag` no bloco inteiro volta a aparecer como número.
- A regra de captura `LEVE_HOVER_THEME=1` passou a aplicar também `margin-right: 8px`, para o print
  forçado ter o mesmo vão do hover real.

## 4. Arquivos

```
src/components/Header.tsx             bloco 360 px pointer-events-none; cluster auto + no-drag + group
src/components/ui/HueControl.tsx      sem gap na raiz; margens só no slot visível; focus-within
scripts/screenshot.cjs                dragArea no LEVE_MEASURE; margem no hover de captura
docs/branches/fix-palette-drag-area.md
docs/branches/refactor-header-as-titlebar.md   nota sobre o escopo do no-drag
PROJECT_STATUS.md
```

## 5. Testes

- `npx tsc --noEmit` limpo · `npx vite build` verde · `testProcessor`, `testIcoProcessor` e
  `testVideoProcessor` passando.
- **`LEVE_MEASURE=1`** — `dragArea` + `edges` + overflow:

| Estado | Altura | bloco / cluster | cluster / tema | vazio | tema / CTA / inspector | gaps tema | gaps CTA | overflow |
| :--- | ---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `images-start` | 800 | `none` / `auto` | 44 / 44 | `HEADER` `drag` | 1248 / 1248 / 1248,01 | 12 / 12 | 19 / 19 | 0 / 0 |
| `images-start` | 720 | `none` / `auto` | 44 / 44 | `HEADER` `drag` | 1252 / 1252 / 1252,01 | 10 / 10 | 17 / 17 | 0 / 0 |
| `images-start` | 1000 | `none` / `auto` | 44 / 44 | `HEADER` `drag` | 1240 / 1240 / 1240,01 | 14 / 14 | 22 / 22 | 0 / 0 |
| `videos-report` | 720 | `none` / `auto` | 44 / 44 | `HEADER` `drag` | 1252 / 1252 / — | 10 / 10 | 17 / 17 | 0 / 0 |
| `favicon-report` | 800 | `none` / `auto` | 44 / 44 | `HEADER` `drag` | 1248 / 1248 / — | 12 / 12 | 19 / 19 | 0 / 0 |

- **Estados de hover no harness** (mouse real via `sendInputEvent`): parado = 44 px de cluster e slot
  0; hover no tema = slot 44 + margem 8 e cluster 96; hover no gatilho = continua 96; aberto =
  espectro 262 + margem 8 e cluster 314; fora do tema (vazio) = volta a 44 e slot 0.
- **Teclado:** com o botão do gatilho focado, o slot mede 44 e a margem 8.
- **App real** (janela 1280 × 800, Electron em primeiro plano, eventos de mouse de verdade via
  CoreGraphics):
  - hover no tema revela o gatilho à esquerda, com o vão de 8 px;
  - hover no vazio esconde o gatilho;
  - arrastar a partir do vazio do bloco moveu a janela de `y = 129` para `y = 229` e o teste restaurou
    para `129`.
- O print do hover forçado (`LEVE_HOVER_THEME=1`) e o aberto (`LEVE_HUE_OPEN=1`) conferem o vão e a
  posição do espectro.

## 6. Decisões

| # | Decisão | Justificativa |
|---|---|---|
| 1 | `pointer-events-none` no bloco de 360 px + `pointer-events-auto` no cluster | o vazio atravessa para o `header` (drag) e não dispara hover; só o que é visível captura o ponteiro |
| 2 | `group` no cluster do tamanho do conteúdo | o alvo de hover passa a ser o botão de tema, não os 360 px |
| 3 | Margem no slot visível em vez de `gap` na raiz | `gap` sobrevive a filho de largura 0 e criava alvo fantasma de 8 px |
| 4 | Manter o vão de 8 px quando o gatilho/espectro está visível | o ponteiro precisa atravessar do tema até a paleta sem fechá-la |
| 5 | `focus-within` no slot do gatilho | o botão é focável; sem isso o Tab parava num controle invisível |
| 6 | `dragArea` no `LEVE_MEASURE` | transforma "não arrasta" em valor medido (`none` / `auto` / `HEADER` / `drag`) |
| 7 | Regra de captura com a mesma margem do hover | o print forçado não pode mostrar um vão diferente do real |

## 7. Commit History

| Commit | Message |
| :--- | :--- |
| `fbb14d4` | `fix(ui): keep the header draggable outside the tone controls` |
| _(this docs commit)_ | `docs: record the palette-drag-area branch` |
