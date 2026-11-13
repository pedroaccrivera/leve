# `feat/hue-selector` — Seletor de tom (hue)

- **Type:** Feature — aparência / identidade
- **Status:** In Progress — implementado, aguardando aprovação de merge
- **Base:** `main` @ `ba7ad9d` (release `1.5.1`)
- **Plano aprovado:** [docs/plans/ui-pass-2.md](../plans/ui-pass-2.md) §5

## 1. Objetivo

Dar ao usuário um controle de **tom** do app, inline no header, que rotaciona **todas** as cores da
interface a partir de um único valor de hue — aprovado como F3 da leva 2 (o F4, microinterações,
segue como estudo).

Comportamento, conforme o mockup `79:1616` e as decisões do usuário:

| Passo | O que acontece |
|---|---|
| hover no seletor de tema | um botão com ícone de paleta aparece à esquerda (44 × 44, 8 px de respiro) |
| clique na paleta | o botão se expande para 262 px com o espectro completo de HUE, marcador de precisão e o valor em mono |
| arrastar / clicar / setas | o hue muda ao vivo; **todas** as cores do app acompanham |
| hover no número | o número (`66°`) vira ícone de reset (`rotate-ccw`) |
| clique no reset | volta ao tom original (66°, o hue do `#E6F45C`) |
| qualquer mudança | salva automaticamente (`localStorage: leve_hue`) |

## 2. Como as cores mudam

Todas as cores do shell já são variáveis semânticas (`--c-paper`, `--c-signal`, …). A rotação é
feita **nesses tokens**, não com `filter: hue-rotate` global (que tingiria também as prévias de logo
e as miniaturas dos arquivos):

1. `src/utils/hue.ts` guarda as duas paletas (Paper/Ink) espelhando `tokens.css` e converte cada
   token para HSL uma vez por mudança.
2. `applyHue(hue, dark)` reescreve **os 13 tokens** como `hsl(baseH + Δ, baseS, baseL)`, com
   `Δ = hue - 66`.
3. Em `Δ = 0` as propriedades inline são **removidas**, então o tom padrão é byte-idêntico ao design
   (nenhum drift de arredondamento).
4. Preservar S e L mantém o contraste: `on-signal` (#1B241D) segue legível sobre o sinal rotacionado
   em toda a roda — validado visualmente em 0°, 120°, 200°, 280°.

`src/context/HueContext.tsx` aplica no boot, a cada mudança e quando o tema Paper/Ink troca (cada
tema tem sua paleta base). `src/components/ui/HueControl.tsx` é o controle em si; o grupo de hover
fica no header, junto do `ThemeSwitch`, para que o hover no seletor de tema revele a paleta.

Superfícies novas: `--c-signal-soft` e `--c-signal-edge`, derivadas com `color-mix` a partir do
próprio `--c-signal` — o pill do controle acompanha o tom escolhido automaticamente.

## 2.1 Acessibilidade: o texto adapta-se ao fundo

Rotacionar o matiz mantendo S e L **não** preserva contraste: a luminância percebida de um `hsl(H 87%
66%)` varia muito com H — o lima (#E6F45C) é claríssimo, um azul no mesmo L é médio. Medido com o
probe do harness (contraste WCAG de elementos reais, `LEVE_MEASURE=1`), a rotação cega deixava o CTA
e o tab ativo em **4.21:1** em 240°, abaixo do mínimo AA (4.5) para os nossos rótulos de 13–14 px.

Duas correções:

1. **`on-signal` é derivado, não rotacionado** (`src/utils/hue.ts`): depois de rotacionar o sinal, a
   luminância relativa decide entre o neutro escuro e o claro (o que der mais contraste), e o `ink`
   é **clareado passo a passo** até o par atingir ≥ 4.6:1 — preservando o caráter do design (acento
   claro com texto escuro). Se ainda assim não fechar, cai para o neutro claro.
2. **`--c-signal-text`** (`color-mix(in oklab, var(--c-signal) 62%, var(--c-ink))`) para quando o
   sinal é **texto** — no trilho de estágios do cartão de processamento. Ele escurece no Paper e
   clareia no Ink, então o estágio atual continua legível nos dois temas (antes era lima sobre
   branco no Paper, ~1.3:1).

Contraste medido em toda a roda, nos dois temas:

| Par | Antes (rotação cega) | Depois |
|---|---:|---:|
| CTA / tab ativo (`on-signal` sobre `signal`) | 4.21 – 14.77 | **4.72 – 16.59** (mínimo 4.72 em Paper 240°) |
| Texto principal (`ink` sobre `paper`) | 13.5 – 16 | 13.5 – 16 |
| Sinal como texto sobre o cartão | ~1.3 (Paper) | ≥ 4.6 |
| Fila/estados (`success`, `danger`, `warning`) | 4.7 – 8 | 4.7 – 8 |

## 3. Arquivos

**Criados**

```
src/utils/hue.ts                    paletas base, hexToHsl, applyHue, persistência
src/context/HueContext.tsx          provider + hook (aplica no boot, na mudança e na troca de tema)
src/components/ui/HueControl.tsx    paleta recolhida + espectro expandido + reset
docs/branches/feat-hue-selector.md  este documento
```

**Modificados**

```
src/components/Header.tsx     grupo de hover com HueControl + ThemeSwitch
src/main.tsx                  HueProvider dentro do ThemeProvider
src/styles/tokens.css         --c-signal-soft / --c-signal-edge (color-mix sobre o sinal)
tailwind.config.js            signal-soft / signal-edge
scripts/screenshot.cjs        LEVE_HUE, LEVE_HUE_OPEN, LEVE_HOVER_THEME, LEVE_HOVER_RESET + limpeza de storage por captura
```

## 4. Decisões

| # | Decisão | Justificativa |
|---|---|---|
| 1 | Rotacionar os **tokens**, não um filtro global | prévias de logo e miniaturas não podem ser tingidas; o controle fica exato e reversível |
| 2 | Valor **absoluto 0–360**, padrão 66° | aprovado (D3); o `22°` do mockup era exemplo |
| 3 | Reset **no hover do número**, como o mockup | aprovado; o número vira `rotate-ccw` |
| 4 | Pill com **44 px de altura** (mockup: 42) | alinhado ao `ThemeSwitch` e ao alvo de 44 px do design, por pedido do usuário |
| 5 | Marca do tema **não** muda com o tom | o `ThemeSwitch` continua sendo só o sol, como aprovado no 1.5.0 |
| 6 | Acessibilidade | o espectro é um `<input type="range">` real (teclado/setas) com o gradiente desenhado atrás; o marcador é decorativo; o reset é um `<button>` com `aria-label` |
| 7 | `prefers-reduced-motion` | a expansão usa transição de `width` (200 ms, `ease-fieldwork`); já é coberta pela regra global de reduced-motion a aplicar no F4 |

## 5. Testes

- `npx tsc --noEmit` → limpo.
- `npx vite build` → verde.
- `node test/testProcessor.js` / `test/testIcoProcessor.js` / `test/testVideoProcessor.js` → passam
  (nada do motor foi tocado; o tom é puramente de apresentação).
- Capturas (`scripts/screenshot.cjs`) revisadas: hover revelando a paleta; expandido no tom padrão
  (app idêntico ao design); hover no número mostrando o reset; hue 0/120/140/200/280 nos dois temas.
- Medições por script: `--c-signal` = `hsl(199.5 87.4% 65.9%)` em 200°, `--c-subtle`/`--c-paper`
  acompanham, e o `background` computado dos controles segue o token.

## 6. Pendente

- **F4 — microinterações** (estudo aprovado, skills instaladas). Quando entrar, o seletor de tom já
  nasce com a transição de expansão; o resto da interface segue com microinterações ≈ 0.
- Persistência do tom por tema? Hoje é um valor único para os dois temas (Paper e Ink compartilham o
  hue), como no mockup.

## 7. Commit history

```
feat(ui): hue selector that rotates the whole palette
feat(a11y): adapt text colour to its surface across the hue wheel
chore(dev): drive the tone control and measure contrast from the harness
docs: record the hue selector branch
```
