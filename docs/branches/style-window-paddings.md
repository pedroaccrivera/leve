# `style/window-paddings` — Paddings externos padronizados

- **Type:** Style — layout
- **Status:** In Progress — implementado e verificado, aguardando merge
- **Base:** `refactor/header-as-titlebar` (`7e67746`) — entra na release **1.6.6**
- **Plano:** [window-paddings.md](../plans/window-paddings.md)

## 1. Pedido

Os paddings externos estavam despadronizados: os campos do inspector terminavam **6 px à direita** do
botão de tema e do CTA, e header/footer tinham meio pixel a mais embaixo por causa das hairlines. O
pedido: os paddings da janela devem encaixar o botão de tema e o botão inferior direito (e o print
anota `10.5 / 11.5`, `18.5 / 17.5`, `26` vs `31/32`, `20` para as lights).

## 2. Mudanças

### Um gutter de janela

- `WorkbenchLayout` (`aside`): `px-[var(--d-inspector-x)]` → `pl-[var(--d-inspector-x)]` +
  `pr-[var(--d-page-x)]`. O inset esquerdo continua medido a partir do divisor (26), mas a borda
  direita é borda de janela e usa o gutter da página (32).
- Resultado @800: **botão de tema, CTA e campos do inspector terminam todos em 1248** (32 px da
  borda). A 720 todos em 1252 (28 px) e a 1000 em 1240 (40 px).

### Hairlines fora do fluxo

- `Header` e `ActionFooter` deixaram de usar `border-b` / `border-t`; a linha virou pseudo-elemento
  (`after:` de 1 px) e a caixa continua exatamente `--d-nav` / `--d-footer`.
- O footer ganhou `isolate` (stacking context próprio) para o `after:-z-10` ficar **acima** do
  `bg-paper` do footer e **abaixo** do conteúdo; no header o `z-20` já criava o contexto.
- O `-mb-px` do bloco das abas saiu: as abas terminam em 68 e a hairline é desenhada por baixo, então
  o sublinhado de 2 px da aba ativa continua inteiro e as abas inativas se fundem com a linha.
- Respiro resultante: tema **12/12** @800 (era 11,5/12,5), CTA **19/19** (era 19,5/18,5); a 720
  10/10 e 17/17; a 1000 14/14 e 22/22.

### Lights na posição do print

- `electron/main.ts`: medindo o círculo no app real descobriu-se que o macOS desenha o botão no ponto
  dado (a borda antialias lê 0–1 px para dentro), então **x continua 20** e só o `y` mudou:
  `nav/2 − 6 → nav/2 − 7`. O círculo visível fica em **x = 20,04** e centro **y = 34,07** num header
  de 68 (centro 34) — medido por pixel no app real, não no mock.

### Trava de regressão

- `LEVE_MEASURE=1` ganhou o bloco `edges` (`gutter`, `themeRight`, `ctaRight`, `inspectorRight`,
  `workspaceLeft`, `footerLeft`, `themeGapTop/Bottom`, `ctaGapTop/Bottom`) — o desalinhamento agora
  aparece como número na medição, não como "parece torto".

## 3. Arquivos

```
src/components/WorkbenchLayout.tsx   pr do inspector = gutter da página
src/components/Header.tsx            hairline como pseudo-elemento, sem -mb-px
src/components/ActionFooter.tsx      hairline como pseudo-elemento + isolate
electron/main.ts                     lights: y = nav/2 − 7 (x segue 20)
scripts/screenshot.cjs               bloco edges no LEVE_MEASURE
docs/plans/window-paddings.md        status → implementado
docs/branches/refactor-header-as-titlebar.md   nota sobre a hairline
docs/branches/refactor-tabs-to-header-rule.md  nota sobre a hairline
docs/branches/style-window-paddings.md
PROJECT_STATUS.md
```

## 4. Testes

- `npx tsc --noEmit` limpo · `npx vite build` verde · `testProcessor`, `testIcoProcessor` e
  `testVideoProcessor` passando.
- **`edges` + overflow** via `LEVE_MEASURE=1`:

| Estado | Altura | gutter | tema / CTA / inspector | gaps tema | gaps CTA | overflow |
| :--- | ---: | ---: | :--- | :--- | :--- | :--- |
| `images-start` | 800 | 32 | 1248 / 1248 / 1248,01 | 12 / 12 | 19 / 19 | 0 / 0 |
| `images-start` | 720 | 28 | 1252 / 1252 / 1252,01 | 10 / 10 | 17 / 17 | 0 / 0 |
| `images-start` | 1000 | 40 | 1240 / 1240 / 1240,01 | 14 / 14 | 22 / 22 | 0 / 0 |
| `images-report` | 800 | 32 | 1248 / 1248 / — | 12 / 12 | 19 / 19 | 0 / 0 |
| `videos-report` | 720 | 28 | 1252 / 1252 / — | 10 / 10 | 17 / 17 | 0 / 0 |
| `favicon-report` | 800 | 32 | 1248 / 1248 / — | 12 / 12 | 19 / 19 | 0 / 0 |
| `favicon-start` | 720 | 28 | 1252 / 1252 / 1252,01 | 10 / 10 | 17 / 17 | 0 / 0 |

  (Os relatórios não têm campos no inspector — a receita é read-only — por isso o `—`.)
- Sem overflow horizontal em nenhuma coluna, no documento ou no body em nenhum dos estados.
- Hairlines conferidas por pixel: header em y = 63/64 @720, footer em y = 644/645; o sublinhado de
  2 px da aba ativa continua inteiro.
- App real: lights com o círculo em x = 20 e centro na linha do header.

## 5. Decisões

| # | Decisão | Justificativa |
|---|---|---|
| 1 | Gutter horizontal único (`--d-page-x`) em header, workspace, footer e borda direita do inspector | é o que faz os três elementos da direita caírem na mesma linha |
| 2 | Inset esquerdo do inspector continua `--d-inspector-x` | a referência ali é o divisor, não a janela |
| 3 | Hairlines como pseudo-elemento (não `box-shadow`) | mantém a caixa exata e permite a linha em 1 px sem meio pixel |
| 4 | `isolate` no footer | sem stacking context o `after:-z-10` sumia atrás do `bg-paper` |
| 5 | Header 68 e botão 44 (não 66/40) | 12/12 exatos; 66 quebraria a escala 72/68/64 dos tiers |
| 5.1 | Lights: só 1 px de compensação vertical | medido no app real: o macOS posiciona o círculo no ponto configurado; o −1 alinha o centro |
| 6 | `edges` no `LEVE_MEASURE` | o alinhamento vira teste, não impressão |

## 6. Commit history

```
style(ui): align the outer paddings on one window gutter
docs: record the window-paddings branch
```
