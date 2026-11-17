import React from 'react';
import { ThemeSwitch } from './ui/ThemeSwitch';
import { HueControl } from './ui/HueControl';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  tabs?: React.ReactNode;
}

/**
 * The window bar and the navigation bar in one.
 *
 * macOS runs frameless (`titleBarStyle: 'hiddenInset'`), so the OS draws the
 * traffic lights inside this 72 px bar and the bar itself is the drag region;
 * the interactive parts opt out with `no-drag`. The wordmark clears the lights
 * through `--d-brand-offset` (0 outside macOS, which keeps its native frame).
 *
 * The full stop is the accent, so the brand reads like the app icon (`l.`) and
 * follows the tone picked in the theme control.
 */
export const Header: React.FC<HeaderProps> = ({ tabs }) => {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <header className="titlebar-drag-region relative z-20 flex h-[var(--d-nav)] shrink-0 items-stretch justify-between border-b border-subtle bg-paper px-[var(--d-page-x)]">
      <div className="flex w-[360px] items-center pl-[var(--d-brand-offset)]">
        <h1 className="t-title text-ink" aria-label="leve">
          leve
          <span aria-hidden="true" className="text-[color:var(--c-brand-stop)]">
            .
          </span>
        </h1>
      </div>

      <div className="no-drag -mb-px">{tabs}</div>

      <div className="no-drag group flex w-[360px] items-center justify-end gap-2">
        <HueControl />
        <ThemeSwitch
          themeName={resolvedTheme === 'dark' ? 'Ink' : 'Paper'}
          onToggle={toggleTheme}
        />
      </div>
    </header>
  );
};
