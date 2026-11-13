import React from 'react';
import { cx } from '../utils/cx';

/**
 * Workbench: media workspace (fluid, 40 px gutters) + batch inspector
 * (fixed 428 px, 30 px gutters, hairline between). Both columns scroll on
 * their own; the window itself never scrolls.
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
        'flex min-w-0 flex-1 flex-col overflow-y-auto px-10 pb-10 pt-8',
        workspaceClassName
      )}
    >
      {workspace}
    </div>
    <aside
      className={cx(
        'w-[428px] shrink-0 overflow-y-auto border-l border-subtle px-[30px] pb-10 pt-7',
        inspectorClassName
      )}
    >
      {inspector}
    </aside>
  </div>
);
