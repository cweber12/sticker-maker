import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StickerPreview } from '@/components/StickerPreview/StickerPreview';
import { useStickerStore } from '@/store/useStickerStore';
import { DEFAULT_LAYOUT } from '@/utils/render-sticker';
import * as renderModule from '@/utils/render-sticker';

vi.mock('@/utils/render-sticker', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/render-sticker')>();
  return {
    ...actual,
    renderStickerCanvas: vi.fn().mockResolvedValue(document.createElement('canvas')),
    renderBarcode: vi.fn().mockResolvedValue(null),
  };
});

beforeEach(() => {
  useStickerStore.setState({ rows: [], layout: { ...DEFAULT_LAYOUT } });
  vi.clearAllMocks();
});

describe('StickerPreview', () => {
  it('renders placeholder text when there are no rows', () => {
    render(<StickerPreview />);
    expect(screen.getByText(/select or add an image to preview/i)).toBeInTheDocument();
  });

  it('renders placeholder when rows exist but none are selected or have images', () => {
    useStickerStore.setState({
      rows: [{
        id: 'row-0',
        artName: 'Roses',
        size: '10x12',
        upc: '000000000001',
        imageFile: null,
        imagePreviewUrl: null,
        selected: false,
      }],
      layout: { ...DEFAULT_LAYOUT },
    });
    render(<StickerPreview />);
    // renderStickerCanvas should not be called for no image row
    expect(renderModule.renderStickerCanvas).not.toHaveBeenCalled();
  });

  it('calls renderStickerCanvas when a row has an image file', async () => {
    const mockCanvas = document.createElement('canvas');
    mockCanvas.width = 1200;
    mockCanvas.height = 1800;
    // Canvas.toDataURL is stubbed in setup
    vi.mocked(renderModule.renderStickerCanvas).mockResolvedValue(mockCanvas);

    const file = new File(['img'], 'roses.jpg', { type: 'image/jpeg' });
    useStickerStore.setState({
      rows: [{
        id: 'row-0',
        artName: 'Roses',
        size: '10x12',
        upc: '000000000001',
        imageFile: file,
        imagePreviewUrl: 'blob:fake',
        selected: false,
      }],
      layout: { ...DEFAULT_LAYOUT },
    });

    render(<StickerPreview />);
    // Wait for async render
    await vi.waitFor(() => {
      expect(renderModule.renderStickerCanvas).toHaveBeenCalled();
    });
  });
});
