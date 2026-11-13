# `feat/favicon-per-logo` — Editor de favicon: miniaturas e receita por logo

- **Type:** Feature / Fix — editor de favicon
- **Status:** In Progress — implementado e verificado, aguardando merge
- **Base:** `main` @ `df73976` (release `1.6.2`)

## 1. Problemas relatados

1. **O filmstrip não mostrava a miniatura do arquivo** — todos os slots eram o ícone genérico.
2. **A receita era única para o lote**: editar um logo mudava todos, mas o caso de uso é fazer
   favicons para clientes diferentes no mesmo lote.

## 2. Miniaturas no filmstrip

O strip passou a carregar a **miniatura real de cada arquivo** via `getCachedThumbnail` →
`image:getThumbnail` (o mesmo IPC que a fila usa desde a 1.4.0), com o cache compartilhado já
existente (`src/utils/thumbnailCache.ts`) e fallback para o ícone genérico quando o carregamento
falha. A miniatura selecionada mantém a borda `signal`.

## 3. Receita por logo + opt-in "apply to all"

- `FaviconItem` ganhou `config?: FaviconConfig` — **cada logo tem a própria receita**.
- O inspector edita a receita do **logo selecionado**; o subtítulo diz onde a edição está sendo
  aplicada ("Applies to the selected logo" / "Applied to every logo" / "Settings for the next logos"
  quando ainda não há logos).
- **Opt-in "Apply to all logos"** (checkbox, aparece com 2+ logos): quando marcado, cada edição
  espelha para todos. Desmarcado (padrão), cada logo mantém a sua.
- Sem logos na fila, a edição molda o **template** que os próximos herdam (comportamento anterior).
- `Reset recipe` respeita o escopo (logo selecionado, ou todos com o opt-in).
- O rodapé reflete o estado: `N logos. One shared recipe.` quando todas as receitas são idênticas,
  `N logos. A recipe each.` quando diferem.
- A geração usa `item.config ?? defaults` por item; o relatório e a receita travada seguem por logo.
- Fixture dev `?fixture=favicon-real` (3 logos reais em `/tmp/leve-logo-fixture`) com receitas
  distintas para conferência; `?fixture=favicon-processing` inalterado.

### Arquivos

```
src/types/index.ts                    FaviconItem.config
src/App.tsx                           receitas por item, escopo, reset, copy do rodapé
src/components/FaviconInspector.tsx   opt-in + subtítulo de escopo
src/components/FaviconEditor.tsx      miniaturas reais no filmstrip
src/utils/devFixtures.ts              fixture favicon-real + FAVICON_BASE
scripts/screenshot.cjs                LEVE_STUB_THUMBNAILS, LEVE_SELECT_LOGO, ponte de fixture
scripts/screenshot-app.cjs            **novo** — harness que roda o main real (todos os handlers IPC)
```

## 4. Testes

- `npx tsc --noEmit` limpo; `npx vite build` verde; as 3 suítes de teste passam.
- Encaixe medido (`LEVE_MEASURE=1`) no estado de 3 logos: sem overflow horizontal nas duas colunas
  nem no documento.
- **Miniaturas**: captura com o handler de miniatura espelhado no harness (o harness só roda o
  renderer, então não tem processo principal) mostra as três artes reais no strip — A (escuro/lima),
  B (lima/escuro), C (verde/claro).
- **Receita por logo**: selecionando o 1º logo o inspector mostra `0% / Square / White`; o 3º mostra
  `50% / Circle / Transparent`; o rodapé lê "3 logos. A recipe each.".
- `scripts/screenshot-app.cjs` foi criado para capturar o **app real** (com os handlers IPC de
  verdade) e ficou como ferramenta de verificação para estados que dependem do main.

## 5. Decisões

| # | Decisão | Justificativa |
|---|---|---|
| 1 | Receita **por item**, com opt-in para espelhar | o caso de uso (clientes diferentes) exige independência; o opt-in cobre o caso de lote uniforme |
| 2 | Miniatura **da fonte** (não do render) no strip | o strip identifica o arquivo; o render vive no preview grande |
| 3 | Reusar `getCachedThumbnail` | cache compartilhado com a fila, sem IPC duplicado |
| 4 | Copy do rodapé derivada do estado | evita afirmar "one shared recipe" quando não é o caso |

## 6. Commit history

```
feat(favicon): per-logo recipes, real filmstrip thumbnails and an apply-to-all opt-in
docs: record the favicon editor branch
```
