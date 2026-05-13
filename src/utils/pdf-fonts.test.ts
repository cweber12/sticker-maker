/**
 * pdf-fonts.test.ts
 *
 * Strategy: Each test calls vi.resetModules() before importing the module
 * so the module-level cache (loadedFonts / loadPromise) starts fresh.
 * The global fetch is stubbed before each import.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

function makeMockPdf() {
  return { addFileToVFS: vi.fn(), addFont: vi.fn() };
}

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
});

describe('registerPdfFonts', () => {
  it('falls back to built-in fonts when fetch returns HTML (invalid font bytes)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new TextEncoder().encode('<html></html>').buffer,
    } as unknown as Response);
    vi.resetModules();
    const { registerPdfFonts, PDF_NAME_FALLBACK, PDF_SIZE_FALLBACK } = await import('@/utils/pdf-fonts');
    const pdf = makeMockPdf();
    const { nameFamily, sizeFamily } = await registerPdfFonts(pdf as never);
    expect(nameFamily).toBe(PDF_NAME_FALLBACK);
    expect(sizeFamily).toBe(PDF_SIZE_FALLBACK);
    expect(pdf.addFont).not.toHaveBeenCalled();
  });

  it('falls back when fetch returns a non-OK response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      arrayBuffer: async () => new ArrayBuffer(0),
    } as unknown as Response);
    vi.resetModules();
    const { registerPdfFonts, PDF_NAME_FALLBACK, PDF_SIZE_FALLBACK } = await import('@/utils/pdf-fonts');
    const pdf = makeMockPdf();
    const { nameFamily, sizeFamily } = await registerPdfFonts(pdf as never);
    expect(nameFamily).toBe(PDF_NAME_FALLBACK);
    expect(sizeFamily).toBe(PDF_SIZE_FALLBACK);
  });

  it('registers fonts and returns custom families when valid TTFs are fetched', async () => {
    const ttf = new Uint8Array([0x00, 0x01, 0x00, 0x00, 0xAB, 0xCD]);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => ttf.buffer,
    } as unknown as Response);
    vi.resetModules();
    const { registerPdfFonts, PDF_NAME_FONT_FAMILY, PDF_SIZE_FONT_FAMILY } = await import('@/utils/pdf-fonts');
    const pdf = makeMockPdf();
    const { nameFamily, sizeFamily } = await registerPdfFonts(pdf as never);
    expect(nameFamily).toBe(PDF_NAME_FONT_FAMILY);
    expect(sizeFamily).toBe(PDF_SIZE_FONT_FAMILY);
    expect(pdf.addFileToVFS).toHaveBeenCalled();
    expect(pdf.addFont).toHaveBeenCalled();
  });
});
