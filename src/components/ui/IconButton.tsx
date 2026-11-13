import React from 'react';
import { cx } from '../../utils/cx';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible label — these controls are icon-only. */
  label: string;
}

/** 44 px square hit area with no chrome, as designed for row removal. */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, className, type = 'button', children, ...rest }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        'flex h-11 w-11 shrink-0 items-center justify-center text-ink transition-colors duration-150 hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
);

IconButton.displayName = 'IconButton';
