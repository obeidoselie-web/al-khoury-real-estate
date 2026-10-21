import 'server-only';

import { mkdir, readFile, rmdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

/*
 * Photo storage behind a small interface. Today: files on local disk (UPLOAD_DIR, default
 * data/uploads), served by the /media route. To move to Cloudinary or S3, implement `PhotoStorage`
 * (put/get/delete by key, plus a public URL) and return it from `getPhotoStorage()`; listing rows
 * keep only `src` and `storageKey`, so nothing else changes.
 */

export interface StoredPhoto {
  key: string;
  url: string;
  width: number;
  height: number;
}

export interface PhotoStorage {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<{ data: Buffer; contentType: string } | null>;
  delete(key: string): Promise<void>;
  url(key: string): string;
}

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
export const MAX_PHOTO_EDGE = 2400;
const KEY_PATTERN = /^listings\/[a-z0-9-]{1,120}\/[a-f0-9-]{36}\.webp$/;

export function isValidKey(key: string): boolean {
  return KEY_PATTERN.test(key);
}

export class LocalDiskStorage implements PhotoStorage {
  constructor(private readonly root = process.env.UPLOAD_DIR || path.join(process.cwd(), 'data', 'uploads')) {}

  private resolve(key: string): string {
    if (!isValidKey(key)) throw new Error('Invalid storage key');
    const file = path.resolve(this.root, key);
    if (!file.startsWith(path.resolve(this.root) + path.sep)) throw new Error('Invalid storage key');
    return file;
  }

  async put(key: string, data: Buffer): Promise<void> {
    const file = this.resolve(key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, data);
  }

  async get(key: string) {
    try {
      return { data: await readFile(this.resolve(key)), contentType: 'image/webp' };
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    const file = this.resolve(key);
    await unlink(file).catch(() => undefined);
    // Remove the listing folder once its last photo is gone (fails harmlessly while others remain).
    await rmdir(path.dirname(file)).catch(() => undefined);
  }

  url(key: string): string {
    return `/media/${key}`;
  }
}

let storage: PhotoStorage | null = null;

export function getPhotoStorage(): PhotoStorage {
  storage ??= new LocalDiskStorage();
  return storage;
}

export class UploadError extends Error {}

/**
 * Validates and normalises an uploaded image: decodes it with sharp (so only real JPEG, PNG, WebP,
 * AVIF or HEIC files pass), applies EXIF rotation, strips all metadata (including GPS), caps the
 * long edge at 2400px and re-encodes to WebP. Then stores it under a fresh key.
 */
export async function storeListingPhoto(listingId: string, file: File): Promise<StoredPhoto> {
  if (file.size === 0) throw new UploadError('The file is empty.');
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError('Photos must be 12 MB or smaller.');

  const input = Buffer.from(await file.arrayBuffer());
  let output: { data: Buffer; info: { width: number; height: number } };
  try {
    const image = sharp(input, { limitInputPixels: 80_000_000, failOn: 'error' });
    const meta = await image.metadata();
    if (!meta.format || !['jpeg', 'png', 'webp', 'avif', 'heif'].includes(meta.format)) {
      throw new UploadError('Use a JPEG, PNG, WebP or HEIC photo.');
    }
    output = await image
      .rotate()
      .resize({ width: MAX_PHOTO_EDGE, height: MAX_PHOTO_EDGE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
  } catch (error) {
    if (error instanceof UploadError) throw error;
    throw new UploadError('That file is not a photo we can read.');
  }

  const key = `listings/${listingId}/${crypto.randomUUID()}.webp`;
  const store = getPhotoStorage();
  await store.put(key, output.data, 'image/webp');
  return { key, url: store.url(key), width: output.info.width, height: output.info.height };
}
