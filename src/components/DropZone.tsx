import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import type { ImageItem, VideoItem } from '../types';
import { cx } from '../utils/cx';
import { Button } from './ui/Button';

export type DropMediaType = 'images' | 'videos' | 'favicon';

/**
 * Native pickers shared by the drop surface and the queue action row.
 */
export const useFilePickers = (
  mediaType: DropMediaType,
  onAddItems: (items: ImageItem[]) => void,
  onAddVideoItems?: (items: VideoItem[]) => void
) => {
  const [isLoading, setIsLoading] = useState(false);

  const selectFiles = async () => {
    try {
      setIsLoading(true);
      if (!window.electronAPI) return;
      if (mediaType === 'videos') {
        const items = await window.electronAPI.selectVideoFiles();
        if (items?.length) onAddVideoItems?.(items);
      } else {
        const items = await window.electronAPI.selectFiles();
        if (items?.length) onAddItems(items);
      }
    } catch (err) {
      console.error('[DropZone] Error selecting files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectFolder = async () => {
    try {
      setIsLoading(true);
      if (!window.electronAPI) return;
      if (mediaType === 'videos') {
        const items = await window.electronAPI.selectVideoFolder();
        if (items?.length) onAddVideoItems?.(items);
      } else {
        const items = await window.electronAPI.selectFolder();
        if (items?.length) onAddItems(items);
      }
    } catch (err) {
      console.error('[DropZone] Error selecting folder:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return { selectFiles, selectFolder, isLoading };
};

interface DropZoneProps {
  onAddItems: (items: ImageItem[]) => void;
  onAddVideoItems?: (items: VideoItem[]) => void;
  mediaType?: DropMediaType;
  /** `large` = empty state, `compact` = dashed "add by dropping" strip. */
  variant?: 'large' | 'compact';
  title?: string;
  subtitle?: string;
  /** The large variant shows the 40 px upload mark (Images only in the design). */
  showIcon?: boolean;
  compactTitle?: string;
  compactSubtitle?: string;
}

/**
 * Drag-and-drop surface with the native file/folder pickers.
 * Visual language: dashed `control` border on a `surface` fill, square.
 */
export const DropZone: React.FC<DropZoneProps> = ({
  onAddItems,
  onAddVideoItems,
  mediaType = 'images',
  variant = 'large',
  title,
  subtitle,
  showIcon = true,
  compactTitle,
  compactSubtitle,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { selectFiles, selectFolder, isLoading: isPicking } = useFilePickers(
    mediaType,
    onAddItems,
    onAddVideoItems
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (!files.length) return;

    try {
      setIsLoading(true);
      const paths = files
        .map((f: File & { path?: string }) => {
          if (window.electronAPI?.getPathForFile) {
            return window.electronAPI.getPathForFile(f);
          }
          return f.path;
        })
        .filter(Boolean) as string[];

      if (paths.length && window.electronAPI) {
        if (mediaType === 'videos') {
          const items = await window.electronAPI.scanDroppedVideoPaths(paths);
          onAddVideoItems?.(items);
        } else {
          const items = await window.electronAPI.scanDroppedPaths(paths);
          onAddItems(items);
        }
      }
    } catch (err) {
      console.error('[DropZone] Error dropping files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const dropHandlers = {
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop,
  };

  if (variant === 'compact') {
    return (
      <div
        {...dropHandlers}
        className={cx(
          'flex h-[100px] items-center gap-4 border border-dashed bg-surface px-6 transition-colors',
          isDragging ? 'border-ink' : 'border-control'
        )}
      >
        <Upload className="h-6 w-6 shrink-0 text-ink" strokeWidth={2} />
        <div className="flex flex-col gap-1">
          <span className="t-control text-ink">{compactTitle}</span>
          <span className="t-small text-muted">{compactSubtitle}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      {...dropHandlers}
      className={cx(
        'flex h-[320px] flex-col items-center justify-center gap-5 border border-dashed bg-surface transition-colors',
        isDragging ? 'border-ink' : 'border-control'
      )}
    >
      {showIcon && <Upload className="h-10 w-10 text-ink" strokeWidth={2} />}
      <h3 className="t-title text-ink">{title}</h3>
      <p className="t-body text-muted">{subtitle}</p>
      <div className="flex w-[344px] items-start gap-3">
        <Button variant="primary" size="lg" className="w-[166px]" onClick={selectFiles} disabled={isLoading || isPicking}>
          Select files
        </Button>
        <Button variant="secondary" size="lg" className="w-[166px]" onClick={selectFolder} disabled={isLoading || isPicking}>
          Select folder
        </Button>
      </div>
      {(isLoading || isPicking) && <span className="t-small text-muted">Scanning files…</span>}
    </div>
  );
};
