import React, { useState, useEffect } from 'react';
import { Upload, FolderPlus, Plus, AlertTriangle } from 'lucide-react';
import type { ImageItem } from '../types';

interface DropZoneProps {
  onAddItems: (items: ImageItem[]) => void;
  isCompact?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onAddItems, isCompact = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasElectronAPI, setHasElectronAPI] = useState(true);

  useEffect(() => {
    const available = typeof window !== 'undefined' && Boolean(window.electronAPI);
    setHasElectronAPI(available);
  }, []);

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
        .map((f: any) => {
          if (window.electronAPI?.getPathForFile) {
            return window.electronAPI.getPathForFile(f);
          }
          return f.path;
        })
        .filter(Boolean);

      if (paths.length && window.electronAPI) {
        const items = await window.electronAPI.scanDroppedPaths(paths);
        onAddItems(items);
      }
    } catch (err) {
      console.error('[DropZone] Error dropping files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFiles = async () => {
    try {
      setIsLoading(true);
      if (window.electronAPI) {
        const items = await window.electronAPI.selectFiles();
        if (items && items.length) {
          onAddItems(items);
        }
      }
    } catch (err) {
      console.error('[DropZone] Error selecting files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFolder = async () => {
    try {
      setIsLoading(true);
      if (window.electronAPI) {
        const items = await window.electronAPI.selectFolder();
        if (items && items.length) {
          onAddItems(items);
        }
      }
    } catch (err) {
      console.error('[DropZone] Error selecting folder:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {!hasElectronAPI && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-500 dark:text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-500" />
          <span>Electron engine connecting...</span>
        </div>
      )}

      {isCompact ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border border-dashed rounded-xl py-3 px-4 text-center transition-all flex items-center justify-between ${
            isDragging
              ? 'border-brand-500 bg-brand-500/10'
              : 'border-slate-300 dark:border-darkBorder bg-slate-100/60 dark:bg-darkCard/50 hover:border-slate-400 dark:hover:border-slate-600'
          }`}
        >
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-darkTextMuted">
            <Upload className="w-4 h-4 text-brand-500" />
            <span>Drop more images or folders here</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectFiles}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-darkCard hover:bg-slate-50 dark:hover:bg-darkCardHover border border-slate-300 dark:border-darkBorder text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Files
            </button>
            <button
              type="button"
              onClick={handleSelectFolder}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-darkCard hover:bg-slate-50 dark:hover:bg-darkCardHover border border-slate-300 dark:border-darkBorder text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              Add Folder
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border border-dashed rounded-2xl py-12 px-6 text-center transition-all flex flex-col items-center justify-center ${
            isDragging
              ? 'border-brand-500 bg-brand-500/10 scale-[0.99]'
              : 'border-slate-300 dark:border-[#283556] bg-slate-50/50 dark:bg-darkCard/30 hover:border-slate-400 dark:hover:border-[#384a77]'
          }`}
        >
          {/* Upload Icon */}
          <div className="w-12 h-12 flex items-center justify-center text-slate-400 dark:text-slate-400 mb-3">
            <Upload className="w-8 h-8 stroke-[1.75]" />
          </div>

          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
            Drag & drop images or folders here
          </h3>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSelectFiles}
              disabled={isLoading}
              className="px-4 py-2 bg-white dark:bg-[#222b44] hover:bg-slate-100 dark:hover:bg-[#2b3656] text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#313e63] shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              Select Files
            </button>
            <button
              type="button"
              onClick={handleSelectFolder}
              disabled={isLoading}
              className="px-4 py-2 bg-white dark:bg-[#222b44] hover:bg-slate-100 dark:hover:bg-[#2b3656] text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-200 dark:border-[#313e63] shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              Select Folder
            </button>
          </div>

          {isLoading && (
            <div className="mt-3 text-xs text-brand-500 animate-pulse">
              Scanning files...
            </div>
          )}
        </div>
      )}
    </div>
  );
};
