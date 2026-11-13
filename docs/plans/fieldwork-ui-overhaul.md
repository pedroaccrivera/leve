# Plano — Overhaul completo de UI: direção **Fieldwork / Refined** (`leve`)

> **Status:** aguardando aprovação. Nenhum código de feature foi escrito.
> **Fonte de verdade:** Figma `LEVE` — fileKey `tpwkncQMXCg5zZRdUnBp3m`, seção `69:830` ("Fieldwork [polished]").
> **Regra da tarefa:** reprodução **1:1**. Sem invenções de layout. Onde o design não cobre um estado, compor **apenas** com estilos/componentes já existentes na mesma direção, e o usuário aponta desvios.

---

## 1. Objetivo

Substituir integralmente a interface atual do `leve` (paleta slate/blue, cards arredondados, modal de resumo) pela direção **Fieldwork / Refined** do Figma: temas **Paper / Ink**, tipografia **Space Grotesk / Inter / IBM Plex Mono**, accent **signal yellow**, layout de duas colunas (workbench + recipe inspector), footer de ação fixo e **batch report** em página.

A lógica de negócio (IPC, Sharp, ffmpeg, ICO encoder, presets em localStorage, destinos de saída) **não muda**.

---

## 2. Inventário do Figma

Seção `69:830` — 9 frames. 3 são documentação de identidade/direção, 6 são telas de produção.

| # | Frame | nodeId | Papel |
|---|---|---|---|
| D1 | Identity | `64:1091` | lockup, princípios, paleta, fontes |
| D2 | Concept and changes | `64:1115` | o que foi preservado / empurrado |
| D3 | Control states | `64:1130` | foco de teclado, custom background, locked, auto resolvido |
| 01 | Images — Start | `64:65` | estado vazio (Ink) |
| 02 | Images — Ready | `64:252` | fila com 3 itens (Ink) |
| 03 | Images — Batch report | `64:425` | relatório de lote (Ink) |
| 04 | Videos — Processing | `64:571` | processando 1 de 2, inspector travado (Ink) |
| 05 | Favicon — Editor | `64:696` | editor + receita (Ink) |
| 06 | Images — Paper | `64:863` | mesmo que 02 no tema Paper |

Referências visuais baixadas localmente em `/private/var/folders/.../T/opencode/leve-figma/` (PNGs 1024px). Serão úteis como baseline de comparação.

### Geometria canônica (janela de produção 1280 × 800)

```
0           28   titlebar (window controls + "leve  /  LOCAL MEDIA TOOLKIT" mono)
28         100   nav: wordmark "leve" (x32) · tabs 01/02/03 (x424, 3 × 144×48) · "100% local" + theme switch (x888)
100        ...   workbench: Media workspace (852, padding 40) | Batch inspector (428, padding 31/368)
...       1076   action footer (92): status à esquerda (x40) + CTA 280×48 (x960)
```

- Coluna workspace: conteúdo em largura 772 (padding lateral 40).
- Coluna inspector: conteúdo em largura 368 (padding lateral 30/31).
- Divisória vertical entre as colunas na borda do inspector; divisória horizontal acima do footer.
- Cabeçalho/rodapé fixos; apenas a área do workbench rola.

---

## 3. Design system extraído (Figma → tokens)

### 3.1 Cores (semânticas, trocam por tema)

| Token | Paper (light) | Ink (dark) | Uso |
|---|---|---|---|
| `paper` | `#f5f3ec` | `#171b18` | fundo do app |
| `panel` | `#eceae1` | `#222823` | painéis/cartões, caixa do dropzone, receipt |
| `surface` | `#fffef9` | `#2b322c` | inputs, choices, thumbs, chips |
| `subtle` | `#d5d6c9` | `#3d483e` | hairlines / divisórias |
| `line` | `#9a9f91` | `#737f71` | borda tracejada do dropzone |
| `border-control` | `#879681` | `#76816d` | borda de controles (choice, input, botão secundário) |
| `ink` | `#1b241d` | `#f5f3ec` | texto primário **e** fill do estado selecionado |
| `muted` | `#586153` | `#b9c2b5` | texto secundário |
| `signal` | `#e6f45c` | `#e6f45c` | ação primária (um único sinal) |
| `on-signal` | `#1b241d` | `#1b241d` | texto sobre signal |
| `danger` | `#9c3428` | `#ffada0` | falha |
| `warning` | `#775016` | `#f5cc84` | ignorado (skipped) |
| `success` | `#28643d` | `#a3d8ac` | concluído |

Raios: `radius/md = 8px` (botões, inputs, receipt), `radius/lg = 12px` (painéis maiores). **Controles de escolha (Choice) são quadrados (0)**.

### 3.2 Tipografia (9 estilos)

| Estilo | Família | Peso | Tamanho/Altura | Tracking | Uso |
|---|---|---|---|---|---|
| `Mono 13` | IBM Plex Mono | 400 | 13/20 | 0 | valores técnicos, contadores, labels de status, titlebar |
| `Display` | Space Grotesk | 500 | 48/52 | −2 | H1 das telas ("Less weight.") |
| `Title` | Space Grotesk | 500 | 28/34 | −0.6 | "Image recipe", títulos de bloco |
| `Section` | Space Grotesk | 700 | 20/26 | −0.3 | "YOUR OUTPUT", nome do logo |
| `Body` | Inter | 400 | 16/24 | 0 | parágrafos |
| `Control` | Inter | 500 | 14/20 | 0 | rótulos de botões/choices |
| `Small` | Inter | 400 | 13/20 | 0 | metadados, legendas |
| `Label` | Inter | 600 | 12/16 | +0.6 | labels UPPERCASE de seção ("01 / OUTPUT WIDTH") |
| `Brand` | Space Grotesk | 700 | 104/104 | −6 | lockup (apenas capa de identidade) |

Fontes precisam ser **empacotadas localmente** (app 100% offline, CSP `font-src 'self' data:`): Space Grotesk 500/700, Inter 400/500/600, IBM Plex Mono 400 — woff2, subset latino + latin-ext (acentos PT/ES), licenças OFL incluídas.

### 3.3 Primitivos de componente (nomes do próprio Figma)

| Primitivo | Especificação extraída |
|---|---|
| `Choice` | `bg-surface` + `border 1px border-control`, label `Mono 13`/`ink`, padding 8, centralizado; altura 44; largura 120 (presets de largura) ou dividindo a linha (compression/format/destination). **Selecionado = fill `ink`, texto `paper`.** |
| `Choice · Read only` | mesma geometria, sem fill/interação — usada no inspector travado (Videos) e no relatório |
| `Button · primary` | `bg-signal`, raio 8, padding 16/12, label `Control`/`on-signal` (ex.: "Resize 3 images →"). Disabled = `panel` + `muted` |
| `Button · secondary` | borda `border-control`, texto `ink` (ex.: "Add folder", "Dismiss report", "Reset recipe") |
| `Input` | `bg-surface`, raio 8, altura 44, valor `Mono 13` (ex.: "1920 px · Full HD", "resized/") |
| `Checkbox` | caixa 20×20 com ✓, label `Control` + descrição `Small`/`muted` |
| `Slider` | trilha fina `subtle`, knob `ink`/`surface`, valor em mono à direita (8%, 22%) |
| `Status chip` | `○ Pending`, `✓ Done`, `⌐ Skipped`, `! Failed`, `○ Waiting` — mono 13, cores `muted`/`success`/`warning`/`danger` |
| `Queue row` | 100px: hairline, thumb 56×56 (ícone 24), detalhes x72 (nome 16/24 · `dims · MB` 13/20 · `→ output` 13/20), status à direita, botão remover 44×44 (ícone 18) |
| `WindowBar` | 28px: dots, `leve  /  LOCAL MEDIA TOOLKIT` mono 13, drag region |
| `ThemeSwitch` | 104×44, borda, ícone 16 + label com o nome do tema **atual** ("Ink" / "Paper"), conteúdo centralizado |
| `SectionLabel` | `01 / OUTPUT WIDTH` — mono/`Label` uppercase; blocos numerados com hairline `subtle` acima |
| `Receipt` | painel com 3 colunas (`FILES SAVED` big number, `SPACE SAVED`, `ELAPSED TIME`) + nota |
| `DropZone` | borda **tracejada** `line`, `panel`, ícone upload 40×40, H2, subtítulo, 2 CTAs; versão compacta com uma linha + copy "Everything stays on this machine." |

**Estados explícitos na direção (frame D3):** foco de teclado = **outline 2px `ink` + offset 2px** (target ≥ 44–48px), custom background editável (swatch + hex), inspector **travado** durante processamento (leitura preservada), background `Auto → #FFFFFF` como valor **resolvido**, não input.

---

## 4. Arquitetura proposta

### 4.1 Camadas

1. **Tokens** — `src/styles/tokens.css` com CSS variables em `:root` (Paper) e `.dark` (Ink) + `src/styles/fonts.css` (`@font-face`).
2. **Tailwind** — `tailwind.config.js` remapeado para tokens semânticos (`bg-paper`, `text-ink`, `border-control`, `bg-signal`, `rounded-md/lg`, `font-display/body/mono`, `text-display/title/section/body/control/small/label/mono`). Nada de `slate-*`/`darkBg` no código final.
3. **Primitivos** — `src/components/ui/*` implementando a tabela §3.3.
4. **Shell** — titlebar + nav + workbench de duas colunas + footer.
5. **Telas/estados** — compostas por tab, usando os primitivos.

### 4.2 Mapa de arquivos

**Novos**
```
src/styles/tokens.css            tokens Paper/Ink + reset de foco
src/styles/fonts.css             @font-face (woff2 local)
public/fonts/*.woff2             Space Grotesk, Inter, IBM Plex Mono + OFL
src/components/ui/Button.tsx
src/components/ui/Choice.tsx         (Choice + ChoiceGroup + ReadOnlyChoice)
src/components/ui/TextInput.tsx
src/components/ui/Checkbox.tsx
src/components/ui/Slider.tsx
src/components/ui/StatusChip.tsx
src/components/ui/SectionLabel.tsx   (label UPPERCASE + hairline + numeração)
src/components/ui/Divider.tsx
src/components/ui/IconButton.tsx
src/components/ui/ProgressBar.tsx
src/components/ui/ThemeSwitch.tsx
src/components/WindowBar.tsx          titlebar 28px + drag region
src/components/WorkbenchLayout.tsx    workbench 2 colunas, 852/428, padding 40/31
src/components/ActionFooter.tsx       status + CTA (92px)
src/components/BatchReport.tsx        substitui o SummaryModal
src/components/QueueRow.tsx           linha de fila (imagens)
```

**Reescritos (preservando lógica)**
```
src/components/Header.tsx              → WindowBar + nav + tabs 01/02/03 + "100% local" + ThemeSwitch
src/components/MediaTabs.tsx           → tabs numeradas, ativa = signal
src/components/DropZone.tsx            → dropzone tracejado (2 variantes)
src/components/SettingsPanel.tsx       → ImageInspector (01..04 + "Never enlarge" + "Remove metadata")
src/components/ImageQueue.tsx          → QueueList (hairlines + QueueRow)
src/components/QueueClearButton.tsx    → Button secondary "Clear queue (N)"
src/components/SummaryModal.tsx        → removido (vira BatchReport em página)
src/components/VideoSettingsPanel.tsx  → VideoInspector (+ modo travado/read-only)
src/components/VideoQueue.tsx          → VideoPipeline (ativo com barra + fila "Waiting" + bloco "YOUR OUTPUT")
src/components/FaviconSettingsPanel.tsx→ FaviconInspector (01 Fit · 02 Corner radius · 03 Background · 04 Sizes)
src/components/FaviconEditor.tsx       → preview 256px + ACTUAL SIZES + Reset recipe + fila numerada + OUTPUT NAME + SAVE NEW FILES TO
src/components/FaviconQueue.tsx        → integrado ao editor (seleção de logo)
src/App.tsx                            → orquestra shell + 3 workbenches + estados
src/index.css                          → vira só utilitários específicos (scrollbar, checkerboard)
tailwind.config.js                     → tokens semânticos
src/context/ThemeContext.tsx           → mantém API; tema padrão e nomes Paper/Ink
electron/main.ts                       → trafficLightPosition + janela 1280×800 (min. ~1024×720)
```

### 4.3 O que **não** muda
IPC/preload, `imageProcessor`, `videoProcessor`, `icoProcessor`, `thumbnailCache`, `formatters`, tipos, destinos de saída, dedupe de fila, presets em localStorage.

---

## 5. Cobertura por tela/estado

| Tab | Estado | Fonte | Ação |
|---|---|---|---|
| Images | Start (vazio) | `64:65` | 1:1 |
| Images | Ready (fila) | `64:252` | 1:1 |
| Images | Processing | D3 + `64:252` | **compor**: mesma tela, chips por item + footer "Processing N of M…" (disabled) |
| Images | Batch report | `64:425` | 1:1 (substitui o modal) |
| Videos | Processing | `64:571` | 1:1 |
| Videos | Start / Ready / Report | — | **compor** com padrões de Images + copy de vídeo |
| Favicon | Editor (1 logo) | `64:696` | 1:1 |
| Favicon | Start / N logos / Report | `64:696` | **compor**: estado vazio, faixa numerada de thumbs, relatório (sem claim de economia) |
| Ambos | Paper | `64:863` | 1:1 (paridade de tema em todas as telas) |

### Lacunas conhecidas (a confirmar/apontar)
1. **Videos** não tem telas de vazio/ready/report — serão compostas espelhando Images.
2. **Favicon** com múltiplos logos: o design mostra 1 ("01 / 01 · Select a thumbnail to inspect a logo."). Proposta: faixa de thumbs numerados com o mesmo vocabulário de Choice.
3. Ícone de upload e setas (`→`, `↗`, `!`, `⌐`) — extrair os SVGs exatos do Figma quando divergirem do `lucide-react`.
4. Relatório de Favicon: números = tamanhos gerados, sem "% economizado".

---

## 6. Decisões que precisam da sua aprovação

| # | Decisão | Proposta |
|---|---|---|
| D1 | **"Remove metadata" marcado por padrão?** No design as telas mostram o checkbox **marcado**. Hoje o app mantém metadados por padrão. | Seguir o design (remover por padrão) — muda comportamento; alternativa: manter default atual e apenas reproduzir o estilo |
| D2 | **Janela no Windows** — o design desenha dots estilo macOS. | macOS: `hiddenInset` + dots reais + texto mono. Windows: manter frame nativo e ocultar os dots falsos (proposta) ou frameless com controles próprios |
| D3 | **Modal → Batch report** | Remover o `SummaryModal` e usar o relatório em página ("Start a new batch" / "Dismiss report") |
| D4 | **Presets customizados** (nome+largura, localStorage) não existem no design. | Preservar a funcionalidade sob o choice "Custom", estilizada com primitivos novos (você aponta se ficar fora de lugar) |
| D5 | **Inspector travado** (somente leitura durante processamento) | Implementar como no design (D3) para Videos e Imagens |
| D6 | **Copy** do design é a fonte de verdade (inclusive footer/legendas). | Substituir todos os textos atuais pelos do Figma |
| D7 | **Fontes** = +3 famílias woff2 empacotadas (~200–300 KB) | Aceitar o custo para fechar a identidade (subset latino + latin-ext) |
| D8 | Nome da branch | `feat/fieldwork-ui` |

---

## 7. Fases

Cada fase termina com `npx tsc --noEmit`, `npm run dev` verificado a 1280×800 nos dois temas, e commit atômico (Conventional Commits).

**F0 — Fundação** (branch + docs + insumos)
- Branch `feat/fieldwork-ui` a partir de `main`; `docs/branches/feat-fieldwork-ui.md`; linha no `PROJECT_STATUS.md`.
- Baixar/converter fontes + licenças; `tokens.css`, `fonts.css`; remapear `tailwind.config.js`.
- *Aceite:* app sobe com Paper/Ink trocando por CSS var, sem nenhuma string de copy alterada.

**F1 — Primitivos** (ui/*)
- Button, Choice (+read-only), Input, Checkbox, Slider, StatusChip, SectionLabel, Divider, IconButton, ProgressBar, ThemeSwitch.
- `get_design_context` por instância para fechar paddings/bordas/estados (hover, foco, disabled, selected).
- *Aceite:* cada primitivo confere com o design isoladamente (comparação por screenshot).

**F2 — Shell**
- WindowBar + nav/tabs + WorkbenchLayout + ActionFooter; scroll do workbench; foco 2px ink.
- *Aceite:* telas 01 e 06 (Paper) com header/footer 1:1.

**F3 — Images**
- Start, Ready (QueueRow/QueueList), Processing, Batch report + ImageInspector (01..04) + dropzone compacta + Clear queue.
- *Aceite:* telas 01, 02, 06 pixel-fiéis; report = 03.

**F4 — Videos**
- Processing 1:1 + inspector travado + bloco YOUR OUTPUT; estados compostos (vazio/ready/report).
- *Aceite:* tela 04 pixel-fiel; demais estados consistentes por espelhamento.

**F5 — Favicon**
- Editor 1:1 (preview 256, ACTUAL SIZES, Reset recipe, OUTPUT NAME, SAVE NEW FILES TO) + inspector 01..04 + fila numerada; estados compostos.
- *Aceite:* tela 05 pixel-fiel.

**F6 — Estados, a11y e polimento**
- Todos os estados de foco/disabled/locked/erro; paridade Paper/Ink em 100% das telas; `prefers-reduced-motion`; scrollbars; checkerboard do favicon nas cores novas.
- *Aceite:* varredura de estados em ambos os temas sem regressão de legibilidade/contraste.

**F7 — Verificação e entrega**
- Comparação lado a lado (ver §8); `npm run build`/`package:mac`; atualizar docs de branch + `PROJECT_STATUS.md`; apresentar resumo e pedir aprovação de merge para `main`.

Tamanho relativo: F1 **M**, F2 **S/M**, F3 **L**, F4 **M/L**, F5 **L**, F6 **M**, F7 **S**.

---

## 8. Verificação 1:1

1. **Window real:** janela Electron 1280×800 (o design é 1280 de largura, 800 de altura de produção).
2. **Fixtures dev-only** (`import.meta.env.DEV`, ex.: `?fixture=images-ready`): injeta os 3 arquivos do design (photo-01/02/03.jpg com 3000×2000 · 2.4 MB, etc.) para reproduzir exatamente as telas 02/03/04/05. Sem impacto em produção.
3. **Screenshot diff:** capturar cada tela nos dois temas e comparar com os PNGs do Figma (overlay/diff por região): geometria (colunas 852/428, alturas 28/72/92, linhas de 100px), tipografia (família/peso/tracking), cores por token, espaçamentos, raios, bordas.
4. **Testes existentes:** `test/testProcessor.js` e `test/testIcoProcessor.js` devem continuar passando (regressão funcional).
5. Checklist de aceite por tela: header, colunas, seções numeradas, hairlines, dropzone tracejado, fila, inspector, footer, e todos os estados interativos.

---

## 9. Riscos

| Risco | Mitigação |
|---|---|
| Reprodução "quase igual" (1px de padding, tracking de fonte) | Extração fina por componente via `get_design_context` + diff de screenshot por fase |
| Fontes empacotadas aumentarem o app | Subset latino/latin-ext, só os pesos usados (6 arquivos) |
| Telas não desenhadas (Videos/Favicon fora do estado mostrado) ficarem inconsistentes | Compor só com primitivos existentes, listar cada composição no doc da branch, você revisa |
| Regressão funcional ao reescrever painéis | Lógica/IPC intocados; reuso de handlers; testes existentes como rede de segurança |
| Escopo grande em uma branch | Fases independentes, commits atômicos, cada fase verificável isolada |
| Contraste Paper (muted `#586153` sobre `#f5f3ec` etc.) | Checar AA nas combinações reais e reportar caso o design falhe |

---

## 10. Processo (AGENTS.md)

1. Aprovação deste plano.
2. Branch `feat/fieldwork-ui` a partir de `main` + `docs/branches/feat-fieldwork-ui.md` + linha no `PROJECT_STATUS.md` (status *In Progress*).
3. Implementação por fases, commits Conventional.
4. Doc da branch com arquivos, testes, decisões e histórico.
5. Resumo + **pedido explícito de aprovação** antes do merge em `main`; só então merge e atualização de status.
