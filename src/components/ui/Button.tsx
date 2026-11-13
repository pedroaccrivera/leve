import React from 'react';
import { cx } from '../../utils/cx';

type ButtonVariant = 'primary' | 'secondary';
type ButtonSize = 'sm' | 'md' | 'lg';

/** Heights match the design: sm = 34 px (compact), md = 44 px, lg = 48 px. */
const sizes: Record<ButtonSize, string> = {
  sm: 'h-[34px] px-4 py-2',
  md: 'h-11 px-4 py-2.5',
  lg: 'h-12 px-4 py-3',
};

const variants: Record<ButtonVariant, string> = {
  // Signal yellow marks the primary next action — the single accent.
  primary: 'bg-signal text-on-signal hover:brightness-[0.96] active:brightness-[0.92]',
  secondary: 'bg-surface border border-control text-ink hover:bg-panel active:bg-panel',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'lg', className, type = 'button', disabled, ...rest }, ref) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={cx(
        'inline-flex shrink-0 select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-md t-control transition-colors duration-150',
        sizes[size],
        disabled
          ? 'cursor-not-allowed border border-transparent bg-subtle text-ink'
          : variants[variant],
        className
      )}
      {...rest}
    />
  )
);

Button.displayName = 'Button';
