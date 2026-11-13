import React from 'react';
import { Button } from './ui/Button';

interface QueueActionsProps {
  onSelectFiles: () => void;
  onSelectFolder: () => void;
  disabled?: boolean;
  /** Right-aligned summary, e.g. `12.4 MB total`. */
  total?: string;
}

/** `Add files` · `Add folder` with an optional queue total on the right. */
export const QueueActions: React.FC<QueueActionsProps> = ({
  onSelectFiles,
  onSelectFolder,
  disabled = false,
  total,
}) => (
  <div className="flex h-12 items-center gap-5">
    <Button variant="secondary" size="lg" className="w-[150px]" onClick={onSelectFiles} disabled={disabled}>
      Add files
    </Button>
    <Button variant="secondary" size="lg" className="w-[150px]" onClick={onSelectFolder} disabled={disabled}>
      Add folder
    </Button>
    {total && <span className="ml-auto t-mono text-muted">{total}</span>}
  </div>
);
