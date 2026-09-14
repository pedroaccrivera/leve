import React, { useState } from 'react';
import {
  FolderTree,
  FileText,
  FolderDown,
  ChevronDown,
} from 'lucide-react';
import type { VideoConfig } from '../types';

interface VideoSettingsPanelProps {
  config: VideoConfig;
  onChangeConfig: (newConfig: VideoConfig) => void;
  disabled?: boolean;
}

const WIDTH_PRESETS = [
  { id: 'hd-720', name: 'HD', width: 1280 },
  { id: 'fhd-1080', name: 'Full HD', width: 1920 },
  { id: '4k-2160', name: '4K UHD', width: 3840 },
];

export const VideoSettingsPanel: React.FC<VideoSettingsPanelProps> = ({
  config,
  onChangeConfig,
  disabled = false,
}) => {
  const [showAdvancedDest, setShowAdvancedDest] = useState(false);

  const handleWidthChange = (val: number) => {
    onChangeConfig({
      ...config,
      maxWidth: Math.max(16, Math.min(10000, val)),
    });
  };

  const handlePresetSelect = (presetWidth: number | string) => {
    if (presetWidth === 'custom') return;
    handleWidthChange(Number(presetWidth));
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

  const matchedPreset = WIDTH_PRESETS.find((p) => p.width === config.maxWidth);
  const currentSelectValue = matchedPreset ? matchedPreset.width.toString() : 'custom';

  return (
    <div className="space-y-6">
      {/* 1. Max Width */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          Max Width
        </label>

        <div className="flex items-center gap-2">
          <div className="relative w-1/2">
            <select
              value={currentSelectValue}
              onChange={(e) => handlePresetSelect(e.target.value)}
              disabled={disabled}
              className="w-full appearance-none bg-slate-100 dark:bg-[#1c2339] border border-slate-300 dark:border-[#2b3658] text-slate-800 dark:text-slate-200 text-xs font-medium rounded-xl px-3.5 py-2.5 pr-8 focus:outline-none focus:border-blue-500 transition-all cursor-pointer disabled:opacity-50"
            >
              <option value="custom">Custom</option>
              {WIDTH_PRESETS.map((p) => (
                <option key={p.id} value={p.width}>
                  {p.name} ({p.width}px)
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative flex-1">
            <input
              type="number"
              min="16"
              max="10000"
              value={config.maxWidth || ''}
              onChange={(e) => handleWidthChange(parseInt(e.target.value, 10) || 0)}
              disabled={disabled}
              placeholder="Max width in px"
              className="w-full bg-slate-100 dark:bg-[#1c2339] border border-slate-300 dark:border-[#2b3658] text-slate-800 dark:text-slate-200 text-xs font-medium rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-500 transition-all disabled:opacity-50"
            />
          </div>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-darkTextMuted">
          Videos are only downscaled, never upscaled. Aspect ratio is preserved.
        </p>
      </div>

      {/* 2. Quality */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          Quality
        </label>

        <div className="grid grid-cols-3 gap-2.5">
          {(
            [
              { id: 'light', title: 'Good Quality', hint: 'Larger file, best quality' },
              { id: 'balanced', title: 'Balanced', hint: 'Middle ground' },
              { id: 'aggressive', title: 'Smallest File', hint: 'More compression' },
            ] as const
          ).map((q) => (
            <button
              key={q.id}
              type="button"
              disabled={disabled}
              onClick={() => onChangeConfig({ ...config, quality: q.id })}
              className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-center cursor-pointer ${
                config.quality === q.id
                  ? 'bg-blue-500/10 dark:bg-blue-600/20 border-blue-500 dark:border-blue-500 text-blue-900 dark:text-blue-200 shadow-sm ring-1 ring-blue-500/30'
                  : 'bg-slate-100/70 dark:bg-[#1b2238] border-slate-200 dark:border-[#283254] text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-[#222b46]'
              }`}
            >
              <span className="text-xs font-semibold block mb-0.5">{q.title}</span>
              <span className="text-[10px] text-slate-500 dark:text-darkTextMuted leading-tight">
                {q.hint}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Output Format */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          Output Format
        </label>

        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { id: 'mp4', label: 'MP4 (H.264)', hint: 'Universal playback' },
              { id: 'webm', label: 'WebM (VP9)', hint: 'Smaller files' },
            ] as const
          ).map((fmt) => {
            const isSelected = config.outputFormat === fmt.id;
            return (
              <button
                key={fmt.id}
                type="button"
                disabled={disabled}
                onClick={() => onChangeConfig({ ...config, outputFormat: fmt.id })}
                className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 dark:bg-blue-600/90 text-white border-blue-600 shadow-sm shadow-blue-500/20 font-semibold'
                    : 'bg-slate-100/70 dark:bg-[#1b2238] border-slate-200 dark:border-[#283254] text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-[#222b46]'
                }`}
              >
                <span className="text-xs font-medium block">{fmt.label}</span>
                <span
                  className={`text-[10px] block ${
                    isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-darkTextMuted'
                  }`}
                >
                  {fmt.hint}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Keep Metadata + Mute Audio */}
      <div className="space-y-2">
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
              Keep video metadata
            </span>
            <span className="text-[11px] text-slate-500 dark:text-darkTextMuted block">
              Unchecking reduces file size by removing embedded data
            </span>
          </div>
        </label>

        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={config.muteAudio}
            onChange={(e) => onChangeConfig({ ...config, muteAudio: e.target.checked })}
            disabled={disabled}
            className="mt-0.5 w-4 h-4 rounded text-blue-600 bg-slate-100 dark:bg-[#1b2238] border-slate-300 dark:border-[#283254] focus:ring-blue-500 cursor-pointer"
          />
          <div>
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block">
              Remove audio track
            </span>
            <span className="text-[11px] text-slate-500 dark:text-darkTextMuted block">
              Smaller files for silent / background videos
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
                ? `Subfolder (${config.subfolderName || 'compressed'})`
                : config.destinationMode === 'suffix'
                ? `Suffix (${config.suffix || '-web'})`
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
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="radio"
                name="video-dest"
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

            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="radio"
                name="video-dest"
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

            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="video-dest"
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
