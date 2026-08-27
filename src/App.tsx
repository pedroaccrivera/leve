import React, { useState } from 'react';
import {
  Play,
  Loader2,
  FolderOpen,
  CheckCircle2,
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
    stripMetadata: true,
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

    // Process sequentially to keep memory usage low and UI smooth
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
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Header
        itemCount={items.length}
        onClear={handleClearAll}
        isProcessing={isProcessing}
      />

      <main className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 max-w-7xl mx-auto w-full">
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
            <DropZone onAddItems={handleAddItems} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
            {/* Left Column: Settings Panel */}
            <div className="lg:col-span-5 space-y-4">
              <SettingsPanel
                config={config}
                onChangeConfig={setConfig}
                presets={presets}
                onAddPreset={handleAddPreset}
                onDeletePreset={handleDeletePreset}
                disabled={isProcessing}
              />
            </div>

            {/* Right Column: Queue & Processing */}
            <div className="lg:col-span-7 flex flex-col gap-4 flex-1">
              <DropZone onAddItems={handleAddItems} isCompact />

              <ImageQueue
                items={items}
                config={config}
                onRemoveItem={handleRemoveItem}
                isProcessing={isProcessing}
              />

              {/* Action Bar */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xl sticky bottom-0 z-20">
                <div className="text-xs text-slate-400">
                  {isProcessing ? (
                    <div className="flex items-center gap-2 text-emerald-400 font-medium">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        Processing {progress.current} of {progress.total} images...
                      </span>
                    </div>
                  ) : doneCount > 0 ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{doneCount} images successfully resized</span>
                    </div>
                  ) : (
                    <span>
                      Ready to resize {items.length} {items.length === 1 ? 'image' : 'images'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {doneCount > 0 && !isProcessing && (
                    <button
                      onClick={handleOpenOutputFolder}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
                    >
                      <FolderOpen className="w-4 h-4 text-emerald-400" />
                      Open Folder
                    </button>
                  )}

                  <button
                    onClick={handleStartProcessing}
                    disabled={isProcessing || items.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>
                          {doneCount > 0 ? 'Re-run Resize' : `Resize ${items.length} Images`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Summary Modal */}
      <SummaryModal
        summary={summary}
        onClose={() => setSummary(null)}
        onOpenFolder={handleOpenOutputFolder}
      />
    </div>
  );
};
