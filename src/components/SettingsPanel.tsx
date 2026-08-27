import React, { useState } from 'react';
import {
  Sliders,
  BookmarkPlus,
  Trash2,
  Lock,
  FolderTree,
  FileText,
  FolderDown,
  Shield,
} from 'lucide-react';
import type {
  ResizeConfig,
  ResizePreset,
  CompressionLevel,
  OutputFormat,
} from '../types';

interface SettingsPanelProps {
  config: ResizeConfig;
  onChangeConfig: (newConfig: ResizeConfig) => void;
  presets: ResizePreset[];
  onAddPreset: (name: string, width: number) => void;
  onDeletePreset: (id: string) => void;
  disabled?: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  config,
  onChangeConfig,
  presets,
  onAddPreset,
  onDeletePreset,
  disabled = false,
}) => {
  const [newPresetName, setNewPresetName] = useState('');
  const [isSavingPreset, setIsSavingPreset] = useState(false);

  const handleWidthChange = (val: number) => {
    onChangeConfig({
      ...config,
      targetWidth: Math.max(1, Math.min(10000, val)),
    });
  };

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim() || !config.targetWidth) return;
    onAddPreset(newPresetName.trim(), config.targetWidth);
    setNewPresetName('');
    setIsSavingPreset(false);
  };

  const handleSelectFolder = async () => {
    if (!window.electronAPI) return;
    const selected = await window.electronAPI.selectDestinationFolder();
    if (selected) {
      onChangeConfig({
        ...config,
        destinationMode: 'custom_folder',
        customFolderPath: selected,
      });
    }
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-6">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-700/60 text-slate-200 font-medium text-sm">
        <Sliders className="w-4 h-4 text-emerald-400" />
        <span>Resize & Compression Settings</span>
      </div>

      {/* 1. Target Width & Presets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Target Width (Pixels)
          </label>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <Lock className="w-3 h-3" />
            <span>Height auto-calculated to maintain proportions</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="number"
              min="1"
              max="10000"
              value={config.targetWidth || ''}
              onChange={(e) => handleWidthChange(parseInt(e.target.value, 10) || 0)}
              disabled={disabled}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-medium text-base focus:outline-none focus:border-emerald-500 transition-all disabled:opacity-50"
              placeholder="e.g. 1920"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium pointer-events-none">
              px
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsSavingPreset(!isSavingPreset)}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-700/70 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-600/60 transition-all whitespace-nowrap"
            title="Save this width as a reusable preset"
          >
            <BookmarkPlus className="w-4 h-4 text-emerald-400" />
            Save Preset
          </button>
        </div>

        {/* Modal/Input to save custom preset */}
        {isSavingPreset && (
          <form
            onSubmit={handleSavePreset}
            className="p-3 bg-slate-900/90 rounded-xl border border-emerald-500/30 flex items-center gap-2 animate-in fade-in duration-150"
          >
            <input
              type="text"
              autoFocus
              placeholder="Preset Name (e.g. Social Media, Blog Hero)"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!newPresetName.trim()}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-all"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsSavingPreset(false)}
              className="px-2.5 py-1.5 text-slate-400 hover:text-slate-200 text-xs font-medium rounded-lg"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Presets Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-slate-400 mr-1">Presets:</span>
          {presets.map((preset) => {
            const isSelected = config.targetWidth === preset.width;
            return (
              <div
                key={preset.id}
                className={`group inline-flex items-center rounded-lg text-xs transition-all border ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-medium'
                    : 'bg-slate-900/60 text-slate-300 border-slate-700/80 hover:bg-slate-700/60'
                }`}
              >
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleWidthChange(preset.width)}
                  className="px-2.5 py-1"
                >
                  {preset.name} ({preset.width}px)
                </button>
                {preset.isCustom && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onDeletePreset(preset.id)}
                    className="pr-2 pl-1 py-1 text-slate-500 hover:text-rose-400 transition-colors"
                    title={`Delete custom preset "${preset.name}"`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Option: Don't enlarge */}
        <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={config.withoutEnlargement}
            onChange={(e) =>
              onChangeConfig({ ...config, withoutEnlargement: e.target.checked })
            }
            disabled={disabled}
            className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700 focus:ring-emerald-500 focus:ring-offset-slate-900"
          />
          <span className="text-xs text-slate-300">
            Don't upscale if image is already smaller than target width
          </span>
        </label>
      </div>

      {/* 2. Compression Level (Human Friendly) */}
      <div className="space-y-2.5">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>Compression Method</span>
          <span className="text-[11px] font-normal text-slate-400">Clear & plain language</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(
            [
              {
                id: 'balanced',
                title: 'Balanced',
                badge: 'Recommended',
                desc: 'Great quality with substantial file size reduction',
              },
              {
                id: 'light',
                title: 'Maximum Quality',
                badge: 'Light Compression',
                desc: 'Preserves fine details, best for photography & portfolios',
              },
              {
                id: 'aggressive',
                title: 'Smallest File Size',
                badge: 'Aggressive',
                desc: 'Maximum size reduction for websites, messaging & emails',
              },
              {
                id: 'lossless',
                title: 'Lossless',
                badge: 'No Quality Loss',
                desc: 'Zero degradation (ideal for PNGs and icons)',
              },
            ] as const
          ).map((opt) => {
            const isSelected = config.compressionLevel === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                disabled={disabled}
                onClick={() =>
                  onChangeConfig({
                    ...config,
                    compressionLevel: opt.id as CompressionLevel,
                  })
                }
                className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/30'
                    : 'bg-slate-900/60 border-slate-700/80 text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">{opt.title}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      isSelected
                        ? 'bg-emerald-500/30 text-emerald-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {opt.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{opt.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Metadata Removal Checkbox */}
        <div className="pt-1">
          <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/80 cursor-pointer hover:bg-slate-900 transition-all select-none">
            <input
              type="checkbox"
              checked={config.stripMetadata}
              onChange={(e) =>
                onChangeConfig({ ...config, stripMetadata: e.target.checked })
              }
              disabled={disabled}
              className="w-4 h-4 rounded text-emerald-600 bg-slate-800 border-slate-700 focus:ring-emerald-500 focus:ring-offset-slate-900"
            />
            <div className="flex items-center gap-2 flex-1">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <div>
                <span className="text-xs font-medium text-slate-200 block">
                  Strip metadata (EXIF, GPS, camera model)
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Improves privacy and further shaves off unnecessary file size.
                </span>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* 3. Output Format */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Output Format
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              { id: 'original', label: 'Keep Original' },
              { id: 'jpeg', label: 'JPG' },
              { id: 'png', label: 'PNG' },
              { id: 'webp', label: 'WebP' },
            ] as const
          ).map((fmt) => {
            const isSelected = config.outputFormat === fmt.id;
            return (
              <button
                key={fmt.id}
                type="button"
                disabled={disabled}
                onClick={() =>
                  onChangeConfig({
                    ...config,
                    outputFormat: fmt.id as OutputFormat,
                  })
                }
                className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-900/60 border-slate-700/80 text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                {fmt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Output Destination */}
      <div className="space-y-3 pt-1">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>Destination & Output Location</span>
        </label>

        <div className="space-y-2">
          {/* Subfolder mode */}
          <label
            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              config.destinationMode === 'subfolder'
                ? 'bg-emerald-500/10 border-emerald-500/60 text-white'
                : 'bg-slate-900/60 border-slate-700/80 text-slate-300 hover:bg-slate-800/80'
            }`}
          >
            <input
              type="radio"
              name="destinationMode"
              checked={config.destinationMode === 'subfolder'}
              onChange={() =>
                onChangeConfig({ ...config, destinationMode: 'subfolder' })
              }
              disabled={disabled}
              className="mt-0.5 text-emerald-600 bg-slate-900 border-slate-700 focus:ring-emerald-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <FolderTree className="w-3.5 h-3.5 text-emerald-400" />
                <span>Create subfolder in each original directory</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Automatically places images in a dedicated folder inside their respective parent folder.
              </p>
              {config.destinationMode === 'subfolder' && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Folder name:</span>
                  <input
                    type="text"
                    value={config.subfolderName}
                    onChange={(e) =>
                      onChangeConfig({
                        ...config,
                        subfolderName: e.target.value,
                      })
                    }
                    disabled={disabled}
                    placeholder="resized"
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 w-32"
                  />
                  <span className="text-[11px] text-slate-400 italic">
                    (e.g. /original_folder/{config.subfolderName || 'resized'}/)
                  </span>
                </div>
              )}
            </div>
          </label>

          {/* Suffix mode */}
          <label
            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              config.destinationMode === 'suffix'
                ? 'bg-emerald-500/10 border-emerald-500/60 text-white'
                : 'bg-slate-900/60 border-slate-700/80 text-slate-300 hover:bg-slate-800/80'
            }`}
          >
            <input
              type="radio"
              name="destinationMode"
              checked={config.destinationMode === 'suffix'}
              onChange={() =>
                onChangeConfig({ ...config, destinationMode: 'suffix' })
              }
              disabled={disabled}
              className="mt-0.5 text-emerald-600 bg-slate-900 border-slate-700 focus:ring-emerald-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Save next to original with suffix</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Saved in the same folder without overwriting the original file.
              </p>
              {config.destinationMode === 'suffix' && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">File suffix:</span>
                  <input
                    type="text"
                    value={config.suffix}
                    onChange={(e) =>
                      onChangeConfig({ ...config, suffix: e.target.value })
                    }
                    disabled={disabled}
                    placeholder="-resized"
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 w-32"
                  />
                  <span className="text-[11px] text-slate-400 italic">
                    (e.g. photo{config.suffix || '-resized'}.jpg)
                  </span>
                </div>
              )}
            </div>
          </label>

          {/* Custom destination folder */}
          <label
            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              config.destinationMode === 'custom_folder'
                ? 'bg-emerald-500/10 border-emerald-500/60 text-white'
                : 'bg-slate-900/60 border-slate-700/80 text-slate-300 hover:bg-slate-800/80'
            }`}
          >
            <input
              type="radio"
              name="destinationMode"
              checked={config.destinationMode === 'custom_folder'}
              onChange={() =>
                onChangeConfig({ ...config, destinationMode: 'custom_folder' })
              }
              disabled={disabled}
              className="mt-0.5 text-emerald-600 bg-slate-900 border-slate-700 focus:ring-emerald-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <FolderDown className="w-3.5 h-3.5 text-emerald-400" />
                <span>Save everything to a specific folder</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Collect all resized outputs into a single chosen directory.
              </p>
              {config.destinationMode === 'custom_folder' && (
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectFolder}
                    disabled={disabled}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-all flex items-center gap-1.5"
                  >
                    <FolderDown className="w-3.5 h-3.5 text-emerald-400" />
                    {config.customFolderPath ? 'Change Folder' : 'Select Folder'}
                  </button>
                  <span className="text-[11px] text-slate-300 truncate max-w-xs bg-slate-950/60 px-2 py-1 rounded border border-slate-800">
                    {config.customFolderPath || 'No folder selected yet'}
                  </span>
                </div>
              )}
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
