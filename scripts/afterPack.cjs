#!/usr/bin/env node
/**
 * leve — electron-builder `afterPack` hook.
 *
 * `ffprobe-static` ships prebuilt binaries for every platform/arch inside its
 * npm package (~335 MB in node_modules, ~232 MB copied into the app). The
 * runtime only ever resolves `bin/<process.platform>/<process.arch>/ffprobe`,
 * so every other directory is dead weight in the distributable.
 *
 * This hook keeps the target binary and deletes the rest after packing, before
 * code signing. It fails the build when the target binary is missing so we
 * never publish an app whose video metadata step is broken.
 */

const fs = require('node:fs');
const path = require('node:path');

/** electron-builder Arch enum → directory name used by ffprobe-static. */
const ARCH_NAMES = {
  0: 'ia32',
  1: 'x64',
  2: 'armv7l',
  3: 'arm64',
};

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}

function directorySize(dir) {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      total += directorySize(fullPath);
    } else if (entry.isFile()) {
      total += fs.statSync(fullPath).size;
    }
  }
  return total;
}

function findResourcesDir(context) {
  const { appOutDir, electronPlatformName, packager } = context;

  if (electronPlatformName === 'darwin') {
    const productFilename = packager?.appInfo?.productFilename;
    const candidates = productFilename
      ? [path.join(appOutDir, `${productFilename}.app`)]
      : fs
          .readdirSync(appOutDir)
          .filter((name) => name.endsWith('.app'))
          .map((name) => path.join(appOutDir, name));

    const appBundle = candidates.find((candidate) => fs.existsSync(candidate));
    if (!appBundle) {
      throw new Error(`[afterPack] macOS app bundle not found in ${appOutDir}`);
    }
    return path.join(appBundle, 'Contents', 'Resources');
  }

  return path.join(appOutDir, 'resources');
}

/**
 * Maps the build target to the ffprobe-static directories that must survive.
 * Universal macOS builds contain both architectures, so both are kept.
 */
function resolveAllowedArches(arch) {
  if (arch === 4) return ['x64', 'arm64']; // electron-builder Arch.universal

  const archName = ARCH_NAMES[arch];
  if (!archName) {
    throw new Error(
      `[afterPack] Unsupported electron-builder arch "${arch}". ` +
        `Known values: ${Object.entries(ARCH_NAMES)
          .map(([value, name]) => `${value}=${name}`)
          .join(', ')}, 4=universal.`
    );
  }
  return [archName];
}

module.exports = async function afterPack(context) {
  const { electronPlatformName, arch } = context;
  const binDir = path.join(
    findResourcesDir(context),
    'app.asar.unpacked',
    'node_modules',
    'ffprobe-static',
    'bin'
  );

  if (!fs.existsSync(binDir)) {
    throw new Error(
      `[afterPack] ffprobe-static binaries not found at ${binDir}. ` +
        'Check the `asarUnpack` patterns in package.json.'
    );
  }

  const allowedArches = resolveAllowedArches(arch);
  const allowedDirs = new Set(
    allowedArches.map((archName) => path.join(binDir, electronPlatformName, archName))
  );

  // Safety: never proceed if the binary this build will actually load is gone.
  for (const allowedDir of allowedDirs) {
    const probeName = electronPlatformName === 'win32' ? 'ffprobe.exe' : 'ffprobe';
    const probePath = path.join(allowedDir, probeName);
    if (!fs.existsSync(probePath)) {
      throw new Error(
        `[afterPack] Expected ffprobe binary missing: ${probePath}. ` +
          'Refusing to finish the build with a broken video metadata dependency.'
      );
    }
  }

  const removed = [];
  let freedBytes = 0;

  for (const platformEntry of fs.readdirSync(binDir, { withFileTypes: true })) {
    if (!platformEntry.isDirectory()) continue;
    const platformDir = path.join(binDir, platformEntry.name);

    for (const archEntry of fs.readdirSync(platformDir, { withFileTypes: true })) {
      if (!archEntry.isDirectory()) continue;
      const archDir = path.join(platformDir, archEntry.name);
      if (allowedDirs.has(archDir)) continue;

      const size = directorySize(archDir);
      fs.rmSync(archDir, { recursive: true, force: true });
      removed.push({ dir: archDir, size });
      freedBytes += size;
    }

    // Drop the platform folder when nothing inside it survived.
    if (fs.readdirSync(platformDir).length === 0) {
      fs.rmdirSync(platformDir);
    }
  }

  const kept = [...allowedDirs]
    .map((dir) => path.relative(binDir, dir))
    .join(', ');
  console.log(
    `[afterPack] ffprobe-static pruned: kept ${kept}; ` +
      `removed ${removed.length} director${removed.length === 1 ? 'y' : 'ies'} ` +
      `(${formatBytes(freedBytes)} freed).`
  );
  for (const item of removed) {
    console.log(`[afterPack]   - ${path.relative(binDir, item.dir)} (${formatBytes(item.size)})`);
  }
};
