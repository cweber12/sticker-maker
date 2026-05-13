import type { jsPDF } from 'jspdf';

/**
 * Embedded font support for the PDF export.
 *
 * jsPDF only ships with Helvetica / Times / Courier. To preserve the
 * sticker's actual fonts (Baskerville Display PT for the art name,
 * Tw Cen MT for size) in the EDITABLE text layer of the exported PDF,
 * the .ttf files must be loaded into jsPDF's virtual file system and
 * registered as fonts.
 *
 * Drop the .ttf files into `public/fonts/` and they will be picked up
 * automatically:
 *   public/fonts/BaskervilleDisplayPT.ttf
 *   public/fonts/TwCenMT.ttf
 *
 * If a font file is missing, the exporter silently falls back to the
 * closest built-in (Times for name, Helvetica for size).
 */

export const PDF_NAME_FONT_FAMILY = 'BaskervilleDisplayPT';
export const PDF_SIZE_FONT_FAMILY = 'TwCenMT';

/** Built-in fallbacks if the TTF files aren't present. */
export const PDF_NAME_FALLBACK = 'times';
export const PDF_SIZE_FALLBACK = 'helvetica';

interface FontAsset {
  family: string;
  fallback: string;
  filename: string; // file under /fonts/
  vfsName: string;  // arbitrary virtual-FS filename used by jsPDF
}

const FONTS: FontAsset[] = [
  {
    family: PDF_NAME_FONT_FAMILY,
    fallback: PDF_NAME_FALLBACK,
    filename: 'BaskervilleDisplayPT.ttf',
    vfsName: 'BaskervilleDisplayPT.ttf',
  },
  {
    family: PDF_SIZE_FONT_FAMILY,
    fallback: PDF_SIZE_FALLBACK,
    filename: 'TwCenMT.ttf',
    vfsName: 'TwCenMT.ttf',
  },
];

/** family → base64 data (null if missing). Populated once on first export. */
let loadedFonts: Map<string, string | null> | null = null;
let loadPromise: Promise<Map<string, string | null>> | null = null;

async function fetchAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);

    // Validate this is actually a TrueType/OpenType file. Vite's dev server
    // falls back to index.html for missing static files (200 OK with HTML),
    // which would otherwise get embedded and trigger jsPDF's
    // "No unicode cmap for font" deep inside addFont.
    // Valid font magic numbers (first 4 bytes):
    //   0x00010000  TrueType
    //   "OTTO"      OpenType / CFF
    //   "true"      TrueType (legacy Mac)
    //   "typ1"      PostScript Type 1
    //   "ttcf"      TrueType Collection
    if (bytes.length < 4) return null;
    const sig = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
    const isTrueType =
      bytes[0] === 0x00 && bytes[1] === 0x01 && bytes[2] === 0x00 && bytes[3] === 0x00;
    const isKnownSig = sig === 'OTTO' || sig === 'true' || sig === 'typ1' || sig === 'ttcf';
    if (!isTrueType && !isKnownSig) return null;

    // Chunked btoa to avoid call-stack overflow on large files.
    let binary = '';
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode.apply(
        null,
        Array.from(bytes.subarray(i, i + CHUNK))
      );
    }
    return btoa(binary);
  } catch {
    return null;
  }
}

async function loadAllFonts(): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  await Promise.all(
    FONTS.map(async (f) => {
      const data = await fetchAsBase64(`${import.meta.env.BASE_URL}fonts/${f.filename}`);
      map.set(f.family, data);
      if (!data) {
        // One-time console warning per missing file.
        console.warn(
          `[pdf-fonts] /fonts/${f.filename} not found — PDF will fall back to ${f.fallback}. ` +
            `Drop the .ttf into public/fonts/ to embed the real font.`
        );
      }
    })
  );
  return map;
}

/**
 * Loads font files (once) and registers any that are present with the
 * supplied jsPDF instance. Returns the resolved family names to use,
 * so callers can substitute the fallback automatically.
 */
export async function registerPdfFonts(pdf: jsPDF): Promise<{
  nameFamily: string;
  sizeFamily: string;
}> {
  if (!loadedFonts) {
    if (!loadPromise) loadPromise = loadAllFonts();
    loadedFonts = await loadPromise;
  }

  for (const f of FONTS) {
    const data = loadedFonts.get(f.family);
    if (data) {
      pdf.addFileToVFS(f.vfsName, data);
      pdf.addFont(f.vfsName, f.family, 'normal');
    }
  }

  return {
    nameFamily: loadedFonts.get(PDF_NAME_FONT_FAMILY) ? PDF_NAME_FONT_FAMILY : PDF_NAME_FALLBACK,
    sizeFamily: loadedFonts.get(PDF_SIZE_FONT_FAMILY) ? PDF_SIZE_FONT_FAMILY : PDF_SIZE_FALLBACK,
  };
}
