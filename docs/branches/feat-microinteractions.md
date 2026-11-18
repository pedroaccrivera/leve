# `feat/microinteractions` — F4: Microinterações (release 1.7.0)

- **Type:** Feature — motion / microinterações
- **Status:** In Progress — implementado e verificado, aguardando merge
- **Base:** `main` @ `857f80d` (depois da release `1.6.7`)
- **Plano:** [microinteractions.md](../plans/microinteractions.md) — aprovado pelo usuário (D1–D9)

## 1. Pedido

F4 do estudo de motion ([ui-pass-2.md](../plans/ui-pass-2.md) §4), prometido para a `1.7.0`: dar
feedback de motion a **tudo que já existe**, sem funcionalidade nova — a direção Fieldwork é "quiet
canvas". Junto, decisão em aberto da release anterior: **aposentar o tap do Homebrew**.

## 2. Fundação (M1)

- **Tokens de motion** em `tokens.css`: `--t-ctl: 120ms` (feedback de controle), `--t-state: 180ms`
  (mudança de estado), `--t-enter: 240ms` (entrada de conteúdo), `--ease-fieldwork` (curva já usada)
  e `--ease-exit: ease-out`. Expostos ao Tailwind como `duration-ctl/state/enter` + `ease-exit` —
  nenhum número de duração solto nos componentes.
- **`prefers-reduced-motion` global:** a regra que cobria só o favicon virou uma regra única que
  colapsa toda transição/animação para 0,01 ms (e não `none`, para `transitionend` continuar
  disparando). Verificada no harness com `LEVE_REDUCED_MOTION=1` (switch Blink
  `--force-prefers-reduced-motion`): o estado final renderiza **idêntico byte a byte** ao normal.

## 3. Checklist entregue (M2–M5)

| Onde | Motion |
| :-- | :-- |
| `Button` / `IconButton` | press `scale(0.99)` em 120 ms; foco visível por teclado (outline, sem animação) |
| `Choice` | press + foco; `ReadOnlyChoice` crossfada cor/bg em 120 ms |
| `Checkbox` | o check **desenha** (scale 0.5→1 + opacity, 120 ms); o fundo da caixa crossfada |
| `Slider` (favicon) | knob cresce 1.12 no hover e 1.2 no arrasto (120 ms) |
| `ThemeSwitch` | o sol gira 30° no hover (180 ms) — o desenho do print |
| `MediaTabs` | fundo/borda do tab ativo transiciona em 180 ms |
| Workbench | troca de tab remonta a view com key no `<WorkbenchLayout>` e o conteúdo entra com **fade de 240 ms** (`.view-enter`, opacity só — o container é scroll área) |
| `QueueRow` | entrada: fade + slide 4 px (240 ms); hover tinge a linha; **saída fica instantânea** (remoção é ação de alta frequência — decisão de auditoria) |
| `StatusChip` | re-entra com fade simples (180 ms, `ease-exit`) quando o tom muda — chaveado pelo tom na linha |
| `DropZone` | drag agora tinge o painel e levanta o ícone 4 px; o retorno é a própria transição state-driven |
| `ProcessingCard` | trilho de estágios crossfada em 180 ms |
| `ProgressBar` | fill migrado de `transition-[width]` para **`scaleX`** (compositado); continua o único motion linear (300 ms) |
| `BatchReport` | linhas entram em cascata de 40 ms por índice, **limitada à 10ª linha** (D5) |

## 4. Auditoria (M6)

- **Skills:** `design-motion-principles` (Create + checklists de audit/anti-slop) e
  `fixing-motion-performance` como guarda-corpo. Pesos declarados: **Emil primário** (ferramenta de
  produtividade, <300 ms, regra da frequência), **Jakub secundário** (polimento sutil).
- **Anti-slop:** nenhum pulso/loop, nenhum blur-everywhere, scale só em press/knob (não hover-scale
  em tudo), uma cor de ação.
- **Achados corrigidos:** `favicon-studio-reveal` estava em 420 ms / slide 14 px (acima do teto de
  320 ms / slide 8 px do estudo) → `--t-enter` / 8 px; `favicon-preview-fade` usava duração solta →
  tokens; tooltip do `FieldSection` em 150 ms solto → `duration-ctl`.
- **`HueControl` intocado** (D7 — coreografia própria aprovada). Restam transições de `width` só lá.
- **Performance:** nada de layout thrashing; `will-change` não usado; a única transição de
  propriedade de layout que existia (width do progresso) virou transform.

## 5. Verificação

- `npx tsc --noEmit` limpo · `npx vite build` verde · 3 suítes passando — **por fase**.
- **Regressão de layout** (`LEVE_MEASURE=1`, 8 estados: 3 tiers × tabs × temas + reduced-motion):
  `edges` idêntico à baseline 1.6.7 (1248/1252/1240; gaps 12/12 · 10/10 · 14/14 e CTA 19/19 · 17/17
  · 22/22), `dragArea` 44 px com vazio em `drag` em todos. O `favicon-multiple@720` mostra overflow
  *vertical* de 246 px — o editor com várias logos **rola por design** (D4); o overflow *horizontal*
  é 0 em todos os estados.
- **Reduced-motion:** emulação via switch Blink + comparação de bytes: estado final idêntico.
- **Controles:** press/hover conferidos por build e CSS; o app real ficou aberto para conferência
  (press nos botões, hover no sol, arrasto na dropzone, stagger do relatório).

## 6. Homebrew tap aposentado

- O repo [`pedroaccrivera/homebrew-tap`](https://github.com/pedroaccrivera/homebrew-tap) foi
  **arquivado** nesta branch (`archived: true`, somente leitura, sem quebrar links) após a última
  atualização da cask (`1.6.7`, commit `c48e84e`). Releases futuras não atualizam mais cask — o canal
  passa a ser só o GitHub Releases. Decisão do usuário nesta release; o README não menciona brew
  desde a `1.6.3`.

## 7. Arquivos

```
src/styles/tokens.css               tokens de motion (--t-ctl/--t-state/--t-enter/--ease-*)
tailwind.config.js                  duration-ctl/state/enter + ease-exit
src/index.css                       reduced-motion global; .view-enter/.row-enter/.chip-swap; slider knob; reveals
src/App.tsx                         <WorkbenchLayout key={mediaTab}>
src/components/WorkbenchLayout.tsx  view-enter
src/components/MediaTabs.tsx        transição do tab ativo
src/components/ui/Button.tsx        press + foco
src/components/ui/IconButton.tsx    press + foco
src/components/ui/Choice.tsx        press + foco + crossfade
src/components/ui/Checkbox.tsx      check desenha
src/components/ui/ThemeSwitch.tsx   sol gira no hover
src/components/ui/StatusChip.tsx    chip-swap
src/components/ui/ProgressBar.tsx   scaleX
src/components/ui/FieldSection.tsx  tooltip no token
src/components/QueueRow.tsx         entrada + hover + chip por tom
src/components/DropZone.tsx         estado de drag visível
src/components/ProcessingCard.tsx   trilho de estágios
src/components/BatchReport.tsx      cascata limitada
scripts/screenshot.cjs              LEVE_REDUCED_MOTION + bloco motion no MEASURE
docs/plans/microinteractions.md     plano (aprovado)
docs/branches/feat-microinteractions.md
PROJECT_STATUS.md
```

## 8. Decisões

| # | Decisão | Justificativa |
|---|---|---|
| 1 | Tokens 120/180/240 + `ease-fieldwork`/`ease-exit` | uma fonte de verdade; Emil (<300 ms) |
| 2 | Press = scale 0.99 em botões/choices | feedback sem "apelido"; teclado não anima (foco é outline instantâneo) |
| 3 | View-enter = fade 240 ms, opacity só | o container é scroll área; transform deslocaria o conteúdo |
| 4 | Saída das linhas instantânea | alta frequência; um fade atrasaria a curadoria (desvia do plano §3, registado) |
| 5 | Cascata do relatório caps na 10ª linha | relatório longo não pode virar vitrine de motion |
| 6 | Progresso linear com `scaleX` | "progresso é o único linear" + propriedade compositada |
| 7 | `HueControl` fora da migração | coreografia aprovada na 1.6.0 (D7 do plano) |
| 8 | Reduced-motion global via 0,01 ms | `none` quebra código que escuta `transitionend` |
| 9 | Tap do Homebrew arquivado | decisão do usuário; canal único = GitHub Releases |

## 9. Commit history

| Commit | Message |
| :-- | :-- |
| `c5e6cea` | `docs: plan the 1.7.0 microinteractions pass` |
| `e0103d4` | `feat(ui): motion tokens and a global reduced-motion switch` |
| `da6cab2` | `feat(ui): controls answer press, hover and keyboard focus` |
| `eb31dd8` | `feat(ui): tabs and workbench views transition instead of popping` |
| `2787392` | `feat(ui): the queue, dropzone and progress card answer state` |
| `b2d4aa1` | `feat(ui): report rows enter with a capped 40 ms cascade` |
| `b7ed66c` | `style(ui): audit pass — reveals and tooltip on the motion tokens` |
