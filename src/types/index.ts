// Core domain types for the Sticker Maker app

export interface StickerRow {
  id: string;
  artName: string;
  size: string;
  upc: string;
  imageFile: File | null;
  imagePreviewUrl: string | null;
  selected: boolean;
}

/** Raw record from a spreadsheet row — keys are column headers */
export type RawRow = Record<string, string>;

/** Maps the user's spreadsheet column headers to our fields */
export interface ColumnMap {
  artName: string;
  size: string;
  upc: string;
}

export type ExportStatus = 'idle' | 'exporting' | 'done' | 'error';
