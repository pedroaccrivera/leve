import sharp from 'sharp';

/**
 * App icon tinting.
 *
 * The dock / taskbar icon follows the tone chosen in the app: the artwork is
 * hue-rotated by the same shift the renderer applies to its colour tokens, so
 * the icon and the window agree. A shift of 0 returns the designed artwork
 * untouched.
 */
export const tintIcon = async (base: Buffer, shift: number, size = 512): Promise<Buffer> => {
  const pipeline = sharp(base).resize(size, size, { fit: 'contain' });
  if (!Number.isFinite(shift) || Math.abs(shift) < 0.5) return pipeline.png().toBuffer();
  return pipeline.modulate({ hue: shift }).png().toBuffer();
};
