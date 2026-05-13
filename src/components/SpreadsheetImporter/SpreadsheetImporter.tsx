import { useCallback } from 'react';
import { useStickerStore } from '@/store/useStickerStore';
import { parseSpreadsheet } from '@/utils/parse-spreadsheet';

export function SpreadsheetImporter() {
  const setSpreadsheetData = useStickerStore((s) => s.setSpreadsheetData);

  const handleFile = useCallback(
    async (file: File) => {
      try {
        const { headers, rows } = await parseSpreadsheet(file);
        setSpreadsheetData(headers, rows);
      } catch (err) {
        alert(`Failed to parse file: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
    [setSpreadsheetData]
  );

  return (
    <label
      className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-8 py-10 text-center transition-colors hover:border-zinc-400 hover:bg-zinc-100 cursor-pointer"
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      <svg
        className="size-8 text-zinc-400"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
        />
      </svg>
      <div>
        <p className="text-sm font-medium text-zinc-700">
          Drop a spreadsheet here or{' '}
          <span className="text-blue-600 underline underline-offset-2">browse</span>
        </p>
        <p className="mt-1 text-xs text-zinc-400">.xlsx, .xls, .csv accepted</p>
      </div>
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </label>
  );
}
