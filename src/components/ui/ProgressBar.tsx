import React from 'react';
import { cx } from '../../utils/cx';

export interface ProgressBarProps {
  /** 0 – 100. */
  value: number;
  className?: string;
}

/** 8 px track (`line`) with a signal-yellow fill, clipped square. */
export const ProgressBar: React.FC<ProgressBarProps> = ({ value, className }) => {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cx('flex h-2 w-full items-start overflow-clip bg-line', className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* scaleX instead of a width transition: the fill is composited, not
          laid out, and progress is the one linear motion in the app. */}
      <div
        className="h-2 w-full shrink-0 origin-left bg-signal transition-transform duration-300 ease-linear"
        style={{ transform: `scaleX(${pct / 100})` }}
      />
    </div>
  );
};
