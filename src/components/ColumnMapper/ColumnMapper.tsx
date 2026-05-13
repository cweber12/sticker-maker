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
    <div className="card p-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {FIELDS.map(({ key, label, hint }) => (
          <div key={key} className="flex flex-col gap-2">
            <label className="eyebrow">{label}</label>
            <select
              className="field-select"
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
      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-[12px] text-[var(--color-ink-4)]">
          {isComplete ? 'All three fields mapped — ready to continue.' : 'Map each field to continue.'}
        </p>
        <button onClick={handleApply} disabled={!isComplete} className="btn-primary">
          Apply mapping
          <svg className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
