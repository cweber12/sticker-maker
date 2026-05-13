import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { DataTable } from '@/components/DataTable/DataTable';
import { useStickerStore } from '@/store/useStickerStore';
import { DEFAULT_LAYOUT } from '@/utils/render-sticker';

function seedRows() {
  useStickerStore.setState({
    rawHeaders: ['Art Name', 'Size', 'UPC'],
    rawRows: [
      { 'Art Name': 'Roses', Size: '10x12', UPC: '000000000001' },
      { 'Art Name': 'Sunset', Size: '8x10', UPC: '000000000002' },
    ],
    columnMap: { artName: 'Art Name', size: 'Size', upc: 'UPC' },
    rows: [
      { id: 'row-0', artName: 'Roses', size: '10x12', upc: '000000000001', imageFile: null, imagePreviewUrl: null, selected: false },
      { id: 'row-1', artName: 'Sunset', size: '8x10', upc: '000000000002', imageFile: null, imagePreviewUrl: null, selected: false },
    ],
    layout: { ...DEFAULT_LAYOUT },
  });
}

beforeEach(() => {
  useStickerStore.setState({ rows: [], rawHeaders: [], rawRows: [], columnMap: null, layout: { ...DEFAULT_LAYOUT } });
});

describe('DataTable', () => {
  it('renders nothing when rows are empty', () => {
    const { container } = render(<DataTable />);
    expect(container.firstChild).toBeNull();
  });

  it('renders rows when data is present', () => {
    seedRows();
    render(<DataTable />);
    expect(screen.getByText('Roses')).toBeInTheDocument();
    expect(screen.getByText('Sunset')).toBeInTheDocument();
  });

  it('filters rows by search query', async () => {
    seedRows();
    render(<DataTable />);
    const input = screen.getByPlaceholderText(/filter rows/i);
    await userEvent.type(input, 'roses');
    expect(screen.getByText('Roses')).toBeInTheDocument();
    expect(screen.queryByText('Sunset')).not.toBeInTheDocument();
  });

  it('toggles individual row selection via checkbox', async () => {
    seedRows();
    render(<DataTable />);
    const checkboxes = screen.getAllByRole('checkbox');
    // First checkbox is "select all"; second is row-0
    await userEvent.click(checkboxes[1]);
    expect(useStickerStore.getState().rows[0].selected).toBe(true);
  });

  it('select-all checkbox selects all rows', async () => {
    seedRows();
    render(<DataTable />);
    // Find the "Select all" button (not the header checkbox)
    const btn = screen.getByRole('button', { name: /select all/i });
    await userEvent.click(btn);
    expect(useStickerStore.getState().rows.every((r) => r.selected)).toBe(true);
  });
});
