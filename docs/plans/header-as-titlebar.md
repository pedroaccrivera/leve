# Plano — `1.6.6` · O header vira a titlebar

> **Status:** aprovado e implementado na branch `refactor/header-as-titlebar` — ver
> [docs/branches/refactor-header-as-titlebar.md](../branches/refactor-header-as-titlebar.md).
> **Base:** `main` @ `611ac80` (release `1.6.5`)
> **Branch proposta:** `refactor/header-as-titlebar`

## 1. Objetivo

Remover a barra de janela de 28 px e fazer o **próprio header** ser a titlebar: as traffic lights
passam a viver sobre o header, alinhadas com a marca, que fica logo ao lado. A marca ganha o ponto
final no acento (`leve.`), como no ícone do app. `LOCAL MEDIA TOOLKIT` sai.

## 2. O que muda

### 2.1 Remover a barra de 28 px

- `src/components/WindowBar.tsx` sai do projeto; `App.tsx` deixa de renderizá-lo (e o `isMac` do App
  deixa de ser necessário).
- Ganho: o chrome passa de 28 + 72 + 92 = 192 px para **72 + 92 = 164 px**, ou seja
  **28 px a mais de conteúdo**. Os tiers de densidade (F2 do `ui-pass-2`) ficam como estão — o espaço
  extra é folga, então o encaixe só melhora. Nada nos tokens precisa mudar.

### 2.2 O header assume o papel

- `Header` já é `titlebar-drag-region`, com `no-drag` nas partes interativas (abas, seletor de tema,
  paleta) ✓ nada novo aqui além de garantir que a barra inteira seja arrastável, inclusive à direita
  e à esquerda das abas.
- Altura permanece **72 px** (`--d-nav`): as lights têm 12 px, então centradas sobram 30 px em cima e
  embaixo — folgado para o clique.
- Duplo-clique na barra (zoom/minimizar conforme a preferência do sistema) vem de graça com a região
  de arrasto.

### 2.3 Traffic lights alinhadas com a marca

- `electron/main.ts`: `trafficLightPosition` de `{ x: 20, y: 8 }` para **`{ x: 20, y: 30 }`** →
  lights em `y = 30…42`, centro 36 = **centro exato do header** e mesma linha óptica da marca
  (o `t-title` de 28/34 centrado em 72 tem o centro em 36).
- A marca começa **logo depois das lights**: elas ocupam `x = 20…72`, então a marca entra em
  **x = 84** (12 px de respiro) — via um novo inset por plataforma (`--d-brand-inset`): 84 no macOS,
  **32** no Windows/Linux (que usam frame nativo e não têm lights sobre o header).
- No Windows o header continua igual ao de hoje, só sem a barra de 28 px acima.

### 2.4 Marca `leve.`

- `<h1>` passa a ser `leve` + um ponto em `text-signal` → **`leve.`**, com o ponto seguindo o tom
  escolhido no seletor (é um token) e casando com o ícone do app (`l.` — haste + ponto amarelo).
- Tipografia inalterada (`t-title`: Space Grotesk Medium 28/34, tracking −0.6).
- Acessibilidade: `aria-label="leve"` no `<h1>` para o leitor de tela não anunciar "ponto".

### 2.5 `LOCAL MEDIA TOOLKIT` sai

- O texto era o único conteúdo da barra removida; não há substituto.

## 3. Arquivos previstos

```
src/components/WindowBar.tsx     REMOVIDO
src/App.tsx                      sem WindowBar/isMac no shell
src/components/Header.tsx        inset da marca por plataforma + marca "leve."
src/styles/tokens.css            --d-brand-inset (macOS 84 / outros 32) — ou classe no Header
electron/main.ts                 trafficLightPosition y: 8 → 30
scripts/screenshot.cjs           mock das lights na nova posição (y = 30, dentro do header)
docs/branches/refactor-header-as-titlebar.md
```

## 4. Testes previstos

- `npx tsc --noEmit`, `npx vite build`, as 3 suítes (`testProcessor`, `testIcoProcessor`,
  `testVideoProcessor`).
- **Encaixe**: matriz `LEVE_MEASURE=1` (3 abas × 800/720, estados vazios) — esperado 0/0 com folga
  extra de 28 px; conferir também fila e relatório.
- **Capturas**: macOS (com o mock das lights na nova posição) e "sem lights" (simulando Windows);
  Ink e Paper; com tons diferentes para ver o ponto da marca acompanhar.
- **App real**: rodar `electron .` e conferir no dock/janela que (a) o header arrasta a janela,
  (b) as lights estão alinhadas com a marca, (c) as abas/seletor continuam clicáveis (não-arrasto).

## 5. Decisões para aprovar

| # | Decisão | Proposta |
|---|---|---|
| D1 | Altura do header continua 72 px | Sim — as lights ficam centradas com folga e o rótulo das abas mantém a linha |
| D2 | Lights em `x = 20, y = 30` (centro do header) | Sim, conforme o print (alinhadas à marca) |
| D3 | Marca em `x = 84` no macOS / `32` no Windows | Sim |
| D4 | Ponto da marca em `text-signal` (acompanha o tom) | Sim — casa com o ícone e com o seletor |
| D5 | `aria-label="leve"` no `<h1>` | Sim |
| D6 | Windows segue com frame nativo, sem lights desenhadas | Sim (decisão anterior mantida) |

## 6. Bump

**1.6.6** (patch) — é uma iteração de layout/identidade sobre o que já existe, sem mudança de
motor, IPC ou dados salvos.
