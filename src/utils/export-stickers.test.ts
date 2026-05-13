import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { StickerRow } from '@/types';
import { DEFAULT_LAYOUT } from '@/utils/render-sticker';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock('@/utils/render-sticker', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/render-sticker')>();
  return {
    ...actual,
    renderStickerCanvas: vi.fn().mockResolvedValue(Object.assign(document.createElement('canvas'), {
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,abc'),
    })),
  };
});

vi.mock('@/utils/pdf-fonts', () => ({
  registerPdfFonts: vi.fn().mockResolvedValue({ nameFamily: 'times', sizeFamily: 'helvetica' }),
}));

vi.mock('jspdf', () => {
  const mockPdf = {
    addImage: vi.fn(),
    addFileToVFS: vi.fn(),
    addFont: vi.fn(),
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    setCharSpace: vi.fn(),
    setTextColor: vi.fn(),
    setProperties: vi.fn(),
    getTextWidth: vi.fn().mockReturnValue(1),
    text: vi.fn(),
    save: vi.fn(),
    output: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3]).buffer),
  };
  return {
    jsPDF: vi.fn().mockImplementation(function () { return mockPdf; }),
  };
});

// Mock File System Access API — handles arbitrarily deep getDirectoryHandle chains
const mockWritable = { write: vi.fn(), close: vi.fn() };
const mockFileHandle = { createWritable: vi.fn().mockResolvedValue(mockWritable) };
function makeDir(name = 'dir'): Record<string, unknown> {
  return {
    name,
    getDirectoryHandle: vi.fn().mockImplementation(() => Promise.resolve(makeDir())),
    getFileHandle: vi.fn().mockResolvedValue(mockFileHandle),
  };
}
const mockDirHandle = makeDir('exports');

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, 'showDirectoryPicker', {
    writable: true,
    value: vi.fn().mockResolvedValue(mockDirHandle),
  });
});

// ---------------------------------------------------------------------------
// Import the module under test AFTER mocks are set up
// ---------------------------------------------------------------------------
function makeRow(overrides: Partial<StickerRow> = {}): StickerRow {
  return {
    id: 'row-0',
    artName: 'Roses',
    size: '10x12',
    upc: '012345678905',
    imageFile: new File(['img'], 'roses.jpg', { type: 'image/jpeg' }),
    imagePreviewUrl: 'blob:fake',
    selected: true,
    ...overrides,
  };
}

describe('exportStickerPdfs', () => {
  it('throws when there are no exportable rows (no image + selected)', async () => {
    const { exportStickerPdfs } = await import('@/utils/export-stickers');
    const row = makeRow({ imageFile: null });
    await expect(exportStickerPdfs([row])).rejects.toThrow();
  });

  it('calls renderStickerCanvas with skipText:false in fixed-text mode', async () => {
    const { exportStickerPdfs } = await import('@/utils/export-stickers');
    const renderMock = vi.mocked((await import('@/utils/render-sticker')).renderStickerCanvas);
    await exportStickerPdfs([makeRow()], DEFAULT_LAYOUT, { editableText: false });
    expect(renderMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({ skipText: false })
    );
  });

  it('calls renderStickerCanvas with skipText:true in editable-text mode', async () => {
    const { exportStickerPdfs } = await import('@/utils/export-stickers');
    const renderMock = vi.mocked((await import('@/utils/render-sticker')).renderStickerCanvas);
    await exportStickerPdfs([makeRow()], DEFAULT_LAYOUT, { editableText: true });
    expect(renderMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({ skipText: true })
    );
  });

  it('calls pdf.text() when editableText is true', async () => {
    const { exportStickerPdfs } = await import('@/utils/export-stickers');
    const { jsPDF } = await import('jspdf');
    const mockPdf = vi.mocked(jsPDF).mock.results[0]?.value ?? (new (vi.mocked(jsPDF))());
    await exportStickerPdfs([makeRow()], DEFAULT_LAYOUT, { editableText: true });
    expect(mockPdf.text).toHaveBeenCalled();
  });
});
