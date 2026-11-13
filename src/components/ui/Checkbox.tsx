import React from 'react';
import { Check } from 'lucide-react';
import { cx } from '../../utils/cx';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  /** Optional second line in `small` / `muted`. */
  description?: string;
  disabled?: boolean;
  className?: string;
}

/** 20 px box, label 12 px to the right — the box stays on the first line. */
export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
}) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    title={description}
    className={cx(
      'flex w-full gap-3 text-left transition-opacity',
      description ? 'items-start' : 'items-center',
      disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      className
    )}
  >
    <span
      className={cx(
        'flex h-5 w-5 shrink-0 items-center justify-center border',
        checked ? 'border-ink bg-ink' : 'border-control bg-surface'
      )}
    >
      {checked && <Check className="h-3.5 w-3.5 text-paper" strokeWidth={2.5} />}
    </span>
    <span className="flex min-w-0 flex-col">
      <span className="t-control text-ink">{label}</span>
      {description && <span className="compact:hidden t-small text-muted">{description}</span>}
    </span>
  </button>
);
