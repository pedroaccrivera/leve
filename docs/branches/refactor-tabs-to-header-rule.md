# `refactor/tabs-to-header-rule` — Abas até a linha inferior do cabeçalho

- **Type:** Refactor — layout
- **Status:** Merged into `main` (included in release `1.6.5`)
- **Base:** `main` @ `2c77d1d` (release `1.6.4`)

## 1. Pedido

As abas `01 Images | 02 Videos | 03 Favicon` ocupavam uma faixa de 48 px centrada no cabeçalho de
72 px, deixando ~12 px de espaço vazio **acima e abaixo** (print anexado). Estender as abas para
ocupar a altura toda do cabeçalho, com o rótulo centralizado verticalmente.

## 2. Mudança

- **`MediaTabs`**: o tablist e cada aba passaram a ocupar a **altura toda do cabeçalho** (`h-full`),
  com o rótulo **centralizado no bloco inteiro** (`items-center justify-center`) — a mesma linha
  vertical do wordmark e do seletor de tema, que já eram centrados nos 72 px do cabeçalho.
- **`Header`**: o eixo do flex passou de `items-center` para `items-stretch` (os blocos laterais já
  centralizam o próprio conteúdo internamente) e o bloco das abas recebeu `-mb-px`, para que a borda
  inferior da aba fique **sobre** a hairline do cabeçalho em vez de logo acima dela.
- Resultado: a aba ativa preenche o cabeçalho de ponta a ponta em `signal`, as inativas terminam na
  mesma linha, e não há mais espaço vazio acima nem abaixo. A área de clique cresceu junto.

## 3. Arquivos

```
src/components/MediaTabs.tsx    altura total, faixa do rótulo preservada
src/components/Header.tsx       items-stretch + -mb-px no bloco das abas
docs/branches/refactor-tabs-to-header-rule.md
```

## 4. Testes

- `npx tsc --noEmit` limpo; `npx vite build` verde; as 3 suítes de teste passam.
- Medição (`LEVE_MEASURE=1`) em Ink e Paper @800: workspace 0, inspector 0, **sem overflow**
  horizontal em nenhuma coluna, no documento ou no body (as abas são full-height, então não
  introduzem largura).
- Conferência visual do cabeçalho (Ink e Paper): o bloco amarelo da aba ativa vai do topo do
  cabeçalho até a linha inferior; os sublinhados das abas inativas se fundem com a hairline; o rótulo
  fica na mesma linha do wordmark e do seletor de tema.

## 5. Decisões

| # | Decisão | Justificativa |
|---|---|---|
| 1 | Rótulo centralizado na altura toda | o centro do cabeçalho é a linha do wordmark e do seletor de tema, então o alinhamento do design se mantém |
| 2 | `-mb-px` no bloco das abas | faz a borda da aba coincidir com a hairline do cabeçalho, sem uma linha dupla de 1 px |
| 3 | `items-stretch` no header | permite `h-full` nas abas sem posicionamento absoluto |

## 5.1 Merge record

- Aprovado pelo usuário após revisar o app em execução (dev server).
- Merge em `main` com `--no-ff`; release `1.6.5` — ver
  [chore-release-1.6.5.md](chore-release-1.6.5.md).

## 6. Commit history

```
refactor(ui): extend the media tabs down to the header rule
refactor(ui): centre the tab label in the full-height tabs
docs: record the tabs branch
```
