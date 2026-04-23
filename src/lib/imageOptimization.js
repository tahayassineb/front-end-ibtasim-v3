const DEFAULT_OPTIONS = {
  maxWidth: 1800,
  maxHeight: 1800,
  quality: 0.82,
};

export async function optimizeImageFile(file, options = {}) {
  const settings = { ...DEFAULT_OPTIONS, ...options };
  if (!file?.type?.startsWith('image/')) {
    return { file, optimized: false, originalSize: file?.size || 0, finalSize: file?.size || 0 };
  }

  if (!supportsCanvasImageOptimization()) {
    return { file, optimized: false, originalSize: file.size, finalSize: file.size };
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, settings.maxWidth / bitmap.width, settings.maxHeight / bitmap.height);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.drawImage(bitmap, 0, 0, width, height);

    const originalWidth = bitmap.width;
    const originalHeight = bitmap.height;
    const type = await supportsWebP() ? 'image/webp' : file.type;
    const blob = await canvasToBlob(canvas, type, settings.quality);
    bitmap.close?.();

    if (!blob || blob.size >= file.size) {
      return { file, optimized: false, originalSize: file.size, finalSize: file.size, width: originalWidth, height: originalHeight };
    }

    const extension = type === 'image/webp' ? 'webp' : file.name.split('.').pop() || 'jpg';
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const optimizedFile = new File([blob], `${baseName}.${extension}`, { type, lastModified: Date.now() });

    return {
      file: optimizedFile,
      optimized: true,
      originalSize: file.size,
      finalSize: optimizedFile.size,
      width,
      height,
      ratio: optimizedFile.size / file.size,
    };
  } catch {
    return { file, optimized: false, originalSize: file.size, finalSize: file.size };
  }
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function supportsCanvasImageOptimization() {
  return typeof document !== 'undefined' && typeof createImageBitmap === 'function';
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

let webpSupportPromise;
function supportsWebP() {
  if (!webpSupportPromise) {
    webpSupportPromise = new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      canvas.toBlob((blob) => resolve(Boolean(blob && blob.type === 'image/webp')), 'image/webp', 0.8);
    });
  }
  return webpSupportPromise;
}
