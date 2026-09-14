import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegStatic from 'ffmpeg-static';
import { path as ffprobePath } from 'ffprobe-static';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDir = path.join(__dirname, 'temp_video_test');

const FFMPEG = String(ffmpegStatic);
const FFPROBE = ffprobePath;

// --- Inline mirror of electron/services/videoProcessor.ts logic --------------

function determineVideoOutputPath(inputPath, config) {
  const parsed = path.parse(inputPath);
  const targetExt = config.outputFormat === 'webm' ? '.webm' : '.mp4';
  if (config.destinationMode === 'custom_folder' && config.customFolderPath) {
    return path.join(config.customFolderPath, `${parsed.name}${targetExt}`);
  }
  if (config.destinationMode === 'subfolder') {
    const subfolder = config.subfolderName?.trim() || 'compressed';
    return path.join(parsed.dir, subfolder, `${parsed.name}${targetExt}`);
  }
  const suffix = config.suffix ?? '-web';
  return path.join(parsed.dir, `${parsed.name}${suffix}${targetExt}`);
}

function buildFfmpegArgs(inputPath, outputPath, config) {
  const args = ['-y', '-v', 'error', '-i', inputPath];
  const maxW = Math.max(16, Math.round(config.maxWidth || 1280));
  args.push('-vf', `scale=min(iw\\,${maxW}):-2`);
  if (config.outputFormat === 'webm') {
    const crf = config.quality === 'light' ? '15'
      : config.quality === 'aggressive' ? '38' : '30';
    args.push('-c:v', 'libvpx-vp9', '-crf', crf, '-b:v', '0');
    if (config.muteAudio) args.push('-an');
    else args.push('-c:a', 'libopus', '-b:a', '96k');
  } else {
    const crf = config.quality === 'light' ? '18'
      : config.quality === 'aggressive' ? '28' : '23';
    const preset = config.quality === 'light' ? 'slow'
      : config.quality === 'aggressive' ? 'veryfast' : 'medium';
    args.push('-c:v', 'libx264', '-preset', preset, '-crf', crf, '-pix_fmt', 'yuv420p');
    if (config.muteAudio) args.push('-an');
    else args.push('-c:a', 'aac', '-b:a', '128k');
    args.push('-movflags', '+faststart');
  }
  if (config.stripMetadata) args.push('-map_metadata', '-1');
  args.push(outputPath);
  return args;
}

function runBin(bin, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args);
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => { out += String(d); });
    child.stderr.on('data', (d) => { err += String(d); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve({ out, err });
      else reject(new Error(`${bin} exited ${code}: ${err.slice(-300)}`));
    });
  });
}

async function probe(filePath) {
  const { out } = await runBin(FFPROBE, [
    '-v', 'error',
    '-show_entries', 'stream=width,height,codec_type,codec_name:format=duration',
    '-of', 'json',
    filePath,
  ]);
  return JSON.parse(out);
}

async function processVideo(item, config, onProgress) {
  const outputPath = determineVideoOutputPath(item.path, config);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const meta = await probe(item.path);
  const totalSec = meta.format?.duration ? Number(meta.format.duration) : undefined;
  const args = buildFfmpegArgs(item.path, outputPath, config);

  await new Promise((resolve, reject) => {
    const child = spawn(FFMPEG, args);
    let stderr = '';
    let lastSent = -1;
    child.stderr.on('data', (d) => {
      const text = String(d);
      stderr += text;
      if (!totalSec || !onProgress) return;
      const m = text.match(/time=(\d+:\d{2}:\d{2}(?:\.\d+)?)/);
      if (!m) return;
      const [h, mi, s] = m[1].split(':').map(Number);
      const pct = Math.max(0, Math.min(100, Math.round(((h * 3600 + mi * 60 + s) / totalSec) * 100)));
      if (pct !== lastSent) {
        lastSent = pct;
        onProgress(pct);
      }
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        onProgress?.(100);
        resolve();
      } else {
        reject(new Error(stderr.trim().split('\n').slice(-3).join(' ').slice(0, 300)));
      }
    });
  });

  const newStats = await fs.stat(outputPath);
  const newMeta = await probe(outputPath);
  const vStream = (newMeta.streams || []).find((s) => s.codec_type === 'video') || {};
  return {
    success: true,
    outputPath,
    newSize: newStats.size,
    newWidth: vStream.width,
    newHeight: vStream.height,
  };
}

// --- Tests -------------------------------------------------------------------

async function runTest() {
  console.log('--- Starting Video Processing Verification Tests ---');
  await fs.mkdir(testDir, { recursive: true });

  // 0. Generate a 1280x720 5s sample with audio
  const samplePath = path.join(testDir, 'source_sample.mov');
  await runBin(FFMPEG, [
    '-y', '-v', 'error',
    '-f', 'lavfi', '-i', 'testsrc=size=1280x720:rate=30:duration=5',
    '-f', 'lavfi', '-i', 'sine=frequency=440:duration=5',
    '-pix_fmt', 'yuv420p', samplePath,
  ]);
  const sampleStat = await fs.stat(samplePath);
  console.log(`✓ Generated sample video (1280x720, 5s, ${(sampleStat.size / 1024).toFixed(1)} KB)`);
  const item = { id: 'vtest-1', path: samplePath, name: 'source_sample.mov', size: sampleStat.size };

  // Test 1: MP4 balanced, maxWidth 640, subfolder mode
  console.log('\n[Test 1] MP4 balanced, maxWidth 640 (subfolder mode)...');
  const progressSeen = [];
  const res1 = await processVideo(item, {
    maxWidth: 640,
    withoutEnlargement: true,
    quality: 'balanced',
    outputFormat: 'mp4',
    stripMetadata: true,
    muteAudio: false,
    destinationMode: 'subfolder',
    subfolderName: 'compressed_test',
    suffix: '-web',
  }, (p) => progressSeen.push(p));
  console.log('Result 1:', res1);
  if (!res1.success) throw new Error('Test 1 failed to process');
  if (res1.newWidth !== 640 || res1.newHeight !== 360) {
    throw new Error(`Expected 640x360, got ${res1.newWidth}x${res1.newHeight}`);
  }
  const probe1 = await probe(res1.outputPath);
  const dur1 = Number(probe1.format.duration);
  if (Math.abs(dur1 - 5) > 1) throw new Error(`Duration not preserved: ${dur1}s`);
  const hasAudio1 = (probe1.streams || []).some((s) => s.codec_type === 'audio');
  if (!hasAudio1) throw new Error('Expected audio track to be kept');
  if (!progressSeen.length || progressSeen[progressSeen.length - 1] !== 100) {
    throw new Error(`Progress callback broken: [${progressSeen.join(',')}]`);
  }
  console.log(`✓ 1280x720 -> 640x360, duration ~5s, audio kept, progress events: ${progressSeen.length} (final 100)`);

  // Test 2: WebM balanced + mute, suffix mode
  console.log('\n[Test 2] WebM balanced + mute (suffix mode)...');
  const res2 = await processVideo(item, {
    maxWidth: 1920,
    withoutEnlargement: true,
    quality: 'balanced',
    outputFormat: 'webm',
    stripMetadata: true,
    muteAudio: true,
    destinationMode: 'suffix',
    subfolderName: 'compressed',
    suffix: '-web',
  });
  console.log('Result 2:', res2);
  if (!res2.success || !res2.outputPath.endsWith('-web.webm')) {
    throw new Error(`Unexpected output path: ${res2.outputPath}`);
  }
  const probe2 = await probe(res2.outputPath);
  const vCodec = (probe2.streams || []).find((s) => s.codec_type === 'video')?.codec_name;
  const hasAudio2 = (probe2.streams || []).some((s) => s.codec_type === 'audio');
  if (vCodec !== 'vp9') throw new Error(`Expected vp9, got ${vCodec}`);
  if (hasAudio2) throw new Error('Expected audio track to be removed');
  // withoutEnlargement parity: 1280 < 1920 → untouched width
  if (res2.newWidth !== 1280) throw new Error(`Expected untouched 1280 width, got ${res2.newWidth}`);
  console.log('✓ VP9 WebM, audio removed, width untouched (1280 < maxWidth 1920)');

  // Test 3: thumbnail generation
  console.log('\n[Test 3] Thumbnail generation...');
  const thumbTmp = path.join(os.tmpdir(), `leve-test-thumb-${Date.now()}.jpg`);
  await runBin(FFMPEG, [
    '-y', '-v', 'error', '-ss', '1', '-i', samplePath,
    '-vframes', '1', '-vf', 'scale=320:-1', '-q:v', '4', thumbTmp,
  ]);
  const thumbBuf = await fs.readFile(thumbTmp);
  await fs.unlink(thumbTmp).catch(() => undefined);
  if (!thumbBuf.length) throw new Error('Empty thumbnail');
  console.log(`✓ Thumbnail generated (${(thumbBuf.length / 1024).toFixed(1)} KB JPEG)`);

  await fs.rm(testDir, { recursive: true, force: true });
  console.log('\n✓ All video processing tests passed successfully!');
}

runTest().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
