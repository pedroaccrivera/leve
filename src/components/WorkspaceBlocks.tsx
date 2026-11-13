import React from 'react';
import { Upload } from 'lucide-react';
import { cx } from '../utils/cx';
import { Divider, FieldLabel, FieldNote } from './ui/FieldSection';

/* ---------------------------------------------------------------------------
 * Screen introduction: mono breadcrumb, display heading, one-line summary.
 * ------------------------------------------------------------------------ */
export const IntroBlock: React.FC<{ label: string; title: string; subtitle: string }> = ({
  label,
  title,
  subtitle,
}) => (
  <div className="flex flex-col gap-3">
    <span className="t-mono text-muted">{label}</span>
    <h2 className="t-display whitespace-pre-line text-ink">{title}</h2>
    <p className="t-body text-muted">{subtitle}</p>
  </div>
);

/* ---------------------------------------------------------------------------
 * Numbered principles (Images): hairline, then mono index + statement.
 * ------------------------------------------------------------------------ */
export const Principles: React.FC<{ items: string[]; className?: string }> = ({ items, className }) => (
  <div className={cx('flex flex-col gap-4', className)}>
    <Divider />
    <ul className="flex flex-col gap-4">
      {items.map((item, index) => (
        <li key={item} className="flex items-start gap-5">
          <span className="t-mono text-muted">{String(index + 1).padStart(2, '0')}</span>
          <span className="t-control text-ink">{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

/* ---------------------------------------------------------------------------
 * Labelled principles (Videos / Favicon): label + helper sentence.
 * ------------------------------------------------------------------------ */
export const PrincipleList: React.FC<{
  items: { label: string; description: string }[];
  className?: string;
}> = ({ items, className }) => (
  <ul className={cx('flex flex-col gap-6', className)}>
    {items.map((item) => (
      <li key={item.label} className="flex flex-col gap-2">
        <FieldLabel>{item.label}</FieldLabel>
        <FieldNote>{item.description}</FieldNote>
      </li>
    ))}
  </ul>
);

/* ---------------------------------------------------------------------------
 * "YOUR OUTPUT" summary used before and during a batch.
 * ------------------------------------------------------------------------ */
export const OutputBlock: React.FC<{
  label: string;
  summary: string;
  note: string;
  className?: string;
}> = ({ label, summary, note, className }) => (
  <div className={cx('flex flex-col gap-2', className)}>
    <FieldLabel>{label}</FieldLabel>
    <p className="t-small text-muted">{summary}</p>
    <p className="t-small text-muted">{note}</p>
  </div>
);

/* ---------------------------------------------------------------------------
 * One-line drop affordance (Videos queue state).
 * ------------------------------------------------------------------------ */
export const DropHint: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={cx('flex items-center gap-3', className)}>
    <Upload className="h-4 w-4 shrink-0 text-muted" strokeWidth={2} />
    <span className="t-small text-muted">{children}</span>
  </div>
);
