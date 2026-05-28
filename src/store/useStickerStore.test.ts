import { describe, it, expect, beforeEach } from 'vitest';
import { act } from 'react';
import { useStickerStore } from '@/store/useStickerStore';
import { DEFAULT_LAYOUT } from '@/utils/render-sticker';

function makeFile(name = 'art.jpg') {
  return new File(['img'], name, { type: 'image/jpeg' });
}

beforeEach(() => {
  useStickerStore.setState({
    rawHeaders: [],
    rawRows: [],
    columnMap: null,
    rows: [],
    layout: { ...DEFAULT_LAYOUT },
    diamondArtMarkMode: 'barcode',
  });
});

describe('spreadsheet actions', () => {
  it('setSpreadsheetData stores headers and rows, resets map', () => {
    const store = useStickerStore.getState();
    act(() => {
      store.setSpreadsheetData(['Art Name', 'Size', 'UPC'], [{ 'Art Name': 'Roses', Size: '10x12', UPC: '012345678905' }]);
    });
    const s = useStickerStore.getState();
    expect(s.rawHeaders).toEqual(['Art Name', 'Size', 'UPC']);
    expect(s.rawRows).toHaveLength(1);
    expect(s.columnMap).toBeNull();
    expect(s.rows).toHaveLength(0);
  });

  it('applyColumnMap creates StickerRows from rawRows', () => {
    const store = useStickerStore.getState();
    act(() => {
      store.setSpreadsheetData(
        ['Art Name', 'Size', 'UPC'],
        [{ 'Art Name': 'Roses', Size: '10x12', UPC: '012345678905' }]
      );
      store.setColumnMap({ artName: 'Art Name', size: 'Size', upc: 'UPC' });
      store.applyColumnMap();
    });
    const { rows } = useStickerStore.getState();
    expect(rows).toHaveLength(1);
    expect(rows[0].artName).toBe('Roses');
    expect(rows[0].size).toBe('10x12');
    expect(rows[0].upc).toBe('012345678905');
    expect(rows[0].selected).toBe(false);
    expect(rows[0].imageFile).toBeNull();
  });

  it('applyColumnMap does nothing when columnMap is null', () => {
    const store = useStickerStore.getState();
    act(() => {
      store.setSpreadsheetData(['Art Name'], [{ 'Art Name': 'x' }]);
      // columnMap stays null — don't call setColumnMap
      store.applyColumnMap();
    });
    expect(useStickerStore.getState().rows).toHaveLength(0);
  });
});

describe('image actions', () => {
  function seedRows() {
    const store = useStickerStore.getState();
    act(() => {
      store.setSpreadsheetData(
        ['Art Name', 'Size', 'UPC'],
        [
          { 'Art Name': 'Roses', Size: '10x12', UPC: '000000000001' },
          { 'Art Name': 'Roses', Size: '8x10', UPC: '000000000002' },
        ]
      );
      store.setColumnMap({ artName: 'Art Name', size: 'Size', upc: 'UPC' });
      store.applyColumnMap();
    });
  }

  it('setRowImage sets imageFile on matching art name rows', () => {
    seedRows();
    const { rows } = useStickerStore.getState();
    const file = makeFile('roses.jpg');
    act(() => {
      useStickerStore.getState().setRowImage(rows[0].id, file);
    });
    const updated = useStickerStore.getState().rows;
    // Both rows share art name "Roses" — both should be updated
    expect(updated[0].imageFile).toBe(file);
    expect(updated[1].imageFile).toBe(file);
  });

  it('clearRowImage removes imageFile from a row', () => {
    seedRows();
    const { rows } = useStickerStore.getState();
    const file = makeFile('roses.jpg');
    act(() => {
      useStickerStore.getState().setRowImage(rows[0].id, file);
      useStickerStore.getState().clearRowImage(rows[0].id);
    });
    const updated = useStickerStore.getState().rows;
    expect(updated[0].imageFile).toBeNull();
  });
});

describe('selection actions', () => {
  beforeEach(() => {
    const store = useStickerStore.getState();
    act(() => {
      store.setSpreadsheetData(
        ['Art Name', 'Size', 'UPC'],
        [
          { 'Art Name': 'A', Size: '10x12', UPC: '000000000001' },
          { 'Art Name': 'B', Size: '10x12', UPC: '000000000002' },
        ]
      );
      store.setColumnMap({ artName: 'Art Name', size: 'Size', upc: 'UPC' });
      store.applyColumnMap();
    });
  });

  it('toggleRowSelected flips selected state', () => {
    const { rows } = useStickerStore.getState();
    act(() => useStickerStore.getState().toggleRowSelected(rows[0].id));
    expect(useStickerStore.getState().rows[0].selected).toBe(true);
    act(() => useStickerStore.getState().toggleRowSelected(rows[0].id));
    expect(useStickerStore.getState().rows[0].selected).toBe(false);
  });

  it('selectAll(true) selects all rows', () => {
    act(() => useStickerStore.getState().selectAll(true));
    const { rows } = useStickerStore.getState();
    expect(rows.every((r) => r.selected)).toBe(true);
  });

  it('selectAll(false) deselects all rows', () => {
    act(() => useStickerStore.getState().selectAll(true));
    act(() => useStickerStore.getState().selectAll(false));
    const { rows } = useStickerStore.getState();
    expect(rows.every((r) => !r.selected)).toBe(true);
  });
});

describe('layout actions', () => {
  it('setLayout patches individual fields', () => {
    act(() => useStickerStore.getState().setLayout({ nameFontSize: 99 }));
    const { layout } = useStickerStore.getState();
    expect(layout.nameFontSize).toBe(99);
    // Other fields unchanged
    expect(layout.labelInset).toBe(DEFAULT_LAYOUT.labelInset);
  });

  it('resetLayout restores DEFAULT_LAYOUT', () => {
    act(() => {
      useStickerStore.getState().setLayout({ nameFontSize: 99, labelHeight: 500 });
      useStickerStore.getState().resetLayout();
    });
    expect(useStickerStore.getState().layout).toEqual(DEFAULT_LAYOUT);
  });

  it('setDiamondArtMarkMode updates the global mode', () => {
    act(() => useStickerStore.getState().setDiamondArtMarkMode('logo'));
    expect(useStickerStore.getState().diamondArtMarkMode).toBe('logo');
  });
});
