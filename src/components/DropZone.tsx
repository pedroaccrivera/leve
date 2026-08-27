import React, { useState, useEffect } from 'react';
import { UploadCloud, FolderPlus, FileImage, Plus, AlertTriangle } from 'lucide-react';
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
    console.log('[DropZone] Initialized. window.electronAPI available:', available, window.electronAPI);
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

    console.log('[DropZone] handleDrop event fired. dataTransfer files:', e.dataTransfer.files.length);
    const files = Array.from(e.dataTransfer.files);
    if (!files.length) return;

    try {
      setIsLoading(true);
      const paths = files
        .map((f: any) => {
          if (window.electronAPI?.getPathForFile) {
            const p = window.electronAPI.getPathForFile(f);
            console.log('[DropZone] Got path via getPathForFile:', p);
            return p;
          }
          console.log('[DropZone] Got path via f.path:', f.path);
          return f.path;
        })
        .filter(Boolean);

      console.log('[DropZone] Extracted paths to scan:', paths);
      if (paths.length && window.electronAPI) {
        const items = await window.electronAPI.scanDroppedPaths(paths);
        console.log('[DropZone] scanDroppedPaths returned items:', items.length);
        onAddItems(items);
      } else {
        console.warn('[DropZone] No valid paths or electronAPI missing');
      }
    } catch (err) {
      console.error('[DropZone] Error dropping files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFiles = async () => {
    console.log('[DropZone] handleSelectFiles clicked. window.electronAPI:', window.electronAPI);
    try {
      setIsLoading(true);
      if (window.electronAPI) {
        const items = await window.electronAPI.selectFiles();
        console.log('[DropZone] selectFiles returned items:', items);
        if (items && items.length) {
          onAddItems(items);
        }
      } else {
        console.error('[DropZone] window.electronAPI is undefined!');
      }
    } catch (err) {
      console.error('[DropZone] Error selecting files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFolder = async () => {
    console.log('[DropZone] handleSelectFolder clicked. window.electronAPI:', window.electronAPI);
    try {
      setIsLoading(true);
      if (window.electronAPI) {
        const items = await window.electronAPI.selectFolder();
        console.log('[DropZone] selectFolder returned items:', items);
        if (items && items.length) {
          onAddItems(items);
        }
      } else {
        console.error('[DropZone] window.electronAPI is undefined!');
      }
    } catch (err) {
      console.error('[DropZone] Error selecting folder:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {!hasElectronAPI && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>
            Connecting to local background engine... Please check the DevTools Console tab for diagnostics.
          </span>
        </div>
      )}

      {isCompact ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
            isDragging
              ? 'border-emerald-400 bg-emerald-500/10'
              : 'border-slate-700 hover:border-slate-600 bg-slate-800/40'
          }`}
        >
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleSelectFiles}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-200 text-xs font-medium rounded-lg transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Images
            </button>
            <button
              onClick={handleSelectFolder}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-200 text-xs font-medium rounded-lg transition-all cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              Add Folder
            </button>
            <span className="text-xs text-slate-400">or drop more files here</span>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all flex flex-col items-center justify-center min-h-[340px] ${
            isDragging
              ? 'border-emerald-400 bg-emerald-500/10 scale-[0.99]'
              : 'border-slate-700 hover:border-slate-600 bg-slate-800/30'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-emerald-400 mb-4 shadow-xl">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-medium text-slate-200 mb-1">
            Drag & drop images or folders here
          </h3>
          <p className="text-sm text-slate-400 max-w-sm mb-6">
            Supports JPG, PNG, WebP, AVIF, TIFF, GIF, and SVG files. Entire directories are scanned automatically.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectFiles}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-sm font-medium rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <FileImage className="w-4 h-4" />
              Choose Images
            </button>
            <button
              onClick={handleSelectFolder}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              Choose Folder
            </button>
          </div>

          {isLoading && (
            <div className="mt-4 text-xs text-emerald-400 animate-pulse">
              Scanning images...
            </div>
          )}
        </div>
      )}
    </div>
  );
};
