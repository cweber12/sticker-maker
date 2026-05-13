import bwipjs from 'bwip-js';

// Sticker dimensions: 4×6 in at 300 DPI
export const STICKER_W = 1200;
export const STICKER_H = 1800;
export const STRIP_H = 240;        // bottom white strip height in px
export const PADDING = 32;
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

  // --- Product image (fills top area) ---
  const imgAreaH = STICKER_H - STRIP_H;
  const img = await loadImage(imageFile);
  const srcRatio = img.width / img.height;
  const dstRatio = STICKER_W / imgAreaH;

  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (srcRatio > dstRatio) {
    // Image is wider — crop sides
    sw = img.height * dstRatio;
    sx = (img.width - sw) / 2;
  } else {
    // Image is taller — crop top/bottom
    sh = img.width / dstRatio;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, STICKER_W, imgAreaH);

  // --- Bottom strip ---
  const stripY = imgAreaH;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, stripY, STICKER_W, STRIP_H);

  // Separator line
  ctx.strokeStyle = '#e5e5e5';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, stripY);
  ctx.lineTo(STICKER_W, stripY);
  ctx.stroke();

  // --- Barcode (right side) ---
  const barcodeCanvas = await renderBarcode(upc);
  const barcodeW = 340;
  const barcodeH = barcodeCanvas
    ? Math.round((barcodeCanvas.height / barcodeCanvas.width) * barcodeW)
    : 0;
  const barcodeX = STICKER_W - barcodeW - PADDING;
  const barcodeY = stripY + (STRIP_H - barcodeH) / 2;

  if (barcodeCanvas) {
    ctx.drawImage(barcodeCanvas, barcodeX, barcodeY, barcodeW, barcodeH);
  }

  // --- Text (left side) ---
  const textMaxW = barcodeX - PADDING * 2;

  // Art Name — large, bold, uppercase spaced (matching reference)
  ctx.fillStyle = '#111111';
  ctx.font = `bold 44px '${NAME_FONT}'`;
  ctx.letterSpacing = '3px';
  const artNameUpper = artName.toUpperCase();
  ctx.fillText(clampText(ctx, artNameUpper, textMaxW), PADDING, stripY + 80);

  // Size — smaller, regular weight
  ctx.font = `28px '${META_FONT}'`;
  ctx.letterSpacing = '1px';
  ctx.fillStyle = '#444444';
  ctx.fillText(clampText(ctx, size, textMaxW), PADDING, stripY + 122);

  return canvas;
}

function clampText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 0 && ctx.measureText(t + '…').width > maxWidth) {
    t = t.slice(0, -1);
  }
  return t + '…';
}
