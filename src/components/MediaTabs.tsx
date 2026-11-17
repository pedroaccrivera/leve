import React from 'react';
import type { MediaTab } from '../types';
import { cx } from '../utils/cx';

const TABS: { id: MediaTab; index: string; label: string }[] = [
  { id: 'images', index: '01', label: 'Images' },
  { id: 'videos', index: '02', label: 'Videos' },
  { id: 'favicon', index: '03', label: 'Favicon' },
];

interface MediaTabsProps {
  activeTab: MediaTab;
  onChange: (tab: MediaTab) => void;
  disabled?: boolean;
}

/**
 * Pinned media tabs.
 *
 * 144 px wide and the header's full height, so the fill reaches both the top
 * of the bar and its bottom rule with the label centred in the whole block
 * (the same vertical line as the wordmark and the theme switch). The active
 * tab fills with signal and carries the 2 px ink underline.
 */
export const MediaTabs: React.FC<MediaTabsProps> = ({ activeTab, onChange, disabled = false }) => (
  <div role="tablist" aria-label="Media type" className="flex h-full items-stretch gap-1">
    {TABS.map((tab) => {
      const active = tab.id === activeTab;
      return (
        <button
          key={tab.id}
          role="tab"
          type="button"
          aria-selected={active}
          disabled={disabled && !active}
          onClick={() => onChange(tab.id)}
          className={cx(
            'flex h-full w-36 shrink-0 items-center justify-center gap-2 border-b transition-colors duration-150',
            active
              ? 'border-ink border-b-2 bg-signal text-on-signal'
              : 'border-subtle hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60'
          )}
        >
          <span className={cx('t-mono', active ? 'text-on-signal' : 'text-muted')}>{tab.index}</span>
          <span className="t-control">{tab.label}</span>
        </button>
      );
    })}
  </div>
);
