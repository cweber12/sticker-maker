import bwipjs from 'bwip-js';

// Sticker dimensions: 4×6 in at 300 DPI
export const STICKER_W = 1200;
export const STICKER_H = 1800;
export const LABEL_INSET = 46;      // 12 units × 3.82 scale — gap between label and sticker edge
export const LABEL_H = 171;         // canvas px — floating white label height
export const LABEL_PAD = 38;        // 10 units × 3.82 — inner padding inside the label
export const TEXT_AREA_W = 650;     // 170 units × 3.82 — reserved width for art name / size
export const BARCODE_ZONE_W = 382;  // 100 units × 3.82 — reserved width for barcode (always held)
export const NAME_FONT = 'Baskerville Display PT';
export const META_FONT = 'Tw Cen MT';

/**
 * Renders a UPC-A barcode onto an offscreen canvas and returns it as ImageBitmap.
 * Returns null for invalid UPCs.
 */
export async function renderBarcode(upc: string): Promise<HTMLCanvasElement | null> {
  if (!/^\d{12}$/.test(upc)) return null;
  try {
    const canvas = document.createElement('canvas');
    bwipjs.toCanvas(canvas, {
      bcid: 'upca',
      text: upc,
      scale: 4,
      height: 18,
      includetext: true,
      textxalign: 'center',
    });
    return canvas;
  } catch {
    return null;
  }
}

/**
 * Loads a File as an HTMLImageElement.
 */
export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    img.src = url;
  });
}

/**
 * Composites one sticker onto a 1200×1800 canvas and returns it.
 * Layout: product image fills top portion, white strip at bottom.
 * Strip: Art Name + Size on the left, UPC-A barcode on the right.
 */
export async function renderStickerCanvas(
  imageFile: File,
  artName: string,
  size: string,
  upc: string
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = STICKER_W;
  canvas.height = STICKER_H;
  const ctx = canvas.getContext('2d')!;

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, STICKER_W, STICKER_H);

  // --- Product image (full bleed) ---
  const img = await loadImage(imageFile);
  const srcRatio = img.width / img.height;
  const dstRatio = STICKER_W / STICKER_H;

  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (srcRatio > dstRatio) {
    sw = img.height * dstRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / dstRatio;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, STICKER_W, STICKER_H);

  // --- Floating white label (inset from all edges at bottom) ---
  const labelX = LABEL_INSET;
  const labelY = STICKER_H - LABEL_INSET - LABEL_H;
  const labelW = STICKER_W - LABEL_INSET * 2;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(labelX, labelY, labelW, LABEL_H);

  // --- Barcode (fixed zone on right side of label) ---
  const barcodeCanvas = await renderBarcode(upc);
  const barcodeZoneX = labelX + labelW - LABEL_PAD - BARCODE_ZONE_W;
  const barcodeH = barcodeCanvas
    ? Math.round((barcodeCanvas.height / barcodeCanvas.width) * BARCODE_ZONE_W)
    : 0;
  const barcodeY = labelY + (LABEL_H - barcodeH) / 2;

  if (barcodeCanvas) {
    ctx.drawImage(barcodeCanvas, barcodeZoneX, barcodeY, BARCODE_ZONE_W, barcodeH);
  }

  // --- Text (fixed area on left side of label) ---
  const textX = labelX + LABEL_PAD;

  // Art Name — 14.5pt @ 300dpi = 60px, 200 tracking = 12px letter-spacing
  // Font size scales down if text is too wide so full name always displays.
  ctx.fillStyle = '#111111';
  ctx.letterSpacing = '12px';
  const artNameUpper = artName.toUpperCase();
  const nameFontSize = fitFontSize(ctx, artNameUpper, TEXT_AREA_W, 60, NAME_FONT);
  ctx.font = `${nameFontSize}px '${NAME_FONT}'`;
  ctx.fillText(artNameUpper, textX, labelY + 100);

  // Size — 9pt @ 300dpi = 38px
  ctx.letterSpacing = '1px';
  const sizeFontSize = fitFontSize(ctx, size, TEXT_AREA_W, 38, META_FONT);
  ctx.font = `${sizeFontSize}px '${META_FONT}'`;
  ctx.fillStyle = '#444444';
  ctx.fillText(size, textX, labelY + 165);

  return canvas;
}

/** Reduces font size (step -1px) until text fits within maxWidth. */
function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  family: string
): number {
  let size = startSize;
  ctx.font = `${size}px '${family}'`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 1;
    ctx.font = `${size}px '${family}'`;
  }
  return size;
}
