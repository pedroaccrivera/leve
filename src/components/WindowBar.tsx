import React from 'react';
import { cx } from '../utils/cx';

/**
 * 28 px window bar.
 *
 * macOS only: the window is frameless (`titleBarStyle: 'hiddenInset'`) so the
 * OS draws the real traffic lights inside this bar and it carries the identity
 * line next to them. Windows keeps its native frame, so the bar is not
 * rendered there.
 *
 * Spacing: `trafficLightPosition` places the buttons at x = 20 with a 20 px
 * pitch, so the 12 px buttons span 20 → 72. The design draws narrower 10 px
 * dots (20 → 66) with its label at 74; using that absolute value would leave
 * only 2 px against the real buttons, so the label starts at 84 — a 12 px gap
 * that reads like the reference without crowding the OS controls.
 */
const LABEL_INSET = 84;

export const WindowBar: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cx('titlebar-drag-region flex h-7 shrink-0 items-center bg-paper', className)}>
    <span className="t-mono text-muted" style={{ paddingLeft: LABEL_INSET }}>
      LOCAL MEDIA TOOLKIT
    </span>
  </div>
);
