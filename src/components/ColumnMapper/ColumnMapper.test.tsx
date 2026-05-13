import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { ColumnMapper } from '@/components/ColumnMapper/ColumnMapper';
import { useStickerStore } from '@/store/useStickerStore';

beforeEach(() => {
  useStickerStore.setState({
    rawHeaders: ['Art Name', 'Size', 'UPC', 'Extra'],
    rawRows: [{ 'Art Name': 'Roses', Size: '10x12', UPC: '012345678905', Extra: '' }],
    columnMap: null,
    rows: [],
  });
});

describe('ColumnMapper', () => {
  it('renders a select for each field', () => {
    render(<ColumnMapper />);
    // ColumnMapper uses eyebrow labels without htmlFor — query by role
    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(3);
  });

  it('auto-maps columns when header names match', () => {
    render(<ColumnMapper />);
    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    // First select should auto-detect 'Art Name'
    expect(selects[0].value).toBe('Art Name');
  });

  it('"Apply mapping" button is disabled when no columns are mapped', () => {
    useStickerStore.setState({ rawHeaders: ['foo', 'bar', 'baz'] });
    render(<ColumnMapper />);
    expect(screen.getByRole('button', { name: /apply mapping/i })).toBeDisabled();
  });

  it('"Apply mapping" fires applyColumnMap and populates rows', async () => {
    render(<ColumnMapper />);
    await userEvent.click(screen.getByRole('button', { name: /apply mapping/i }));
    const { rows } = useStickerStore.getState();
    expect(rows).toHaveLength(1);
    expect(rows[0].artName).toBe('Roses');
  });
});
