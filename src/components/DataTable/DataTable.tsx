import { useStickerStore } from '@/store/useStickerStore';
import type { StickerRow } from '@/types';

export function DataTable() {
  const rows = useStickerStore((s) => s.rows);
  const toggleRowSelected = useStickerStore((s) => s.toggleRowSelected);
  const selectAll = useStickerStore((s) => s.selectAll);
  const setRowImage = useStickerStore((s) => s.setRowImage);
  const clearRowImage = useStickerStore((s) => s.clearRowImage);

  if (rows.length === 0) return null;

  const allSelected = rows.length > 0 && rows.every((r) => r.selected);
  const someSelected = rows.some((r) => r.selected);
  const withImages = rows.filter((r) => r.imageFile).length;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
      {/* Table header stats bar */}
      <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-5 py-3">
        <p className="text-xs text-zinc-500">
          <span className="font-medium text-zinc-700">{rows.length}</span> rows ·{' '}
          <span className="font-medium text-zinc-700">{withImages}</span> with images ·{' '}
          <span className="font-medium text-zinc-700">{rows.filter((r) => r.selected).length}</span> selected
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => selectAll(!allSelected)}
            className="rounded px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 transition-colors"
          >
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
          {someSelected && (
            <button
              onClick={() => selectAll(false)}
              className="rounded px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 transition-colors"
            >
              Clear selection
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100">
              <th className="w-10 px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => selectAll(e.target.checked)}
                  className="rounded border-zinc-300"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Art Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Size
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                UPC
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Image
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {rows.map((row) => (
              <TableRow
                key={row.id}
                row={row}
                onToggle={() => toggleRowSelected(row.id)}
                onImageChange={(file) => setRowImage(row.id, file)}
                onImageClear={() => clearRowImage(row.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TableRow({
  row,
  onToggle,
  onImageChange,
  onImageClear,
}: {
  row: StickerRow;
  onToggle: () => void;
  onImageChange: (file: File) => void;
  onImageClear: () => void;
}) {
  return (
    <tr className={row.selected ? 'bg-blue-50/60' : 'hover:bg-zinc-50'}>
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={row.selected}
          onChange={onToggle}
          className="rounded border-zinc-300"
        />
      </td>
      <td className="px-4 py-3 font-medium text-zinc-800">{row.artName}</td>
      <td className="px-4 py-3 text-zinc-600">{row.size}</td>
      <td className="px-4 py-3 font-mono text-xs text-zinc-500">{row.upc}</td>
      <td className="px-4 py-3">
        {row.imagePreviewUrl ? (
          <div className="flex items-center gap-2">
            <img
              src={row.imagePreviewUrl}
              alt={row.artName}
              className="h-10 w-10 rounded object-cover shadow-xs border border-zinc-200"
            />
            <button
              onClick={onImageClear}
              className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
              title="Remove image"
            >
              ✕
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
            <svg
              className="size-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Add image
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImageChange(file);
              }}
            />
          </label>
        )}
      </td>
    </tr>
  );
}
