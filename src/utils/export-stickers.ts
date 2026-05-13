import { jsPDF } from 'jspdf';
import type { StickerRow, LayoutConfig } from '@/types';
import { renderStickerCanvas, STICKER_W, STICKER_H, DEFAULT_LAYOUT } from './render-sticker';

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

function artTypeFolder(size: string): string {
  const s = size.toLowerCase();
  if (s.includes('paint by number')) return 'PaintByNumbers';
  if (s.includes('diamond art') || s.includes('diamond painting')) return 'DiamondArt';
  if (s.includes('embroidered') || s.includes('embroidery')) return 'Embroidery';
  return 'Other';
}

function datetimeStamp(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}_${hh}${min}`;
}

/**
 * Converts a canvas to a PNG data URL. PNG is used (rather than JPEG) so
 * UPC-A barcode edges and label text stay crisp — JPEG chroma subsampling
 * blurs hard black/white transitions, which can hurt barcode scan reliability.
 */
function canvasToPdfDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}

/**
 * Exports all selected rows with images as individual PDFs saved into a
 * user-chosen directory with the structure: type/size/art_name/upc.pdf
 */
export async function exportStickerPdfs(
  rows: StickerRow[],
  layout: LayoutConfig = DEFAULT_LAYOUT
): Promise<void> {
  const eligible = rows.filter((r) => r.selected && r.imageFile);

  if (eligible.length === 0) {
    throw new Error('No rows with images selected for export.');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });

  // Determine root export folder:
  //   - If user selected a folder named "Stickers", create datetime subfolder inside it.
  //   - Otherwise, create "Stickers_<datetime>" inside the selected folder.
  const stamp = datetimeStamp();
  const isStickersFolder = dirHandle.name.toLowerCase() === 'stickers';
  const rootHandle = isStickersFolder
    ? await dirHandle.getDirectoryHandle(stamp, { create: true })
    : await dirHandle.getDirectoryHandle(`Stickers_${stamp}`, { create: true });

  for (const row of eligible) {
    const stickerCanvas = await renderStickerCanvas(
      row.imageFile!,
      row.artName,
      row.size,
      row.upc,
      layout
    );

    const dataUrl = canvasToPdfDataUrl(stickerCanvas);

    // jsPDF — exact 4×6 in page, image placed at origin filling the page.
    // `compress: true` keeps output small without quality loss (PNG is lossless).
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: [STICKER_W_IN, STICKER_H_IN],
      compress: true,
    });

    // 'PNG' format + 'FAST' compression — visually identical to 'SLOW',
    // but ~2-3× faster for full-page sticker images.
    pdf.addImage(dataUrl, 'PNG', 0, 0, STICKER_W_IN, STICKER_H_IN, undefined, 'FAST');

    // Embed basic metadata so downstream tools can identify the sticker.
    pdf.setProperties({
      title: `${row.artName} — ${row.size}`,
      subject: row.upc || 'Sticker',
      creator: 'Sticker Maker',
    });

    const pdfBytes = pdf.output('arraybuffer');

    // Build filename: ArtName_PBN_10x12.pdf
    const artSlug = sanitize(row.artName).replace(/_+/g, '');
    const prodId = productIdentifier(row.size);
    const sizeSlug = sizeCode(row.size);
    const fileName = `${artSlug}_${prodId}_${sizeSlug}.pdf`;

    // Folder structure: <root>/<ArtType>/<size>/filename.pdf
    const typeDir = await rootHandle.getDirectoryHandle(artTypeFolder(row.size), { create: true });
    const sizeDir = await typeDir.getDirectoryHandle(sizeSlug, { create: true });

    const fileHandle = await sizeDir.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(pdfBytes);
    await writable.close();
  }
}
