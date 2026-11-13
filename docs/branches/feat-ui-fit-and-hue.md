# `feat/ui-fit-and-hue` — Encaixe vertical + densidade (leva 2)

- **Type:** Feature — layout / densidade
- **Status:** In Progress — F1 e F2 implementados, aguardando aprovação de merge
- **Base:** `main` @ `a368469` (release `1.5.0`)
- **Plano aprovado:** [docs/plans/ui-pass-2.md](../plans/ui-pass-2.md)

## 1. Escopo desta leva

Dos 5 itens da leva, **dois foram implementados** (itens 1–3 do pedido) e **dois seguem como
plano aprovado, sem código** (itens 4–5), conforme combinado:

| # | Item | Status |
|---|---|---|
| 1 | Abrir com todo o conteúdo visível, sem rolar | ✅ implementado |
| 2 | Versão condensada por altura de tela (até 720p) | ✅ implementado |
| 3 | Gap entre linhas de caixas = gap entre colunas | ✅ implementado |
| 4 | Estudo de motion / microinterações | 📄 estudo aprovado (skills instaladas) |
| 5 | Seletor de tom (hue) | 📄 plano aprovado, **não implementado** |

## 2. Item 3 — `ChoiceStack` (fidelidade ao design)

As linhas de caixas empilhavam no `gap-2` (8 px) do conteúdo da seção enquanto as colunas usavam
`gap-1` (4 px). O frame `64:121` do design põe a linha 2 em `y=48` com caixas de 44 → **4 px nos
dois eixos**. Novo primitivo `ChoiceStack` (`flex flex-col gap-1`), aplicado em:

- `ImageInspector` — presets de largura (2 linhas)
- `FaviconInspector` — background (2 linhas) e tamanhos do `.ico` (2 linhas)

Verificado por medição (`LEVE_MEASURE=1` passou a reportar os gutters das pilhas): vertical `[4]` e
horizontal `[4, 4]` / `[4, 4, 4, 4, 4]` em 1060, 800 e 720 — antes o vertical era 8 no tier tall.

## 3. Itens 1 e 2 — densidade

### 3.1 O problema, medido

`scripts/screenshot.cjs` ganhou dois modos de diagnóstico:

- `LEVE_MEASURE=1` — imprime `clientHeight`/`scrollHeight` das duas colunas + `overflow`;
- `LEVE_HEIGHT=<px>` — abre a janela na altura pedida (antes fixava 800).

Medição inicial (`main` @ 1.5.0):

| Estado | Workspace | Inspector |
|---|---:|---:|
| Images start @800 | 721 (coluna 608) → **+113** | 822 → **+214** |
| Videos empty @800 | 792 → **+184** | 826 → **+218** |
| Favicon empty @800 | 792 → **+184** | 858 → **+250** |

Ou seja: **já sobrava no tamanho de janela padrão**, não só em 720p. O frame do design tem 1060 px
de conteúdo num "production preview" de 800 — o design pressupõe rolagem.

### 3.2 Como foi resolvido

Densidade em **três tiers por altura de viewport**, tudo em CSS (media query → variáveis de token,
sem JS, sem re-render):

| Token | Tall ≥1000 | Compact ≤999 | Short ≤759 |
|---|---:|---:|---:|
| `--d-page-x` / top / bottom | 40 / 32 / 40 | 32 / 20 / 20 | 28 / 14 / 14 |
| `--d-block` (gap entre blocos) | 24 | 16 | 12 |
| `--d-section` (gap entre seções) | 16 | 4 | 4 |
| `--d-field` (label → conteúdo) | 8 | 4 | 4 |
| `--d-label-gap` (hairline → label) | 8 | 4 | 2 |
| `--d-nav` / `--d-footer` | 72 / 92 | 68 / 84 | 64 / 76 |
| `--d-inspector-x` / top / bottom | 30 / 28 / 40 | 26 / 16 / 16 | 24 / 12 / 12 |
| `--d-control` / `-lg` / `-sm` | 44 / 48 / 44 | 44 / 46 / 28 | 40 / 42 / 28 |
| `--d-dropzone` | 320 | 240 | 216 |
| `--d-row` / `--d-row-y` / `--d-receipt` | 100 / 20 / 104 | 84 / 14 / 88 | 76 / 12 / 80 |
| `--d-intro-gap` / `--d-list-gap` | 12 / 16 | 10 / 12 | 8 / 8 |
| `--t-display-size` / leading | 48 / 52 | 42 / 46 | 34 / 38 |
| `--t-title-size` / leading | 28 / 34 | 26 / 32 | 24 / 30 |

Duas mudanças discretas completam o encaixe:

1. **Notas do inspector viram tooltip** (`FieldSection.note`): acima de 1000 px a nota aparece
   inline como antes; abaixo disso ela vai para um `ⓘ` no label da seção, revelado em hover/focus.
   A copy não se perde — muda de lugar. A descrição dos checkboxes (`Remove EXIF…`) segue o mesmo
   caminho, via `title` nativo.
2. **Subtítulo do inspector** (`Shared settings · applies to…`) é oculto apenas no tier short.

Também: a **janela** abre em `min(1280, workArea) × min(800, workArea)` (mínimo 1040×640), então
em tela baixa o app já nasce do tamanho da área útil.

### 3.3 Resultado medido (estados vazios, ambos os temas)

| Altura da janela | Tier | Images | Videos | Favicon |
|---|---|---:|---:|---:|
| 1060 | tall (design) | 0 / 0 | 0 / 0 | 0 / 0 |
| 900 | compact | 0 / 0 | 0 / 0 | 0 / 0 |
| 800 (padrão) | compact | 0 / 0 | 0 / 0 | 0 / 0 |
| 720 | short | 0 / 0 | 0 / 0 | 0 / 0 |

(workspace / inspector — `overflow` em px). Os **inspectors ficam em 0 em todos os estados**,
inclusive com fila, relatório e processamento.

### 3.4 O que continua rolando (decidido: D4)

Conteúdo ilimitado por natureza — o workspace rola com fila/relatório/editor:

| Estado @800 | Workspace |
|---|---:|
| Images ready (3 itens) | +86 |
| Images report (3 resultados) | +30 |
| Images processing (1 ativo + 2) | +78 |
| Favicon editor (3 logos) | +258 |

As alturas de linha foram reduzidas nos tiers condensados (`--d-row` 100 → 84 → 76) justamente para
diminuir essa rolagem; o editor de favicon (preview de 256 px + strip + blocos) é o caso mais alto e
rola como no próprio frame do design (1060 px).

## 4. Arquivos

**Criados**

```
docs/plans/ui-pass-2.md              plano aprovado da leva
docs/branches/feat-ui-fit-and-hue.md este documento
```

**Modificados**

```
src/styles/tokens.css              tokens de densidade + 3 tiers + t-display/t-title por variável
tailwind.config.js                 screens por altura: compact (≤999), short (≤759)
src/components/ui/Choice.tsx       ChoiceStack + alturas por token
src/components/ui/FieldSection.tsx note → tooltip (ⓘ) abaixo de 1000 px
src/components/ui/Button.tsx       md/lg por token
src/components/ui/TextInput.tsx    altura por token (input e valor resolvido)
src/components/ui/Slider.tsx       hit area por token (trilha/knob inalterados)
src/components/ui/Checkbox.tsx     descrição oculta no compact (title nativo mantém a copy)
src/components/WorkbenchLayout.tsx paddings por token + overflow-x-hidden
src/components/Header.tsx          altura da nav por token
src/components/ActionFooter.tsx    altura do footer + padding por token
src/components/DropZone.tsx        altura do dropzone por token
src/components/WorkspaceBlocks.tsx gaps do intro/princípios por token
src/components/QueueRow.tsx        altura das linhas por token
src/components/BatchReport.tsx     padding das linhas e altura do receipt por token
src/components/ImageInspector.tsx  gaps por token + notas → tooltip
src/components/VideoInspector.tsx  gaps por token + notas → tooltip
src/components/FaviconInspector.tsx gaps por token + notas → tooltip
src/App.tsx                        gaps das telas por token
electron/main.ts                   janela = min(design, área útil da tela)
scripts/screenshot.cjs             LEVE_MEASURE=1 e LEVE_HEIGHT=<px>
```

## 5. Testes

- `npx tsc --noEmit` → limpo.
- `npx vite build` → verde.
- `node test/testProcessor.js` / `testIcoProcessor.js` / `testVideoProcessor.js` → todos passam.
- Matriz de encaixe (acima): 10/10 combinações com `overflow = 0` nos estados vazios; inspectors em
  0 em todos os estados; tier tall (≥1000) intocado (o design como desenhado).
- Capturas em 1060/900/800/720 nos dois temas (Ink e Paper) revisadas visualmente — inclusive o
  favicon no tier compact em Paper, que foi onde o `ⓘ` e o `Auto → #FFFFFF` ficaram mais apertados.

## 6. Decision log

| # | Decisão | Justificativa |
|---|---|---|
| 1 | Densidade por **media query** e não por JS | reage a resize sem re-render, sem estado, sem hidratação; os tokens já existiam |
| 2 | Corte do tier tall em **≥1000** | o design precisa de ~1030 px de janela para caber; abaixo disso o compact assume (inclusive 975 de uma tela 1080p maximizada) |
| 3 | Notas → **tooltip**, não removidas | aprovado (D1): libera ~100 px sem perder copy |
| 4 | Controles de **40 px só no short** (D2) e 44 px em 800+ | mantém o alvo de 44/48 do design sempre que há espaço |
| 5 | `--d-control-sm` 28 px no compact/short | só o *hit area* de slider e do bloco de valor resolvido; trilha e knob seguem iguais |
| 6 | Rows de lista menores nos tiers condensados | reduz a rolagem dos estados com fila sem mudar o desenho da linha |
| 7 | F3/F4 não implementados | combinado: primeiro o estudo/plano; o hue entra depois, na mesma branch |

## 7. Pendente nesta branch

- **F3 — seletor de tom (hue)**: plano em [ui-pass-2.md](../plans/ui-pass-2.md) §5. Decisões tomadas:
  hue absoluto 0–360 com padrão 66° (`#E6F45C`), reset no hover do número, salvamento automático,
  theme switch permanece **44×44** (alinhado por pedido, não os 42 do mockup).
- **F4 — microinterações**: estudo em §4 do plano; 3 skills instaladas
  (`impeccable` com `reference/animate.md`, `design-motion-principles`, `fixing-motion-performance`).

## 8. Commit history

```
docs: record the second UI pass plan and branch
feat(ui): density tiers so the whole app fits a short window
chore(dev): measure layout overflow and window height in the harness
docs(branch): correct the commit list
fix(ui): equalise the gutter between stacked choice rows
```

O ajuste do item 3 chegou em dois tempos: o primitivo `ChoiceStack` foi criado junto do commit de
densidade (mesmo arquivo, `ui/Choice.tsx`) e a aplicação nas duas inspectors veio no commit
seguinte, com a verificação por medição.
