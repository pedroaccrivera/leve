import React from 'react';
import { cx } from '../utils/cx';

/**
 * 28 px window bar.
 *
 * macOS only: the window is frameless (`titleBarStyle: 'hiddenInset'`) so the
 * OS draws the real traffic lights at x = 20, y = 8 and this bar carries the
 * identity line next to them. Windows keeps its native frame, so the bar is
 * not rendered there.
 */
export const WindowBar: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cx('titlebar-drag-region flex h-7 shrink-0 items-center bg-paper', className)}>
    <span className="t-mono pl-[76px] text-muted">leve / LOCAL MEDIA TOOLKIT</span>
  </div>
);
