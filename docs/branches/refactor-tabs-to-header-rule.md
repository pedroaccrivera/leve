# `refactor/tabs-to-header-rule` — Abas até a linha inferior do cabeçalho

- **Type:** Refactor — layout
- **Status:** In Progress — implementado e verificado, aguardando merge
- **Base:** `main` @ `2c77d1d` (release `1.6.4`)

## 1. Pedido

As abas `01 Images | 02 Videos | 03 Favicon` deixavam ~12 px de espaço vazio entre a base delas e a
linha inferior do cabeçalho (print anexado). Estender as abas para que alcancem essa linha.

## 2. Mudança

- **`MediaTabs`**: o tablist passou a ocupar a **altura toda do cabeçalho** (`h-full`) com `pt-3`, e
  cada aba cresce até a base (`h-full`) em vez dos 48 px fixos. O rótulo mantém a **faixa de 48 px no
  topo** (o `h-12` interno), ou seja, continua centrado com o wordmark e o seletor de tema — só o
  preenchimento da aba se estende para baixo.
- **`Header`**: o eixo do flex passou de `items-center` para `items-stretch` (os blocos laterais já
  centralizam o próprio conteúdo internamente) e o bloco das abas recebeu `-mb-px`, para que a borda
  inferior da aba fique **sobre** a hairline do cabeçalho em vez de logo acima dela.
- Resultado: a aba ativa tem 60 px de preenchimento `signal` (12 px a mais), as inativas terminam na
  mesma linha, e não há mais espaço vazio abaixo das abas. A área de clique cresceu junto.

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
- Conferência visual do cabeçalho: o bloco amarelo da aba ativa termina exatamente na linha inferior;
  os sublinhados das abas inativas se fundem com a hairline do cabeçalho; o rótulo permanece alinhado
  ao wordmark e ao seletor de tema.

## 5. Decisões

| # | Decisão | Justificativa |
|---|---|---|
| 1 | Manter a faixa do rótulo no topo da aba | o alinhamento com o wordmark/seletor de tema é do design; o pedido era só remover o vazio abaixo |
| 2 | `-mb-px` no bloco das abas | faz a borda da aba coincidir com a hairline do cabeçalho, sem uma linha dupla de 1 px |
| 3 | `items-stretch` no header | permite `h-full` nas abas sem posicionamento absoluto |

## 6. Commit history

```
refactor(ui): extend the media tabs down to the header rule
docs: record the tabs branch
```
