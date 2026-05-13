import { useCallback, useState } from 'react';
import { useStickerStore } from '@/store/useStickerStore';
import { parseSpreadsheet } from '@/utils/parse-spreadsheet';

export function SpreadsheetImporter() {
  const setSpreadsheetData = useStickerStore((s) => s.setSpreadsheetData);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const handleFile = useCallback(
    async (file: File) => {
      setError('');
      try {
        const { headers, rows } = await parseSpreadsheet(file);
        setSpreadsheetData(headers, rows);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [setSpreadsheetData]
  );

  return (
    <div>
      <label
        className={'dropzone block cursor-pointer px-10 py-14 text-center' + (dragging ? ' !border-[var(--color-sienna)] !bg-[var(--color-sienna-soft)]/40' : '')}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-paper-2)] border border-[var(--color-rule)] mb-4">
          <svg className="size-5 text-[var(--color-ink-2)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5A2.5 2.5 0 015.5 5h13A2.5 2.5 0 0121 7.5v9A2.5 2.5 0 0118.5 19h-13A2.5 2.5 0 013 16.5v-9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M9 5v14" />
          </svg>
        </div>

        <p className="font-display text-[19px] leading-tight text-[var(--color-ink)]">
          Drop your spreadsheet here
        </p>
        <p className="mt-1.5 text-[12.5px] text-[var(--color-ink-3)]">
          or{' '}
          <span className="underline decoration-[var(--color-sienna)] decoration-2 underline-offset-4 text-[var(--color-ink)] font-medium">
            choose a file
          </span>{' '}
          — .xlsx, .xls, or .csv
        </p>

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

      {error && (
        <p className="mt-3 text-[12.5px] text-[var(--color-sienna)]">
          Couldn't parse that file — {error}
        </p>
      )}
    </div>
  );
}
