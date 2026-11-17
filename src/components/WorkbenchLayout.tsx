import React from 'react';
import { cx } from '../utils/cx';

/**
 * Workbench: media workspace (fluid, page gutters) + batch inspector
 * (fixed 428 px, hairline between). The inspector's left inset is measured from
 * that hairline, but its right edge is the window edge, so it uses the page
 * gutter — that lines its fields up with the theme button and the footer CTA.
 * Both columns scroll on their own; the window itself never scrolls.
 */
export const WorkbenchLayout: React.FC<{
  workspace: React.ReactNode;
  inspector: React.ReactNode;
  workspaceClassName?: string;
  inspectorClassName?: string;
}> = ({ workspace, inspector, workspaceClassName, inspectorClassName }) => (
  <div className="flex min-h-0 flex-1 items-stretch">
    <div
      className={cx(
        'flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-[var(--d-page-x)] pb-[var(--d-page-bottom)] pt-[var(--d-page-top)]',
        workspaceClassName
      )}
    >
      {workspace}
    </div>
    <aside
      className={cx(
        'w-[428px] shrink-0 overflow-y-auto overflow-x-hidden border-l border-subtle pb-[var(--d-inspector-bottom)] pl-[var(--d-inspector-x)] pr-[var(--d-page-x)] pt-[var(--d-inspector-top)]',
        inspectorClassName
      )}
    >
      {inspector}
    </aside>
  </div>
);
