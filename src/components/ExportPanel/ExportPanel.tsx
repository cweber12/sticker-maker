import { useState } from 'react';
import { useStickerStore } from '@/store/useStickerStore';
import { exportStickerPdfs } from '@/utils/export-stickers';
import type { ExportStatus } from '@/types';

export function ExportPanel() {
  const rows = useStickerStore((s) => s.rows);
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [exportCount, setExportCount] = useState(0);

  const selectedWithImages = rows.filter((r) => r.selected && r.imageFile);
  const selectedCount = rows.filter((r) => r.selected).length;

  const handleExport = async () => {
    setStatus('exporting');
    setErrorMsg('');
    try {
      await exportStickerPdfs(rows);
      setExportCount(selectedWithImages.length);
      setStatus('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  };

  const canExport = selectedWithImages.length > 0 && status !== 'exporting';
  const missingImages = selectedCount - selectedWithImages.length;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-zinc-700">Export Stickers</h3>
          <p className="text-xs text-zinc-400">
            {selectedWithImages.length > 0
              ? `${selectedWithImages.length} sticker${selectedWithImages.length !== 1 ? 's' : ''} ready to export`
              : 'Select rows with images to export'}
            {missingImages > 0 && (
              <span className="text-amber-500">
                {' '}· {missingImages} selected {missingImages === 1 ? 'row is' : 'rows are'} missing an image
              </span>
            )}
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={!canExport}
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === 'exporting' ? (
            <>
              <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Exporting…
            </>
          ) : (
            <>
              <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export {selectedWithImages.length > 0 ? `${selectedWithImages.length} PDF${selectedWithImages.length !== 1 ? 's' : ''}` : 'PDFs'}
            </>
          )}
        </button>
      </div>

      {status === 'done' && (
        <div className="mt-3 rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700">
          ✓ {exportCount} sticker PDF{exportCount !== 1 ? 's' : ''} exported successfully.
        </div>
      )}
      {status === 'error' && (
        <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
