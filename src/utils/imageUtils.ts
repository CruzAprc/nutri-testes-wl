/**
 * Compress an image file using Canvas API.
 * Returns a JPEG Blob with reduced dimensions and quality.
 */
export async function compressImage(
  file: File,
  options?: { maxWidth?: number; quality?: number }
): Promise<Blob> {
  const maxWidth = options?.maxWidth ?? 1200;
  const quality = options?.quality ?? 0.8;

  const bitmap = await createImageBitmap(file);
  let width = bitmap.width;
  let height = bitmap.height;

  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to compress image'));
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Load an image from a URL and return an HTMLImageElement.
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Generate a side-by-side comparison image (BEFORE / AFTER).
 * Returns a JPEG Blob with a 1200x800 canvas.
 */
export async function generateComparisonImage(params: {
  beforeUrl: string;
  afterUrl: string;
  beforeDate: string;
  afterDate: string;
  appName?: string;
}): Promise<Blob> {
  const { beforeUrl, afterUrl, beforeDate, afterDate, appName } = params;

  const CANVAS_W = 1200;
  const CANVAS_H = 800;
  const HEADER_H = 50;
  const FOOTER_H = 40;
  const GAP = 4;

  const [beforeImg, afterImg] = await Promise.all([
    loadImage(beforeUrl),
    loadImage(afterUrl),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Header labels
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ANTES', CANVAS_W / 4, HEADER_H / 2 + 8);
  ctx.fillText('DEPOIS', (CANVAS_W * 3) / 4, HEADER_H / 2 + 8);

  // Image area
  const imgY = HEADER_H;
  const imgH = CANVAS_H - HEADER_H - FOOTER_H;
  const halfW = (CANVAS_W - GAP) / 2;

  // Draw before image (left)
  drawCover(ctx, beforeImg, 0, imgY, halfW, imgH);

  // Draw after image (right)
  drawCover(ctx, afterImg, halfW + GAP, imgY, halfW, imgH);

  // Center divider line
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(halfW, imgY, GAP, imgH);

  // Footer with dates
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  const footerY = CANVAS_H - FOOTER_H / 2 + 5;
  ctx.fillText(beforeDate, CANVAS_W / 4, footerY);
  ctx.fillText(afterDate, (CANVAS_W * 3) / 4, footerY);

  // App name watermark (if provided)
  if (appName) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(appName, CANVAS_W - 12, CANVAS_H - 8);
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to generate comparison image'));
      },
      'image/jpeg',
      0.9
    );
  });
}

/**
 * Draw an image into a rectangular area using "cover" mode
 * (fills the area while maintaining aspect ratio, cropping overflow).
 */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  const imgRatio = img.width / img.height;
  const areaRatio = dw / dh;

  let sx: number, sy: number, sw: number, sh: number;

  if (imgRatio > areaRatio) {
    // Image is wider than area - crop sides
    sh = img.height;
    sw = img.height * areaRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    // Image is taller than area - crop top/bottom
    sw = img.width;
    sh = img.width / areaRatio;
    sx = 0;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

/**
 * Share a blob via Web Share API if supported, otherwise trigger a file download.
 */
export async function shareOrDownload(params: {
  blob: Blob;
  fileName: string;
  title?: string;
}): Promise<void> {
  const { blob, fileName, title } = params;

  if (navigator.share && navigator.canShare) {
    const file = new File([blob], fileName, { type: blob.type });
    const shareData: ShareData = { files: [file], title };

    if (navigator.canShare(shareData)) {
      await navigator.share(shareData);
      return;
    }
  }

  // Fallback: download via anchor element
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download a remote image by fetching it and triggering a browser download.
 */
export async function downloadImageFromUrl(
  url: string,
  fileName: string
): Promise<void> {
  const response = await fetch(url);
  const blob = await response.blob();

  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}
