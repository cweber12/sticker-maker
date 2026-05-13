import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseSpreadsheet } from '@/utils/parse-spreadsheet';

// ---------------------------------------------------------------------------
// Helper: make a minimal File whose .text() resolves to the given string
// ---------------------------------------------------------------------------
function makeFile(name: string, content: string, type = 'text/csv'): File {
  return new File([content], name, { type });
}

// ---------------------------------------------------------------------------
// CSV tests
// ---------------------------------------------------------------------------
describe('parseSpreadsheet — CSV', () => {
  it('parses headers and rows', async () => {
    const csv = `Art Name,Size,UPC\nRoses,10x12,012345678905\nSunset,8x10,098765432109`;
    const { headers, rows } = await parseSpreadsheet(makeFile('test.csv', csv));
    expect(headers).toEqual(['Art Name', 'Size', 'UPC']);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ 'Art Name': 'Roses', Size: '10x12', UPC: '012345678905' });
  });

  it('handles quoted fields with commas', async () => {
    const csv = `Name,Size\n"Roses, Red",10x12`;
    const { rows } = await parseSpreadsheet(makeFile('test.csv', csv));
    expect(rows[0].Name).toBe('Roses, Red');
  });

  it('handles escaped quotes inside quoted fields', async () => {
    const csv = `Name,Size\n"He said ""hello""",10x12`;
    const { rows } = await parseSpreadsheet(makeFile('test.csv', csv));
    expect(rows[0].Name).toBe('He said "hello"');
  });

  it('filters out blank rows', async () => {
    const csv = `Name,Size\nRoses,10x12\n\n\n`;
    const { rows } = await parseSpreadsheet(makeFile('test.csv', csv));
    expect(rows).toHaveLength(1);
  });

  it('throws on empty CSV', async () => {
    await expect(parseSpreadsheet(makeFile('empty.csv', ''))).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// FileReader-based CSV path — ensure FileReader onload is called via jsdom
// ---------------------------------------------------------------------------
describe('parseSpreadsheet — FileReader path (CSV extension triggers text reader)', () => {
  it('resolves with correct structure for .csv files', async () => {
    const csv = `Col1,Col2\nA,B`;
    const file = makeFile('data.csv', csv);
    const { headers } = await parseSpreadsheet(file);
    expect(headers).toEqual(['Col1', 'Col2']);
  });
});
