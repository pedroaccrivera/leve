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

## 3. Conclusão e Merge na `main`
- Ao concluir as alterações e verificações na branch:
  1. Apresentar o resumo das mudanças e resultados dos testes.
  2. **Perguntar explicitamente ao usuário se está tudo aprovado para realizar o merge na branch `main`.**
  3. Somente após a confirmação/aprovação do usuário, executar o merge na `main` e atualizar o estado do projeto.
