import React from 'react';

interface ActionFooterProps {
  /** Bold status line, e.g. "Ready when you are." */
  title: string;
  /** Muted second line. */
  subtitle: string;
  /** Right-hand actions (the primary CTA, or cancel + progress). */
  children?: React.ReactNode;
}

/** 92 px action bar: status on the left, the batch action on the right. */
export const ActionFooter: React.FC<ActionFooterProps> = ({ title, subtitle, children }) => (
  <footer className="flex h-[var(--d-footer)] shrink-0 items-center justify-between gap-6 border-t border-subtle bg-paper px-[var(--d-page-x)]">
    <div className="flex w-[700px] min-w-0 flex-col gap-1">
      <span className="t-control text-ink">{title}</span>
      <span className="t-small text-muted">{subtitle}</span>
    </div>
    {children && <div className="flex shrink-0 items-center gap-4">{children}</div>}
  </footer>
);
