import React, { useState } from 'react';
import {
  Loader2,
  FolderOpen,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import type {
  ImageItem,
  ResizeConfig,
  ResizePreset,
  BatchSummary,
} from './types';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { SettingsPanel } from './components/SettingsPanel';
import { ImageQueue } from './components/ImageQueue';
import { SummaryModal } from './components/SummaryModal';

const DEFAULT_PRESETS: ResizePreset[] = [
  { id: 'web-800', name: 'Web Small', width: 800 },
  { id: 'hd-1280', name: 'HD', width: 1280 },
  { id: 'fhd-1920', name: 'Full HD', width: 1920 },
  { id: '2k-2560', name: '2K QHD', width: 2560 },
  { id: '4k-3840', name: '4K UHD', width: 3840 },
];

const PRESETS_STORAGE_KEY = 'user_custom_resize_presets';

export const App: React.FC = () => {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [summary, setSummary] = useState<BatchSummary | null>(null);

  // User configurable options
  const [config, setConfig] = useState<ResizeConfig>({
    targetWidth: 1920,
    withoutEnlargement: true,
    compressionLevel: 'balanced',
    stripMetadata: false, // In default UI: "Keep metadata" is checked by default
    outputFormat: 'original',
    destinationMode: 'subfolder',
    subfolderName: 'resized',
    suffix: '-resized',
    customFolderPath: '',
  });

  // Presets management
  const [presets, setPresets] = useState<ResizePreset[]>(() => {
    try {
      const saved = localStorage.getItem(PRESETS_STORAGE_KEY);
      if (saved) {
        const customPresets: ResizePreset[] = JSON.parse(saved);
        return [...DEFAULT_PRESETS, ...customPresets];
      }
    } catch (e) {
      console.error('Error loading custom presets:', e);
    }
    return DEFAULT_PRESETS;
  });

  const handleAddPreset = (name: string, width: number) => {
    const newPreset: ResizePreset = {
      id: `custom_${Date.now()}`,
      name,
      width,
      isCustom: true,
    };
    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    try {
      const customOnly = updatedPresets.filter((p) => p.isCustom);
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(customOnly));
    } catch (e) {
      console.error('Error saving custom presets:', e);
    }
  };

  const handleDeletePreset = (id: string) => {
    const updatedPresets = presets.filter((p) => p.id !== id);
    setPresets(updatedPresets);
    try {
      const customOnly = updatedPresets.filter((p) => p.isCustom);
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(customOnly));
    } catch (e) {
      console.error('Error saving custom presets:', e);
    }
  };

  const handleAddItems = (newItems: ImageItem[]) => {
    setItems((prev) => {
      // Deduplicate by path
      const existingPaths = new Set(prev.map((i) => i.path));
      const filtered = newItems.filter((i) => !existingPaths.has(i.path));
      return [...prev, ...filtered];
    });
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleClearAll = () => {
    setItems([]);
    setSummary(null);
  };

  const handleStartProcessing = async () => {
    if (!items.length || isProcessing || !window.electronAPI) return;

    setIsProcessing(true);
    const startTime = Date.now();
    let processedCount = 0;
    let failedCount = 0;
    let originalTotalBytes = 0;
    let newTotalBytes = 0;

    setProgress({ current: 0, total: items.length });

    // Process sequentially to keep memory usage low and UI responsive
    for (let i = 0; i < items.length; i++) {
      const currentItem = items[i];
      originalTotalBytes += currentItem.size || 0;

      // Update state to processing
      setItems((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, status: 'processing' } : item
        )
      );
      setProgress({ current: i + 1, total: items.length });

      const result = await window.electronAPI.processImage(currentItem, config);

      if (result.success) {
        processedCount++;
        newTotalBytes += result.newSize || 0;
        setItems((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: 'done',
                  outputPath: result.outputPath,
                  newSize: result.newSize,
                  newWidth: result.newWidth,
                  newHeight: result.newHeight,
                }
              : item
          )
        );
      } else {
        failedCount++;
        setItems((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: 'error',
                  error: result.error,
                }
              : item
          )
        );
      }
    }

    const durationMs = Date.now() - startTime;
    const totalSavedBytes = Math.max(0, originalTotalBytes - newTotalBytes);
    const percentageSaved =
      originalTotalBytes > 0
        ? Math.round((totalSavedBytes / originalTotalBytes) * 100)
        : 0;

    setSummary({
      totalImages: items.length,
      processedCount,
      failedCount,
      originalTotalBytes,
      newTotalBytes,
      totalSavedBytes,
      percentageSaved,
      durationMs,
    });

    setIsProcessing(false);
  };

  const handleOpenOutputFolder = () => {
    if (!window.electronAPI) return;
    if (config.destinationMode === 'custom_folder' && config.customFolderPath) {
      window.electronAPI.openInFolder(config.customFolderPath);
      return;
    }
    const firstDone = items.find((i) => i.status === 'done' && i.outputPath);
    if (firstDone?.outputPath) {
      window.electronAPI.openInFolder(firstDone.outputPath);
    }
  };

  const doneCount = items.filter((i) => i.status === 'done').length;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-darkBg text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Header
        itemCount={items.length}
        onClear={handleClearAll}
        isProcessing={isProcessing}
      />

      <main className="flex-1 overflow-y-auto px-8 pb-10 flex flex-col items-center">
        <div className="w-full max-w-2xl flex flex-col gap-6">
          {/* Drop & Upload Area */}
          <DropZone
            onAddItems={handleAddItems}
            isCompact={items.length > 0}
          />

          {/* Queue of selected images if any */}
          {items.length > 0 && (
            <ImageQueue
              items={items}
              config={config}
              onRemoveItem={handleRemoveItem}
              isProcessing={isProcessing}
            />
          )}

          {/* Settings Panel */}
          <SettingsPanel
            config={config}
            onChangeConfig={setConfig}
            presets={presets}
            onAddPreset={handleAddPreset}
            onDeletePreset={handleDeletePreset}
            disabled={isProcessing}
          />

          {/* Processing and Status / Open Folder */}
          {doneCount > 0 && !isProcessing && (
            <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>{doneCount} images successfully resized!</span>
              </div>
              <button
                type="button"
                onClick={handleOpenOutputFolder}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Open Folder</span>
              </button>
            </div>
          )}

          {/* Primary CTA Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleStartProcessing}
              disabled={isProcessing || items.length === 0}
              className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                items.length === 0
                  ? 'bg-slate-200 dark:bg-[#1e263f] text-slate-400 dark:text-[#4f5f8b] cursor-not-allowed border border-transparent'
                  : isProcessing
                  ? 'bg-blue-600 text-white cursor-wait opacity-90'
                  : 'bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white shadow-blue-600/25 border border-blue-500'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>
                    Resizing {progress.current} of {progress.total} images...
                  </span>
                </>
              ) : items.length === 0 ? (
                <span>Resize Images</span>
              ) : doneCount > 0 ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Re-run Resize ({items.length} Images)</span>
                </>
              ) : (
                <span>Resize {items.length} {items.length === 1 ? 'Image' : 'Images'}</span>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Summary Modal on completion */}
      <SummaryModal
        summary={summary}
        onClose={() => setSummary(null)}
        onOpenFolder={handleOpenOutputFolder}
      />
    </div>
  );
};
