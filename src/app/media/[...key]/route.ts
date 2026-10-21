import { getPhotoStorage, isValidKey } from '@/lib/storage';

/** Serves uploaded listing photos from the configured storage (local disk by default). */
export async function GET(_request: Request, { params }: RouteContext<'/media/[...key]'>) {
  const key = (await params).key.join('/');
  if (!isValidKey(key)) return new Response('Not found', { status: 404 });

  const file = await getPhotoStorage().get(key);
  if (!file) return new Response('Not found', { status: 404 });

  return new Response(new Uint8Array(file.data), {
    headers: {
      'Content-Type': file.contentType,
      // Keys are unique per upload, so the content behind a URL never changes.
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': String(file.data.length),
    },
  });
}
