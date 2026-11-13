import React from 'react';
import { cx } from '../../utils/cx';

type Tone = 'muted' | 'success' | 'warning' | 'danger';

const tones: Record<Tone, string> = {
  muted: 'text-muted',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

/**
 * File / batch state marker. The design sets the mark and the label as one
 * text run with two spaces between them, so it stays on one line.
 */
export const StatusChip: React.FC<{ tone?: Tone; mark: string; children: React.ReactNode; className?: string }> = ({
  tone = 'muted',
  mark,
  children,
  className,
}) => (
  <span className={cx('t-small whitespace-pre', tones[tone], className)}>
    {mark}
    {'  '}
    {children}
  </span>
);

export const STATUS_MARKS = {
  pending: '○',
  waiting: '○',
  done: '✓',
  saved: '✓',
  skipped: '↷',
  failed: '!',
} as const;
