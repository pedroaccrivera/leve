import React from 'react';
import { CheckCircle, FolderOpen, ArrowRight, X } from 'lucide-react';
import type { BatchSummary } from '../types';
import { formatBytes } from '../utils/formatters';

interface SummaryModalProps {
  summary: BatchSummary | null;
  onClose: () => void;
  onOpenFolder?: () => void;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  summary,
  onClose,
  onOpenFolder,
}) => {
  if (!summary) return null;

  const seconds = (summary.durationMs / 1000).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Batch Complete!</h3>
            <p className="text-xs text-slate-400">
              Finished processing in {seconds}s
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block mb-1">Images Processed</span>
            <span className="text-lg font-bold text-white">
              {summary.processedCount} / {summary.totalImages}
            </span>
            {summary.failedCount > 0 && (
              <span className="text-[10px] text-rose-400 block mt-0.5">
                ({summary.failedCount} failed)
              </span>
            )}
          </div>

          <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block mb-1">Disk Space Saved</span>
            <span className="text-lg font-bold text-emerald-400">
              {formatBytes(summary.totalSavedBytes)}
            </span>
            <span className="text-[10px] text-emerald-300 block mt-0.5">
              {summary.percentageSaved}% reduction
            </span>
          </div>
        </div>

        {/* Size comparison bar */}
        <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-3 mb-6 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Original Total</span>
            <span className="font-mono text-slate-200">{formatBytes(summary.originalTotalBytes)}</span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500" />
          <div className="text-right">
            <span className="text-slate-400 block text-[11px]">New Total</span>
            <span className="font-mono text-emerald-400 font-semibold">{formatBytes(summary.newTotalBytes)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onOpenFolder && (
            <button
              onClick={onOpenFolder}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all"
            >
              <FolderOpen className="w-4 h-4 text-emerald-400" />
              Open Output Location
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
