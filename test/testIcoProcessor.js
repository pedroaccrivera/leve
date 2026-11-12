import sharp from 'sharp';
import esbuild from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDir = path.join(__dirname, 'temp_test_ico');
const bundlePath = path.join(testDir, 'icoProcessor.bundle.mjs');

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/**
 * Parse the ICO container produced by the app and return its entries.
 * Entry dimensions are read from the directory; the PNG payload is returned
 * so tests can check real pixel data.
 */
function parseIco(buffer) {
  assert(buffer.length >= 6, 'ICO buffer is too short');
  const reserved = buffer.readUInt16LE(0);
  const type = buffer.readUInt16LE(2);
  const count = buffer.readUInt16LE(4);
  assert(reserved === 0, `Expected reserved=0, got ${reserved}`);
  assert(type === 1, `Expected type=1 (icon), got ${type}`);
  assert(count > 0, 'Expected at least one ICO entry');

  const entries = [];
  for (let i = 0; i < count; i++) {
    const position = 6 + i * 16;
    const width = buffer.readUInt8(position) || 256;
    const height = buffer.readUInt8(position + 1) || 256;
    const planes = buffer.readUInt16LE(position + 4);
    const bitCount = buffer.readUInt16LE(position + 6);
    const bytesInRes = buffer.readUInt32LE(position + 8);
    const imageOffset = buffer.readUInt32LE(position + 12);

    assert(planes === 1, `Entry ${i}: expected planes=1, got ${planes}`);
    assert(bitCount === 32, `Entry ${i}: expected bitCount=32, got ${bitCount}`);
    assert(bytesInRes > 0, `Entry ${i}: empty payload`);
    assert(
      imageOffset + bytesInRes <= buffer.length,
      `Entry ${i}: payload runs past the end of the file`
    );

    const payload = buffer.subarray(imageOffset, imageOffset + bytesInRes);
    entries.push({ width, height, bytesInRes, imageOffset, payload });
  }

  return { count, entries };
}

async function readPngPixels(pngBuffer) {
  const { data, info } = await sharp(pngBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, info };
}

function pixelAt({ data, info }, x, y) {
  const offset = (y * info.width + x) * 4;
  return {
    r: data[offset],
    g: data[offset + 1],
    b: data[offset + 2],
    a: data[offset + 3],
  };
}

async function loadProcessor() {
  // Bundle the real TypeScript service so the test exercises shipping code.
  // esbuild comes with Vite, so this adds no dependency to the project.
  await esbuild.build({
    entryPoints: [path.join(__dirname, '..', 'electron', 'services', 'icoProcessor.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    external: ['sharp'],
    outfile: bundlePath,
    logLevel: 'silent',
  });
  return import(pathToFileURL(bundlePath).href);
}

async function makeSource(name, width, height, channels = 4) {
  const filePath = path.join(testDir, name);
  await sharp({
    create: {
      width,
      height,
      channels,
      background: { r: 37, g: 99, b: 235, alpha: channels === 4 ? 1 : 1 },
    },
  })
    .png()
    .toFile(filePath);
  const stat = await fs.stat(filePath);
  return { path: filePath, size: stat.size, id: name, name, status: 'pending' };
}

function baseConfig(overrides = {}) {
  return {
    sizes: [16, 32, 48, 64, 128, 256],
    fit: 'cover',
    padding: 0,
    backgroundMode: 'auto',
    backgroundColor: '#ffffff',
    nameMode: 'favicon',
    destinationMode: 'subfolder',
    subfolderName: 'favicons',
    customFolderPath: '',
    ...overrides,
  };
}

async function runTest() {
  console.log('--- Starting ICO / Favicon Verification Tests ---');

  await fs.rm(testDir, { recursive: true, force: true });
  await fs.mkdir(testDir, { recursive: true });
  const { buildIco, processSingleFavicon, determineFaviconOutputPath, detectAutoBackground, renderFaviconPreview } =
    await loadProcessor();

  // -------------------------------------------------------------------------
  // Test 1: ICO container layout (header, directory, offsets, PNG payload)
  // -------------------------------------------------------------------------
  console.log('\n[Test 1] ICO container layout...');
  const sizes = [16, 32, 48, 64, 128, 256];
  const fakeEntries = [];
  for (const size of sizes) {
    const png = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: size, g: 0, b: 0, alpha: 1 },
      },
    })
      .png()
      .toBuffer();
    fakeEntries.push({ size, png });
  }

  // Deliberately unsorted: buildIco must sort by size.
  const ico = buildIco([...fakeEntries].reverse());
  const parsed = parseIco(ico);
  assert(parsed.count === sizes.length, `Expected ${sizes.length} entries, got ${parsed.count}`);

  const expectedHeaderSize = 6 + sizes.length * 16;
  let expectedOffset = expectedHeaderSize;
  parsed.entries.forEach((entry, index) => {
    const expectedSize = sizes[index];
    assert(
      entry.width === expectedSize && entry.height === expectedSize,
      `Entry ${index}: expected ${expectedSize}x${expectedSize}, got ${entry.width}x${entry.height}`
    );
    assert(
      entry.payload.subarray(0, 8).equals(PNG_SIGNATURE),
      `Entry ${index}: payload is not a PNG`
    );
    assert(
      entry.imageOffset === expectedOffset,
      `Entry ${index}: expected offset ${expectedOffset}, got ${entry.imageOffset}`
    );
    assert(
      entry.bytesInRes === fakeEntries[index].png.length,
      `Entry ${index}: bytesInRes mismatch`
    );
    expectedOffset += entry.bytesInRes;
  });
  assert(
    ico.length === expectedOffset,
    `Expected total length ${expectedOffset}, got ${ico.length}`
  );
  // The directory stores 256 as 0, the ICO convention.
  const lastPosition = 6 + (sizes.length - 1) * 16;
  assert(
    ico.readUInt8(lastPosition) === 0 && ico.readUInt8(lastPosition + 1) === 0,
    '256px entry must be stored as 0x00 in the directory'
  );
  console.log(`✓ Header, directory, offsets and PNG payloads valid (${ico.length} B)`);

  // Reject malformed input.
  const duplicateRejected = (() => {
    try {
      buildIco([
        { size: 16, png: fakeEntries[0].png },
        { size: 16, png: fakeEntries[0].png },
      ]);
      return false;
    } catch {
      return true;
    }
  })();
  assert(duplicateRejected, 'Duplicate sizes must be rejected');

  const nonPngRejected = (() => {
    try {
      buildIco([{ size: 16, png: Buffer.from('not a png') }]);
      return false;
    } catch {
      return true;
    }
  })();
  assert(nonPngRejected, 'Non-PNG payloads must be rejected');
  console.log('✓ Invalid containers rejected (duplicate size, non-PNG payload)');

  // -------------------------------------------------------------------------
  // Test 2: Full 6-size generation from a landscape source (cover)
  // -------------------------------------------------------------------------
  console.log('\n[Test 2] Full 16–256 generation, crop-to-square...');
  const landscape = await makeSource('landscape.png', 1024, 768);
  const config = baseConfig();
  const res1 = await processSingleFavicon(landscape, config);
  assert(res1.success, `Generation failed: ${res1.error}`);
  assert(
    path.basename(res1.outputPath) === 'favicon.ico',
    `Expected favicon.ico, got ${res1.outputPath}`
  );
  assert(
    res1.outputPath === path.join(testDir, 'favicons', 'favicon.ico'),
    `Unexpected output path: ${res1.outputPath}`
  );
  assert(
    JSON.stringify(res1.generatedSizes) === JSON.stringify(sizes),
    `Expected sizes ${sizes.join(',')}, got ${res1.generatedSizes?.join(',')}`
  );
  assert(
    Array.isArray(res1.skippedSizes) && res1.skippedSizes.length === 0,
    'No size should be skipped for a 1024px source'
  );

  const generated = parseIco(await fs.readFile(res1.outputPath));
  assert(generated.count === 6, `Expected 6 entries, got ${generated.count}`);
  for (const entry of generated.entries) {
    const meta = await sharp(entry.payload).metadata();
    assert(
      meta.width === entry.width && meta.height === entry.height,
      `Payload ${entry.width}px does not match its directory entry (${meta.width}x${meta.height})`
    );
  }
  console.log(
    `✓ Generated all 6 sizes (${res1.newSize} B): ${res1.generatedSizes.join(', ')} px`
  );

  // A favicon is a conversion, not a compression: the oversized-output guard
  // used by images/videos must not apply here. The ICO may be smaller or
  // larger than the source depending on its content.
  console.log(
    res1.newSize > landscape.size
      ? `✓ ICO is larger than the source (${res1.newSize} B > ${landscape.size} B) and still accepted`
      : `✓ ICO is smaller than the source (${res1.newSize} B < ${landscape.size} B); acceptance is not size-gated`
  );

  // -------------------------------------------------------------------------
  // Test 3: Crop vs padding (transparent and solid background)
  // -------------------------------------------------------------------------
  console.log('\n[Test 3] Crop vs fit-with-padding...');
  const coverEntry = generated.entries.find((entry) => entry.width === 256);
  const coverCorner = pixelAt(await readPngPixels(coverEntry.payload), 0, 0);
  assert(coverCorner.a === 255, `Cover corner must be opaque, got alpha=${coverCorner.a}`);

  const containTransparent = await processSingleFavicon(
    { ...landscape, id: 'contain', path: landscape.path },
    baseConfig({
      fit: 'contain',
      nameMode: 'source',
      backgroundMode: 'transparent',
    })
  );
  assert(containTransparent.success, `Contain failed: ${containTransparent.error}`);
  assert(
    path.basename(containTransparent.outputPath) === 'landscape.ico',
    `Expected landscape.ico, got ${containTransparent.outputPath}`
  );
  const containIco = parseIco(await fs.readFile(containTransparent.outputPath));
  const containEntry = containIco.entries.find((entry) => entry.width === 256);
  const containCorner = pixelAt(await readPngPixels(containEntry.payload), 0, 0);
  assert(
    containCorner.a === 0,
    `Padded corner must be transparent, got alpha=${containCorner.a}`
  );
  console.log('✓ Cover fills the square; contain pads with transparency');

  const containRed = await processSingleFavicon(
    { ...landscape, id: 'contain-red' },
    baseConfig({
      fit: 'contain',
      nameMode: 'source',
      backgroundMode: 'color',
      backgroundColor: '#ff0000',
    })
  );
  assert(containRed.success, `Solid padding failed: ${containRed.error}`);
  const redIco = parseIco(await fs.readFile(containRed.outputPath));
  const redEntry = redIco.entries.find((entry) => entry.width === 256);
  const redCorner = pixelAt(await readPngPixels(redEntry.payload), 0, 0);
  assert(
    redCorner.r > 200 && redCorner.g < 60 && redCorner.b < 60 && redCorner.a === 255,
    `Expected solid red padding, got ${JSON.stringify(redCorner)}`
  );
  console.log('✓ Solid padding color applied');

  // -------------------------------------------------------------------------
  // Test 3b: Auto background picks a contrasting color per image
  // -------------------------------------------------------------------------
  console.log('\n[Test 3b] Auto background detection...');
  const darkLogoPath = path.join(testDir, 'dark-logo.png');
  await sharp({
    create: {
      width: 256,
      height: 256,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: Buffer.from(
          '<svg width="120" height="120"><circle cx="60" cy="60" r="60" fill="#111827"/></svg>'
        ),
        top: 68,
        left: 68,
      },
    ])
    .png()
    .toFile(darkLogoPath);

  const lightLogoPath = path.join(testDir, 'light-logo.png');
  await sharp({
    create: {
      width: 256,
      height: 256,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: Buffer.from(
          '<svg width="120" height="120"><circle cx="60" cy="60" r="60" fill="#f8fafc"/></svg>'
        ),
        top: 68,
        left: 68,
      },
    ])
    .png()
    .toFile(lightLogoPath);

  assert(
    (await detectAutoBackground(darkLogoPath)) === '#ffffff',
    'Dark logo should resolve to a white background'
  );
  assert(
    (await detectAutoBackground(lightLogoPath)) === '#000000',
    'Light logo should resolve to a black background'
  );

  const darkStat = await fs.stat(darkLogoPath);
  const darkAuto = await processSingleFavicon(
    { id: 'dark-auto', path: darkLogoPath, name: 'dark-logo.png', size: darkStat.size, status: 'pending' },
    baseConfig({ fit: 'contain', nameMode: 'source', backgroundMode: 'auto' })
  );
  assert(darkAuto.success, `Auto background generation failed: ${darkAuto.error}`);
  const darkIco = parseIco(await fs.readFile(darkAuto.outputPath));
  const darkCorner = pixelAt(
    await readPngPixels(darkIco.entries.find((entry) => entry.width === 256).payload),
    0,
    0
  );
  assert(
    darkCorner.r > 240 && darkCorner.g > 240 && darkCorner.b > 240 && darkCorner.a === 255,
    `Expected white auto background, got ${JSON.stringify(darkCorner)}`
  );

  const lightStat = await fs.stat(lightLogoPath);
  const lightAuto = await processSingleFavicon(
    { id: 'light-auto', path: lightLogoPath, name: 'light-logo.png', size: lightStat.size, status: 'pending' },
    baseConfig({ fit: 'contain', nameMode: 'source', backgroundMode: 'auto' })
  );
  assert(lightAuto.success, `Auto background generation failed: ${lightAuto.error}`);
  const lightIco = parseIco(await fs.readFile(lightAuto.outputPath));
  const lightCorner = pixelAt(
    await readPngPixels(lightIco.entries.find((entry) => entry.width === 256).payload),
    0,
    0
  );
  assert(
    lightCorner.r < 15 && lightCorner.g < 15 && lightCorner.b < 15 && lightCorner.a === 255,
    `Expected black auto background, got ${JSON.stringify(lightCorner)}`
  );
  console.log('✓ Dark logo → white background, light logo → black background');

  // -------------------------------------------------------------------------
  // Test 3c: Padding shrinks the logo inside the canvas
  // -------------------------------------------------------------------------
  console.log('\n[Test 3c] Padding inset...');
  const padded = await processSingleFavicon(
    { ...landscape, id: 'padded' },
    baseConfig({
      fit: 'contain',
      nameMode: 'source',
      padding: 0.1,
      backgroundMode: 'transparent',
    })
  );
  assert(padded.success, `Padded generation failed: ${padded.error}`);
  const paddedIco = parseIco(await fs.readFile(padded.outputPath));
  const paddedPixels = await readPngPixels(
    paddedIco.entries.find((entry) => entry.width === 256).payload
  );
  let minX = 256;
  let maxX = -1;
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      if (pixelAt(paddedPixels, x, y).a > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }
  const logoWidth = maxX - minX + 1;
  assert(
    Math.abs(logoWidth - 205) <= 2,
    `Expected a ~205px logo at 10% padding, got ${logoWidth}px`
  );
  const paddedCorner = pixelAt(paddedPixels, 0, 0);
  assert(
    paddedCorner.a === 0,
    `Padded corner must stay transparent, got alpha=${paddedCorner.a}`
  );
  console.log(`✓ 10% padding insets the logo to ${logoWidth}px and keeps corners clear`);

  // -------------------------------------------------------------------------
  // Test 3d: 256px preview render
  // -------------------------------------------------------------------------
  console.log('\n[Test 3d] 256px editor preview...');
  const preview = await renderFaviconPreview(darkLogoPath, {
    ...baseConfig(),
    fit: 'contain',
    padding: 0.05,
    backgroundMode: 'auto',
  });
  assert(preview.success, `Preview failed: ${preview.error}`);
  assert(preview.width === 256 && preview.height === 256, 'Preview must be 256×256');
  assert(preview.resolvedBackground === '#ffffff', 'Preview should report the resolved background');
  assert(
    typeof preview.dataUrl === 'string' && preview.dataUrl.startsWith('data:image/png;base64,'),
    'Preview must be a PNG data URL'
  );
  const previewBuffer = Buffer.from(preview.dataUrl.split(',')[1], 'base64');
  const previewMeta = await sharp(previewBuffer).metadata();
  assert(
    previewMeta.width === 256 && previewMeta.height === 256,
    `Preview payload is ${previewMeta.width}x${previewMeta.height}`
  );

  // Small sources are upscaled only in the preview so the composition is visible.
  const previewSmall = await makeSource('preview-small.png', 48, 48);
  const smallPreview = await renderFaviconPreview(previewSmall.path, {
    ...baseConfig(),
    fit: 'contain',
    backgroundMode: 'transparent',
  });
  assert(smallPreview.success, `Small preview failed: ${smallPreview.error}`);
  assert(smallPreview.width === 256, 'Small source preview must still render at 256px');
  console.log('✓ Preview renders 256×256 PNG with resolved background and preview-only upscale');

  // -------------------------------------------------------------------------
  // Test 4: No upscaling (skip sizes above the source)
  // -------------------------------------------------------------------------
  console.log('\n[Test 4] No upscale for a 64px source...');
  const small = await makeSource('small.png', 64, 64);
  const resSmall = await processSingleFavicon(small, baseConfig());
  assert(resSmall.success, `Small source failed: ${resSmall.error}`);
  assert(
    JSON.stringify(resSmall.generatedSizes) === JSON.stringify([16, 32, 48, 64]),
    `Expected 16/32/48/64, got ${resSmall.generatedSizes?.join(',')}`
  );
  assert(
    JSON.stringify(resSmall.skippedSizes) === JSON.stringify([128, 256]),
    `Expected 128/256 skipped, got ${resSmall.skippedSizes?.join(',')}`
  );
  const smallIco = parseIco(await fs.readFile(resSmall.outputPath));
  assert(smallIco.count === 4, `Expected 4 entries, got ${smallIco.count}`);
  console.log('✓ 128/256 skipped, ICO contains only 16/32/48/64');

  // An SVG is vector art: it must be rendered at every selected size.
  const vectorSvg = path.join(testDir, 'vector-mark.svg');
  await fs.writeFile(
    vectorSvg,
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
       <circle cx="40" cy="40" r="38" fill="#2563eb"/>
     </svg>`
  );
  const vectorStat = await fs.stat(vectorSvg);
  const resVector = await processSingleFavicon(
    { id: 'vector', path: vectorSvg, name: 'vector-mark.svg', size: vectorStat.size, status: 'pending' },
    baseConfig({ nameMode: 'source' })
  );
  assert(resVector.success, `Vector generation failed: ${resVector.error}`);
  assert(
    JSON.stringify(resVector.generatedSizes) === JSON.stringify(sizes),
    `SVG must render all sizes, got ${resVector.generatedSizes?.join(',')}`
  );
  assert(
    Array.isArray(resVector.skippedSizes) && resVector.skippedSizes.length === 0,
    'SVG must not skip any size'
  );
  const vectorIco = parseIco(await fs.readFile(resVector.outputPath));
  assert(vectorIco.count === 6, `Expected 6 entries from SVG, got ${vectorIco.count}`);
  const vector256 = await sharp(
    vectorIco.entries.find((entry) => entry.width === 256).payload
  ).metadata();
  assert(
    vector256.width === 256 && vector256.height === 256,
    `SVG 256 entry is ${vector256.width}x${vector256.height}`
  );
  console.log('✓ 80px SVG is upscaled to all 6 sizes (16–256) with no skips');

  // -------------------------------------------------------------------------
  // Test 5: Source too small for every selected size
  // -------------------------------------------------------------------------
  console.log('\n[Test 5] Source smaller than every selected size...');
  const tiny = await makeSource('tiny.png', 8, 8);
  const resTiny = await processSingleFavicon(tiny, baseConfig({ sizes: [16, 32] }));
  assert(!resTiny.success, 'Tiny source should fail');
  assert(
    /too small/i.test(resTiny.error || ''),
    `Expected a "too small" error, got: ${resTiny.error}`
  );
  console.log(`✓ Clear error returned: "${resTiny.error}"`);

  // -------------------------------------------------------------------------
  // Test 6: Collision handling (never overwrite)
  // -------------------------------------------------------------------------
  console.log('\n[Test 6] Existing favicon collision...');
  const collisionDir = path.join(testDir, 'collision');
  await fs.mkdir(collisionDir, { recursive: true });
  const collisionSource = await makeSource(path.join('collision', 'source.png'), 256, 256);
  const collisionConfig = baseConfig({ destinationMode: 'same_folder' });
  const res1st = await processSingleFavicon(collisionSource, collisionConfig);
  const res2 = await processSingleFavicon(collisionSource, collisionConfig);
  const res3 = await processSingleFavicon(collisionSource, collisionConfig);
  assert(
    path.basename(res1st.outputPath) === 'favicon.ico',
    `Expected favicon.ico, got ${res1st.outputPath}`
  );
  assert(
    path.basename(res2.outputPath) === 'favicon-2.ico',
    `Expected favicon-2.ico, got ${res2.outputPath}`
  );
  assert(
    path.basename(res3.outputPath) === 'favicon-3.ico',
    `Expected favicon-3.ico, got ${res3.outputPath}`
  );
  const collisionFiles = await fs.readdir(collisionDir);
  assert(
    collisionFiles.filter((name) => name.startsWith('favicon')).length === 3,
    `Expected 3 favicon files, got ${collisionFiles.join(', ')}`
  );
  console.log('✓ favicon.ico → favicon-2.ico → favicon-3.ico without overwriting');

  // -------------------------------------------------------------------------
  // Test 7: SVG source is rasterized
  // -------------------------------------------------------------------------
  console.log('\n[Test 7] SVG source...');
  const svgPath = path.join(testDir, 'logo.svg');
  await fs.writeFile(
    svgPath,
    `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
       <rect width="512" height="512" fill="#111827"/>
       <circle cx="256" cy="256" r="180" fill="#fbbf24"/>
     </svg>`
  );
  const svgStat = await fs.stat(svgPath);
  const resSvg = await processSingleFavicon(
    { id: 'svg', path: svgPath, name: 'logo.svg', size: svgStat.size, status: 'pending' },
    baseConfig({ nameMode: 'source' })
  );
  assert(resSvg.success, `SVG generation failed: ${resSvg.error}`);
  assert(path.basename(resSvg.outputPath) === 'logo.ico', 'SVG output name should match source');
  const svgIco = parseIco(await fs.readFile(resSvg.outputPath));
  assert(svgIco.count === 6, `Expected 6 entries from SVG, got ${svgIco.count}`);
  const svgMiddle = pixelAt(
    await readPngPixels(svgIco.entries.find((entry) => entry.width === 64).payload),
    32,
    32
  );
  assert(svgMiddle.a === 255, 'SVG center pixel must be opaque');
  console.log('✓ SVG rasterized into a 6-size ICO (logo.ico)');

  // -------------------------------------------------------------------------
  // Test 8: Transparency is preserved
  // -------------------------------------------------------------------------
  console.log('\n[Test 8] Transparency preservation...');
  const transparentPath = path.join(testDir, 'transparent.png');
  await sharp({
    create: {
      width: 256,
      height: 256,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: Buffer.from(
          '<svg width="120" height="120"><circle cx="60" cy="60" r="60" fill="#22c55e"/></svg>'
        ),
        top: 68,
        left: 68,
      },
    ])
    .png()
    .toFile(transparentPath);
  const transparentStat = await fs.stat(transparentPath);
  const resTransparent = await processSingleFavicon(
    {
      id: 'transparent',
      path: transparentPath,
      name: 'transparent.png',
      size: transparentStat.size,
      status: 'pending',
    },
    baseConfig({ nameMode: 'source' })
  );
  assert(resTransparent.success, `Transparent source failed: ${resTransparent.error}`);
  const transparentIco = parseIco(await fs.readFile(resTransparent.outputPath));
  const transparentCorner = pixelAt(
    await readPngPixels(transparentIco.entries.find((entry) => entry.width === 64).payload),
    0,
    0
  );
  assert(
    transparentCorner.a === 0,
    `Transparent corner lost its alpha (got ${transparentCorner.a})`
  );
  console.log('✓ Alpha channel preserved in ICO entries');

  // -------------------------------------------------------------------------
  // Test 9: Output naming and destination helpers
  // -------------------------------------------------------------------------
  console.log('\n[Test 9] Output path resolution...');
  assert(
    determineFaviconOutputPath('/tmp/photos/logo.png', baseConfig()) ===
      path.join('/tmp/photos', 'favicons', 'favicon.ico'),
    'Subfolder default path is wrong'
  );
  assert(
    determineFaviconOutputPath('/tmp/photos/logo.png', baseConfig({ destinationMode: 'same_folder' })) ===
      path.join('/tmp/photos', 'favicon.ico'),
    'Same-folder path is wrong'
  );
  assert(
    determineFaviconOutputPath('/tmp/photos/logo.png', baseConfig({ nameMode: 'source', destinationMode: 'same_folder' })) ===
      path.join('/tmp/photos', 'logo.ico'),
    'Source-name path is wrong'
  );
  assert(
    determineFaviconOutputPath(
      '/tmp/photos/logo.png',
      baseConfig({ destinationMode: 'custom_folder', customFolderPath: '/tmp/icons' })
    ) === path.join('/tmp/icons', 'favicon.ico'),
    'Custom-folder path is wrong'
  );
  console.log('✓ Subfolder, same-folder, custom-folder and source-name paths resolve');

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------
  await fs.rm(testDir, { recursive: true, force: true });
  console.log('\n✓ All ICO / favicon tests passed successfully!');
}

runTest().catch(async (err) => {
  console.error('Test execution failed:', err);
  await fs.rm(testDir, { recursive: true, force: true }).catch(() => undefined);
  process.exit(1);
});
