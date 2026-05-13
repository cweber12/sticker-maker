import { useState } from 'react';
import { useStickerStore } from '@/store/useStickerStore';
import type { ColumnMap } from '@/types';

const FIELDS: { key: keyof ColumnMap; label: string; hint: string }[] = [
  { key: 'artName', label: 'Art Name', hint: 'e.g. "Art Name"' },
  { key: 'size', label: 'Size', hint: 'e.g. "Size"' },
  { key: 'upc', label: 'UPC', hint: 'e.g. "UPC"' },
];

export function ColumnMapper() {
  const rawHeaders = useStickerStore((s) => s.rawHeaders);
  const setColumnMap = useStickerStore((s) => s.setColumnMap);
  const applyColumnMap = useStickerStore((s) => s.applyColumnMap);

  const [map, setMap] = useState<Partial<ColumnMap>>(() => {
    // Auto-detect common header names
    const auto: Partial<ColumnMap> = {};
    const lower = rawHeaders.map((h) => h.toLowerCase());
    const find = (terms: string[]) =>
      rawHeaders[lower.findIndex((h) => terms.some((t) => h.includes(t)))] ?? '';

    auto.artName = find(['art name', 'art', 'name', 'title']);
    auto.size = find(['size', 'dimension']);
    auto.upc = find(['upc', 'barcode']);
    return auto;
  });

  const isComplete = FIELDS.every((f) => map[f.key]);

  const handleApply = () => {
    if (!isComplete) return;
    setColumnMap(map as ColumnMap);
    applyColumnMap();
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
      <h3 className="mb-4 text-sm font-semibold text-zinc-700">Map Spreadsheet Columns</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {FIELDS.map(({ key, label, hint }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
              {label}
            </label>
            <select
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              value={map[key] ?? ''}
              onChange={(e) => setMap((prev) => ({ ...prev, [key]: e.target.value }))}
            >
              <option value="">{hint}</option>
              {rawHeaders.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-end">
        <button
          onClick={handleApply}
          disabled={!isComplete}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Apply Mapping
        </button>
      </div>
    </div>
  );
}
