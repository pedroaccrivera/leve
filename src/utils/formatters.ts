export function formatBytes(bytes: number, decimals = 1): string {
  if (!+bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDimensions(width?: number, height?: number): string {
  if (!width && !height) return '';
  if (width && !height) return `${width}px (w)`;
  if (!width && height) return `${height}px (h)`;
  return `${width} × ${height} px`;
}

export function calculateEstimatedHeight(
  origW?: number,
  origH?: number,
  targetW?: number,
  withoutEnlargement = true
): number | undefined {
  if (!origW || !origH || !targetW) return undefined;
  if (withoutEnlargement && origW <= targetW) {
    return origH;
  }
  const ratio = origH / origW;
  return Math.round(targetW * ratio);
}
