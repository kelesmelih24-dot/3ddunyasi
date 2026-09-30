// Yüklemeden önce görseli tarayıcıda küçültür (en uzun kenar 1600 px, WebP). GIF/SVG ve küçük dosyalar olduğu gibi kalır.
export async function gorselKucult(file, { maks = 1600, kalite = 0.82 } = {}) {
  if (!file?.type?.startsWith('image/') || /gif|svg/.test(file.type) || file.size < 250 * 1024) return file;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const oran = Math.min(1, maks / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * oran); c.height = Math.round(bmp.height * oran);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((ok) => c.toBlob(ok, 'image/webp', kalite));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' });
  } catch { return file; }
}
