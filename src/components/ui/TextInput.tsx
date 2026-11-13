import React from 'react';
import { cx } from '../../utils/cx';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional leading icon (the width field shows a dimension glyph). */
  leading?: React.ReactNode;
}

/**
 * Surface field, 44 px tall, radius 8, border/control.
 * The keyboard-focus outline wraps the whole control (2 px ink + 2 px offset),
 * so the inner input suppresses its own outline and the wrapper borrows it.
 */
export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ leading, className, ...rest }, ref) => (
    <div
      className={cx(
        'flex h-11 items-center gap-2 rounded-md border border-control bg-surface px-2.5 py-2',
        'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink',
        className
      )}
    >
      {leading}
      <input
        ref={ref}
        className="w-full min-w-0 bg-transparent t-control text-ink placeholder:text-muted focus:outline-none disabled:cursor-not-allowed disabled:text-muted"
        {...rest}
      />
    </div>
  )
);

TextInput.displayName = 'TextInput';

/**
 * Read-only value: in the locked recipe and the batch report a value is
 * plain text, not a field.
 */
export const ReadOnlyValue: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...rest
}) => <div className={cx('t-control text-ink', className)} {...rest} />;

/**
 * Resolved value block (design: "A resolved value, not an input") — e.g.
 * `Auto → #FFFFFF`, on a `panel` fill with 12 px left padding.
 */
export const ResolvedValue: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...rest
}) => (
  <div className={cx('flex h-11 items-center bg-panel pl-3 t-control text-ink', className)} {...rest} />
);
