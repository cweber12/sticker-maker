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

/**
 * Adjustable layout values for the 4×6 in @ 300 dpi sticker.
 * All dimensions stored in canvas pixels (1200×1800 canvas).
 * Design-unit scale: 1 design unit ≈ 3.82 canvas px (≈ 0.0127 in / 0.323 mm).
 */
export interface LayoutConfig {
  /** Gap between the floating white label and all four sticker edges. */
  labelInset: number;
  /** Height of the floating white info strip. */
  labelHeight: number;
  /** Inner horizontal padding inside the label strip. */
  labelPadding: number;
  /** Max width reserved for Art Name + Size text (left side of strip). */
  textAreaWidth: number;
  /** Width reserved for the UPC-A barcode (right side of strip). */
  barcodeZoneWidth: number;
  /** Starting font size (px) for Art Name; fitFontSize shrinks if too wide. */
  nameFontSize: number;
  /** Starting font size (px) for Size; fitFontSize shrinks if too wide. */
  sizeFontSize: number;
}
