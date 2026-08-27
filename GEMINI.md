# Regras de Desenvolvimento e Fluxo Git do Projeto `leve`

As diretrizes a seguir são mandatórias para qualquer alteração ou desenvolvimento no projeto:

## 1. Aprovação Prévia Obrigatória
- Toda nova funcionalidade, refatoração ou correção de bug deve primeiro ser apresentada com escopo/plano claro.
- **Nenhum código de feature ou fix deve ser implementado antes da aprovação explícita do usuário.**

## 2. Estratégia de Branches no Git
- Sempre criar uma branch dedicada a partir da `main` antes de iniciar as alterações:
  - **Novas Funcionalidades**: `feat/nome-da-feat` (ex.: `feat/relative-resizing`, `feat/smart-crop`)
  - **Correções de Bugs**: `fix/nome-do-fix` (ex.: `fix/metadata-exif-stripping`)
  - **Refatorações**: `refactor/nome-do-refactor`
  - **Documentação / Tarefas de Manutenção**: `docs/nome` ou `chore/nome`
- Manter commits atômicos, descritivos e seguindo o padrão Conventional Commits.

## 3. Documentação Obrigatória por Branch (`docs/branches/` e `PROJECT_STATUS.md`)
- **Toda branch criada deve possuir um arquivo de documentação correspondente** em `docs/branches/` (ex.: `docs/branches/feat-relative-resizing.md` ou `docs/branches/fix-nome.md`).
- O arquivo da branch deve conter:
  - Objetivo e escopo da branch.
  - Lista de arquivos criados / modificados.
  - Testes realizados e resultados.
  - Histórico de decisões e commits.
- **Atualização do [PROJECT_STATUS.md](file:///Users/pedrorivera/Library/CloudStorage/GoogleDrive-pedro.rivera@q4inc.com/My%20Drive/Projects/SIDE/resize-agy/PROJECT_STATUS.md)**: A tabela de branches em `PROJECT_STATUS.md` deve ser atualizada para referenciar a nova branch e o status atual (Em andamento, Concluída, Merged).

## 4. Conclusão e Merge na `main`
- Ao concluir as alterações, testes e documentação na branch:
  1. Apresentar o resumo das mudanças e resultados dos testes.
  2. **Perguntar explicitamente ao usuário se está tudo aprovado para realizar o merge na branch `main`.**
  3. Somente após a confirmação/aprovação do usuário, executar o merge na `main` e atualizar o status em `PROJECT_STATUS.md` e no arquivo da branch.
