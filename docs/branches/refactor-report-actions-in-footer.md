# `refactor/report-actions-in-footer` — Ações do relatório no footer

- **Type:** Refactor — layout
- **Status:** In Progress — implementado e verificado, aguardando merge
- **Base:** `main` @ `c2ff26d` (release `1.6.3`)

## 1. Pedido

Mover os botões do fim do relatório (**Start a new batch** / **Dismiss report**) para o footer de ação,
junto do **Open output folder** (print anexado: os dois à esquerda do CTA primário).

## 2. Mudança

- **`BatchReport`** deixou de renderizar a linha de ações (e as props `onStartNewBatch` / `onDismiss`);
  o relatório termina nos resultados (e na nota final, quando existe).
- **`App`** passou a renderizar as duas ações secundárias no **footer do estado de relatório**,
  antes do CTA primário — vale para as três abas, já que o footer é único:
  `[Start a new batch] [Dismiss report] [Open output folder ↗]`.
- **`ActionFooter`**: o bloco de status à esquerda era `w-[700px]` fixo; virou `flex-1 min-w-0` para
  ceder espaço aos três botões (o texto é curto — "Batch finished. Originals untouched." — então o
  visual não muda). Os secundários usam largura natural; o CTA primário segue com os 280 px do design.

Ganho colateral: o workspace do relatório ficou ~72 px mais curto (a linha de botões + o gap saíram).

## 3. Arquivos

```
src/components/BatchReport.tsx    linha de ações removida
src/components/ActionFooter.tsx   bloco de status passa a flexível
src/App.tsx                       ações no footer do relatório (3 abas)
docs/branches/refactor-report-actions-in-footer.md
```

## 4. Testes

- `npx tsc --noEmit` limpo; `npx vite build` verde; as 3 suítes de teste passam.
- Capturas e medição (`LEVE_MEASURE=1`): `images-report` @800 → workspace 0 / inspector 0;
  `videos-report` @800 → 0 / 0; `favicon-report` @720 → 22 / 22 (rolagem de lista, conforme D4).
  Sem overflow horizontal nas colunas, no documento ou no body.
- Conferência visual do footer em 1280×800: os três botões cabem com o status à esquerda, sem
  truncar texto nem empurrar o CTA primário.

## 5. Decisões

| # | Decisão | Justificativa |
|---|---|---|
| 1 | Mover, não duplicar | o print indica realocação; manter nos dois lugares poluiria o relatório |
| 2 | Status do footer flexível em vez de 700 px fixos | os três botões não caberiam em 1280 com o bloco fixo |
| 3 | Secundários com largura natural, CTA primário em 280 px | mantém a hierarquia do design (um sinal, um CTA) |

## 6. Commit history

```
refactor(ui): move the batch report actions into the action footer
docs: record the report actions branch
```
