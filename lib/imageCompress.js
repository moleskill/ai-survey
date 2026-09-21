// Сжатие фото в браузере перед загрузкой. Снимки с телефона весят 3–10 МБ,
// а Vercel принимает запросы до 4,5 МБ, да и галерея быстрее грузится с лёгкими файлами.

async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* пробуем через <img> */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function compressImage(file, { maxSide = 1800, quality = 0.82 } = {}) {
  if (!file.type.startsWith('image/')) throw new Error('Это не изображение');

  let source;
  try {
    source = await decode(file);
  } catch {
    throw new Error('Не удалось открыть фото. Подходят JPG, PNG и WebP.');
  }

  const scale = Math.min(1, maxSide / Math.max(source.width, source.height));
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; // прозрачные PNG не должны становиться чёрными
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);
  if (typeof source.close === 'function') source.close();

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Не удалось сжать фото'))), 'image/jpeg', quality);
  });
  return { blob, width, height };
}
