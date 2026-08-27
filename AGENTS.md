# `leve` — Development Workflow & Git Rules

The following guidelines are mandatory for any change or development work on this project:

## 1. Mandatory Prior Approval
- Every new feature, refactor, or bug fix must first be presented with a clear scope/plan.
- **No feature or fix code may be implemented before the user's explicit approval.**

## 2. Git Branching Strategy
- Always create a dedicated branch from `main` before starting any changes:
  - **New Features**: `feat/feature-name` (e.g., `feat/relative-resizing`, `feat/smart-crop`)
  - **Bug Fixes**: `fix/fix-name` (e.g., `fix/metadata-exif-stripping`)
  - **Refactors**: `refactor/refactor-name`
  - **Docs / Maintenance tasks**: `docs/name` or `chore/name`
- Keep commits atomic, descriptive, and following the Conventional Commits standard.

## 3. Mandatory Branch Documentation (`docs/branches/` and `PROJECT_STATUS.md`)
- **Every created branch must have a corresponding documentation file** in `docs/branches/` (e.g., `docs/branches/feat-relative-resizing.md` or `docs/branches/fix-name.md`).
- The branch file must contain:
  - Goal and scope of the branch.
  - List of files created / modified.
  - Tests performed and results.
  - Decision log and commit history.
- **Update [PROJECT_STATUS.md](./PROJECT_STATUS.md)**: The branch table in `PROJECT_STATUS.md` must be updated to reference the new branch and its current status (In Progress, Done, Merged).

## 4. Completion & Merge into `main`
- Upon completing changes, tests, and documentation on the branch:
  1. Present a summary of changes and test results.
  2. **Explicitly ask the user whether everything is approved to merge into `main`.**
  3. Only after the user's confirmation, execute the merge into `main` and update the status in `PROJECT_STATUS.md` and in the branch file.
