# `feat/tone-aware-icon` — Ícone do app acompanha o tom

- **Type:** Feature — aparência / identidade
- **Status:** Merged into `main` (included in release `1.6.1`)
- **Base:** `main` @ `8522b80` (release `1.6.0`)

## 1. Objetivo

O ícone do app (dock no macOS, barra de tarefas no Windows) passa a **refletir o tom escolhido** no
seletor de hue, inclusive **depois de reiniciar**: o renderer restaura o tom salvo no boot e o
reporta ao processo principal, que re-tinge a arte.

## 2. Como funciona

```
renderer (HueContext)                 main process
  applyHue(hue)                         ipcMain.on('tone:setShift')
  └─ setTimeout 160 ms ────────────────▶  tintIcon(base, shift)
       window.electronAPI.setToneShift()    └─ sharp(base).modulate({ hue: shift })
                                             └─ nativeImage.createFromBuffer()
                                                ├─ macOS: app.dock.setIcon(image)
                                                └─ Windows/Linux: win.setIcon(image)
```

- O renderer envia o **deslocamento** (`hue − 66`), o mesmo valor que aplica aos tokens — o processo
  principal não precisa conhecer a paleta.
- `sharp.modulate({ hue })` roda a matiz da arte inteira pelo mesmo Δ, então o ícone e a janela
  concordam (inclusive nos neutros esverdeados).
- Com Δ = 0 a arte é usada **sem alteração** — nenhum retrabalho de cor no tom de projeto.
- O envio é **debounced em 160 ms**: arrastar o espectro não regenera a arte a cada passo.
- No boot o ícone é pintado com a arte de projeto (`applyToneShift(0)`) e, logo depois, com o tom
  restaurado — sem "flash" da cor anterior.
- A arte base é lida uma vez (`assets/icon.png`, 1024 px) e mantida em memória; a saída vai a 512 px.

## 3. Arquivos

**Criados**

```
electron/services/appIcon.ts          tintIcon(): arte + deslocamento → PNG
docs/branches/feat-tone-aware-icon.md este documento
```

**Modificados**

```
electron/main.ts        applyToneShift() + handler `tone:setShift` + import de tintIcon
electron/preload.cjs    setToneShift(shift) exposto em window.electronAPI
src/types/index.ts      ElectronAPI.setToneShift (opcional)
src/context/HueContext.tsx  reporta o deslocamento (debounce) a cada mudança e no boot
```

## 4. Testes

- `npx tsc --noEmit` → limpo; `npx vite build` → verde (renderer + `dist-electron/main.js`).
- Pipeline de tingimento exercitado direto com sharp em deslocamentos `0 / 138 / 214 / −66`:
  a arte de projeto sai intacta em 0 e as demais acompanham a paleta (o ponto vira ciano em 138,
  espelhando o tom 204° do app).
- **Round-trip real**: o app empacotado (`electron .`, `dist/` + `dist-electron/`) foi executado por
  ~14 s e o log do processo principal registrou

  ```
  [Tone] app icon shifted by 0 degrees
  [Tone] app icon shifted by 284 degrees
  ```

  ou seja: o renderer restaurou um tom salvo (284°) do `localStorage` e o ícone foi re-tingido —
  exatamente o comportamento pedido.
- Nomes de canal conferidos nos artefatos compilados (`tone:setShift` em `dist-electron/main.js` e
  `dist-electron/preload.cjs`; `setToneShift` no bundle do renderer).
- `node test/testProcessor.js`, `testIcoProcessor.js`, `testVideoProcessor.js` → passam (o motor não
  foi tocado).

## 5. Decisões

| # | Decisão | Justificativa |
|---|---|---|
| 1 | Tingir no **processo principal**, não no renderer | `app.dock.setIcon` / `win.setIcon` são APIs do main; o renderer só informa o deslocamento |
| 2 | Enviar o **deslocamento**, não o hue absoluto | o main não precisa da paleta nem do valor de referência (66°) |
| 3 | `sharp.modulate({ hue })` em vez de re-renderizar o SVG | mesma matemática da rotação dos tokens, sem duplicar o parser de cor; sharp já é dependência |
| 4 | Debounce de 160 ms | arrastar o espectro não pode custar uma rasterização por passo |
| 5 | `setToneShift` **opcional** no `ElectronAPI` | o harness de captura e o navegador não têm o canal; a chamada é opcional |
| 6 | Windows/Linux via `win.setIcon` | mesmo efeito na barra de tarefas; no macOS o `BrowserWindow.icon` é ignorado |

## 5.1 Merge record

- Aprovado pelo usuário após a verificação do round-trip no app real.
- Merge em `main` com `--no-ff`; release `1.6.1` — ver
  [chore-release-1.6.1.md](chore-release-1.6.1.md).

## 6. Commit history

```
feat(app): tint the application icon with the chosen tone
docs: record the tone-aware icon branch
```
