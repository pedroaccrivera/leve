import React from 'react';
import { Trash2 } from 'lucide-react';

interface QueueClearButtonProps {
  /** Number of items currently in the queue. */
  count: number;
  /** Plural noun used in the tooltip, e.g. `images`, `videos`, `logos`. */
  noun?: string;
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Queue action shown right below the file listing, so clearing lives with the
 * list it affects instead of the app header.
 */
export const QueueClearButton: React.FC<QueueClearButtonProps> = ({
  count,
  noun = 'items',
  onClick,
  disabled = false,
}) => (
  <div className="flex items-center justify-end">
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={`Remove all ${count} ${noun} from the queue`}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-darkTextMuted hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-transparent hover:border-rose-200/70 dark:hover:border-rose-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Trash2 className="w-3.5 h-3.5" />
      <span>Clear queue ({count})</span>
    </button>
  </div>
);
