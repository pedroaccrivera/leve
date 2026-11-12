import React from 'react';
import { FileImage, FileVideo, Globe } from 'lucide-react';
import type { MediaTab } from '../types';

interface MediaTabsProps {
  activeTab: MediaTab;
  onChange: (tab: MediaTab) => void;
  disabled?: boolean;
  className?: string;
}

const TABS = [
  { id: 'images', label: 'Images', Icon: FileImage },
  { id: 'videos', label: 'Videos', Icon: FileVideo },
  { id: 'favicon', label: 'Favicon', Icon: Globe },
] as const;

export const MediaTabs: React.FC<MediaTabsProps> = ({
  activeTab,
  onChange,
  disabled = false,
  className = '',
}) => {
  return (
    <div
      role="tablist"
      aria-label="Media type"
      className={`no-drag w-full max-w-[640px] flex items-center gap-1 p-1 bg-slate-200/60 dark:bg-[#1a2138] border border-slate-200 dark:border-[#283254] rounded-xl ${className}`}
    >
      {TABS.map(({ id, label, Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:cursor-not-allowed ${
              active
                ? 'bg-white dark:bg-[#283556] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-darkTextMuted hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
};
