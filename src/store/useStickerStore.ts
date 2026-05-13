import { create } from 'zustand';
import type { StickerRow, ColumnMap, RawRow, LayoutConfig } from '@/types';
import { DEFAULT_LAYOUT } from '@/utils/render-sticker';

interface StickerStore {
  // Spreadsheet state
  rawHeaders: string[];
  rawRows: RawRow[];
  columnMap: ColumnMap | null;

  // Mapped rows
  rows: StickerRow[];

  // Sticker layout (adjustable in Layout Editor)
  layout: LayoutConfig;

  // Actions — spreadsheet
  setSpreadsheetData: (headers: string[], rows: RawRow[]) => void;
  setColumnMap: (map: ColumnMap) => void;
  applyColumnMap: () => void;

  // Actions — images
  setRowImage: (id: string, file: File) => void;
  clearRowImage: (id: string) => void;

  // Actions — selection
  toggleRowSelected: (id: string) => void;
  selectAll: (selected: boolean) => void;

  // Actions — layout
  setLayout: (patch: Partial<LayoutConfig>) => void;
  resetLayout: () => void;

  // Actions — reset
  clearAll: () => void;
}

export const useStickerStore = create<StickerStore>((set, get) => ({
  rawHeaders: [],
  rawRows: [],
  columnMap: null,
  rows: [],
  layout: { ...DEFAULT_LAYOUT },

  setSpreadsheetData: (headers, rawRows) =>
    set({ rawHeaders: headers, rawRows, columnMap: null, rows: [] }),

  setColumnMap: (columnMap) => set({ columnMap }),

  applyColumnMap: () => {
    const { rawRows, columnMap } = get();
    if (!columnMap) return;

    const rows: StickerRow[] = rawRows.map((raw, i) => ({
      id: `row-${i}`,
      artName: raw[columnMap.artName] ?? '',
      size: raw[columnMap.size] ?? '',
      upc: raw[columnMap.upc] ?? '',
      imageFile: null,
      imagePreviewUrl: null,
      selected: false,
    }));

    set({ rows });
  },

  setRowImage: (id, file) => {
    const { rows } = get();
    const targetRow = rows.find((r) => r.id === id);
    if (!targetRow) return;

    const artName = targetRow.artName.trim().toLowerCase();

    set((state) => {
      // Revoke stale preview URLs for all rows that will be updated
      state.rows.forEach((r) => {
        if (r.artName.trim().toLowerCase() === artName && r.imagePreviewUrl) {
          URL.revokeObjectURL(r.imagePreviewUrl);
        }
      });

      const previewUrl = URL.createObjectURL(file);

      return {
        rows: state.rows.map((row) =>
          row.artName.trim().toLowerCase() === artName
            ? { ...row, imageFile: file, imagePreviewUrl: previewUrl }
            : row
        ),
      };
    });
  },

  clearRowImage: (id) => {
    set((state) => {
      const row = state.rows.find((r) => r.id === id);
      if (row?.imagePreviewUrl) URL.revokeObjectURL(row.imagePreviewUrl);
      return {
        rows: state.rows.map((r) =>
          r.id === id ? { ...r, imageFile: null, imagePreviewUrl: null } : r
        ),
      };
    });
  },

  toggleRowSelected: (id) =>
    set((state) => ({
      rows: state.rows.map((row) =>
        row.id === id ? { ...row, selected: !row.selected } : row
      ),
    })),

  selectAll: (selected) =>
    set((state) => ({ rows: state.rows.map((row) => ({ ...row, selected })) })),

  setLayout: (patch) =>
    set((state) => ({ layout: { ...state.layout, ...patch } })),

  resetLayout: () => set({ layout: { ...DEFAULT_LAYOUT } }),

  clearAll: () => set({ rawHeaders: [], rawRows: [], columnMap: null, rows: [] }),
}));
