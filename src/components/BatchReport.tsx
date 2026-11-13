import React from 'react';
import { Button } from './ui/Button';
import { Divider, FieldLabel } from './ui/FieldSection';
import { StatusChip } from './ui/StatusChip';
import { cx } from '../utils/cx';

export interface ReportRow {
  tone: 'success' | 'warning' | 'danger' | 'muted';
  mark: string;
  label: string;
  name: string;
  lines: string[];
}

export interface ReceiptCell {
  label: string;
  value: string;
}

export interface BatchReportProps {
  introLabel: string;
  title: string;
  subtitle: string;
  receipt: ReceiptCell[];
  /** Images shows the measured results on a `panel` fill; video and favicon are plain. */
  receiptVariant?: 'panel' | 'plain';
  note: string;
  rows: ReportRow[];
  onStartNewBatch: () => void;
  onDismiss: () => void;
  trailingNote?: string;
}

/** In-page batch report that replaces the old summary modal. */
export const BatchReport: React.FC<BatchReportProps> = ({
  introLabel,
  title,
  subtitle,
  receipt,
  receiptVariant = 'plain',
  note,
  rows,
  onStartNewBatch,
  onDismiss,
  trailingNote,
}) => (
  <div className="flex flex-col gap-6">
    <div className="flex flex-col gap-3">
      <span className="t-mono text-muted">{introLabel}</span>
      <h2 className="t-display whitespace-pre-line text-ink">{title}</h2>
      <p className="t-body text-muted">{subtitle}</p>
    </div>

    <div
      className={cx(
        'flex items-start',
        receiptVariant === 'panel' ? 'gap-0 bg-panel' : 'gap-6'
      )}
    >
      {receipt.map((cell) => (
        <div
          key={cell.label}
          className={cx(
            'flex min-w-0 flex-1 flex-col gap-2 overflow-clip',
            receiptVariant === 'panel' ? 'pl-5 pt-5' : ''
          )}
        >
          <FieldLabel className="w-full text-muted">{cell.label}</FieldLabel>
          <span className="t-title w-full truncate text-ink">{cell.value}</span>
        </div>
      ))}
      {receiptVariant === 'panel' && <div className="h-[104px]" aria-hidden="true" />}
    </div>

    <p className="t-small text-muted">{note}</p>

    <div className="flex flex-col">
      {rows.map((row, index) => (
        <React.Fragment key={`${row.name}-${index}`}>
          <Divider />
          <div className="flex items-start gap-0 py-5">
            <span className="w-[120px] shrink-0">
              <StatusChip tone={row.tone} mark={row.mark}>
                {row.label}
              </StatusChip>
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="t-body truncate text-ink">{row.name}</span>
              {row.lines.map((line) => (
                <span key={line} className="t-small truncate text-muted">
                  {line}
                </span>
              ))}
            </div>
          </div>
        </React.Fragment>
      ))}
      <Divider />
    </div>

    <div className="flex items-center gap-4">
      <Button variant="secondary" size="lg" className="w-[228px]" onClick={onStartNewBatch}>
        Start a new batch
      </Button>
      <Button variant="secondary" size="lg" onClick={onDismiss}>
        Dismiss report
      </Button>
    </div>

    {trailingNote && <p className="t-small text-muted">{trailingNote}</p>}
  </div>
);

/** Inspector side of a finished batch: the recipe as a read-only record. */
export const RecipeUsed: React.FC<{
  rows: { label: string; value: string }[];
  title?: string;
  subtitle?: string;
  callout: string;
  calloutBody: string;
}> = ({ rows, title = 'Recipe used', subtitle = 'Completed batch · read only', callout, calloutBody }) => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-col gap-1">
      <h2 className="t-section text-ink">{title}</h2>
      <p className="t-small text-muted">{subtitle}</p>
    </div>

    <div className="flex flex-col">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-col gap-0.5 border-t border-subtle py-3">
          <FieldLabel className="text-muted">{row.label}</FieldLabel>
          <span className="t-control text-ink">{row.value}</span>
        </div>
      ))}
    </div>

    <div className="flex flex-col gap-2 pt-2">
      <h3 className="t-section text-ink">{callout}</h3>
      <p className="t-body text-muted">{calloutBody}</p>
    </div>
  </div>
);
