import { useCallback, useState } from 'react';
import { useStickerStore } from '@/store/useStickerStore';
import { matchImageToArtName } from '@/utils/fuzzy-match';

export function ImageImporter() {
  const rows = useStickerStore((s) => s.rows);
  const setRowImage = useStickerStore((s) => s.setRowImage);
  const [dragging, setDragging] = useState(false);
  const [lastBatch, setLastBatch] = useState<{ matched: number; unmatched: number } | null>(null);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const artNames = rows.map((r) => ({ id: r.id, artName: r.artName }));
      let matched = 0;
      let unmatched = 0;

      Array.from(files).forEach((file) => {
        if (!file.type.startsWith('image/')) return;
        const matchedId = matchImageToArtName(file.name, artNames);
        if (matchedId) {
          setRowImage(matchedId, file);
          matched++;
        } else {
          unmatched++;
        }
      });

      setLastBatch({ matched, unmatched });
    },
    [rows, setRowImage]
  );

  return (
    <div>
      <label
        className={'dropzone block cursor-pointer px-8 py-10 text-center' + (dragging ? ' !border-[var(--color-sienna)] !bg-[var(--color-sienna-soft)]/40' : '')}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-paper-2)] border border-[var(--color-rule)] mb-4">
          <svg className="size-5 text-[var(--color-ink-2)]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16l5-5 4 4 3-3 6 6M3 6h18v12H3z" />
          </svg>
        </div>
        <p className="font-display text-[19px] leading-tight text-[var(--color-ink)]">
          Drop product images
        </p>
        <p className="mt-1.5 text-[12.5px] text-[var(--color-ink-3)]">
          or{' '}
          <span className="underline decoration-[var(--color-sienna)] decoration-2 underline-offset-4 text-[var(--color-ink)] font-medium">
            select files
          </span>{' '}
          — filenames are matched to Art Names automatically
        </p>
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
          }}
        />
      </label>

      {lastBatch && (lastBatch.matched > 0 || lastBatch.unmatched > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12.5px]">
          {lastBatch.matched > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[var(--color-leaf)]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-leaf)]" />
              {lastBatch.matched} matched
            </span>
          )}
          {lastBatch.unmatched > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[var(--color-amber)]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-amber)]" />
              {lastBatch.unmatched} couldn't auto-match — add them manually below
            </span>
          )}
        </div>
      )}
    </div>
  );
}
