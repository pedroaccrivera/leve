import React from 'react';
import { Info } from 'lucide-react';
import { cx } from '../../utils/cx';

/** Hairline + numbered label + content — the inspector's section rhythm. */
export interface FieldSectionProps {
  /** Section number as printed by the design, e.g. `01`. */
  index?: string;
  title: string;
  /** Optional right-aligned value on the label row (e.g. `22%`). */
  trailing?: React.ReactNode;
  /**
   * Helper copy. Inline above 880 px tall; below that it moves into an info
   * tooltip so the recipe can fit a short window without losing the text.
   * `\n` starts a new line.
   */
  note?: string;
  children?: React.ReactNode;
  className?: string;
}

export const FieldSection: React.FC<FieldSectionProps> = ({
  index,
  title,
  trailing,
  note,
  children,
  className,
}) => (
  <section className={cx('border-t border-subtle pt-[var(--d-label-gap)]', className)}>
    <div className="flex min-h-4 items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-2">
        <h3 className="t-label uppercase text-ink">
          {index ? `${index} / ` : ''}
          {title}
        </h3>
        {note && (
          <span className="group relative hidden compact:inline-flex">
            <button
              type="button"
              aria-label={note}
              className="flex h-4 w-4 items-center justify-center text-muted transition-colors hover:text-ink"
            >
              <Info className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
            <span
              role="tooltip"
              className="pointer-events-none absolute left-0 top-5 z-40 w-[248px] whitespace-pre-line border border-subtle bg-panel p-2 t-small text-ink opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
            >
              {note}
            </span>
          </span>
        )}
      </div>
      {trailing != null && <span className="t-mono text-ink">{trailing}</span>}
    </div>
    {children != null && (
      <div className="mt-[var(--d-field)] flex flex-col gap-[var(--d-field)]">{children}</div>
    )}
    {note && (
      <p className="compact:hidden mt-[var(--d-field)] whitespace-pre-line t-small text-muted">{note}</p>
    )}
  </section>
);

/** Uppercase micro-heading used inside content blocks (`YOUR OUTPUT`). */
export const FieldLabel: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...rest }) => (
  <span className={cx('t-label uppercase text-ink', className)} {...rest} />
);

/** Small muted helper line that closes a section. */
export const FieldNote: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...rest }) => (
  <p className={cx('t-small text-muted', className)} {...rest} />
);

export const Divider: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...rest }) => (
  <div className={cx('h-px w-full bg-subtle', className)} {...rest} />
);
