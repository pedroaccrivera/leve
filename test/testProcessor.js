import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDir = path.join(__dirname, 'temp_test');

const SUPPORTED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.avif', '.tiff', '.tif', '.gif', '.svg'
]);

function determineOutputPath(inputPath, config) {
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

  const suffix = config.suffix ?? '-resized';
  return path.join(dir, `${name}${suffix}${targetExt}`);
}

async function getImageMetadata(filePath) {
  const meta = await sharp(filePath).metadata();
  const stats = await fs.stat(filePath);
  return {
    width: meta.width,
    height: meta.height,
    size: stats.size,
    format: meta.format,
  };
}

async function processSingleImage(item, config) {
  try {
    const outputPath = determineOutputPath(item.path, config);
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    let pipeline = sharp(item.path, { failOnError: false });

    if (!config.stripMetadata) {
      pipeline = pipeline.withMetadata();
    }

    if (config.targetWidth && config.targetWidth > 0) {
      pipeline = pipeline.resize({
        width: Math.round(config.targetWidth),
        withoutEnlargement: config.withoutEnlargement,
        fit: 'inside',
      });
    }

    const parsed = path.parse(item.path);
    const originalExt = parsed.ext.toLowerCase();
    let format = config.outputFormat;
    if (format === 'original') {
      if (['.jpg', '.jpeg'].includes(originalExt)) format = 'jpeg';
      else if (originalExt === '.png') format = 'png';
      else if (originalExt === '.webp') format = 'webp';
      else format = 'jpeg';
    }

    if (format === 'jpeg') {
      let quality = 80;
      if (config.compressionLevel === 'light') quality = 90;
      else if (config.compressionLevel === 'aggressive') quality = 65;
      else if (config.compressionLevel === 'lossless') quality = 100;

      pipeline = pipeline.jpeg({ quality, mozjpeg: true, progressive: true });
    } else if (format === 'webp') {
      let quality = 80;
      let lossless = false;
      if (config.compressionLevel === 'light') quality = 90;
      else if (config.compressionLevel === 'aggressive') quality = 65;
      else if (config.compressionLevel === 'lossless') {
        lossless = true;
        quality = 100;
      }
      pipeline = pipeline.webp({ quality, lossless, effort: 4 });
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
      pipeline = pipeline.png({ compressionLevel, palette, progressive: true });
    }

    await pipeline.toFile(outputPath);
    const newStats = await fs.stat(outputPath);
    const newMeta = await sharp(outputPath).metadata();

    return {
      id: item.id,
      success: true,
      outputPath,
      newSize: newStats.size,
      newWidth: newMeta.width,
      newHeight: newMeta.height,
    };
  } catch (err) {
    return {
      id: item.id,
      success: false,
      error: err.message || 'Error processing image',
    };
  }
}

async function runTest() {
  console.log('--- Starting Image Processing Verification Tests ---');

  await fs.mkdir(testDir, { recursive: true });

  // 1. Create a sample image (3000x2000 px)
  const testImagePath = path.join(testDir, 'source_sample.png');
  await sharp({
    create: {
      width: 3000,
      height: 2000,
      channels: 4,
      background: { r: 50, g: 120, b: 240, alpha: 1 },
    },
  })
    .png()
    .toFile(testImagePath);

  const initialStat = await fs.stat(testImagePath);
  console.log(`✓ Generated dummy test image (3000x2000 px, size: ${(initialStat.size / 1024).toFixed(1)} KB)`);

  // Test 1: Resize to 1200px width with Balanced WebP compression
  console.log('\n[Test 1] Resize to 1200px (Balanced WebP, Subfolder mode)...');
  const item1 = {
    id: 'test-1',
    path: testImagePath,
    name: 'source_sample.png',
    size: initialStat.size,
  };

  const config1 = {
    targetWidth: 1200,
    withoutEnlargement: true,
    compressionLevel: 'balanced',
    stripMetadata: true,
    outputFormat: 'webp',
    destinationMode: 'subfolder',
    subfolderName: 'resized_test',
    suffix: '-resized',
  };

  const res1 = await processSingleImage(item1, config1);
  console.log('Result 1:', res1);

  if (!res1.success || !res1.outputPath) {
    throw new Error('Test 1 failed to process');
  }

  const meta1 = await getImageMetadata(res1.outputPath);
  console.log(`Output 1 metadata: ${meta1.width}x${meta1.height} px, ${(meta1.size / 1024).toFixed(1)} KB, format: ${meta1.format}`);

  if (meta1.width !== 1200 || meta1.height !== 800) {
    throw new Error(`Expected dimensions 1200x800, got ${meta1.width}x${meta1.height}`);
  }
  console.log('✓ Proportional height maintained: 3000x2000 -> 1200x800 px (exact 3:2 ratio)!');

  // Test 2: Resize to 800px width with Suffix mode and JPG format
  console.log('\n[Test 2] Resize to 800px (Aggressive JPG, Suffix mode)...');
  const config2 = {
    targetWidth: 800,
    withoutEnlargement: true,
    compressionLevel: 'aggressive',
    stripMetadata: true,
    outputFormat: 'jpeg',
    destinationMode: 'suffix',
    suffix: '-small',
    subfolderName: 'resized',
  };

  const res2 = await processSingleImage(item1, config2);
  console.log('Result 2:', res2);

  const meta2 = await getImageMetadata(res2.outputPath);
  console.log(`Output 2 metadata: ${meta2.width}x${meta2.height} px, ${(meta2.size / 1024).toFixed(1)} KB, format: ${meta2.format}`);

  if (meta2.width !== 800 || meta2.height !== 533) {
    throw new Error(`Expected dimensions 800x533, got ${meta2.width}x${meta2.height}`);
  }
  console.log('✓ Proportional height maintained: 3000x2000 -> 800x533 px!');

  // Cleanup test artifacts
  await fs.rm(testDir, { recursive: true, force: true });
  console.log('\n✓ All image processing tests passed successfully!');
}

runTest().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
