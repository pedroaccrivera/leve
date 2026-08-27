# Plano e Estado de Execução do Projeto — `leve`

Este documento registra o estado atual da arquitetura, os módulos implementados, os fluxos de execução e o roadmap para evolução do **leve**.

---

## 1. Visão Geral do Projeto

**leve** é um aplicativo desktop 100% local, offline e focado em privacidade para redimensionamento e compressão em lote de imagens (macOS e Windows).

- **Princípio Fundamental**: Nenhum dado ou imagem sai da máquina do usuário (zero chamadas de rede, zero telemetria).
- **Stack Tecnológica**:
  - **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite.
  - **Runtime Desktop**: Electron (com isolamento de contexto e IPC assíncrono).
  - **Processamento de Imagens**: Sharp (baseado em `libvips` de alta performance nativa em C/C++).

---

## 2. Estado Atual de Execução (O que já foi implementado)

### 2.1. Arquitetura e Estrutura do Código
- [x] **Configuração Vite + Electron**: Pipeline de build configurado com `vite-plugin-electron` e `vite-plugin-electron-renderer`.
- [x] **Segurança e Comunicação IPC**:
  - Script de preload (`electron/preload.cjs`) expondo `window.electronAPI` via `contextBridge`.
  - Isolamento de contexto ativo (`contextIsolation: true`, `nodeIntegration: false`).
  - Handlers IPC no processo principal (`electron/main.ts`) para diálogo com SO, leitura de metadados, geração de thumbnails e processamento de imagem via Sharp.

### 2.2. Motor de Processamento (`electron/services/imageProcessor.ts`)
- [x] **Redimensionamento Proporcional**: Cálculo automático de altura proporcional mantendo aspect ratio. Opção de evitar upscale de imagens menores que a resolução alvo.
- [x] **Compressão Inteligente (Presets)**:
  - *Balanced (Recomendado)*: Equilíbrio ótimo entre tamanho e fidelidade visual.
  - *Maximum Quality*: Compressão suave preservando detalhes finos.
  - *Smallest File Size*: Otimização agressiva com mozjpeg / oxipng / avif.
  - *Lossless*: Compressão sem perda para PNG e WebP.
  - *Custom*: Ajuste manual de slider de qualidade (1 a 100).
- [x] **Suporte a Múltiplos Formatos**: JPG, PNG, WebP, AVIF, TIFF, GIF, SVG.
- [x] **Conversão de Formato**: Manter original ou converter em lote para JPG, PNG, WebP ou AVIF.
- [x] **Privacidade e Metadados**: Limpeza seletiva ou total de dados EXIF, modelo de câmera e localização GPS via flag `stripMetadata`.
- [x] **Estratégias de Destino de Saída**:
  - Subpasta dedicada (ex.: `resized/` dentro da pasta de cada imagem).
  - Sufixo no mesmo diretório (ex.: `imagem-resized.jpg`).
  - Pasta customizada escolhida pelo usuário com criação automática de diretório.
  - Resolução de colisões de nome de arquivo para não sobrescrever arquivos existentes.

### 2.3. Interface de Usuário (`src/`)
- [x] **Header Moderno**: Identidade visual, status da fila e ações rápidas.
- [x] **DropZone Interativa**: Suporte a drag-and-drop de múltiplos arquivos e pastas, além de botões nativos de seleção de arquivos/pastas.
- [x] **Fila de Imagens (ImageQueue)**:
  - Miniaturas geradas sob demanda com dimensões originais e tamanho em disco.
  - Status em tempo real (Pendente, Processando, Concluído, Erro).
  - Remoção individual de itens e limpeza de fila.
- [x] **Painel de Configurações (SettingsPanel)**:
  - Seleção de largura (800px, 1280px, 1920px, 2560px, 3840px ou valor customizado).
  - Gestão de presets personalizados (criação, seleção e exclusão persistidos em localStorage).
  - Configuração de compressão, conversão de formato, remoção de metadados e destino.
- [x] **Feedback e Modal de Resumo (SummaryModal)**:
  - Relatório estatístico pós-processamento: total de arquivos processados, economia de espaço em bytes/porcentagem e tempo decorrido.
  - Acesso direto com 1 clique para abrir a pasta de destino no Finder / Explorer.

### 2.4. Testes e Empacotamento
- [x] Script de teste automatizado de processamento (`test/testProcessor.js`).
- [x] Configuração `electron-builder` em `package.json` para geração de instaladores (.dmg / .zip para macOS e .exe / portable para Windows).

---

## 3. Próximos Passos e Roadmap

### Curto Prazo
- [ ] Suporte a redimensionamento por porcentagem relativa (ex.: 50%, 75%).
- [ ] Recorte inteligente (smart crop) com detecção de ponto focal ou proporções fixas (1:1, 16:9, 4:5).
- [ ] Adição de marcas d'água (watermarking) de texto ou imagem opcional.
- [ ] Internacionalização da interface (i18n: Inglês, Português, Espanhol).

### Médio / Longo Prazo
- [ ] Integração com atalhos de sistema / menu de contexto do SO ("Abrir com leve").
- [ ] Processamento paralelo em worker threads para lotes massivos (1.000+ imagens).
- [ ] Modo CLI / Terminal para automações de pipeline sem interface gráfica.

---

## 4. Registro e Histórico de Branches (`docs/branches/`)

Cada branch de feature, fix ou refatoração possui um arquivo dedicado no diretório `docs/branches/` documentando escopo, decisões técnicas, testes e histórico.

| Branch | Tipo | Status | Documentação |
| :--- | :--- | :--- | :--- |
| `main` | Baseline Principal | Ativa | [docs/branches/main.md](file:///Users/pedrorivera/Library/CloudStorage/GoogleDrive-pedro.rivera@q4inc.com/My%20Drive/Projects/SIDE/resize-agy/docs/branches/main.md) |
| `feat/visual-redesign` | Feature / Visual Redesign | Em andamento | [docs/branches/feat-visual-redesign.md](file:///Users/pedrorivera/Library/CloudStorage/GoogleDrive-pedro.rivera@q4inc.com/My%20Drive/Projects/SIDE/resize-agy/docs/branches/feat-visual-redesign.md) |

