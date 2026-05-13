import { useCallback } from 'react';
import { useStickerStore } from '@/store/useStickerStore';
import { matchImageToArtName } from '@/utils/fuzzy-match';

export function ImageImporter() {
  const rows = useStickerStore((s) => s.rows);
  const setRowImage = useStickerStore((s) => s.setRowImage);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const artNames = rows.map((r) => ({ id: r.id, artName: r.artName }));
      let unmatched = 0;

      Array.from(files).forEach((file) => {
        if (!file.type.startsWith('image/')) return;
        const matchedId = matchImageToArtName(file.name, artNames);
        if (matchedId) {
          setRowImage(matchedId, file);
        } else {
          unmatched++;
        }
      });

      if (unmatched > 0) {
        alert(
          `${unmatched} image${unmatched > 1 ? 's' : ''} could not be auto-matched. ` +
            'You can attach them manually in the table below.'
        );
      }
    },
    [rows, setRowImage]
  );

  return (
    <label
      className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-8 py-10 text-center transition-colors hover:border-zinc-400 hover:bg-zinc-100 cursor-pointer"
      onDrop={(e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
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
          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
        />
      </svg>
      <div>
        <p className="text-sm font-medium text-zinc-700">
          Drop product images here or{' '}
          <span className="text-blue-600 underline underline-offset-2">browse</span>
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          Filenames are matched to Art Names automatically
        </p>
      </div>
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
  );
}
