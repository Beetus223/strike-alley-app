import { describe, expect, it } from 'vitest';
import { photoPath, PHOTO_PREFIX, validatePhotoFile } from './website-photos';
describe('Website photo safety', () => {
  it('accepts managed photo paths', () => expect(photoPath(PHOTO_PREFIX + '4d938c99-f250-4a9c-927f-ae1301046021/11111111-1111-4111-8111-111111111111.jpg')).toBe('4d938c99-f250-4a9c-927f-ae1301046021/11111111-1111-4111-8111-111111111111.jpg'));
  it('rejects paths outside website photos', () => expect(photoPath(PHOTO_PREFIX + '../../private.jpg')).toBeNull());
  it('rejects active SVG uploads', () => expect(() => validatePhotoFile({ type: 'image/svg+xml', size: 100 })).toThrow());
  it('allows phone JPEG photos', () => expect(() => validatePhotoFile({ type: 'image/jpeg', size: 2048 })).not.toThrow());
  it('rejects files larger than 20 MB', () => expect(() => validatePhotoFile({ type: 'image/jpeg', size: 20 * 1024 * 1024 + 1 })).toThrow());
});