import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  tabs?: React.ReactNode;
  /**
   * Scroll container the header overlays. Wheel events over the header are
   * forwarded to it so scrolling keeps working under the blur band.
   */
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
}

export const Header: React.FC<HeaderProps> = ({ tabs, scrollContainerRef }) => {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <header
      className="titlebar-drag-region absolute inset-x-0 top-0 z-30 select-none"
      onWheel={(event) => {
        const container = scrollContainerRef?.current;
        if (container) container.scrollTop += event.deltaY;
      }}
    >
      {/* Progressive blur backdrop: very strong at the top, gone at the bottom edge. */}
      <div className="app-header-blur" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="app-header-tint" aria-hidden="true" />

      <div className="app-header-grid pt-8 pb-4 px-8">
        <h1 className="justify-self-start text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-sans">
          leve
        </h1>

        {/* Center column is sized to the content column, so the tabs stay
            centered over the DropZone and the settings cards. */}
        <div className="min-w-0">{tabs}</div>

        <div className="no-drag flex items-center justify-end gap-2">
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
      </div>
    </header>
  );
};
