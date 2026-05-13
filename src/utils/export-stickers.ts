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
 * Infers a type folder from the size string (e.g. "16x20 paint by numbers" → "paint-by-numbers").
 * Falls back to "other".
 */
function inferTypeFolder(size: string): string {
  const s = size.toLowerCase();
  if (s.includes('paint by number') || s.includes('paint by numbers')) return 'paint-by-numbers';
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

    // Build folder path: type / size / art_name
    const typeFolder = inferTypeFolder(row.size);
    const sizeFolder = sanitize(row.size);
    const artFolder = sanitize(row.artName);
    const fileName = `${sanitize(row.upc) || sanitize(row.artName)}.pdf`;

    const typeDir = await dirHandle.getDirectoryHandle(typeFolder, { create: true });
    const sizeDir = await typeDir.getDirectoryHandle(sizeFolder, { create: true });
    const artDir = await sizeDir.getDirectoryHandle(artFolder, { create: true });

    const fileHandle = await artDir.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(pdfBytes);
    await writable.close();
  }
}
