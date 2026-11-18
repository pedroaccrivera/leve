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
      'flex w-full gap-3 text-left transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
      description ? 'items-start' : 'items-center',
      disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      className
    )}
  >
    <span
      className={cx(
        'flex h-5 w-5 shrink-0 items-center justify-center border transition-colors duration-ctl',
        checked ? 'border-ink bg-ink' : 'border-control bg-surface'
      )}
    >
      <Check
        aria-hidden={!checked}
        className={cx(
          'h-3.5 w-3.5 text-paper transition-[transform,opacity] duration-ctl ease-fieldwork',
          checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        )}
        strokeWidth={2.5}
      />
    </span>
    <span className="flex min-w-0 flex-col">
      <span className="t-control text-ink">{label}</span>
      {description && <span className="compact:hidden t-small text-muted">{description}</span>}
    </span>
  </button>
);
