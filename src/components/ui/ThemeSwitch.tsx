import React from 'react';
import { Sun } from 'lucide-react';
import { cx } from '../../utils/cx';

export interface ThemeSwitchProps {
  /** Name of the theme currently in use — the control shows where you are. */
  themeName: 'Ink' | 'Paper';
  onToggle: () => void;
  className?: string;
}

/** 104 × 44 bordered control: sun mark + current theme name. */
export const ThemeSwitch: React.FC<ThemeSwitchProps> = ({ themeName, onToggle, className }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={`Switch to ${themeName === 'Ink' ? 'Paper' : 'Ink'} theme`}
    className={cx(
      'flex h-11 w-[104px] shrink-0 items-center justify-center gap-2 rounded-md border border-control bg-surface px-3 py-2 t-control text-ink transition-colors duration-150 hover:bg-panel',
      className
    )}
  >
    <Sun className="h-4 w-4" strokeWidth={2} />
    <span>{themeName}</span>
  </button>
);
