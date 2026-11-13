import React from 'react';
import { FolderOpen } from 'lucide-react';
import { cx } from '../../utils/cx';

export interface FolderPickerFieldProps {
  /** Chosen folder — one path applies to the whole batch. */
  path?: string;
  /** Opens the native picker. Called only from an explicit click. */
  onPick: () => void;
  disabled?: boolean;
  className?: string;
  /** Placeholder while no folder has been chosen yet. */
  placeholder?: string;
}

/**
 * Destination field for `custom_folder`.
 *
 * A deliberate choice, not a per-file prompt: the picker opens when the user
 * picks the option or clicks this field, and the chosen folder is stored once
 * in the recipe, so every file in the batch lands in the same place.
 */
export const FolderPickerField: React.FC<FolderPickerFieldProps> = ({
  path,
  onPick,
  disabled = false,
  className,
  placeholder = 'Choose folder…',
}) => (
  <button
    type="button"
    onClick={onPick}
    disabled={disabled}
    title={path || placeholder}
    className={cx(
      'flex h-[var(--d-control)] w-full items-center gap-2 rounded-md border border-control bg-surface px-2.5 text-left transition-colors',
      disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-panel',
      className
    )}
  >
    <FolderOpen className="h-4 w-4 shrink-0 text-muted" strokeWidth={2} />
    <span className={cx('t-control truncate', path ? 'text-ink' : 'text-muted')}>
      {path || placeholder}
    </span>
  </button>
);
