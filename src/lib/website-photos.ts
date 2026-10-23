export const PHOTO_BUCKET = 'website-photos';
export const PHOTO_PREFIX = '/api/public/website-photo?path=';
export const photoPathPattern = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/;
export function photoPath(value: string): string | null {
  if (!value.startsWith(PHOTO_PREFIX)) return null;
  const path = value.slice(PHOTO_PREFIX.length);
  return photoPathPattern.test(path) ? path : null;
}
export function validatePhotoFile(file: { type: string; size: number }) {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif'].includes(file.type)) {
    throw new Error('Choose a JPG, PNG, WebP, AVIF or phone photo.');
  }
  if (!file.size || file.size > 20 * 1024 * 1024) throw new Error('Choose a photo smaller than 20 MB.');
}
/** Decode and re-encode locally: strip metadata and never upload active SVG content. */
export async function preparePhoto(file: File): Promise<Blob> {
  validatePhotoFile(file);
  let image: ImageBitmap;
  try { image = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch { throw new Error('This photo format cannot be opened on this device. Choose a JPG or PNG version.'); }
  try {
    const scale = Math.min(1, 2400 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Photo preparation failed. Try another photo.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Photo preparation failed.')), 'image/jpeg', 0.88));
    if (blob.size > 10 * 1024 * 1024) throw new Error('This photo is too large. Choose a smaller photo.');
    return blob;
  } finally { image.close(); }
}