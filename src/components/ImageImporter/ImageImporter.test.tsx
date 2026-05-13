import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageImporter } from '@/components/ImageImporter/ImageImporter';
import { useStickerStore } from '@/store/useStickerStore';
import { DEFAULT_LAYOUT } from '@/utils/render-sticker';

beforeEach(() => {
  useStickerStore.setState({
    rows: [
      { id: 'row-0', artName: 'Roses', size: '10x12', upc: '000000000001', imageFile: null, imagePreviewUrl: null, selected: false },
    ],
    layout: { ...DEFAULT_LAYOUT },
  });
});

describe('ImageImporter', () => {
  it('renders drop zone text', () => {
    render(<ImageImporter />);
    expect(screen.getByText(/drop product images/i)).toBeInTheDocument();
  });

  it('renders a file input', () => {
    render(<ImageImporter />);
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
  });

  it('shows match summary after uploading images', async () => {
    render(<ImageImporter />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['img'], 'roses.jpg', { type: 'image/jpeg' });
    await userEvent.upload(input, file);
    // After upload, matched count should appear
    expect(await screen.findByText(/\d+ matched/)).toBeInTheDocument();
  });
});
