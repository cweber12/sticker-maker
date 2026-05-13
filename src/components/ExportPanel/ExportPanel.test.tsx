import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportPanel } from '@/components/ExportPanel/ExportPanel';
import { useStickerStore } from '@/store/useStickerStore';
import { DEFAULT_LAYOUT } from '@/utils/render-sticker';
import * as exportModule from '@/utils/export-stickers';

vi.mock('@/utils/export-stickers', () => ({
  exportStickerPdfs: vi.fn(),
}));

const mockExport = vi.mocked(exportModule.exportStickerPdfs);

function makeRow(overrides = {}) {
  return {
    id: 'row-0',
    artName: 'Roses',
    size: '10x12 Paint by Numbers',
    upc: '012345678905',
    imageFile: new File(['img'], 'roses.jpg', { type: 'image/jpeg' }),
    imagePreviewUrl: 'blob:fake',
    selected: true,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  useStickerStore.setState({ rows: [], layout: { ...DEFAULT_LAYOUT } });
});

describe('ExportPanel', () => {
  it('shows 0 stickers when no rows', () => {
    render(<ExportPanel />);
    expect(screen.getByText(/0/)).toBeInTheDocument();
  });

  it('shows correct count of exportable rows', () => {
    useStickerStore.setState({ rows: [makeRow()] });
    render(<ExportPanel />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('Download button is disabled when there are no exportable rows', () => {
    render(<ExportPanel />);
    expect(screen.getByRole('button', { name: /download/i })).toBeDisabled();
  });

  it('Download button is enabled when a selected row has an image', () => {
    useStickerStore.setState({ rows: [makeRow()] });
    render(<ExportPanel />);
    expect(screen.getByRole('button', { name: /download/i })).toBeEnabled();
  });

  it('calls exportStickerPdfs with editableText:false by default', async () => {
    mockExport.mockResolvedValue(undefined);
    useStickerStore.setState({ rows: [makeRow()] });
    render(<ExportPanel />);
    await userEvent.click(screen.getByRole('button', { name: /download/i }));
    expect(mockExport).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Object),
      { editableText: false }
    );
  });

  it('calls exportStickerPdfs with editableText:true when selectable text is chosen', async () => {
    mockExport.mockResolvedValue(undefined);
    useStickerStore.setState({ rows: [makeRow()] });
    render(<ExportPanel />);
    // Click the "Selectable text" radio (second of the two)
    const radios = screen.getAllByRole('radio');
    await userEvent.click(radios[1]);
    mockExport.mockResolvedValue(undefined); // re-set after clearAllMocks may clear state
    await userEvent.click(screen.getByRole('button', { name: /download/i }));
    expect(mockExport).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Object),
      { editableText: true }
    );
  });

  it('shows font warning when selectable text mode is selected', async () => {
    useStickerStore.setState({ rows: [makeRow()] });
    render(<ExportPanel />);
    const radios = screen.getAllByRole('radio');
    await userEvent.click(radios[1]);
    expect(screen.getByText(/font notice/i)).toBeInTheDocument();
  });

  it('shows error message when export fails', async () => {
    mockExport.mockRejectedValue(new Error('disk full'));
    useStickerStore.setState({ rows: [makeRow()] });
    render(<ExportPanel />);
    await userEvent.click(screen.getByRole('button', { name: /download/i }));
    expect(await screen.findByText(/disk full/i)).toBeInTheDocument();
  });
});
