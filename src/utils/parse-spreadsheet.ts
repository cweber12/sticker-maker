import ExcelJS from 'exceljs';
import type { RawRow } from '@/types';

export async function parseSpreadsheet(
  file: File
): Promise<{ headers: string[]; rows: RawRow[] }> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'csv') return parseCsv(file);
  return parseXlsx(file);
}

async function parseXlsx(file: File): Promise<{ headers: string[]; rows: RawRow[] }> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error('No worksheet found in file.');

  const allRows = worksheet.getSheetValues() as ExcelJS.CellValue[][];
  const rawValues = allRows.filter(Boolean);

  if (rawValues.length < 1) throw new Error('Spreadsheet is empty.');

  // getSheetValues is 1-indexed — first element of each row is null
  const headerRow = (rawValues[0] as ExcelJS.CellValue[]).slice(1);
  const headers = headerRow.map((h) => String(h ?? '').trim()).filter(Boolean);

  const rows: RawRow[] = rawValues.slice(1).map((row) => {
    const cells = (row as ExcelJS.CellValue[]).slice(1);
    const record: RawRow = {};
    headers.forEach((header, i) => {
      const cell = cells[i];
      // Handle rich text objects from ExcelJS
      if (cell && typeof cell === 'object' && 'richText' in cell) {
        const rich = cell as { richText: Array<{ text: string }> };
        record[header] = rich.richText.map((r) => r.text).join('').trim();
      } else {
        record[header] = String(cell ?? '').trim();
      }
    });
    return record;
  });

  return { headers, rows: rows.filter((r) => Object.values(r).some((v) => v !== '')) };
}

function parseCsv(file: File): Promise<{ headers: string[]; rows: RawRow[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
        if (lines.length < 1) throw new Error('CSV is empty.');

        const headers = splitCsvLine(lines[0]);
        const rows: RawRow[] = lines.slice(1).map((line) => {
          const cells = splitCsvLine(line);
          const record: RawRow = {};
          headers.forEach((h, i) => {
            record[h] = cells[i] ?? '';
          });
          return record;
        });

        resolve({ headers, rows: rows.filter((r) => Object.values(r).some((v) => v !== '')) });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read CSV file.'));
    reader.readAsText(file);
  });
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}
