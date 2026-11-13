import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import {
  FAVICON_SIZES,
  type FaviconConfig,
  type FaviconItem,
  type FaviconPreviewResult,
  type FaviconResult,
  type FaviconSize,
} from '../../src/types';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PREVIEW_SIZE = 256;

interface IcoEntry {
  size: FaviconSize;
  png: Buffer;
}

interface ResolvedBackground {
  r: number;
  g: number;
  b: number;
  alpha: number;
  hex: string;
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

function getUsefulDimension(width: number, height: number, fit: FaviconConfig['fit']): number {
  return fit === 'contain' ? Math.max(width, height) : Math.min(width, height);
}

/**
 * SVG sources are vector art: they can be rendered at any resolution, so the
 * no-upscaling rule does not apply. Every raster format is still protected
 * from being enlarged.
 */
export function isVectorSource(filePath: string): boolean {
  return path.extname(filePath).toLowerCase() === '.svg';
}

function clampPadding(padding: number): number {
  if (!Number.isFinite(padding)) return 0;
  return Math.min(0.45, Math.max(0, padding));
}

function clampRadius(radius: number): number {
  if (!Number.isFinite(radius)) return 0;
  return Math.min(0.5, Math.max(0, radius));
}

/**
 * Rounded-rectangle mask used to round the icon corners. `dest-in` keeps the
 * icon only where the mask is opaque, so transparent backgrounds stay
 * transparent in the corners.
 */
function roundedMask(size: number, radius: number): Buffer {
  const corner = Math.round(size * radius * 100) / 100;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
      `<rect x="0" y="0" width="${size}" height="${size}" rx="${corner}" ry="${corner}" fill="#ffffff"/>` +
      `</svg>`
  );
}

function srgbToLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
}

function parseBackground(color?: string): ResolvedBackground {
  const transparent: ResolvedBackground = {
    r: 0,
    g: 0,
    b: 0,
    alpha: 0,
    hex: 'transparent',
  };
  if (!color || color === 'transparent') return transparent;
  const match = color.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!match) return transparent;
  const hex = `#${match[1].toLowerCase()}`;
  return {
    r: parseInt(match[1].slice(0, 2), 16),
    g: parseInt(match[1].slice(2, 4), 16),
    b: parseInt(match[1].slice(4, 6), 16),
    alpha: 1,
    hex,
  };
}

/**
 * Pick a background that contrasts with the visible pixels of the logo.
 * Transparent pixels are ignored (weighted by alpha), so a dark mark on a
 * transparent canvas still gets a white background.
 */
export async function detectAutoBackground(filePath: string): Promise<'#ffffff' | '#000000'> {
  try {
    const { data } = await sharp(filePath, { failOnError: false })
      .rotate()
      .resize(64, 64, { fit: 'inside', withoutEnlargement: true })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let weightedLuminance = 0;
    let totalAlpha = 0;

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha < 8) continue;
      const luminance =
        0.2126 * srgbToLinear(data[i]) +
        0.7152 * srgbToLinear(data[i + 1]) +
        0.0722 * srgbToLinear(data[i + 2]);
      weightedLuminance += luminance * alpha;
      totalAlpha += alpha;
    }

    if (totalAlpha === 0) return '#ffffff';
    return weightedLuminance / totalAlpha >= 0.5 ? '#000000' : '#ffffff';
  } catch {
    return '#ffffff';
  }
}

/**
 * Resolve any CSS colour the user can type (hex, `rgb()`, `hsl()`, a named
 * colour) into concrete channels. Six-digit hex is parsed directly; every
 * other form is handed to sharp, which understands the full CSS colour
 * syntax, and the result is read back as RGB.
 */
async function parseCssColor(color?: string): Promise<ResolvedBackground> {
  const direct = parseBackground(color);
  if (direct.hex !== 'transparent') return direct;
  if (!color || color.trim() === '' || color.trim().toLowerCase() === 'transparent') return direct;

  try {
    const { data } = await sharp({
      create: { width: 1, height: 1, channels: 3, background: color },
    })
      .raw()
      .toBuffer({ resolveWithObject: true });
    const [r, g, b] = data;
    const hex = `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
    return { r, g, b, alpha: 1, hex };
  } catch {
    // Unparseable value: keep the logo on a white background rather than
    // silently producing a transparent icon.
    return parseBackground('#ffffff');
  }
}

export async function resolveFaviconBackground(
  config: FaviconConfig,
  filePath: string
): Promise<ResolvedBackground> {
  // Cover fills the square with the image itself; padding/background are unused.
  if (config.fit === 'cover') return parseBackground(undefined);

  switch (config.backgroundMode) {
    case 'white':
      return parseBackground('#ffffff');
    case 'black':
      return parseBackground('#000000');
    case 'color':
      return parseCssColor(config.backgroundColor);
    case 'transparent':
      return parseBackground(undefined);
    case 'auto':
    default:
      return parseBackground(await detectAutoBackground(filePath));
  }
}

/**
 * Render one square master at `size`.
 *
 * `contain` fits the logo inside the padded area and centers it on the
 * resolved background. `cover` keeps the original crop behavior and ignores
 * padding/background. Corner rounding applies to both fits. `allowUpscale` is
 * only used by the preview so the editor can show the 256px composition even
 * for small sources; generation always preserves the no-upscaling rule.
 */
async function renderSquareMaster(
  filePath: string,
  config: FaviconConfig,
  size: number,
  allowUpscale = false
): Promise<{ buffer: Buffer; background: ResolvedBackground }> {
  const background = await resolveFaviconBackground(config, filePath);
  const radius = clampRadius(config.radius ?? 0);

  // Corner rounding is applied once, on the square master, so every derived
  // entry keeps the same radius fraction.
  const round = async (buffer: Buffer) => {
    if (radius <= 0) return buffer;
    return sharp(buffer)
      .composite([{ input: roundedMask(size, radius), blend: 'dest-in' }])
      .png({ compressionLevel: 9 })
      .toBuffer();
  };

  if (config.fit === 'cover') {
    const square = await sharp(filePath, { failOnError: false })
      .rotate()
      .toColourspace('srgb')
      .resize(size, size, { fit: 'cover', position: 'centre' })
      .png({ compressionLevel: 9 })
      .toBuffer();
    return { buffer: await round(square), background };
  }

  const padding = clampPadding(config.padding);
  const inner = Math.max(1, Math.round(size * (1 - padding * 2)));

  const logo = await sharp(filePath, { failOnError: false })
    .rotate()
    .toColourspace('srgb')
    .resize(inner, inner, {
      fit: 'inside',
      withoutEnlargement: !allowUpscale,
    })
    .png({ compressionLevel: 9 })
    .toBuffer();

  const square = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: {
        r: background.r,
        g: background.g,
        b: background.b,
        alpha: background.alpha,
      },
    },
  })
    .composite([{ input: logo, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toBuffer();

  return { buffer: await round(square), background };
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
    const isVector = isVectorSource(item.path);

    // A square icon can use at most the shorter side when cropping, and the
    // longer side when padding. Raster sources are never upscaled: sizes
    // above that limit are skipped. Vectors render at any size, so they are
    // scaled up to the largest selected resolution.
    let usefulDimension = Infinity;
    if (!isVector) {
      const meta = await sharp(item.path, { failOnError: false }).metadata();
      const { width, height } = getOrientedDimensions(meta);
      usefulDimension = getUsefulDimension(width, height, config.fit);
    }

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
    const { buffer: master } = await renderSquareMaster(
      item.path,
      config,
      masterSize,
      isVector
    );

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

/**
 * Render a 256×256 composition for the mini editor. Unlike generation, the
 * preview may upscale a small source so the user can judge padding and
 * background at the target preview size; the no-upscaling rule still applies
 * to the generated ICO.
 */
export async function renderFaviconPreview(
  filePath: string,
  config: FaviconConfig
): Promise<FaviconPreviewResult> {
  try {
    normalizeSizes(config.sizes);
    const { buffer, background } = await renderSquareMaster(
      filePath,
      config,
      PREVIEW_SIZE,
      true
    );

    return {
      success: true,
      dataUrl: `data:image/png;base64,${buffer.toString('base64')}`,
      width: PREVIEW_SIZE,
      height: PREVIEW_SIZE,
      resolvedBackground: background.hex,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Error rendering favicon preview',
    };
  }
}
