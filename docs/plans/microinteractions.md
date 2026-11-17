# Plano — 1.7.0 / F4: Microinterações

> **Status:** aguardando aprovação. Nada implementado ainda.
>
> Baseia-se no estudo de motion aprovado em [ui-pass-2.md](ui-pass-2.md) §4 (auditoria, princípios e
> skills). Este plano transforma o estudo em escopo, fases e critérios de aceite para a release
> **minor `1.7.0`**.

## 1. Objetivo

Dar feedback de motion a **tudo que já existe**, sem adicionar funcionalidade: a direção Fieldwork é
"quiet canvas" — motion é estado, não decoração. Nenhum componente novo, nenhuma tela nova; o mesmo
app com respostas visíveis a press, hover, entrada e mudança de estado.

## 2. Tokens de motion (fundação)

Em `tokens.css`, ao lado dos tokens de espaço e cor:

| Token | Valor | Uso |
| :-- | :-- | :-- |
| `--t-ctl` | `120ms` | feedback de controle (press, hover de controle, check do checkbox) |
| `--t-state` | `180ms` | mudança de estado (tab ativa, chip Pending → Saved, seleção de choice) |
| `--t-enter` | `240ms` | entrada de conteúdo (linhas de fila, view-enter, dropzone) |
| `--ease-fieldwork` | já existe (`cubic-bezier(0.22, 1, 0.36, 1)`) | entradas |
| `--ease-exit` | `ease-out` | saídas |

Expostos ao Tailwind como `transitionDuration`/`transitionTimingFunction` nomeados (`ctl`, `state`,
`enter`, `exit`) para não espalhar números literais. O teto de 320 ms do estudo fica como regra de
review, não token (nada deve chegar lá; progresso é o único linear).

## 3. Checklist por componente (fonte: auditoria §4.2 do estudo)

| # | Onde | Hoje | Fica assim |
| :-- | :-- | :-- | :-- |
| C1 | `Button` / `IconButton` / CTA do footer | só troca de cor no hover | press: `scale(0.99)` em `--t-ctl`; disabled entra sem salto; foco visível já coberto por `has-[:focus-visible]` onde falta |
| C2 | `MediaTabs` | troca instantânea | fundo/indicador do tab ativo transiciona em `--t-state` |
| C3 | `Choice` / ReadOnlyChoice | `transition-colors` só | press scale + underline com transição em `--t-ctl` |
| C4 | `Checkbox` | troca seca | check desenha (scale 0.6 → 1 + opacity) em `--t-ctl` |
| C5 | `Slider` (favicon editor) | thumb nativo | feedback de hover/drag no knob via `::thumb` (scale) em `--t-ctl` |
| C6 | `QueueRow` | estática | entrada: fade + slide 4 px (`--t-enter`); saída: fade rápido (`ease-out`); hover da linha (bg `--t-ctl`); chip `Pending → Saved` em `--t-state` |
| C7 | `DropZone` | só borda | estado drag: borda + fundo + ícone (slide/fade `--t-enter`); retorno animado ao soltar |
| C8 | `ProcessingCard` / `ProgressBar` | barra com transição | troca de estágio (signal) e percentual em `--t-state`; barra continua linear |
| C9 | `BatchReport` | rows de uma vez | entrada com stagger ≤ 40 ms por linha (`--t-enter`), só transform/opacity |
| C10 | `ThemeSwitch` | nada | hover gira o sol levemente (`rotate` ~30°, `--t-state`) — o desenho do print |
| C11 | Troca de tab / estado do workbench | remonta seco | view-enter: fade curto (opacity 0→1, `--t-enter`), generalizando o padrão `.favicon-studio-reveal` para `.view-enter` |
| C12 | `prefers-reduced-motion` | só no favicon | regra global: desliga todas as transições/animações novas e as existentes |

Fora do escopo (decisões anteriores): `HueControl` já tem sua coreografia aprovada (width 200 ms,
margem 8 px) — **não** migra para os novos tokens (D7). Nenhuma animação em loop; nenhum novo som/cor.

## 4. Guard rails (enforcement)

1. **Só `transform` e `opacity`** em lista longa e views (as larguras do HueControl ficam, é caso
   aprovado isolado no header).
2. Slide ≤ 8 px; scale entre 0.98 e 1 (press usa 0.99).
3. Uma cor de ação (o sinal); motion não introduz cor nova.
4. Sem bounce/elastic; progresso é o único linear.
5. Auditoria de performance no fim (skill `fixing-motion-performance`): nada de layout thrashing,
   blur em lista, scroll-linked.

## 5. Workflow com as skills (já instaladas)

1. **Create** — `design-motion-principles` guia a implementação por componente (frequência, timing,
   checklist).
2. **Implementar** fase por fase (§6), com `tsc` + build + suítes em cada uma.
3. **Audit** — no fim, `design-motion-principles` (modo audit) + `fixing-motion-performance`
   revisam os diffs; `impeccable` (animate) é a referência de critério/anti-patterns.

## 6. Fases (cada uma commitada e testável)

| Fase | Conteúdo | Teste |
| :-- | :-- | :-- |
| M1 | Tokens de motion + regra global de `prefers-reduced-motion` | `tsc`; reduced-motion emulado no harness desliga tudo |
| M2 | Controles (C1, C3, C4, C5, C10) | capturas hover/press dos controles nos 2 temas |
| M3 | Tabs + view-enter (C2, C11) | captura por tab; troca não remonta seco |
| M4 | Fila + dropzone + progresso (C6, C7, C8) | fixture com N arquivos: entrada/saída de linha; drag visual da dropzone |
| M5 | Relatório (C9) | entrada com stagger; zero overflow |
| M6 | Auditoria (performance + motion) + ajustes | relatório de auditoria; `LEVE_MEASURE` inalterado |

## 7. Verificação

- `npx tsc --noEmit`, `npx vite build`, `testProcessor`, `testIcoProcessor`, `testVideoProcessor` —
  por fase.
- **Regressão de layout:** `LEVE_MEASURE=1` (`edges` + `dragArea` + overflow) igual à 1.6.7 em
  800/720/1000, nos 3 tabs e 2 temas — motion não pode mexer em geometria.
- **Reduced-motion:** flag nova no harness (`LEVE_REDUCED_MOTION=1`) emulando
  `prefers-reduced-motion` e capturando os mesmos estados (transições viram `none`).
- **App real:** clicar tab, arrastar arquivo, processar lote e conferir press/hover à mão.

## 8. Decisões para aprovar

| # | Decisão | Proposta |
| :-- | :-- | :-- |
| D1 | Escopo = checklist §3, nada além | motion não abre funcionalidade |
| D2 | Tokens 120/180/240 ms + `ease-fieldwork`/`ease-out`, em `tokens.css` | uma fonte de verdade, sem números soltos |
| D3 | Press = `scale(0.99)` nos botões/choices (não em texto) | feedback sem "apelido" |
| D4 | View-enter = fade de 240 ms no mount do conteúdo (sem slide) | troca de tab/estado deixa de ser seca |
| D5 | Stagger do relatório ≤ 40 ms, limitado às ~10 primeiras linhas visíveis | listas grandes entram sem cascata infinita |
| D6 | `prefers-reduced-motion` global (CSS) cobre tudo | acessibilidade antes de mais motion |
| D7 | `HueControl` não migra para os novos tokens | coreografia própria já aprovada |
| D8 | Branch única `feat/microinteractions` (M1–M5) + `chore/release-1.6.7 → 1.7.0` depois | fases commitadas dentro da branch |
| D9 | Release **minor** `1.7.0` com changelog de microinterações | é a F4 prometida |

## 9. Entregáveis

- `src/styles/tokens.css` + `tailwind.config` (tokens/durations/easings).
- Componentes do checklist §3 (`src/components/**`).
- `src/index.css` (regra global de reduced-motion + `.view-enter`).
- `scripts/screenshot.cjs` (flag `LEVE_REDUCED_MOTION`).
- `docs/branches/feat-microinteractions.md` + linha em `PROJECT_STATUS.md`.
