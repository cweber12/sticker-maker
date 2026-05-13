import { useStickerStore } from '@/store/useStickerStore';

/**
 * StickerPreview — 4×6 in print-ready label preview.
 * Placeholder visual that mirrors the final PDF layout:
 *   [ product image ]
 *   [ art name + size | UPC-A barcode ]
 *
 * Shows the currently-focused row, or the first selected row,
 * or the first row with an image, in that order.
 */
export function StickerPreview() {
  const rows = useStickerStore((s) => s.rows);

  const focus =
    rows.find((r) => r.selected && r.imagePreviewUrl) ??
    rows.find((r) => r.imagePreviewUrl) ??
    rows.find((r) => r.selected) ??
    rows[0] ??
    null;

  return (
    <aside className="lg:sticky lg:top-24 self-start">
      <div className="flex items-center justify-between mb-3">
        <span className="eyebrow">Live Preview</span>
        <span className="eyebrow !text-[10px]">4 × 6 in · 300 dpi</span>
      </div>

      <div
        className="card overflow-hidden mx-auto"
        style={{ aspectRatio: '4 / 6', maxWidth: '320px' }}
      >
        {/* Image area (top ~78%) */}
        <div
          className="relative bg-[var(--color-paper-2)] border-b border-[var(--color-rule)]"
          style={{ height: '78%' }}
        >
          {focus?.imagePreviewUrl ? (
            <img
              src={focus.imagePreviewUrl}
              alt={focus.artName}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center px-6">
              <svg
                viewBox="0 0 64 64"
                className="w-12 h-12 mb-3 text-[var(--color-ink-4)]"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.25}
              >
                <rect x="6" y="10" width="52" height="44" rx="3" />
                <path d="M6 42l14-14 12 12 8-8 18 18" />
                <circle cx="22" cy="22" r="4" />
              </svg>
              <p className="text-xs text-[var(--color-ink-4)] max-w-[200px]">
                Product image previews here once attached
              </p>
            </div>
          )}
        </div>

        {/* Info strip (bottom ~22%) */}
        <div className="flex items-stretch" style={{ height: '22%' }}>
          {/* Left: art name + size */}
          <div className="flex-1 flex flex-col justify-center px-3 py-2 min-w-0">
            <p
              className="font-display text-[15px] leading-tight text-[var(--color-ink)] truncate"
              title={focus?.artName}
            >
              {focus?.artName || 'Art Name'}
            </p>
            <p className="font-mono text-[10px] text-[var(--color-ink-3)] mt-0.5 truncate">
              {focus?.size || 'Size'}
            </p>
          </div>

          {/* Right: faux UPC-A barcode */}
          <div className="flex flex-col items-center justify-center px-2.5 py-2 border-l border-[var(--color-rule)] bg-white/40">
            <FauxBarcode value={focus?.upc} />
            <p className="font-mono text-[8.5px] tracking-[0.08em] text-[var(--color-ink-2)] mt-1">
              {focus?.upc || '000000 00000'}
            </p>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-[var(--color-ink-4)] text-center mt-3 leading-relaxed">
        {focus
          ? focus.imagePreviewUrl
            ? 'Showing: ' + focus.artName
            : 'Add an image to ' + focus.artName + ' to preview'
          : 'Select or add an image to preview a sticker'}
      </p>
    </aside>
  );
}

function FauxBarcode({ value }: { value?: string }) {
  // Deterministic pattern derived from the digits (purely decorative —
  // the real bwip-js barcode is rendered at export time).
  const seed = (value ?? '000000').replace(/\D/g, '').slice(0, 12) || '0';
  const bars: number[] = [];
  for (let i = 0; i < 40; i++) {
    const ch = seed.charCodeAt(i % seed.length) + i * 7;
    bars.push(((ch * 31) % 3) + 1); // widths 1..3
  }
  return (
    <svg viewBox="0 0 80 28" width="80" height="22" preserveAspectRatio="none">
      {(() => {
        let x = 0;
        return bars.map((w, i) => {
          const fill = i % 2 === 0 ? '#18171a' : 'transparent';
          const rect = (
            <rect key={i} x={x} y={0} width={w} height={28} fill={fill} />
          );
          x += w;
          return rect;
        });
      })()}
    </svg>
  );
}
