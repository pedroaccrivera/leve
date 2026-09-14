import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import ffmpegStatic from 'ffmpeg-static';
import { path as ffprobePath } from 'ffprobe-static';
import type { VideoItem, VideoConfig, VideoProcessResult } from '../../src/types';

export const SUPPORTED_VIDEO_EXTENSIONS = new Set([
  '.mp4', '.mov', '.mkv', '.webm', '.avi', '.m4v',
]);

/**
 * When packaged, ffmpeg/ffprobe live under `app.asar.unpacked` (see
 * `asarUnpack` in package.json). In dev they resolve straight from
 * node_modules. This helper normalizes both cases.
 */
function resolveUnpackedPath(p: string): string {
  if (p.includes('app.asar')) {
    return p.replace('app.asar', 'app.asar.unpacked');
  }
  return p;
}

export function getFfmpegPath(): string {
  return resolveUnpackedPath(String(ffmpegStatic));
}

export function getFfprobePath(): string {
  return resolveUnpackedPath(ffprobePath);
}

interface ProbeResult {
  width?: number;
  height?: number;
  durationSec?: number;
  size: number;
}

export async function getVideoMetadata(filePath: string): Promise<ProbeResult> {
  try {
    const stats = await fs.stat(filePath);
    const probe = await runFfprobe(filePath);
    return { size: stats.size, ...probe };
  } catch {
    const stats = await fs.stat(filePath).catch(() => ({ size: 0 }));
    return { size: stats.size };
  }
}

function runFfprobe(filePath: string): Promise<{ width?: number; height?: number; durationSec?: number }> {
  return new Promise((resolve) => {
    const child = spawn(getFfprobePath(), [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height:format=duration',
      '-of', 'json',
      filePath,
    ]);
    let out = '';
    child.stdout.on('data', (d) => { out += String(d); });
    child.on('error', () => resolve({}));
    child.on('close', () => {
      try {
        const json = JSON.parse(out || '{}');
        const stream = json?.streams?.[0] ?? {};
        const duration = json?.format?.duration
          ? Number(json.format.duration)
          : undefined;
        resolve({
          width: stream.width,
          height: stream.height,
          durationSec: Number.isFinite(duration) ? duration : undefined,
        });
      } catch {
        resolve({});
      }
    });
  });
}

export function determineVideoOutputPath(
  inputPath: string,
  config: VideoConfig
): string {
  const parsed = path.parse(inputPath);
  const dir = parsed.dir;
  const name = parsed.name;
  const targetExt = config.outputFormat === 'webm' ? '.webm' : '.mp4';

  if (config.destinationMode === 'custom_folder' && config.customFolderPath) {
    return path.join(config.customFolderPath, `${name}${targetExt}`);
  }

  if (config.destinationMode === 'subfolder') {
    const subfolder = config.subfolderName?.trim() || 'compressed';
    return path.join(dir, subfolder, `${name}${targetExt}`);
  }

  // Suffix mode (default / fallback)
  const suffix = config.suffix ?? '-web';
  return path.join(dir, `${name}${suffix}${targetExt}`);
}

function parseTimeToSec(value: string): number | undefined {
  const match = value.trim().match(/(\d+):(\d{2}):(\d{2}(?:\.\d+)?)/);
  if (!match) return undefined;
  const [, h, m, s] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

function buildFfmpegArgs(
  inputPath: string,
  outputPath: string,
  config: VideoConfig
): string[] {
  const args = ['-y', '-v', 'error', '-i', inputPath];

  // Proportional downscale by max width (even dimension required by codecs).
  // `min(iw,MAX)` keeps smaller videos untouched; pair with -withoutEnlargement
  // behavior identical to images regardless of the flag.
  const maxW = Math.max(16, Math.round(config.maxWidth || 1280));
  args.push('-vf', `scale=min(iw\\,${maxW}):-2`);

  if (config.outputFormat === 'webm') {
    // VP9 — good web compression, slower encode.
    const crf = config.quality === 'light' ? '15'
      : config.quality === 'aggressive' ? '38' : '30';
    args.push('-c:v', 'libvpx-vp9', '-crf', crf, '-b:v', '0');
    if (config.muteAudio) {
      args.push('-an');
    } else {
      args.push('-c:a', 'libopus', '-b:a', '96k');
    }
  } else {
    // H.264 — universal web playback (default).
    const crf = config.quality === 'light' ? '18'
      : config.quality === 'aggressive' ? '28' : '23';
    const preset = config.quality === 'light' ? 'slow'
      : config.quality === 'aggressive' ? 'veryfast' : 'medium';
    args.push(
      '-c:v', 'libx264', '-preset', preset, '-crf', crf,
      '-pix_fmt', 'yuv420p'
    );
    if (config.muteAudio) {
      args.push('-an');
    } else {
      args.push('-c:a', 'aac', '-b:a', '128k');
    }
    args.push('-movflags', '+faststart');
  }

  if (config.stripMetadata) {
    args.push('-map_metadata', '-1');
  }

  args.push(outputPath);
  return args;
}

export async function processSingleVideo(
  item: VideoItem,
  config: VideoConfig,
  onProgress?: (percent: number) => void
): Promise<VideoProcessResult> {
  const outputPath = determineVideoOutputPath(item.path, config);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const meta = await getVideoMetadata(item.path);
  const totalSec = meta.durationSec && meta.durationSec > 0 ? meta.durationSec : undefined;
  const args = buildFfmpegArgs(item.path, outputPath, config);

  try {
    await runFfmpeg(args, totalSec, onProgress);
  } catch (err: any) {
    return {
      id: item.id,
      success: false,
      error: err?.message || 'Error processing video',
    };
  }

  try {
    const [newStats, newMeta] = await Promise.all([
      fs.stat(outputPath),
      getVideoMetadata(outputPath),
    ]);
    return {
      id: item.id,
      success: true,
      outputPath,
      newSize: newStats.size,
      newWidth: newMeta.width,
      newHeight: newMeta.height,
      durationSec: newMeta.durationSec,
    };
  } catch (err: any) {
    return {
      id: item.id,
      success: false,
      error: err?.message || 'Error reading output video',
    };
  }
}

function runFfmpeg(
  args: string[],
  totalSec: number | undefined,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(getFfmpegPath(), args);
    let stderr = '';
    let lastSent = -1;

    child.stderr.on('data', (d) => {
      const text = String(d);
      stderr += text;
      if (!totalSec || !onProgress) return;
      const timeMatch = text.match(/time=(\d+:\d{2}:\d{2}(?:\.\d+)?)/);
      if (!timeMatch) return;
      const current = parseTimeToSec(timeMatch[1]);
      if (current === undefined) return;
      const pct = Math.max(0, Math.min(100, Math.round((current / totalSec) * 100)));
      // Throttle: only forward when the integer percent advances.
      if (pct !== lastSent) {
        lastSent = pct;
        onProgress(pct);
      }
    });

    child.on('error', (err) => {
      reject(new Error(`ffmpeg failed to start: ${err.message}`));
    });

    child.on('close', (code) => {
      if (code === 0) {
        onProgress?.(100);
        resolve();
      } else {
        const detail = stderr.trim().split('\n').slice(-3).join(' ').slice(0, 300);
        reject(new Error(detail || `ffmpeg exited with code ${code}`));
      }
    });
  });
}

/** Single-frame thumbnail (320px wide) returned as a JPEG data URL. */
export async function getVideoThumbnail(filePath: string): Promise<string> {
  const tmp = path.join(os.tmpdir(), `leve-thumb-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`);
  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn(getFfmpegPath(), [
        '-y', '-v', 'error',
        '-ss', '1',
        '-i', filePath,
        '-vframes', '1',
        '-vf', 'scale=320:-1',
        '-q:v', '4',
        tmp,
      ]);
      child.on('error', reject);
      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`thumbnail exited with code ${code}`));
      });
    });
    const buffer = await fs.readFile(tmp);
    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  } catch {
    return '';
  } finally {
    await fs.unlink(tmp).catch(() => undefined);
  }
}
