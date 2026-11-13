import React from 'react';
import { Image as ImageIcon, Trash2 } from 'lucide-react';
import { cx } from '../utils/cx';
import { IconButton } from './ui/IconButton';
import { StatusChip } from './ui/StatusChip';

export interface RowStatus {
  tone: 'muted' | 'success' | 'warning' | 'danger';
  mark: string;
  label: string;
}

/* ---------------------------------------------------------------------------
 * Images queue row — 100 px: thumbnail, file details, state, remove.
 * ------------------------------------------------------------------------ */
export interface ImageQueueRowProps {
  name: string;
  /** `3000 × 2000 px · 2.4 MB` */
  meta: string;
  /** `→ photo-01.webp` or a result message. */
  note?: string;
  status: RowStatus;
  onRemove?: () => void;
  className?: string;
}

export const ImageQueueRow: React.FC<ImageQueueRowProps> = ({
  name,
  meta,
  note,
  status,
  onRemove,
  className,
}) => (
  <div className={cx('flex h-[100px] items-center gap-4', className)}>
    <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-panel">
      <ImageIcon className="h-6 w-6 text-muted" strokeWidth={2} />
    </div>

    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="t-body truncate text-ink">{name}</span>
      <span className="t-small truncate text-muted">{meta}</span>
      {note && <span className="t-small truncate text-muted">{note}</span>}
    </div>

    <div className="flex w-[200px] shrink-0 items-center justify-end gap-3">
      <span className="flex-1 text-right">
        <StatusChip tone={status.tone} mark={status.mark}>
          {status.label}
        </StatusChip>
      </span>
      {onRemove && (
        <IconButton label={`Remove ${name}`} onClick={onRemove}>
          <Trash2 className="h-[18px] w-[18px]" strokeWidth={2} />
        </IconButton>
      )}
    </div>
  </div>
);

/* ---------------------------------------------------------------------------
 * Video queue row — mono index, file details, state.
 * ------------------------------------------------------------------------ */
export interface VideoQueueRowProps {
  index: string;
  name: string;
  meta: string;
  note?: string;
  status: RowStatus;
  onRemove?: () => void;
  className?: string;
}

export const VideoQueueRow: React.FC<VideoQueueRowProps> = ({
  index,
  name,
  meta,
  note,
  status,
  onRemove,
  className,
}) => (
  <div className={cx('flex h-[92px] items-center gap-5', className)}>
    <span className="t-mono w-14 shrink-0 text-muted">{index}</span>

    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="t-body truncate text-ink">{name}</span>
      <span className="t-small truncate text-muted">{meta}</span>
      {note && <span className="t-small truncate text-muted">{note}</span>}
    </div>

    <div className="flex shrink-0 items-center gap-3">
      <StatusChip tone={status.tone} mark={status.mark}>
        {status.label}
      </StatusChip>
      {onRemove && (
        <IconButton label={`Remove ${name}`} onClick={onRemove}>
          <Trash2 className="h-[18px] w-[18px]" strokeWidth={2} />
        </IconButton>
      )}
    </div>
  </div>
);

/** Hairline-separated list wrapper. */
export const QueueList: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...rest }) => (
  <div className={cx('flex flex-col divide-y divide-subtle border-y border-subtle', className)} {...rest} />
);
