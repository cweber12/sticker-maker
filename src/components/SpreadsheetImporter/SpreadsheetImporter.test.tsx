import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { SpreadsheetImporter } from '@/components/SpreadsheetImporter/SpreadsheetImporter';
import { useStickerStore } from '@/store/useStickerStore';
import * as parseModule from '@/utils/parse-spreadsheet';

vi.mock('@/utils/parse-spreadsheet', () => ({
  parseSpreadsheet: vi.fn(),
}));

const mockParse = vi.mocked(parseModule.parseSpreadsheet);

beforeEach(() => {
  vi.clearAllMocks();
  useStickerStore.setState({ rawHeaders: [], rawRows: [], columnMap: null, rows: [] });
});

describe('SpreadsheetImporter', () => {
  it('renders a file input and drag target', () => {
    render(<SpreadsheetImporter />);
    expect(screen.getByText(/drop your spreadsheet/i)).toBeInTheDocument();
    expect(document.querySelector('input[type="file"]')).toBeInTheDocument();
  });

  it('calls parseSpreadsheet when a file is selected', async () => {
    mockParse.mockResolvedValue({ headers: ['Art Name', 'Size', 'UPC'], rows: [] });
    render(<SpreadsheetImporter />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['header,data'], 'test.csv', { type: 'text/csv' });
    await userEvent.upload(input, file);
    expect(mockParse).toHaveBeenCalledWith(file);
  });

  it('calls setSpreadsheetData with parsed result', async () => {
    mockParse.mockResolvedValue({
      headers: ['Art Name'],
      rows: [{ 'Art Name': 'Roses' }],
    });
    render(<SpreadsheetImporter />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['data'], 'test.csv', { type: 'text/csv' });
    await userEvent.upload(input, file);
    const { rawHeaders, rawRows } = useStickerStore.getState();
    expect(rawHeaders).toEqual(['Art Name']);
    expect(rawRows).toHaveLength(1);
  });

  it('shows an error message when parse fails', async () => {
    mockParse.mockRejectedValue(new Error('corrupt file'));
    render(<SpreadsheetImporter />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, new File([''], 'bad.csv', { type: 'text/csv' }));
    expect(await screen.findByText(/corrupt file/i)).toBeInTheDocument();
  });
});
