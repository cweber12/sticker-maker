import bwipjs from 'bwip-js';
import type { LayoutConfig } from '@/types';

// Sticker dimensions: 4×6 in at 300 DPI
export const STICKER_W = 1200;
export const STICKER_H = 1800;

/** Design-unit scale: 1 design unit ≈ this many canvas px. */
export const DESIGN_UNIT_PX = 3.82;

export const NAME_FONT = 'Baskerville Display PT';
export const META_FONT = 'Tw Cen MT';

/**
 * Default layout — matches the values documented in docs/unit-conversions.md.
 * (12 / 45 / 10 / 170 / 100 design units × 3.82 = px below.)
 */
export const DEFAULT_LAYOUT: LayoutConfig = {
  labelInset:       46,   // ≈ 12 du
  labelHeight:      171,  // ≈ 45 du
  labelPadding:     38,   // ≈ 10 du
  textAreaWidth:    650,  // ≈ 170 du
  barcodeZoneWidth: 382,  // = 100 du
  nameFontSize:     52,
  sizeFontSize:     38,
};

/** Min font size px floor when shrinking text to fit. */
const FONT_FLOOR = 10;

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
 * Layout: product image fills full bleed, white floating strip at bottom.
 * Strip: Art Name + Size on the left, UPC-A barcode on the right.
 */
export async function renderStickerCanvas(
  imageFile: File,
  artName: string,
  size: string,
  upc: string,
  layout: LayoutConfig = DEFAULT_LAYOUT,
  options: { skipText?: boolean } = {}
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = STICKER_W;
  canvas.height = STICKER_H;
  const ctx = canvas.getContext('2d')!;

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, STICKER_W, STICKER_H);

  // --- Product image (full bleed, cover crop) ---
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
  const labelX = layout.labelInset;
  const labelY = STICKER_H - layout.labelInset - layout.labelHeight;
  const labelW = STICKER_W - layout.labelInset * 2;
  const labelH = layout.labelHeight;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(labelX, labelY, labelW, labelH);

  // --- Barcode (right side of label — no padding, flush to label top/right/bottom edges) ---
  // Rendered at barcodeZoneWidth × labelHeight (default ≈ 100 × 45 design units).
  const barcodeCanvas = await renderBarcode(upc);
  const barcodeX = labelX + labelW - layout.barcodeZoneWidth; // flush to right edge

  if (barcodeCanvas) {
    ctx.drawImage(barcodeCanvas, barcodeX, labelY, layout.barcodeZoneWidth, labelH);
  }

  // --- Text (fixed area on left side of label) ---
  // Skipped when the export pipeline overlays selectable text natively via jsPDF.
  if (options.skipText) {
    return canvas;
  }

  const textX = labelX + layout.labelPadding;

  // Art Name — uppercase, all-caps so no ascenders above cap height.
  ctx.fillStyle = '#111111';
  ctx.letterSpacing = '12px';
  const artNameUpper = artName.toUpperCase();
  const nameFontSize = fitFontSize(
    ctx, artNameUpper, layout.textAreaWidth, layout.nameFontSize, NAME_FONT
  );
  ctx.font = `${nameFontSize}px '${NAME_FONT}'`;
  // Baseline: labelPadding from label top + cap height (≈ 72% of font size).
  const nameY = labelY + layout.labelPadding + Math.round(nameFontSize * 0.72);
  ctx.fillText(artNameUpper, textX, nameY);

  // Size — non-caps, has descenders.
  ctx.letterSpacing = '1px';
  const sizeFontSize = fitFontSize(
    ctx, size, layout.textAreaWidth, layout.sizeFontSize, META_FONT
  );
  ctx.font = `${sizeFontSize}px '${META_FONT}'`;
  ctx.fillStyle = '#444444';
  // Baseline: labelPadding from label bottom − descender depth (≈ 20% of font size).
  const sizeY = labelY + labelH - layout.labelPadding - Math.round(sizeFontSize * 0.20);
  ctx.fillText(size, textX, sizeY);

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
  while (size > FONT_FLOOR && ctx.measureText(text).width > maxWidth) {
    size -= 1;
    ctx.font = `${size}px '${family}'`;
  }
  return size;
}
