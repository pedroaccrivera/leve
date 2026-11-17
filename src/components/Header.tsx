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
 * traffic lights inside this bar and the bar itself is the drag region. Only
 * the visible controls opt out: the empty part of the right-hand column is
 * `pointer-events-none`, so a press there falls through to the header and
 * drags the window, while the control cluster stays `pointer-events-auto`.
 * The wordmark clears the lights through `--d-brand-offset` (0 outside macOS,
 * which keeps its native frame).
 *
 * The full stop is the accent, so the brand reads like the app icon (`l.`) and
 * follows the tone picked in the theme control.
 */
export const Header: React.FC<HeaderProps> = ({ tabs }) => {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <header className="titlebar-drag-region relative z-20 flex h-[var(--d-nav)] shrink-0 items-stretch justify-between bg-paper px-[var(--d-page-x)] after:absolute after:inset-x-0 after:bottom-0 after:-z-10 after:h-px after:bg-subtle after:content-['']">
      <div className="flex w-[360px] items-center pl-[var(--d-brand-offset)]">
        <h1 className="t-title text-ink" aria-label="leve">
          leve
          <span aria-hidden="true" className="text-[color:var(--c-brand-stop)]">
            .
          </span>
        </h1>
      </div>

      <div className="no-drag">{tabs}</div>

      <div className="pointer-events-none flex w-[360px] items-center justify-end">
        <div className="no-drag group pointer-events-auto flex items-center">
          <HueControl />
          <ThemeSwitch
            themeName={resolvedTheme === 'dark' ? 'Ink' : 'Paper'}
            onToggle={toggleTheme}
          />
        </div>
      </div>
    </header>
  );
};
