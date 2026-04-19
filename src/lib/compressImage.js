/**
 * Compress an image file in the browser to a JPEG blob.
 * - Downsizes so longest edge <= maxEdge (default 1200px)
 * - Starts at quality 0.72, halves it up to 3× until blob <= maxBytes (400 KB)
 * Returns a Blob ready for upload to Supabase Storage.
 */
export async function compressImage(file, { maxEdge = 1200, quality = 0.72, maxBytes = 400 * 1024 } = {}) {
  if (!file) return null;
  if (!file.type.startsWith('image/')) throw new Error('File is not an image');

  const bitmap = await createImageBitmap(file);
  const { width: w0, height: h0 } = bitmap;
  const scale = Math.min(1, maxEdge / Math.max(w0, h0));
  const w = Math.round(w0 * scale);
  const h = Math.round(h0 * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const toBlob = (q) =>
    new Promise((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
        'image/jpeg',
        q
      )
    );

  let blob = await toBlob(quality);
  let q = quality;
  for (let i = 0; i < 3 && blob.size > maxBytes; i++) {
    q = Math.max(0.3, q * 0.6);
    blob = await toBlob(q);
  }
  return blob;
}

/** Read a compressed blob as a data URL for preview. */
export function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}
