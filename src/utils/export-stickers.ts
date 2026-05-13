import { jsPDF } from 'jspdf';
import type { StickerRow } from '@/types';
import { renderStickerCanvas, STICKER_W, STICKER_H } from './render-sticker';

const DPI = 300;
const STICKER_W_IN = STICKER_W / DPI; // 4 inches
const STICKER_H_IN = STICKER_H / DPI; // 6 inches

/**
 * Sanitizes a string for use as a filesystem path segment.
 */
function sanitize(str: string): string {
  return str.replace(/[<>:"/\\|?*]+/g, '_').replace(/\s+/g, '_').trim() || 'unknown';
}

/**
 * Returns a short product identifier from the size string.
 * "10 x 12 paint by numbers" → "PBN"
 * "10 x 12 diamond painting"  → "DP"
 */
function productIdentifier(size: string): string {
  const s = size.toLowerCase();
  if (s.includes('paint by number')) return 'PBN';
  if (s.includes('diamond art') || s.includes('diamond painting')) return 'DP';
  if (s.includes('embroidered') || s.includes('embroidery')) return 'EMB';
  return 'OTHER';
}

/**
 * Extracts just the numeric size portion, e.g. "10 x 12 Paint by Numbers" → "10x12".
 */
function sizeCode(size: string): string {
  const match = size.match(/(\d+\s*[xX×]\s*\d+)/);
  if (!match) return sanitize(size);
  return match[1].replace(/\s*[xX×]\s*/, 'x');
}

function inferTypeFolder(size: string): string {
  const s = size.toLowerCase();
  if (s.includes('paint by number')) return 'paint-by-numbers';
  if (s.includes('diamond art') || s.includes('diamond painting')) return 'diamond-art';
  if (s.includes('embroidered') || s.includes('embroidery')) return 'embroidery';
  return 'other';
}

/**
 * Converts a canvas to a jsPDF-compatible data URL at the sticker dimensions.
 */
function canvasToPdfDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/jpeg', 0.95);
}

/**
 * Exports all selected rows with images as individual PDFs saved into a
 * user-chosen directory with the structure: type/size/art_name/upc.pdf
 */
export async function exportStickerPdfs(rows: StickerRow[]): Promise<void> {
  const eligible = rows.filter((r) => r.selected && r.imageFile);

  if (eligible.length === 0) {
    throw new Error('No rows with images selected for export.');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });

  for (const row of eligible) {
    const stickerCanvas = await renderStickerCanvas(
      row.imageFile!,
      row.artName,
      row.size,
      row.upc
    );

    const dataUrl = canvasToPdfDataUrl(stickerCanvas);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: [STICKER_W_IN, STICKER_H_IN],
    });

    pdf.addImage(dataUrl, 'JPEG', 0, 0, STICKER_W_IN, STICKER_H_IN);

    const pdfBytes = pdf.output('arraybuffer');

    // Build filename: ArtName_PBN_10x12.pdf
    const artSlug = sanitize(row.artName).replace(/_+/g, '');
    const prodId = productIdentifier(row.size);
    const sizeSlug = sizeCode(row.size);
    const fileName = `${artSlug}_${prodId}_${sizeSlug}.pdf`;

    const typeFolder = inferTypeFolder(row.size);
    const sizeFolder = sanitize(row.size);
    const artFolder = sanitize(row.artName);

    const typeDir = await dirHandle.getDirectoryHandle(typeFolder, { create: true });
    const sizeDir = await typeDir.getDirectoryHandle(sizeFolder, { create: true });
    const artDir = await sizeDir.getDirectoryHandle(artFolder, { create: true });

    const fileHandle = await artDir.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(pdfBytes);
    await writable.close();
  }
}
