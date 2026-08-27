import React from 'react';
import { Sun, Moon, Trash2, ShieldCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

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
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <header className="titlebar-drag-region pt-8 pb-4 px-8 flex items-start justify-between select-none">
      <div className="flex flex-col">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-sans">
            leve
          </h1>
          <span className="no-drag inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <ShieldCheck className="w-3 h-3" />
            100% Local & Offline
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-darkTextMuted mt-0.5">
          Resize and compress images locally
        </p>
      </div>

      <div className="no-drag flex items-center gap-2">
        {itemCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-slate-200 dark:border-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Clear all images in queue"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear ({itemCount})</span>
          </button>
        )}

        {/* Theme Switcher */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-slate-200/70 hover:bg-slate-300 dark:bg-darkCard hover:dark:bg-darkCardHover border border-slate-300 dark:border-darkBorder text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-sm"
          title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700 hover:-rotate-12 transition-transform" />
          )}
        </button>
      </div>
    </header>
  );
};
