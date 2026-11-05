import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileImage,
  Globe,
  Loader2,
  Trash2,
} from 'lucide-react';
import type { FaviconConfig, FaviconItem } from '../types';
import { formatBytes, formatDimensions } from '../utils/formatters';

interface FaviconQueueProps {
  items: FaviconItem[];
  config: FaviconConfig;
  onRemoveItem: (id: string) => void;
  isProcessing: boolean;
}

const FaviconRow: React.FC<{
  item: FaviconItem;
  config: FaviconConfig;
  onRemove: () => void;
  disabled: boolean;
}> = ({ item, config, onRemove, disabled }) => {
  const [thumb, setThumb] = useState<string | null>(item.previewUrl || null);

  useEffect(() => {
    let isMounted = true;
    if (!thumb && window.electronAPI) {
      window.electronAPI.getImageThumbnail(item.path).then((data) => {
        if (isMounted && data) setThumb(data);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [item.path, thumb]);

  const baseName =
    config.nameMode === 'source'
      ? `${item.name.replace(/\.[^.]+$/, '')}.ico`
      : 'favicon.ico';

  const handleOpenDestination = () => {
    if (item.outputPath && window.electronAPI) {
      window.electronAPI.openInFolder(item.outputPath);
    }
  };

  return (
    <div className="flex items-center gap-3 p-2.5 bg-white dark:bg-[#182035] hover:bg-slate-50 dark:hover:bg-[#1e2740] border border-slate-200 dark:border-[#283254] rounded-xl transition-all group shadow-sm">
      {/* Thumbnail */}
      <div className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-[#121625] border border-slate-200 dark:border-[#263150] overflow-hidden flex-shrink-0 flex items-center justify-center">
        {thumb ? (
          <img
            src={thumb}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <FileImage className="w-5 h-5 text-slate-400 dark:text-slate-500" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate"
            title={item.path}
          >
            {item.name}
          </p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-[#131929] px-1.5 py-0.5 rounded border border-slate-200 dark:border-[#263150]">
            {formatBytes(item.size)}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-darkTextMuted">
          <span>{formatDimensions(item.originalWidth, item.originalHeight) || 'Original'}</span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
            {baseName}
          </span>
          {item.status === 'done' && item.generatedSizes?.length ? (
            <span
              className="text-emerald-600 dark:text-emerald-400 flex-shrink-0"
              title={`${item.generatedSizes.join(', ')} px`}
            >
              · {item.generatedSizes.length} sizes
            </span>
          ) : null}
        </div>

        {item.status === 'done' && item.skippedSizes?.length ? (
          <p
            className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5"
            title="Source image is too small for these sizes"
          >
            {item.skippedSizes.join('/')} px skipped (source too small)
          </p>
        ) : null}
      </div>

      {/* ICO size when done */}
      {item.status === 'done' && item.newSize !== undefined && (
        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#131929] px-2 py-0.5 rounded-full border border-slate-200 dark:border-[#263150]">
          {formatBytes(item.newSize)}
        </span>
      )}

      {/* Status & Actions */}
      <div className="flex items-center gap-1.5">
        {item.status === 'pending' && (
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-[#131929] border border-slate-200 dark:border-[#263150]">
            Pending
          </span>
        )}

        {item.status === 'processing' && (
          <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-500/10">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Generating</span>
          </div>
        )}

        {item.status === 'done' && (
          <button
            type="button"
            onClick={handleOpenDestination}
            className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all cursor-pointer"
            title="Show file in folder"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Show</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </button>
        )}

        {item.status === 'error' && (
          <div
            className="flex items-center gap-1 text-xs text-rose-500 font-medium px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-500/10"
            title={item.error}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Failed</span>
          </div>
        )}

        {item.status !== 'processing' && (
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
            title="Remove from queue"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export const FaviconQueue: React.FC<FaviconQueueProps> = ({
  items,
  config,
  onRemoveItem,
  isProcessing,
}) => {
  const totalOriginalBytes = items.reduce((acc, item) => acc + (item.size || 0), 0);

  return (
    <div className="bg-slate-50/70 dark:bg-[#141a2c]/80 border border-slate-200 dark:border-[#283254] rounded-2xl p-3.5 flex flex-col flex-1 max-h-[320px]">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#26304e] mb-2 px-1">
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Selected Images / Logos ({items.length})
          </span>
          <span className="text-xs text-slate-500 dark:text-darkTextMuted font-mono">
            • {formatBytes(totalOriginalBytes)} total
          </span>
        </div>
      </div>

      <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
        {items.map((item) => (
          <FaviconRow
            key={item.id}
            item={item}
            config={config}
            onRemove={() => onRemoveItem(item.id)}
            disabled={isProcessing}
          />
        ))}
      </div>
    </div>
  );
};
