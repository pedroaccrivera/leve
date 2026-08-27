import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import type { ImageItem, ResizeConfig, ProcessResult } from '../../src/types';

export const SUPPORTED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.avif', '.tiff', '.tif', '.gif', '.svg'
]);

export async function getImageMetadata(filePath: string) {
  try {
    const meta = await sharp(filePath).metadata();
    const stats = await fs.stat(filePath);
    return {
      width: meta.width,
      height: meta.height,
      size: stats.size,
      format: meta.format,
    };
  } catch (error) {
    const stats = await fs.stat(filePath).catch(() => ({ size: 0 }));
    return {
      width: undefined,
      height: undefined,
      size: stats.size,
      format: undefined,
    };
  }
}

export function determineOutputPath(
  inputPath: string,
  config: ResizeConfig
): string {
  const parsed = path.parse(inputPath);
  const dir = parsed.dir;
  const name = parsed.name;
  let targetExt = parsed.ext.toLowerCase();

  if (config.outputFormat === 'jpeg') {
    targetExt = '.jpg';
  } else if (config.outputFormat === 'png') {
    targetExt = '.png';
  } else if (config.outputFormat === 'webp') {
    targetExt = '.webp';
  }

  if (config.destinationMode === 'custom_folder' && config.customFolderPath) {
    return path.join(config.customFolderPath, `${name}${targetExt}`);
  }

  if (config.destinationMode === 'subfolder') {
    const subfolder = config.subfolderName?.trim() || 'resized';
    return path.join(dir, subfolder, `${name}${targetExt}`);
  }

  // Suffix mode (default / fallback)
  const suffix = config.suffix ?? '-resized';
  return path.join(dir, `${name}${suffix}${targetExt}`);
}

export async function processSingleImage(
  item: ImageItem,
  config: ResizeConfig
): Promise<ProcessResult> {
  try {
    const outputPath = determineOutputPath(item.path, config);
    const outputDir = path.dirname(outputPath);

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    let pipeline = sharp(item.path, { failOnError: false });

    // Handle Metadata (EXIF/GPS/Color profiles)
    if (!config.stripMetadata) {
      pipeline = pipeline.withMetadata();
    }

    // Proportional resize by Target Width
    if (config.targetWidth && config.targetWidth > 0) {
      pipeline = pipeline.resize({
        width: Math.round(config.targetWidth),
        withoutEnlargement: config.withoutEnlargement,
        fit: 'inside',
      });
    }

    // Determine target format
    const parsed = path.parse(item.path);
    const originalExt = parsed.ext.toLowerCase();
    let format = config.outputFormat;
    if (format === 'original') {
      if (['.jpg', '.jpeg'].includes(originalExt)) format = 'jpeg';
      else if (originalExt === '.png') format = 'png';
      else if (originalExt === '.webp') format = 'webp';
      else format = 'jpeg'; // fallback default
    }

    // Apply compression settings
    if (format === 'jpeg') {
      let quality = 80;
      if (config.compressionLevel === 'light') quality = 90;
      else if (config.compressionLevel === 'aggressive') quality = 65;
      else if (config.compressionLevel === 'lossless') quality = 100;

      pipeline = pipeline.jpeg({
        quality,
        mozjpeg: true,
        progressive: true,
      });
    } else if (format === 'webp') {
      let quality = 80;
      let lossless = false;
      if (config.compressionLevel === 'light') quality = 90;
      else if (config.compressionLevel === 'aggressive') quality = 65;
      else if (config.compressionLevel === 'lossless') {
        lossless = true;
        quality = 100;
      }

      pipeline = pipeline.webp({
        quality,
        lossless,
        effort: 4,
      });
    } else if (format === 'png') {
      let compressionLevel = 8;
      let palette = false;
      if (config.compressionLevel === 'light') compressionLevel = 6;
      else if (config.compressionLevel === 'aggressive') {
        compressionLevel = 9;
        palette = true;
      } else if (config.compressionLevel === 'lossless') {
        compressionLevel = 9;
      }

      pipeline = pipeline.png({
        compressionLevel,
        palette,
        progressive: true,
      });
    }

    // Save to disk
    await pipeline.toFile(outputPath);

    // Retrieve stats of newly generated file
    const newStats = await fs.stat(outputPath);
    const newMeta = await sharp(outputPath).metadata().catch(() => ({ width: undefined, height: undefined }));

    return {
      id: item.id,
      success: true,
      outputPath,
      newSize: newStats.size,
      newWidth: newMeta.width,
      newHeight: newMeta.height,
    };
  } catch (err: any) {
    return {
      id: item.id,
      success: false,
      error: err.message || 'Error processing image',
    };
  }
}
