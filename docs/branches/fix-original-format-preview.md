# `fix/original-format-preview` — Preview da fila mostra a extensão real com "Original"

- **Type:** Fix — UI / preview de saída
- **Status:** In Progress — implementado e verificado, aguardando merge
- **Base:** `main` @ `8441264` (depois da release `1.7.0`)

## 1. Pedido

> "há um bug no conversor. ao enviar uma imagem qualquer, mantendo a configuração de output
> original, o app mostra que vai converter para .webp."

O print mostrava uma fila com `Globe_in_forest…stock.jpg` e a nota `→ …stock.webp` com **Original**
selecionado em 03 / OUTPUT FORMAT.

## 2. Diagnóstico

- **Imagens** (`src/App.tsx`, preview da fila): a expressão do nome de saída tinha
  `'original' ? 'webp'` hardcode. O processador real (`electron/services/imageProcessor.ts`) faz o
  contrário: `targetExt = parsed.ext` — a extensão original é mantida e só é sobrescrita quando o
  formato é `jpeg`/`png`/`webp` explícito.
- **Vídeos** (mesma expressão, bloco dos vídeos): `'webm' ? 'webm' : 'mp4'` mostrava `.mp4` para
  qualquer fonte com `original`, mas `resolveVideoTarget` (`videoProcessor.ts`) mantém o container
  do source quando é muxável — `webm` → `webm`, `mp4/mov/m4v` → mantém — e cai para `mp4` nos
  demais.

## 3. Correção

Dois helpers em `src/App.tsx`, junto de `countLabel`, espelhando os processadores:

- `extOf(name)` — extensão do arquivo em minúsculas;
- `imageTargetExt(name, format)` — `original` → extensão do source; `jpeg` → `jpg`; senão o
  formato;
- `videoTargetExt(name, format)` — `webm` → `webm`; `mp4` → `mp4`; `original` → container do
  source (`webm`/`mp4`/`mov`/`m4v`) ou `mp4` como fallback.

As duas notas de fila (`ImageQueueRow` e `VideoQueueRow`) passaram a usar os helpers. Sem mudança
de comportamento do processamento — **só o preview** estava mentindo.

## 4. Verificação

- `npx tsc --noEmit` limpo · `npx vite build` verde · `testProcessor`, `testIcoProcessor` e
  `testVideoProcessor` passando.
- **DOM real** (harness + fixtures, clicando "Original" no inspector e lendo as notas):
  - `images-ready` (fontes `.jpg`): config `webp` → `→ photo-01.webp…`; clicando **Original** →
    `→ photo-01.jpg…` ✓
  - `videos-ready` (fontes `.mp4` + `.mov`): config `mp4` → `→ compressed/video-01.mp4`,
    `→ compressed/video-02.mp4` ✓; clicando **Original** → `→ compressed/video-01.mp4`,
    `→ compressed/video-02.mov` ✓ (o `.mov` mantém o container).

## 5. Arquivos

```
src/App.tsx                              helpers imageTargetExt/videoTargetExt + notas da fila
docs/branches/fix-original-format-preview.md
PROJECT_STATUS.md
```

## 6. Decisões

| # | Decisão | Justificativa |
|---|---|---|
| 1 | Helpers espelham os processadores em vez de duplicar a regra inline | preview e resultado não podem divergir de novo |
| 2 | Vídeo corrigido junto | mesmo bug, mesma família (`original`), mesmo arquivo |
| 3 | Sem mudança no processamento | o motor já estava certo; só o texto do preview mentia |

## 7. Commit history

| Commit | Message |
| :-- | :-- |
| `07ce53f` | `fix(ui): queue previews show the real output extension for Original` |
| _(this docs commit)_ | `docs: record the original-format-preview branch` |
