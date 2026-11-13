import React from 'react';
import { cx } from '../../utils/cx';

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  value: number;
  min?: number;
  max?: number;
}

/**
 * Native range styled to the design: 2 px track, ink fill up to the knob,
 * `subtle` remainder, 16 px ink knob, 44 px tall hit area.
 * The fill percentage is handed to CSS through `--slider-pct`.
 */
export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ value, min = 0, max = 100, className, ...rest }, ref) => {
    const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
    return (
      <input
        ref={ref}
        type="range"
        min={min}
        max={max}
        value={value}
        style={{ ['--slider-pct' as string]: `${pct}%` }}
        className={cx('fieldwork-slider h-[var(--d-control-sm)] w-full cursor-pointer appearance-none bg-transparent', className)}
        {...rest}
      />
    );
  }
);

Slider.displayName = 'Slider';

/** Label row above a slider: `Padding · Fit inside only` + `8%`. */
export const SliderRow: React.FC<{
  label: string;
  value: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, value, children, className }) => (
  <div className={cx('flex flex-col', className)}>
    <div className="flex h-5 items-center justify-between text-ink">
      <span className="t-control">{label}</span>
      <span className="t-mono">{value}</span>
    </div>
    {children}
  </div>
);
