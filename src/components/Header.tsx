import React from 'react';
import { ShieldCheck, Sparkles, Trash2 } from 'lucide-react';

interface HeaderProps {
  itemCount: number;
  onClear: () => void;
  isProcessing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  itemCount,
  onClear,
  isProcessing,
}) => {
  return (
    <header className="bg-slate-800/80 backdrop-blur border-b border-slate-700/60 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-bold">
          <Sparkles className="w-5 h-5 text-slate-950" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              leve
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              100% Offline & Safe
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Fast, private batch image resizer & compressor. No files ever leave your computer.
          </p>
        </div>
      </div>

      {itemCount > 0 && (
        <button
          onClick={onClear}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title="Clear queue"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear queue ({itemCount})
        </button>
      )}
    </header>
  );
};
