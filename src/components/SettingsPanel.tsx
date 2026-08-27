import React, { useState } from 'react';
import {
  Save,
  FolderTree,
  FileText,
  FolderDown,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import type {
  ResizeConfig,
  ResizePreset,
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
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [showAdvancedDest, setShowAdvancedDest] = useState(false);

  const handleWidthChange = (val: number) => {
    onChangeConfig({
      ...config,
      targetWidth: Math.max(1, Math.min(10000, val)),
    });
  };

  const handlePresetSelect = (presetWidth: number | string) => {
    if (presetWidth === 'custom') return;
    handleWidthChange(Number(presetWidth));
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

  // Find if current width matches any preset
  const matchedPreset = presets.find((p) => p.width === config.targetWidth);
  const currentSelectValue = matchedPreset ? matchedPreset.width.toString() : 'custom';

  return (
    <div className="space-y-6">
      {/* 1. Output Width */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          Output Width
        </label>

        <div className="flex items-center gap-2">
          {/* Preset dropdown */}
          <div className="relative w-1/2">
            <select
              value={currentSelectValue}
              onChange={(e) => handlePresetSelect(e.target.value)}
              disabled={disabled}
              className="w-full appearance-none bg-slate-100 dark:bg-[#1c2339] border border-slate-300 dark:border-[#2b3658] text-slate-800 dark:text-slate-200 text-xs font-medium rounded-xl px-3.5 py-2.5 pr-8 focus:outline-none focus:border-blue-500 transition-all cursor-pointer disabled:opacity-50"
            >
              <option value="custom">Custom</option>
              {presets.map((p) => (
                <option key={p.id} value={p.width}>
                  {p.name} ({p.width}px)
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Width in px input */}
          <div className="relative flex-1">
            <input
              type="number"
              min="1"
              max="10000"
              value={config.targetWidth || ''}
              onChange={(e) => handleWidthChange(parseInt(e.target.value, 10) || 0)}
              disabled={disabled}
              placeholder="Width in px"
              className="w-full bg-slate-100 dark:bg-[#1c2339] border border-slate-300 dark:border-[#2b3658] text-slate-800 dark:text-slate-200 text-xs font-medium rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 transition-all disabled:opacity-50"
            />
          </div>

          {/* Delete custom preset button if selected */}
          {matchedPreset?.isCustom && (
            <button
              type="button"
              onClick={() => onDeletePreset(matchedPreset.id)}
              disabled={disabled}
              className="p-2.5 bg-slate-100 dark:bg-[#1c2339] hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-slate-300 dark:border-[#2b3658] text-slate-500 hover:text-rose-500 rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50"
              title={`Delete custom preset "${matchedPreset.name}"`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Save preset button */}
          <button
            type="button"
            onClick={() => setIsSavingPreset(!isSavingPreset)}
            disabled={disabled}
            className="p-2.5 bg-slate-100 dark:bg-[#1c2339] hover:bg-slate-200 dark:hover:bg-[#25304e] border border-slate-300 dark:border-[#2b3658] text-slate-600 dark:text-slate-300 rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50"
            title="Save current width as preset"
          >
            <Save className="w-4 h-4" />
          </button>
        </div>

        {/* Save preset form inline */}
        {isSavingPreset && (
          <form
            onSubmit={handleSavePreset}
            className="p-2.5 bg-slate-100 dark:bg-[#181f34] rounded-xl border border-blue-500/40 flex items-center gap-2 animate-in fade-in duration-150"
          >
            <input
              type="text"
              autoFocus
              placeholder="Preset Name (e.g. Instagram Square, Banner)"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              className="flex-1 bg-white dark:bg-[#121727] border border-slate-300 dark:border-[#2c375a] rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!newPresetName.trim()}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-all cursor-pointer"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsSavingPreset(false)}
              className="px-2 py-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
          </form>
        )}
      </div>

      {/* 2. Compression */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          Compression
        </label>

        <div className="grid grid-cols-3 gap-2.5">
          {/* Card 1: Good Quality */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChangeConfig({ ...config, compressionLevel: 'light' })}
            className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-center cursor-pointer ${
              config.compressionLevel === 'light'
                ? 'bg-blue-500/10 dark:bg-blue-600/20 border-blue-500 dark:border-blue-500 text-blue-900 dark:text-blue-200 shadow-sm ring-1 ring-blue-500/30'
                : 'bg-slate-100/70 dark:bg-[#1b2238] border-slate-200 dark:border-[#283254] text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-[#222b46]'
            }`}
          >
            <span className="text-xs font-semibold block mb-0.5">
              Good Quality
            </span>
            <span className="text-[10px] text-slate-500 dark:text-darkTextMuted leading-tight">
              Larger file, best quality
            </span>
          </button>

          {/* Card 2: Balanced */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChangeConfig({ ...config, compressionLevel: 'balanced' })}
            className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-center cursor-pointer ${
              config.compressionLevel === 'balanced'
                ? 'bg-blue-500/10 dark:bg-blue-600/20 border-blue-500 dark:border-blue-500 text-blue-900 dark:text-blue-200 shadow-sm ring-1 ring-blue-500/30'
                : 'bg-slate-100/70 dark:bg-[#1b2238] border-slate-200 dark:border-[#283254] text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-[#222b46]'
            }`}
          >
            <span className="text-xs font-semibold block mb-0.5">
              Balanced
            </span>
            <span className="text-[10px] text-slate-500 dark:text-darkTextMuted leading-tight">
              Middle ground
            </span>
          </button>

          {/* Card 3: Smallest File */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChangeConfig({ ...config, compressionLevel: 'aggressive' })}
            className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-center cursor-pointer ${
              config.compressionLevel === 'aggressive'
                ? 'bg-blue-500/10 dark:bg-blue-600/20 border-blue-500 dark:border-blue-500 text-blue-900 dark:text-blue-200 shadow-sm ring-1 ring-blue-500/30'
                : 'bg-slate-100/70 dark:bg-[#1b2238] border-slate-200 dark:border-[#283254] text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-[#222b46]'
            }`}
          >
            <span className="text-xs font-semibold block mb-0.5">
              Smallest File
            </span>
            <span className="text-[10px] text-slate-500 dark:text-darkTextMuted leading-tight">
              More compression
            </span>
          </button>
        </div>
      </div>

      {/* 3. Output Format */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
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
                className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 dark:bg-blue-600/90 text-white border-blue-600 shadow-sm shadow-blue-500/20 font-semibold'
                    : 'bg-slate-100/70 dark:bg-[#1b2238] border-slate-200 dark:border-[#283254] text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-[#222b46]'
                }`}
              >
                {fmt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Keep Metadata Checkbox */}
      <div className="space-y-1">
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={!config.stripMetadata}
            onChange={(e) =>
              onChangeConfig({ ...config, stripMetadata: !e.target.checked })
            }
            disabled={disabled}
            className="mt-0.5 w-4 h-4 rounded text-blue-600 bg-slate-100 dark:bg-[#1b2238] border-slate-300 dark:border-[#283254] focus:ring-blue-500 cursor-pointer"
          />
          <div>
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block">
              Keep image metadata (EXIF, location, camera info)
            </span>
            <span className="text-[11px] text-slate-500 dark:text-darkTextMuted block">
              Unchecking reduces file size by removing embedded data
            </span>
          </div>
        </label>
      </div>

      {/* 5. Destination & Output Settings (Optional Accordion) */}
      <div className="pt-2 border-t border-slate-200 dark:border-[#283254]/60">
        <button
          type="button"
          onClick={() => setShowAdvancedDest(!showAdvancedDest)}
          className="flex items-center justify-between w-full text-xs font-medium text-slate-500 dark:text-darkTextMuted hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer py-1"
        >
          <span>
            Output Destination:{' '}
            <strong className="text-slate-700 dark:text-slate-300">
              {config.destinationMode === 'subfolder'
                ? `Subfolder (${config.subfolderName || 'resized'})`
                : config.destinationMode === 'suffix'
                ? `Suffix (${config.suffix || '-resized'})`
                : 'Custom Directory'}
            </strong>
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              showAdvancedDest ? 'rotate-180' : ''
            }`}
          />
        </button>

        {showAdvancedDest && (
          <div className="mt-3 space-y-2 pl-1 animate-in fade-in duration-150">
            {/* Subfolder */}
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="radio"
                name="dest"
                checked={config.destinationMode === 'subfolder'}
                onChange={() => onChangeConfig({ ...config, destinationMode: 'subfolder' })}
                className="text-blue-600 cursor-pointer"
              />
              <FolderTree className="w-3.5 h-3.5 text-blue-500" />
              <span>Save into subfolder:</span>
              <input
                type="text"
                value={config.subfolderName}
                onChange={(e) => onChangeConfig({ ...config, subfolderName: e.target.value })}
                className="bg-white dark:bg-[#141a2e] border border-slate-300 dark:border-[#2b3658] rounded px-2 py-0.5 text-xs text-slate-800 dark:text-slate-200 w-24"
              />
            </label>

            {/* Suffix */}
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="radio"
                name="dest"
                checked={config.destinationMode === 'suffix'}
                onChange={() => onChangeConfig({ ...config, destinationMode: 'suffix' })}
                className="text-blue-600 cursor-pointer"
              />
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span>Save with filename suffix:</span>
              <input
                type="text"
                value={config.suffix}
                onChange={(e) => onChangeConfig({ ...config, suffix: e.target.value })}
                className="bg-white dark:bg-[#141a2e] border border-slate-300 dark:border-[#2b3658] rounded px-2 py-0.5 text-xs text-slate-800 dark:text-slate-200 w-24"
              />
            </label>

            {/* Custom Folder */}
            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="dest"
                  checked={config.destinationMode === 'custom_folder'}
                  onChange={() => onChangeConfig({ ...config, destinationMode: 'custom_folder' })}
                  className="text-blue-600 cursor-pointer"
                />
                <FolderDown className="w-3.5 h-3.5 text-blue-500" />
                <span>Custom directory:</span>
              </label>
              <button
                type="button"
                onClick={handleSelectFolder}
                className="px-2 py-0.5 bg-slate-200 dark:bg-[#202944] hover:bg-slate-300 dark:hover:bg-[#283556] border border-slate-300 dark:border-[#2c395c] rounded text-[11px] text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                Browse...
              </button>
              {config.customFolderPath && (
                <span className="text-[11px] text-slate-500 truncate max-w-[180px]">
                  {config.customFolderPath}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
