import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import {
  FAVICON_SIZES,
  type FaviconConfig,
  type FaviconItem,
  type FaviconResult,
  type FaviconSize,
} from '../../src/types';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

interface IcoEntry {
  size: FaviconSize;
  png: Buffer;
}

/**
 * Build a modern PNG-in-ICO container:
 *
 *   ICONDIR      6 bytes  (reserved, type=1, count)
 *   ICONDIRENTRY 16 bytes (width, height, colors, reserved, planes, bpp,
 *                          bytesInRes, imageOffset)
 *   payloads     N × PNG
 *
 * A width/height byte of 0 means 256, per the ICO spec.
 */
export function buildIco(entries: IcoEntry[]): Buffer {
  if (!entries.length) {
    throw new Error('ICO must contain at least one image.');
  }

  const sorted = [...entries].sort((a, b) => a.size - b.size);
  const seen = new Set<number>();

  for (const entry of sorted) {
    if (!Number.isInteger(entry.size) || entry.size < 1 || entry.size > 256) {
      throw new Error(`Invalid favicon size: ${entry.size}.`);
    }
    if (seen.has(entry.size)) {
      throw new Error(`Duplicate favicon size: ${entry.size}.`);
    }
    if (!entry.png.length || !entry.png.subarray(0, 8).equals(PNG_SIGNATURE)) {
      throw new Error(`Favicon size ${entry.size} is not a PNG buffer.`);
    }
    seen.add(entry.size);
  }

  const headerSize = 6 + sorted.length * 16;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sorted.length, 4);

  let offset = headerSize;
  sorted.forEach((entry, index) => {
    const position = 6 + index * 16;
    const dimension = entry.size === 256 ? 0 : entry.size;
    header.writeUInt8(dimension, position);
    header.writeUInt8(dimension, position + 1);
    header.writeUInt8(0, position + 2);
    header.writeUInt8(0, position + 3);
    header.writeUInt16LE(1, position + 4);
    header.writeUInt16LE(32, position + 6);
    header.writeUInt32LE(entry.png.length, position + 8);
    header.writeUInt32LE(offset, position + 12);
    offset += entry.png.length;
  });

  return Buffer.concat([header, ...sorted.map((entry) => entry.png)]);
}

function normalizeSizes(sizes: number[]): FaviconSize[] {
  const valid = new Set<number>([...FAVICON_SIZES]);
  const unique = Array.from(new Set(sizes)).filter((size) => valid.has(size));
  if (!unique.length) {
    throw new Error('Select at least one valid favicon size.');
  }
  return (unique as FaviconSize[]).sort((a, b) => a - b);
}

function getOrientedDimensions(meta: {
  width?: number;
  height?: number;
  orientation?: number;
}): { width: number; height: number } {
  const orientation = meta.orientation ?? 1;
  const swap = orientation >= 5 && orientation <= 8;
  const width = swap ? meta.height : meta.width;
  const height = swap ? meta.width : meta.height;
  if (!width || !height) {
    throw new Error('Could not read image dimensions.');
  }
  return { width, height };
}

function parseBackground(color?: string): { r: number; g: number; b: number; alpha: number } {
  const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
  if (!color || color === 'transparent') return transparent;
  const match = color.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!match) return transparent;
  const hex = match[1];
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
    alpha: 1,
  };
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Never overwrite an existing icon: `favicon.ico` becomes `favicon-2.ico`
 * and so on. Processing is sequential, so checking the disk is sufficient
 * to avoid collisions inside a batch as well.
 */
async function uniqueOutputPath(candidate: string): Promise<string> {
  const parsed = path.parse(candidate);
  let attempt = candidate;
  let counter = 2;
  while (await pathExists(attempt)) {
    attempt = path.join(parsed.dir, `${parsed.name}-${counter}${parsed.ext}`);
    counter++;
  }
  return attempt;
}

export function determineFaviconOutputPath(
  inputPath: string,
  config: FaviconConfig
): string {
  const parsed = path.parse(inputPath);
  const base = config.nameMode === 'source' ? `${parsed.name}.ico` : 'favicon.ico';

  if (config.destinationMode === 'custom_folder') {
    if (!config.customFolderPath) {
      throw new Error('Choose a custom output folder first.');
    }
    return path.join(config.customFolderPath, base);
  }

  if (config.destinationMode === 'same_folder') {
    return path.join(parsed.dir, base);
  }

  const subfolder = config.subfolderName?.trim() || 'favicons';
  return path.join(parsed.dir, subfolder, base);
}

export async function processSingleFavicon(
  item: FaviconItem,
  config: FaviconConfig
): Promise<FaviconResult> {
  try {
    const sizes = normalizeSizes(config.sizes);
    const meta = await sharp(item.path, { failOnError: false }).metadata();
    const { width, height } = getOrientedDimensions(meta);

    // A square icon can use at most the shorter side when cropping, and the
    // longer side when padding. Never upscale: sizes above this are skipped.
    const usefulDimension =
      config.fit === 'contain' ? Math.max(width, height) : Math.min(width, height);
    const maxSelected = Math.max(...sizes);
    const masterSize = Math.min(maxSelected, usefulDimension);
    const smallestSelected = Math.min(...sizes);

    if (masterSize < smallestSelected) {
      throw new Error(
        `Source image is too small for the selected sizes (smallest selected: ${smallestSelected}px, source supports up to ${masterSize}px). Choose smaller sizes.`
      );
    }

    // Render the square master once, then derive every entry from it. This
    // decodes the original image only once, which matters for large sources.
    const background = config.fit === 'contain' ? parseBackground(config.backgroundColor) : undefined;
    const resizeOptions = {
      fit: config.fit,
      position: 'centre' as const,
      ...(background ? { background } : {}),
    };
    const master = await sharp(item.path, { failOnError: false })
      .rotate()
      .toColourspace('srgb')
      .resize(masterSize, masterSize, resizeOptions)
      .png({ compressionLevel: 9 })
      .toBuffer();

    const entries: IcoEntry[] = [];
    const skippedSizes: FaviconSize[] = [];

    for (const size of sizes) {
      if (size > masterSize) {
        skippedSizes.push(size);
        continue;
      }
      // Palette quantization keeps 16–64px entries small; 128/256 stay
      // truecolor to avoid banding in larger, more visible icons.
      const png = await sharp(master)
        .resize(size, size, { kernel: 'lanczos3' })
        .png({
          compressionLevel: 9,
          palette: size <= 64,
          colours: 256,
          dither: 1,
        })
        .toBuffer();
      entries.push({ size, png });
    }

    if (!entries.length) {
      throw new Error('No favicon sizes could be generated from this source.');
    }

    const ico = buildIco(entries);
    const outputPath = await uniqueOutputPath(determineFaviconOutputPath(item.path, config));
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, ico);

    return {
      id: item.id,
      success: true,
      outputPath,
      newSize: ico.length,
      generatedSizes: entries.map((entry) => entry.size),
      skippedSizes,
    };
  } catch (err: any) {
    return {
      id: item.id,
      success: false,
      error: err?.message || 'Error generating favicon',
    };
  }
}
