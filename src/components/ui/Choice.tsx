import React from 'react';
import { cx } from '../../utils/cx';

/**
 * Segmented choice control.
 *
 * Two label styles live in the design: numeric preset rows (width presets,
 * ICO sizes) are set in IBM Plex Mono 13, every other row uses Inter Medium
 * 14. Pass `mono` for the numeric rows.
 */
export interface ChoiceProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  mono?: boolean;
}

export const Choice: React.FC<ChoiceProps> = ({
  selected = false,
  mono = false,
  className,
  type = 'button',
  ...rest
}) => (
  <button
    type={type}
    aria-pressed={selected}
    className={cx(
      'flex h-[var(--d-control)] min-w-11 flex-1 items-center justify-center border p-2 transition-colors duration-150',
      mono ? 't-mono' : 't-control',
      selected
        ? 'border-ink bg-ink text-paper'
        : 'border-control bg-surface text-ink hover:bg-panel disabled:cursor-not-allowed disabled:opacity-60',
      className
    )}
    {...rest}
  />
);

/** Equal-width row of choices — 4 px gutters, as designed. */
export const ChoiceRow: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...rest }) => (
  <div className={cx('flex items-stretch gap-1', className)} {...rest} />
);

/**
 * Stacked rows of choices. The design keeps the same 4 px gutter between rows
 * (row 1 at y=0, row 2 at y=48 with 44 px controls) as between columns.
 */
export const ChoiceStack: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...rest }) => (
  <div className={cx('flex flex-col gap-1', className)} {...rest} />
);

/**
 * Locked / read-only choice: no box, a hairline underline, and the active
 * item filled with `subtle` plus a 2 px ink underline (design: "locked while
 * processing", also used by the video recipe at rest).
 */
export interface ReadOnlyChoiceProps extends React.HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
}

export const ReadOnlyChoice: React.FC<ReadOnlyChoiceProps> = ({
  selected = false,
  className,
  ...rest
}) => (
  <div
    className={cx(
      'flex h-[var(--d-control)] min-w-11 flex-1 items-center justify-center border-b p-2 t-control text-ink',
      selected ? 'border-b-2 border-ink bg-subtle' : 'border-subtle',
      className
    )}
    {...rest}
  />
);

export const ReadOnlyChoiceRow: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...rest
}) => <div className={cx('flex items-stretch gap-1', className)} {...rest} />;
