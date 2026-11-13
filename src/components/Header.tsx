import React from 'react';
import { ThemeSwitch } from './ui/ThemeSwitch';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  tabs?: React.ReactNode;
}

/**
 * 72 px navigation bar: wordmark (left) · pinned media tabs (centre) ·
 * privacy note and theme switch (right). The bar is the window drag region on
 * macOS, so interactive parts opt out with `no-drag`.
 */
export const Header: React.FC<HeaderProps> = ({ tabs }) => {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <header className="titlebar-drag-region relative z-20 flex h-[var(--d-nav)] shrink-0 items-center justify-between border-b border-subtle bg-paper px-[var(--d-page-x)]">
      <div className="flex w-[360px] items-center">
        <h1 className="t-title text-ink">leve</h1>
      </div>

      <div className="no-drag">{tabs}</div>

      <div className="no-drag flex w-[360px] items-center justify-end">
        <ThemeSwitch
          themeName={resolvedTheme === 'dark' ? 'Ink' : 'Paper'}
          onToggle={toggleTheme}
        />
      </div>
    </header>
  );
};
