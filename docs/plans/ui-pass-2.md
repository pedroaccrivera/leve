# Plano — Segunda leva de ajustes de interface (`leve`)

> **Status:** aguardando aprovação. Itens 4 e 5 são **estudo/plano apenas** (sem código), conforme pedido.
> **Base:** `main` @ `a368469` (release `1.5.0`).
> **Branch proposta:** `feat/ui-fit-and-hue` (ver §7).

---

## 1. Escopo

| # | Item | Tipo | Entrega nesta leva |
|---|---|---|---|
| 1 | Abrir com todo o conteúdo visível, sem rolar | layout | implementar |
| 2 | Versão condensada por altura de tela (até 720p) | layout | implementar |
| 3 | Gap entre linhas de caixas igual ao gap entre colunas | bug/design | implementar |
| 4 | Estudo de motion design / microinterações | estudo | **só plano** |
| 5 | Seletor de tom (hue) no header | feature | **só plano** |

---

## 2. Itens 1 e 2 — encaixe vertical

### 2.1 O problema, medido

`scripts/screenshot.cjs` agora reporta a altura real das duas colunas (`LEVE_MEASURE=1`):

| Estado (1280×800) | Workspace | Inspector |
|---|---:|---:|
| Images — start | 721 (coluna 608) → **+113** | 822 (608) → **+214** |
| Videos — empty | 792 → **+184** | 826 → **+218** |
| Favicon — empty | 792 → **+184** | 858 → **+250** |

Ou seja: **o overflow já existe no tamanho de janela padrão (800)** — não é só em 720p. A 720p
(colunas de 528 px) o overflow vai para ~+193/+294 (Images) e até +330 (Favicon, inspector).

O frame do design tem 1060 px de altura de conteúdo num "production preview" de 1280×800: o design
**pressupõe** rolagem. Para cumprir o pedido, precisamos de uma versão condensada.

### 2.2 Estratégia: densidade em três níveis, sem JS

Três tiers por **altura de viewport** (media query), aplicados em `tokens.css` como variáveis +
variantes de altura no Tailwind para as mudanças discretas:

```
tailwind.config.js → extend.screens:
  compact: { raw: '(max-height: 879px)' }   /* 800p cai aqui */
  short:   { raw: '(max-height: 759px)' }   /* 720p cai aqui */
```

| Token | Tall (≥880) | Compact (760–879) | Short (≤759) |
|---|---:|---:|---:|
| `--d-page-y` (workspace topo/base) | 32 / 40 | 20 / 20 | 14 / 14 |
| `--d-block` (gap entre blocos) | 24 | 16 | 12 |
| `--d-section` (gap entre seções do inspector) | 16 | 10 | 8 |
| `--d-field` (label → conteúdo) | 8 | 6 | 6 |
| `--d-control` (altura de controle) | 44 | 44 | 40 |
| `--d-nav` / `--d-footer` | 72 / 92 | 68 / 84 | 64 / 76 |
| `--d-dropzone` | 320 | 272 | 232 |
| `--t-display-size` / leading | 48/52 | 42/46 | 34/38 |
| `--t-title-size` | 28/34 | 26/32 | 24/30 |
| `--d-principle-gap` | 16 | 12 | 8 |

Além das variáveis, três mudanças **discretas** por tier (classes `compact:` / `short:`):

1. **Notas auxiliares do inspector** (`Balanced: less weight…`, `Next to each source…`,
   `Remove EXIF…`, `Choose Custom to edit…`, `Raster sizes above…`) passam a viver num **tooltip de
   informação** ao lado do label da seção, revelado em hover/focus. Isso é o que libera os ~100 px
   que faltam — sem perder a copy.
2. **Compressão das notas de compressão** (2 linhas → 1) no tier compact; tooltip no short.
3. **`Principles` / `PrincipleList`** ganham a versão curta: no tier short a lista de 3 princípios
   do Images vira uma linha única (`All on your machine. New files only. Never overwritten.`)?
   — **não**; ver decisão D2 abaixo: mantemos os 3 itens, só reduzimos o gap.

### 2.3 Contas de fechamento (inspector é o gargalo)

Inspector Images: conteúdo 754 + padding 68 = 822.

| Tier | Cortes | Resultado | Alvo (608 @800) | Alvo (528 @720) |
|---|---:|---:|---:|---:|
| Compact | padding −28, gaps −40, labels −32, heading −6, notas→tooltip −100, gaps internos −12 | **604** | 608 ✅ | — |
| Short | + controles −28, checkboxes −16, gaps −10, heading −6 | **544** | — | 528 ⚠️ (−16) |

Para fechar o short sem sobra negativa: gap entre seções 8 → 6 (−10) e `--d-field` 6 → 4 (−8) →
**526** ✅. (Números exatos serão confirmados pelo medidor após implementar; a meta é
`overflow = 0` para os estados vazios nos três tabs, nos dois temas.)

Workspace fecha com folga: 721 → ~520 (compact) e ~470 (short).

### 2.4 Janela

- `BrowserWindow` passa a abrir em `min(1280, workArea.width) × min(800, workArea.height)`, com
  mínimo 1040×640 — "não precisar aumentar a janela" também é sobre o app caber na tela.
- Bônus já previsto no código (não incluído por padrão): persistir as dimensões da última sessão.

### 2.5 O que continua rolando (por natureza)

Filas longas, relatórios e o editor de favicon com muitas logos **seguem com rolagem** — não há
como caber 20 arquivos em 528 px. O critério de aceite vale para o **chrome + conteúdo primário**
(intro, dropzone/editor, princípios, receita).

---

## 3. Item 3 — gap das linhas de caixas

**Causa:** cada linha é um `ChoiceRow` (`gap-1` = 4 px) e as linhas ficam empilhadas no
`FieldSection` cujo conteúdo usa `gap-2` (8 px). Resultado: 4 px entre colunas, **8 px entre linhas**.

**O design pede 4 px nos dois eixos:** no frame `64:121`, a linha 1 está em `y=0` e a linha 2 em
`y=48` com caixas de 44 px → **gap vertical 4**. É um bug de fidelidade, não uma escolha.

**Correção:** novo primitivo `ChoiceStack` (`flex flex-col gap-1`) envolvendo as linhas empilhadas.
Afetados hoje:

- `ImageInspector` — presets de largura (2 linhas)
- `FaviconInspector` — background (2 linhas) e tamanhos do `.ico` (2 linhas)

---

## 4. Item 4 — Estudo de motion (sem implementação)

### 4.1 Skills encontradas (`npx skills find`)

Critério: tratar **exclusivamente** motion/microinterações, com tração real (installs + estrelas).

| Skill | Installs | Stars | Cobre | Fit p/ `leve` |
|---|---:|---:|---|---|
| `pbakaus/impeccable@animate` | **81.7K** | 109K (repo) | animação estratégica e micro-interações; timing 100–800 ms por propósito; curvas GPU; anti-patterns (bounce/elastic, animar layout, fadiga de animação); `prefers-reduced-motion` | ★★★★☆ — melhor referência de **critério** e anti-patterns |
| `ibelick/ui-skills@fixing-motion-performance` | **28.9K** | 11K | auditoria de performance: layout thrashing, propriedades de compositor, medição, scroll-linked, pintura, camadas, blur/filter, view transitions; review por arquivo | ★★★★★ — guarda-corpo para CSS transitions puras |
| `lottiefiles/motion-design-skill@motion-design` | **25K** | 3K | UI animations (botões, cards, modais, transições), micro-interações e feedback, loading/success/error, identidade de marca, coreografia | ★★★★☆ — catálogo amplo, bom para estados de arquivo |
| `wshobson/agents@interaction-design` | 17.2K | 42.5K (repo) | microinterações, timing 100–500 ms, easing, loading/skeleton/progress, toggles, ripple, swipe | ★★★★☆ — patterns prontos para estado/progresso |
| `kylezantos/design-motion-principles` | 14.1K | 1.6K | modos **Create** e **Audit**; framework de frequência; web/app (CSS, React, Motion, iOS/Android) | ★★★★★ — o único com workflow de auditoria embutido |
| `mblode/agent-skills@ui-animation` | 10.9K | 201 | projetar/implementar/revisar motion, springs, gestos, medir motion de um vídeo, vocabulário de efeitos | ★★★☆☆ — muito bom p/ implementar, mas assume Motion/Framer |
| `wondelai/skills@microinteractions` | 7.3K | 2.7K | framework de Dan Saffer (Trigger, Rules, Feedback, Loops & Modes) | ★★★★☆ — modelo mental, não CSS |
| `affaan-m/ecc@motion-patterns` | 6.0K | 302.1K (repo) | padrões copy-paste sobre tokens de spring | ★★☆☆☆ — assume springs/Motion |
| `vercel-labs/agent-skills@vercel-react-view-transitions` | 189.7K | 34K | View Transition API no React | ★★☆☆☆ — capacidade, não guia de design |

**Observações:** as duas maiores por installs são de repositórios grandes e tratam de **vídeo**
(`heygen/hyperframes`, 1M) ou de **gosto visual geral** (`uizze`, `emil-design-eng`) — fora do
recorte pedido. As de microinteração mais "puras" e com tração são as quatro primeiras.

**Recomendação:** instalar **3** para a fase de auditoria, evitando sobreposição de conselhos:
`pbakaus/impeccable@animate` (critério/anti-patterns) + `ibelick/ui-skills@fixing-motion-performance`
(performance) + `kylezantos/design-motion-principles` (workflow Create/Audit).

### 4.2 Auditoria do que temos hoje (microinterações ≈ 0)

| Onde | Hoje | O que falta |
|---|---|---|
| Botões (primary/secondary) | só troca de cor no hover | press (scale 0.99), foco visível animado, disabled sem transição |
| Tabs | troca instantânea | indicador/fundo do tab ativo, transição de 150 ms |
| Choice / ReadOnlyChoice | `transition-colors` | seleção sem feedback de "press"; underline com transição |
| Checkbox | troca de estado | desenho do check (scale/opacity ~120 ms) |
| Slider | thumb nativo | feedback de hover/drag no knob |
| Linhas da fila (`QueueRow`) | estáticas | entrada/saída ao adicionar/remover, hover na linha, transição `Pending → Saved` |
| Dropzone | só `border` | estado de drag (borda + fundo + ícone), retorno animado |
| Progress card | barra com transição | troca de estágio (signal), número do percentual |
| Relatório | aparece de uma vez | entrada dos rows (stagger ≤ 40 ms) |
| Header/theme switch | nada | hover do sun (rotação), que virá junto com o item 5 |
| Troca de tab/estado | remonta seco | fade curto do conteúdo do workbench |
| `prefers-reduced-motion` | só nas animações do favicon | precisa cobrir tudo |

### 4.3 Princípios propostos (para a futura implementação)

1. **Motion é estado, não decoração.** Só anima o que comunica: entrada de item, mudança de estado,
   resposta a input. Nada de loop decorativo (a direção é "quiet canvas").
2. **Durações:** 120 ms (feedback de controle), 180 ms (mudança de estado), 240 ms (entrada de
   conteúdo), 320 ms teto. Progresso é o único linear.
3. **Easing:** `cubic-bezier(0.22, 1, 0.36, 1)` (já no config como `ease-fieldwork`) para entradas;
   `ease-out` para saídas; sem bounce/elastic (contra "preciso por natureza").
4. **Só `transform` e `opacity`** (guard rail da skill de performance). Nunca animar `height`,
   `top`, `box-shadow` em lista longa.
5. **Distância curta:** slide ≤ 8 px; scale entre 0.98 e 1.
6. **Um sinal:** o amarelo continua sendo a única cor de ação; motion não introduz nova cor.
7. **Acessibilidade:** `prefers-reduced-motion: reduce` desliga tudo (transições viram `none`).

**Entrega desta fase:** apenas este estudo + a decisão de quais skills instalar.

---

## 5. Item 5 — Seletor de tom (plano)

### 5.1 Mockup (frame `79:1616`, "Theme selector")

- **Hover no theme switch** → surge um botão **42×42** com ícone de paleta à esquerda, com 8 px de
  respiro (paleta em `x=268`, theme em `x=318`, ambos 42×42).
- **Clique na paleta** → o botão expande para **262×42** "inline spectrum" (o tema continua à
  direita, ancorado na borda): superfície lime, cantos 8, **barra de espectro de 14 px** com
  **marcador de precisão** e o **valor em mono** na mesma linha.
- **Hover no número** → vira ícone de **reset** (`rotate-ccw`); clique volta ao tom original.
- O mockup mostra `22°`; o marcador aparece em ~6 % da barra. Ver **D3** — proponho que o número
  seja o **hue absoluto do sinal** e o padrão seja o hue do `#E6F45C` (≈ 66°), com o `22°` do mockup
  tratado como valor de exemplo.

### 5.2 Comportamento

| Evento | Resultado |
|---|---|
| hover no theme switch (ou no grupo) | paleta aparece (fade + slide 8 px, 120 ms); permanece enquanto o grupo estiver em hover/focus |
| clique na paleta | expande para 262×42; foco vai para o range; `Esc`/clique fora fecha |
| arrastar / clicar na barra / setas do teclado | atualiza o hue ao vivo; marcador e número acompanham |
| hover no número | número → ícone de reset (`rotate-ccw`, crossfade 120 ms) |
| clique no reset | volta ao hue padrão (66°) |
| qualquer mudança | salva automaticamente (`localStorage`) e reaplica no boot |

### 5.3 Como "todas as cores mudam"

Todas as cores já são **CSS variables** semânticas (`--c-paper`, `--c-signal`, …). A abordagem
proposta:

1. No boot, converter os 13 tokens base de HSL/hex para HSL (uma vez) e guardar os trios.
2. Em cada mudança, reescrever **todos** os tokens com `hsl(baseH + Δ, baseS, baseL)`, onde
   `Δ = hue - 66`. Com `Δ = 0` o tema é **byte-idêntico** ao atual.
3. **Não** usar `filter: hue-rotate` global: ele tingiria também as prévias de logo e as miniaturas.

Consequências a validar: neutros (`paper`, `ink`) têm saturação baixa, então a rotação muda pouco —
os que mudam de fato são `signal`, `success`, `warning`, `danger` e as bordas esverdeadas
(`control`, `subtle`, `line`). Isso é o comportamento pedido ("todas mudam junto"), mas vale ver num
teste visual se a direção continua legível em hues extremos (ex.: 300°).

### 5.4 Riscos

- **Contraste:** rotacionar `signal` para hues escuros pode derrubar o contraste de
  `on-signal` (#1B241D) sobre a cor. Mitigação: manter L/S e só rotacionar; validar 0/66/120/240/300°.
- **Persistência:** chave nova (`leve_hue`); conviver com `leve_app_theme` (Paper/Ink) — o hue é
  ortogonal ao tema, precisa funcionar nos dois.
- **Superfície lime do pill:** o mockup usa uma superfície lime que não existe nos tokens atuais
  (`panel`/`surface`). Preciso de um token novo (`signal-soft` = signal com alpha sobre surface) —
  confirmar.
- **Acessibilidade:** o range precisa ser um `<input type="range">` real (teclado), com o gradiente
  desenhado atrás; o marcador é decorativo.

---

## 6. Fases e testes

| Fase | Conteúdo | Teste |
|---|---|---|
| F1 | Item 3 (`ChoiceStack`) | diff visual: gaps 4/4 nas 3 ocorrências; `tsc` |
| F2 | Densidade (tokens + variantes + tooltips de nota) + janela adaptativa | `LEVE_MEASURE=1` em 900/800/760/720 para os 3 tabs e 2 temas → **overflow 0** nos estados vazios |
| F3 | Seletor de tom | hue 0/66/180/300 nos dois temas; reset; persistência; contraste do `on-signal` |
| F4 | Microinterações (após aprovação do estudo) | checklist por componente + `prefers-reduced-motion` |

Cada fase: `npx tsc --noEmit`, `vite build`, as 3 suítes de teste, capturas 1280×800 e 1280×720.

---

## 7. Decisões para aprovar

| # | Decisão | Proposta |
|---|---|---|
| D1 | Condensar o inspector escondendo as notas em **tooltip** de informação (hover/focus) | Sim — é o que libera ~100 px sem perder a copy |
| D2 | Nos 720p, aceitar **controles de 40 px** (o design pede 44) | Sim, só no tier short; 44 px em 800+ |
| D3 | O número do hue é **absoluto (0–360)** e o padrão é 66° (`#E6F45C`), não 22° | Sim; o mockup fica como exemplo |
| D4 | Filas longas/relatórios continuam rolando | Sim (impossível caber N itens) |
| D5 | Instalar as 3 skills de motion para a fase de auditoria | `impeccable@animate`, `ui-skills@fixing-motion-performance`, `design-motion-principles` |
| D6 | Branch única `feat/ui-fit-and-hue` (F1+F2 agora; F3/F4 depois de aprovar) | Sim |