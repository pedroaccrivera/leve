import React from 'react';
import { cx } from '../../utils/cx';

/** Hairline + numbered label + content — the inspector's section rhythm. */
export interface FieldSectionProps {
  /** Section number as printed by the design, e.g. `01`. */
  index?: string;
  title: string;
  /** Optional right-aligned value on the label row (e.g. `22%`). */
  trailing?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const FieldSection: React.FC<FieldSectionProps> = ({
  index,
  title,
  trailing,
  children,
  className,
}) => (
  <section className={cx('border-t border-subtle pt-2', className)}>
    <div className="flex min-h-4 items-center justify-between gap-4">
      <h3 className="t-label uppercase text-ink">
        {index ? `${index} / ` : ''}
        {title}
      </h3>
      {trailing != null && <span className="t-mono text-ink">{trailing}</span>}
    </div>
    {children != null && <div className="mt-2 flex flex-col gap-2">{children}</div>}
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
