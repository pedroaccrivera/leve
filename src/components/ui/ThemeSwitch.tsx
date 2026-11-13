import React from 'react';
import { Sun } from 'lucide-react';
import { cx } from '../../utils/cx';

export interface ThemeSwitchProps {
  /** Name of the theme currently in use — the control toggles to the other. */
  themeName: 'Ink' | 'Paper';
  onToggle: () => void;
  className?: string;
}

/**
 * 44 × 44 bordered control carrying only the theme mark (the design's sun
 * drawing); the theme name lives in the accessible label.
 */
export const ThemeSwitch: React.FC<ThemeSwitchProps> = ({ themeName, onToggle, className }) => {
  const nextTheme = themeName === 'Ink' ? 'Paper' : 'Ink';

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
      className={cx(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-control bg-surface text-ink transition-colors duration-150 hover:bg-panel',
        className
      )}
    >
      <Sun className="h-4 w-4" strokeWidth={2} />
    </button>
  );
};
