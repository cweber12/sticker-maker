import { useState } from 'react';
import { useStickerStore } from '@/store/useStickerStore';
import type { StickerRow } from '@/types';

export function DataTable() {
  const rows = useStickerStore((s) => s.rows);
  const toggleRowSelected = useStickerStore((s) => s.toggleRowSelected);
  const selectAll = useStickerStore((s) => s.selectAll);
  const setRowImage = useStickerStore((s) => s.setRowImage);
  const clearRowImage = useStickerStore((s) => s.clearRowImage);

  const [query, setQuery] = useState('');

  if (rows.length === 0) return null;

  const filtered = query.trim()
    ? rows.filter((r) =>
        (r.artName + ' ' + r.size + ' ' + r.upc)
          .toLowerCase()
          .includes(query.toLowerCase())
      )
    : rows;

  const allSelected = rows.length > 0 && rows.every((r) => r.selected);
  const withImages = rows.filter((r) => r.imageFile).length;
  const selectedCount = rows.filter((r) => r.selected).length;

  return (
    <div className="card overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-rule-soft)] px-5 py-3.5 bg-[var(--color-paper-2)]/60">
        <div className="flex items-center gap-4 text-[11.5px] num-tabular">
          <Pill label="Rows" value={rows.length} />
          <Pill label="With image" value={withImages} accent={withImages > 0} />
          <Pill label="Selected" value={selectedCount} accent={selectedCount > 0} />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[var(--color-ink-4)]"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="M21 21l-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Filter rows…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-[12.5px] rounded-lg border border-[var(--color-rule)] bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-4)] focus:outline-none focus:border-[var(--color-sienna)] focus:ring-2 focus:ring-[var(--color-sienna)]/15 w-[180px]"
            />
          </div>
          <button onClick={() => selectAll(!allSelected)} className="btn-ghost">
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
        </div>
      </div>

      {/* Scroll body */}
      <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur">
            <tr className="border-b border-[var(--color-rule)]">
              <th className="w-10 px-4 py-3 text-left">
                <input
                  type="checkbox"
                  className="chk"
                  checked={allSelected}
                  onChange={(e) => selectAll(e.target.checked)}
                />
              </th>
              <Th>Art Name</Th>
              <Th>Size</Th>
              <Th>UPC</Th>
              <Th className="text-right pr-5">Image</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <TableRow
                key={row.id}
                row={row}
                onToggle={() => toggleRowSelected(row.id)}
                onImageChange={(file) => setRowImage(row.id, file)}
                onImageClear={() => clearRowImage(row.id)}
              />
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-[12.5px] text-[var(--color-ink-4)]">
                  No rows match "{query}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={
        'px-4 py-3 text-left eyebrow !text-[10px] font-semibold ' + className
      }
    >
      {children}
    </th>
  );
}

function Pill({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span
        className={
          'font-mono text-[13px] font-medium ' +
          (accent ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-3)]')
        }
      >
        {value}
      </span>
      <span className="eyebrow !text-[9.5px]">{label}</span>
    </span>
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
    <tr
      className={
        'border-b border-[var(--color-rule-soft)] last:border-0 transition-colors ' +
        (row.selected
          ? 'bg-[var(--color-sienna-soft)]/35 hover:bg-[var(--color-sienna-soft)]/55'
          : 'hover:bg-[var(--color-paper-2)]/55')
      }
    >
      <td className="px-4 py-2.5">
        <input type="checkbox" className="chk" checked={row.selected} onChange={onToggle} />
      </td>
      <td className="px-4 py-2.5 font-display text-[14.5px] text-[var(--color-ink)] leading-snug max-w-[260px] truncate" title={row.artName}>
        {row.artName}
      </td>
      <td className="px-4 py-2.5 text-[var(--color-ink-2)]">{row.size}</td>
      <td className="px-4 py-2.5 font-mono text-[11.5px] tracking-[0.04em] text-[var(--color-ink-3)]">
        {row.upc}
      </td>
      <td className="px-4 py-2.5 text-right pr-5">
        {row.imagePreviewUrl ? (
          <div className="inline-flex items-center gap-2">
            <img
              src={row.imagePreviewUrl}
              alt={row.artName}
              className="h-9 w-9 rounded-md object-cover border border-[var(--color-rule)] bg-[var(--color-paper-2)]"
            />
            <button
              onClick={onImageClear}
              className="text-[11px] text-[var(--color-ink-4)] hover:text-[var(--color-sienna)] transition-colors"
              title="Remove image"
            >
              Remove
            </button>
          </div>
        ) : (
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-[12px] font-medium text-[var(--color-ink-2)] hover:text-[var(--color-sienna)] transition-colors">
            <svg className="size-3.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Attach
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
