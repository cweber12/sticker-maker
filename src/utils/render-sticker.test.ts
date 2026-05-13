import { describe, it, expect, vi, beforeEach } from 'vitest';
import bwipjs from 'bwip-js';
import { renderBarcode, STICKER_W, STICKER_H, DEFAULT_LAYOUT, DESIGN_UNIT_PX } from '@/utils/render-sticker';

// bwip-js is mocked in vitest.setup.ts — access the mock for assertions.
const mockToCanvas = vi.mocked(bwipjs.toCanvas);

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Exported constants
// ---------------------------------------------------------------------------
describe('exported constants', () => {
  it('STICKER_W is 1200', () => expect(STICKER_W).toBe(1200));
  it('STICKER_H is 1800', () => expect(STICKER_H).toBe(1800));
  it('DESIGN_UNIT_PX is ~3.82', () => expect(DESIGN_UNIT_PX).toBeCloseTo(3.82, 2));

  it('DEFAULT_LAYOUT has all required keys', () => {
    const keys: (keyof typeof DEFAULT_LAYOUT)[] = [
      'labelInset', 'labelHeight', 'labelPadding',
      'textAreaWidth', 'barcodeZoneWidth', 'nameFontSize', 'sizeFontSize',
    ];
    for (const key of keys) {
      expect(DEFAULT_LAYOUT).toHaveProperty(key);
      expect(typeof DEFAULT_LAYOUT[key]).toBe('number');
    }
  });
});

// ---------------------------------------------------------------------------
// renderBarcode
// ---------------------------------------------------------------------------
describe('renderBarcode', () => {
  it('returns null for non-12-digit UPC', async () => {
    expect(await renderBarcode('1234')).toBeNull();
    expect(await renderBarcode('12345678901X')).toBeNull();
    expect(await renderBarcode('')).toBeNull();
  });

  it('returns null for 11-digit string', async () => {
    expect(await renderBarcode('01234567890')).toBeNull();
  });

  it('returns null for 13-digit string', async () => {
    expect(await renderBarcode('0123456789012')).toBeNull();
  });

  it('calls bwipjs.toCanvas for a valid 12-digit UPC', async () => {
    mockToCanvas.mockImplementation((() => undefined) as never);
    const result = await renderBarcode('012345678905');
    expect(mockToCanvas).toHaveBeenCalledOnce();
    expect(mockToCanvas).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      expect.objectContaining({ bcid: 'upca', text: '012345678905' })
    );
    expect(result).toBeInstanceOf(HTMLCanvasElement);
  });

  it('returns null when bwipjs throws', async () => {
    mockToCanvas.mockImplementation(() => { throw new Error('bad UPC'); });
    expect(await renderBarcode('012345678905')).toBeNull();
  });
});
