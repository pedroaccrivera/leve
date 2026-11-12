import React, { useState } from 'react';
import {
  ChevronDown,
  FolderDown,
  FolderTree,
  Globe,
} from 'lucide-react';
import { FAVICON_SIZES } from '../types';
import type {
  FaviconConfig,
  FaviconNameMode,
  FaviconSize,
} from '../types';

interface FaviconSettingsPanelProps {
  config: FaviconConfig;
  onChangeConfig: (newConfig: FaviconConfig) => void;
  disabled?: boolean;
}

const LEAN_SIZES: FaviconSize[] = [16, 32, 48, 64];
const FULL_SIZES: FaviconSize[] = [...FAVICON_SIZES];

const NAME_OPTIONS: { id: FaviconNameMode; label: string; hint: string }[] = [
  { id: 'favicon', label: 'favicon.ico', hint: 'Standard favicon name' },
  { id: 'source', label: 'Match source', hint: 'logo.png → logo.ico' },
];

export const FaviconSettingsPanel: React.FC<FaviconSettingsPanelProps> = ({
  config,
  onChangeConfig,
  disabled = false,
}) => {
  const [showAdvancedDest, setShowAdvancedDest] = useState(false);

  const toggleSize = (size: FaviconSize) => {
    const has = config.sizes.includes(size);
    if (has && config.sizes.length === 1) return;
    const next = has
      ? config.sizes.filter((item) => item !== size)
      : [...config.sizes, size].sort((a, b) => a - b);
    onChangeConfig({ ...config, sizes: next });
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

  const destinationLabel =
    config.destinationMode === 'same_folder'
      ? 'Same folder as source'
      : config.destinationMode === 'subfolder'
      ? `Subfolder (${config.subfolderName || 'favicons'})`
      : 'Custom Directory';

  return (
    <div className="space-y-6">
      {/* 1. Sizes */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Favicon Sizes
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChangeConfig({ ...config, sizes: LEAN_SIZES })}
              className="px-2 py-1 text-[10px] font-medium rounded-lg bg-slate-100 dark:bg-[#1c2339] border border-slate-300 dark:border-[#2b3658] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#25304e] transition-all cursor-pointer disabled:opacity-50"
            >
              Lean (16–64)
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChangeConfig({ ...config, sizes: FULL_SIZES })}
              className="px-2 py-1 text-[10px] font-medium rounded-lg bg-slate-100 dark:bg-[#1c2339] border border-slate-300 dark:border-[#2b3658] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#25304e] transition-all cursor-pointer disabled:opacity-50"
            >
              Full (16–256)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {FAVICON_SIZES.map((size) => {
            const selected = config.sizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                disabled={disabled}
                onClick={() => toggleSize(size)}
                className={`py-2 rounded-xl border text-center transition-all cursor-pointer disabled:opacity-50 ${
                  selected
                    ? 'bg-blue-600 dark:bg-blue-600/90 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                    : 'bg-slate-100/70 dark:bg-[#1b2238] border-slate-200 dark:border-[#283254] text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-[#222b46]'
                }`}
              >
                <span className="text-xs font-semibold block leading-none">{size}</span>
                <span className="text-[9px] opacity-70 block mt-0.5">px</span>
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-slate-500 dark:text-darkTextMuted">
          {config.sizes.length} sizes selected. Raster images are never
          upscaled — larger sizes are skipped. SVG logos are vector and render
          at every selected size.
        </p>
      </div>

      {/* 2. Output name */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          Output Name
        </label>

        <div className="grid grid-cols-2 gap-2.5">
          {NAME_OPTIONS.map((option) => {
            const selected = config.nameMode === option.id;
            return (
              <button
                key={option.id}
                type="button"
                disabled={disabled}
                onClick={() => onChangeConfig({ ...config, nameMode: option.id })}
                className={`p-3 rounded-xl text-left border transition-all cursor-pointer disabled:opacity-50 ${
                  selected
                    ? 'bg-blue-500/10 dark:bg-blue-600/20 border-blue-500 dark:border-blue-500 text-blue-900 dark:text-blue-200 shadow-sm ring-1 ring-blue-500/30'
                    : 'bg-slate-100/70 dark:bg-[#1b2238] border-slate-200 dark:border-[#283254] text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-[#222b46]'
                }`}
              >
                <span className="text-xs font-semibold block">{option.label}</span>
                <span className="text-[10px] text-slate-500 dark:text-darkTextMuted block mt-0.5">
                  {option.hint}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Destination (accordion, mirrors SettingsPanel) */}
      <div className="pt-2 border-t border-slate-200 dark:border-[#283254]/60">
        <button
          type="button"
          onClick={() => setShowAdvancedDest(!showAdvancedDest)}
          className="flex items-center justify-between w-full text-xs font-medium text-slate-500 dark:text-darkTextMuted hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer py-1"
        >
          <span>
            Output Destination:{' '}
            <strong className="text-slate-700 dark:text-slate-300">{destinationLabel}</strong>
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
                name="favicon-dest"
                checked={config.destinationMode === 'same_folder'}
                onChange={() => onChangeConfig({ ...config, destinationMode: 'same_folder' })}
                disabled={disabled}
                className="text-blue-600 cursor-pointer"
              />
              <FolderTree className="w-3.5 h-3.5 text-blue-500" />
              <span>Same folder as source</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="radio"
                name="favicon-dest"
                checked={config.destinationMode === 'subfolder'}
                onChange={() => onChangeConfig({ ...config, destinationMode: 'subfolder' })}
                disabled={disabled}
                className="text-blue-600 cursor-pointer"
              />
              <FolderTree className="w-3.5 h-3.5 text-blue-500" />
              <span>Save into subfolder:</span>
              <input
                type="text"
                value={config.subfolderName}
                onChange={(event) =>
                  onChangeConfig({ ...config, subfolderName: event.target.value })
                }
                disabled={disabled}
                className="bg-white dark:bg-[#141a2e] border border-slate-300 dark:border-[#2b3658] rounded px-2 py-0.5 text-xs text-slate-800 dark:text-slate-200 w-24 disabled:opacity-50"
              />
            </label>

            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="favicon-dest"
                  checked={config.destinationMode === 'custom_folder'}
                  onChange={() =>
                    onChangeConfig({ ...config, destinationMode: 'custom_folder' })
                  }
                  disabled={disabled}
                  className="text-blue-600 cursor-pointer"
                />
                <FolderDown className="w-3.5 h-3.5 text-blue-500" />
                <span>Custom directory:</span>
              </label>
              <button
                type="button"
                onClick={handleSelectFolder}
                disabled={disabled}
                className="px-2 py-0.5 bg-slate-200 dark:bg-[#202944] hover:bg-slate-300 dark:hover:bg-[#283556] border border-slate-300 dark:border-[#2c395c] rounded text-[11px] text-slate-800 dark:text-slate-200 cursor-pointer disabled:opacity-50"
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

      {/* Info */}
      <div className="flex items-start gap-2 p-3 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <Globe className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
          One `.ico` file packs every selected resolution. Entries are
          PNG-compressed, transparency is preserved, and existing files are
          never overwritten.
        </p>
      </div>
    </div>
  );
};
