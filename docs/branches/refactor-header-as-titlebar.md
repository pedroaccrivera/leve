# `refactor/header-as-titlebar` — O header vira a titlebar

- **Type:** Refactor — layout / identidade
- **Status:** In Progress — implementado e verificado, aguardando merge
- **Base:** `main` @ `611ac80` (release `1.6.5`)
- **Plano:** [header-as-titlebar.md](../plans/header-as-titlebar.md)

## 1. Pedido

A barra de janela de 28 px existia só para mostrar `LOCAL MEDIA TOOLKIT`, deixando o app com duas
faixas no topo. O pedido: **tirar a titlebar** e fazer o próprio header ser a barra da janela — a aba
selecionada (amarela) ocupa 100% da altura do header, as traffic lights alinham com a marca (que fica
logo ao lado), `LOCAL MEDIA TOOLKIT` sai e a marca ganha o ponto final no acento: **`leve.`**.

## 2. Mudanças

- **`WindowBar.tsx` removido.** O `App` não renderiza mais a barra e o `isMac` local (que só servia
  para ela) saiu junto. O chrome de topo cai de **28 + 72 = 100 px** para **72 px** — 28 px a mais de
  conteúdo, sem mexer nos tiers de densidade.
- **O header é a titlebar.** Ele já era `titlebar-drag-region` com `no-drag` nas abas, no seletor de
  tema e na paleta, então arrastar/duplo-clique continuam funcionando. A barra inteira (à esquerda e à
  direita das abas) arrasta.
- **Traffic lights na linha da marca.** `trafficLightPosition` de `{ x: 20, y: 8 }` para o centro do
  header: `y = nav/2 − 6` (12 px de diâmetro). Como `--d-nav` segue os tiers (72 · 68 · 64), o main
  process recalcula a posição no evento `resize` com `setWindowButtonPosition`, então as lights ficam
  no centro em qualquer altura de janela, não só na de 800 px.
- **Marca em `leve.`** — `leve` + um ponto em `--c-brand-stop`. Tipografia inalterada, com
  `aria-label="leve"` no `<h1>` e `aria-hidden` no ponto.
- **Inset da marca** — `--d-brand-inset`: **84 px** no macOS (lights terminam em 72 + 12 de respiro),
  a gutter da página (`--d-page-x`) no Windows/Linux. O `--d-brand-offset` é o que sobra dentro do
  bloco de 360 px, então **as abas continuam centradas na janela** em vez de deslocadas para a direita.
  A plataforma é marcada em `<html data-platform="mac">` no `main.tsx`.
- **`LOCAL MEDIA TOOLKIT` removido** com a barra.

### Nota sobre o ponto da marca

No Ink o ponto usa o **signal puro** (lê bem no escuro). No Paper, signal puro sobre o off-white fica
quase invisível, então o token `--c-brand-stop` aponta para `--c-signal-text` (o mix "acento como
texto" já usado no tema claro). Nos dois casos o ponto acompanha o tom escolhido no seletor.

### Harness

`scripts/screenshot-app.cjs` passou a carregar `dist-electron/main.js` com `import()` — o arquivo é
ESM desde a mudança do `package.json` para `"type": "module"`, e o `require()` quebrava o harness com
`ERR_REQUIRE_ESM` (o app real não era afetado). O mock de lights do `scripts/screenshot.cjs` também
foi para a nova posição (centro do header do tier da altura).

## 3. Arquivos

```
src/components/WindowBar.tsx      REMOVIDO
src/App.tsx                       sem WindowBar / isMac
src/components/Header.tsx         marca "leve." + inset por plataforma
src/styles/tokens.css             --d-brand-inset / --d-brand-offset / --c-brand-stop
src/main.tsx                      <html data-platform="mac">
src/index.css                     comentário da região de arrasto
electron/main.ts                  lights centradas no header, re-sync no resize
scripts/screenshot.cjs            mock das lights na nova posição
scripts/screenshot-app.cjs        import() do main ESM
docs/plans/header-as-titlebar.md  status → implementado
docs/branches/refactor-header-as-titlebar.md
PROJECT_STATUS.md
```

## 4. Testes

- `npx tsc --noEmit` limpo · `npx vite build` verde · `testProcessor`, `testIcoProcessor` e
  `testVideoProcessor` passando.
- **Medição (`LEVE_MEASURE=1`)**, Ink:
  - `images-start` @800 → 0 / 0
  - `images-report` @800 → 0 / 0
  - `videos-report` @720 → 0 / 0
  - `favicon-report` @800 → 0 / 0
  - `favicon-start` @720 → 0 / 0

  Sem overflow horizontal em nenhuma coluna, no documento ou no body (o `h` de todos os eixos = 0).
- **Visual**: capturas com o mock das lights em Ink e Paper @800 e @720 — lights no centro do header
  do tier, marca em x = 84, aba ativa de ponta a ponta.
- **Ponto da marca**: conferido com `LEVE_HUE=66` e `LEVE_HUE=200` nos dois temas — o ponto segue o
  tom e continua legível no Paper.
- **App real** (`npm run dev` + screenshot do sistema): barra de 28 px ausente, lights dentro do
  header alinhadas com `leve.`, cantos arredondados da janela preservados, `LOCAL MEDIA TOOLKIT` fora.
- `screenshot-app.cjs` volta a rodar depois do ajuste do `import()` (carrega o app real e salva).

## 5. Decisões

| # | Decisão | Justificativa |
|---|---|---|
| 1 | Header segue com 72 px (68/64 nos tiers) | as lights de 12 px ficam centradas com folga e o rótulo das abas mantém a linha do design |
| 2 | Lights em x = 20, y recalculado por tier | manter o centro exato em 800 e em 720; `setWindowButtonPosition` no resize |
| 3 | Marca em 84 (macOS) / gutter (outros) via `--d-brand-offset` | limpa as lights sem deslocar as abas do centro da janela |
| 4 | `--c-brand-stop`: signal no Ink, signal-text no Paper | o ponto precisa ler nos dois temas mantendo o acento |
| 5 | `aria-label="leve"` + `aria-hidden` no ponto | leitor de tela não anuncia "ponto" |
| 6 | Windows/Linux mantêm frame nativo | sem lights desenhadas sobre o header; nada muda além da barra removida |

## 6. Commit history

```
refactor(ui): make the header the window bar
docs: record the header-as-titlebar branch
```
