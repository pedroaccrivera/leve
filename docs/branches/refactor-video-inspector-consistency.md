# `refactor/video-inspector-consistency` — Controles da receita de vídeo

- **Type:** Refactor — consistência de interface
- **Status:** Merged into `main` (included in release `1.6.2`)
- **Base:** `main` @ `43e2a51` (release `1.6.1`)

## 1. Problema

A receita de **vídeo** usava um vocabulário de controles diferente das receitas de **imagem** e
**favicon**, o que quebrava a consistência entre abas:

| | Imagem / Favicon | Vídeo (antes) |
|---|---|---|
| Escolhas | caixas (`Choice`: `surface` + borda `control`, selecionada = `ink`) | **tabs sublinhadas** (`ReadOnlyChoice`) |
| Valor de largura | campo em caixa (`TextInput`, decorado, editável ao focar) | **texto solto** (`InlineValue`) |
| "Não ampliar" | `Checkbox` com caixa | **frase com um ✓ solto** |
| Destino | caixa (`TextInput` / `FolderPickerField`) | **texto solto** |

## 2. Correção

`VideoInspector` passa a usar exatamente os mesmos primitivos das outras duas receitas:

- **01 / Maximum width** — `TextInput` em caixa com o valor decorado (`1920 px · maximum width`) e
  a mesma mecânica de `Custom` das imagens (digitar muda a seleção para `Custom`; clicar em `Custom`
  foca o campo; o valor digitado persiste). Presets numéricos em **mono 13** (mesma regra das
  larguras de imagem) em **uma linha de 4** (1280 / 1920 / 3840 / Custom) — o padrão de "4 em uma
  linha" já usado em compressão e formato.
- **"Never enlarge smaller videos"** — `Checkbox` de verdade (o `withoutEnlargement` é um booleano
  real no config), com a construção de rótulo da aba de imagens ("Never enlarge smaller files").
- **02 / Compression**, **03 / Output format**, **04 / Save new files to** — `ChoiceRow` em caixa com
  rótulos Inter Medium 14 (texto) — a mesma regra de tipografia das outras abas.
- **Destino** — `TextInput` em caixa para subfolder/suffix e `FolderPickerField` para custom, igual
  às imagens (a nota da seção muda para "Every file in the batch is saved to this folder.").
- O estado **travado** durante o processamento continua sendo o `RecipeUsed` compartilhado (linhas
  rótulo/valor), idêntico ao das imagens — nada mudou ali.

`InlineValue` e `ReadOnlyChoice`/`ReadOnlyChoiceRow` deixam de ser usados por este componente; os
primitivos continuam existindo para o registro de leitura (relatórios e receita travada).

## 3. Arquivos

**Criados**

```
docs/branches/refactor-video-inspector-consistency.md   este documento
```

**Modificados**

```
src/components/VideoInspector.tsx   controles padronizados com imagem/favicon
```

## 4. Testes

- `npx tsc --noEmit` → limpo; `npx vite build` → verde.
- Encaixe vertical e horizontal medidos (`LEVE_MEASURE=1`) nos três estados de vídeo:
  `ready` @800, `empty` @720 e `processing` @800 → **workspace 0, inspector 0, sem rolagem
  horizontal** (a troca mantém as alturas: as caixas têm 44 px como as tabs que substituíram).
- Captura do estado `ready` @800 revisada contra as receitas de imagem e favicon: mesmos primitivos,
  mesmos estados de seleção, mesma hierarquia de seções.
- `node test/testProcessor.js`, `testIcoProcessor.js`, `testVideoProcessor.js` → passam (nada do
  motor foi tocado).

## 5. Decisões

| # | Decisão | Justificativa |
|---|---|---|
| 1 | Padronizar pela linguagem de **imagem/favicon** | pedido do usuário; duas abas contra uma |
| 2 | Larguras em **uma linha de 4** | vídeo tem 3 presets + Custom; o padrão de 4 em linha já existe nas outras seções |
| 3 | "Never enlarge smaller videos" vira `Checkbox` | o config tem o booleano `withoutEnlargement`; a frase do design era um statement, mas o controle é o mesmo das imagens |
| 4 | Rótulos numéricos em mono, textos em Inter | mesma regra de tipografia das outras abas |
| 5 | Estado travado inalterado | já era compartilhado (`RecipeUsed`) entre as três abas |

## 5.1 Merge record

- Aprovado pelo usuário após a revisão da captura do estado `ready`.
- Merge em `main` com `--no-ff`; release `1.6.2` — ver
  [chore-release-1.6.2.md](chore-release-1.6.2.md).

## 6. Commit history

```
refactor(ui): bring the video recipe onto the shared control vocabulary
docs: record the video inspector consistency branch
```
