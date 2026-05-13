import { useState } from 'react';
import { useStickerStore } from '@/store/useStickerStore';
import { exportStickerPdfs } from '@/utils/export-stickers';
import type { ExportStatus } from '@/types';

export function ExportPanel() {
  const rows = useStickerStore((s) => s.rows);
  const layout = useStickerStore((s) => s.layout);
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [exportCount, setExportCount] = useState(0);
  const [editableText, setEditableText] = useState(false);

  const selectedWithImages = rows.filter((r) => r.selected && r.imageFile);
  const selectedCount = rows.filter((r) => r.selected).length;
  const missingImages = selectedCount - selectedWithImages.length;
  const canExport = selectedWithImages.length > 0 && status !== 'exporting';

  const handleExport = async () => {
    setStatus('exporting');
    setErrorMsg('');
    try {
      await exportStickerPdfs(rows, layout, { editableText });
      setExportCount(selectedWithImages.length);
      setStatus('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  };

  return (
    <div className="card p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="space-y-1 min-w-0">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-[24px] leading-none text-[var(--color-ink)] num-tabular">
              {selectedWithImages.length}
            </span>
            <span className="text-[13px] text-[var(--color-ink-3)]">
              sticker{selectedWithImages.length !== 1 ? 's' : ''} ready to export
            </span>
          </div>
          <div className="text-[12.5px] text-[var(--color-ink-4)]">
            {selectedWithImages.length === 0 && 'Select rows that have images attached.'}
            {missingImages > 0 && (
              <span className="text-[var(--color-amber)]">
                {missingImages} selected {missingImages === 1 ? 'row is' : 'rows are'} missing an image
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {status === 'done' && (
            <span className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--color-leaf)]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-leaf)]" />
              {exportCount} PDF{exportCount !== 1 ? 's' : ''} exported
            </span>
          )}
          {status === 'error' && (
            <span className="text-[12.5px] text-[var(--color-sienna)] max-w-[280px] truncate" title={errorMsg}>
              {errorMsg}
            </span>
          )}

          <button onClick={handleExport} disabled={!canExport} className="btn-primary">
            {status === 'exporting' ? (
              <>
                <svg className="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Exporting…
              </>
            ) : (
              <>
                <svg className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download PDFs
              </>
            )}
          </button>
        </div>
      </div>

      {/* Text mode toggle */}
      <div className="pt-4 border-t border-rule-soft space-y-3">
        <div className="text-[11px] uppercase tracking-[0.14em] text-ink-4">
          Text mode
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <label
            className={`flex gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
              !editableText
                ? 'border-sienna bg-paper-2'
                : 'border-rule hover:bg-paper-2'
            }`}
          >
            <input
              type="radio"
              name="text-mode"
              checked={!editableText}
              onChange={() => setEditableText(false)}
              className="mt-1 accent-sienna"
            />
            <span className="space-y-1 min-w-0">
              <span className="block text-[13px] font-medium text-ink">
                Fixed text (rasterized)
              </span>
              <span className="block text-[11.5px] text-ink-4 leading-snug">
                Exact preview fonts preserved. Text is not selectable or editable in the PDF.
              </span>
            </span>
          </label>

          <label
            className={`flex gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
              editableText
                ? 'border-sienna bg-paper-2'
                : 'border-rule hover:bg-paper-2'
            }`}
          >
            <input
              type="radio"
              name="text-mode"
              checked={editableText}
              onChange={() => setEditableText(true)}
              className="mt-1 accent-sienna"
            />
            <span className="space-y-1 min-w-0">
              <span className="block text-[13px] font-medium text-ink">
                Selectable text
              </span>
              <span className="block text-[11.5px] text-ink-4 leading-snug">
                Art name and size become selectable / editable in any PDF reader. Label and barcode stay fixed.
              </span>
            </span>
          </label>
        </div>

        {editableText && (
          <div className="flex gap-2 rounded-md border border-amber bg-amber/10 px-3 py-2 text-[12px] text-ink leading-snug">
            <svg className="size-3.5 mt-0.5 shrink-0 text-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span>
              <strong className="font-medium">Font notice:</strong>{' '}
              Selectable text falls back to Times / Helvetica unless{' '}
              <code className="text-[11px] bg-paper-2 px-1 rounded">BaskervilleDisplayPT.ttf</code> and{' '}
              <code className="text-[11px] bg-paper-2 px-1 rounded">TwCenMT.ttf</code>{' '}
              are placed in <code className="text-[11px] bg-paper-2 px-1 rounded">public/fonts/</code>.
              The exported text will not match the preview exactly.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
