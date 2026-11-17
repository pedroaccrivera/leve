# Plano — `1.6.6` (2ª parte) · Paddings externos padronizados

> **Status:** aprovado e implementado na branch `style/window-paddings` — ver
> [docs/branches/style-window-paddings.md](../branches/style-window-paddings.md).
> **Base:** branch `refactor/header-as-titlebar` (`7e67746`) — entra na mesma release **1.6.6**.
> **Branch proposta:** `style/window-paddings`, cortada da branch acima.

## 1. Contexto

O print anota (em pt, no frame de 1280) `20pt` para as lights, `10.5 / 11.5` em volta do botão de
tema, `31pt` da direita da janela até o botão de tema **e** até o CTA, `26pt` nas laterais dos campos
do inspector e `32pt` na esquerda do footer/workspace. Ou seja: **o botão de tema e o CTA já terminam
na mesma linha; o inspector é o que escapa** — e as duas barras têm meio pixel de folga a mais embaixo
por causa das hairlines.

Medido na implementação atual (1280×800):

| Elemento | Hoje | Print | Alvo |
| :--- | ---: | ---: | ---: |
| Botão de tema — borda direita | 1248 (32) | 31–32 | **1248 (32)** |
| CTA — borda direita | 1248 (32) | 31–32 | **1248 (32)** |
| Campos do inspector — borda direita | **1254 (26)** | 26 | **1248 (32)** |
| Workspace / status do footer — esquerda | 32 | 31–32 | 32 |
| Botão de tema — topo / base | **11,5 / 12,5** | 10,5 / 11,5 | **12 / 12** |
| CTA — topo / base | **19,5 / 18,5** | 18,5 / 17,5 | **19 / 19** |
| Lights — borda esquerda visível | **23** (x = 20 configurado) | 20 | **20** |

Causas:

1. **Inspector com dois insets.** `WorkbenchLayout` aplica `--d-inspector-x` (26) nas duas laterais do
   `aside`; a direita é borda de janela e deveria usar o gutter da página (32), como header e footer.
   Daí os 6 px de diferença — o único desalinhamento visível do print.
2. **Hairlines comem 1 px.** Header e footer usam `h-[var(--d-nav)]` + `border-b/-t`: a caixa de
   conteúdo fica 1 px menor, então o botão de 44 centraliza em 11,5/12,5 (em vez de 12/12) e o CTA de
   46 em 19,5/18,5 (em vez de 19/19). O `-mb-px` nas abas existe só para sobrepor essa borda.
3. **Lights com inset do sistema.** O macOS desenha o círculo ~3 px à direita e ~2 px abaixo do ponto
   configurado, então `x = 20` entrega o círculo em 23 e o centro vertical 1,5 px abaixo do centro do
   header.

## 2. Mudanças

### P1 — Um gutter de janela

- `WorkbenchLayout` (`aside`): `pl-[var(--d-inspector-x)] pr-[var(--d-page-x)]`.
- Efeito: campos do inspector terminam em **1248**, na mesma linha do botão de tema e do CTA; o inset
  interno de 26 (a partir do divisor) fica como está, porque ali a referência é o divisor, não a
  janela.
- Header, footer e workspace já usam `--d-page-x` — passam a ser a única definição de gutter
  horizontal: **32** @800 · **40** no tall · **28** no short.

### P2 — Hairlines fora do fluxo

- A linha do header e a do footer viram pseudo-elementos (`after:` absoluto, 1 px, `border-subtle`) e
  a caixa continua exatamente `--d-nav` / `--d-footer`.
- Consequências: botão de tema **12/12** e CTA **19/19** @800 (23/23 no tall, 17/17 no short);
  `-mb-px` sai do bloco das abas e a hairline é desenhada **sobre** elas (mesmo resultado visual de
  hoje, sem a linha dupla).
- O `border-l` do inspector e o `border-t` das seções internas não mudam (não definem padding de
  janela).

### P3 — Lights no ponto do print

- `electron/main.ts`: o `y` passa a `nav/2 − 7`; o `x` segue 20 (medido no app real: o macOS desenha o
  círculo no ponto dado, a leitura de 23 era borda antialias + estimativa da borda da janela).
- Resultado medido no app real: círculos em **x = 20,04** e centro **y = 34,07** num header de 68
  (centro 34).
- O mock do `scripts/screenshot.cjs` passa a desenhar em `x = 20` e no centro, igual ao alvo.

### P4 — Trava de regressão no harness

- `LEVE_MEASURE` ganha um bloco `edges` com `{ themeRight, ctaRight, inspectorRight, workspaceLeft,
  footerLeft, themeTopGap, themeBottomGap, ctaTopGap, ctaBottomGap }`, e o teste compara com o gutter e
  o respiro esperados do tier. Um desalinhamento futuro aparece como número, não como "parece torto".

## 3. Sobre o botão de tema (a permissão para reduzir)

**Não precisa reduzir.** Com o header em 68 e a hairline fora do fluxo, o botão de 44 (`--d-control`,
o mesmo de todos os controles) deixa **12 px exatos** em cima e embaixo — a assimetria de 1 px era só a
borda. A paleta (`HueControl`) acompanha o mesmo token, então os dois seguem iguais.

Se você preferir o número do print (header de **66** com **11/11**), é uma mudança de token
(`--d-nav: 66` / 70 / 62), mas quebra a escala 72 / 68 / 64 dos tiers e o rótulo das abas sobe 1 px —
por isso a recomendação é **manter 68**. Caso o header encolha, o botão pode ir a 40 (`--d-control` no
short já é 40) sem tocar em mais nada.

## 4. Arquivos previstos

```
src/components/WorkbenchLayout.tsx   pr do inspector = gutter da página
src/components/Header.tsx            hairline como pseudo-elemento
src/components/ActionFooter.tsx      hairline como pseudo-elemento
src/components/MediaTabs.tsx         remove -mb-px
src/styles/tokens.css                comentários dos tokens (sem novos valores)
electron/main.ts                     lights: x 17, y nav/2 − 8
scripts/screenshot.cjs               mock das lights + bloco edges no LEVE_MEASURE
docs/branches/style-window-paddings.md
PROJECT_STATUS.md
```

## 5. Testes previstos

- Probe/DOM em 1280×800, 1280×720 e 1280×1000: `themeRight === ctaRight === inspectorRight` e
  `themeTopGap === themeBottomGap`, `ctaTopGap === ctaBottomGap` em cada tier.
- `LEVE_MEASURE=1` nos estados `images-start`, `images-report`, `videos-report`, `favicon-report` e
  `favicon-start` em 800 e 720 → 0 / 0 e nenhum overflow horizontal (o inspector ganha 6 px de
  largura útil, então a conferência importa).
- Capturas Ink/Paper e app real para as lights (x = 20, centro exato).
- `npx tsc --noEmit`, `npx vite build`, as 3 suítes.

## 6. Decisões para aprovar

| # | Decisão | Proposta |
|---|---|---|
| D1 | Gutter horizontal único (`--d-page-x`) em header, workspace, footer **e** borda direita do inspector | Sim — 32 @800 |
| D2 | Inset esquerdo do inspector continua `--d-inspector-x` (26) | Sim — a referência é o divisor |
| D3 | Hairlines do header/footer fora do fluxo | Sim — corrige 11,5/12,5 e 19,5/18,5 |
| D4 | Header permanece **68** (não 66) e o botão de tema **44** | Sim — 12/12 exatos; 66 quebraria a escala dos tiers |
| D5 | Lights no ponto do print (x = 20, centro exato) | Sim — 1 px de compensação no `y` |
| D6 | `edges` no `LEVE_MEASURE` como trava | Sim |
| D7 | Tudo entra na **1.6.6**, em branch própria (`style/window-paddings`) | Sim |

## 7. Bump

**1.6.6** (patch, mantido) — a release passa a conter: header como titlebar + `leve.` **e** os
paddings externos padronizados.
