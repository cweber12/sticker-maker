import { useEffect, useRef, useState } from 'react';
import { useStickerStore } from '@/store/useStickerStore';
import { renderStickerCanvas, renderBarcode } from '@/utils/render-sticker';
import type { StickerRow } from '@/types';

// Proportions derived from render-sticker.ts canvas constants:
// STICKER_W=1200, STICKER_H=1800, LABEL_INSET=46, LABEL_H=171, LABEL_PAD=38, BARCODE_ZONE_W=382
const LABEL_BOTTOM  = `${(46 / 1800) * 100}%`;       // 2.556% — bottom inset (% of height)
const LABEL_SIDE    = `${(46 / 1200) * 100}%`;        // 3.833% — left/right inset (% of width)
const LABEL_HEIGHT  = `${(171 / 1800) * 100}%`;       // 9.5%   — label height (% of height)
const LABEL_PAD_CQW = `${(38 / 1200) * 100}cqw`;      // 3.167cqw — inner padding
const NAME_SIZE     = `${(60 / 1200) * 100}cqw`;      // 5cqw     — art name font size
const SIZE_SIZE     = `${(38 / 1200) * 100}cqw`;      // 3.167cqw — size text font size
const BARCODE_W_CQW = `${(382 / 1200) * 100}cqw`;     // 31.833cqw — barcode zone width

/**
 * StickerPreview — 4×6 in print-ready label preview.
 *
 * When the focused row has an image file, calls renderStickerCanvas() directly
 * so the preview is a pixel-perfect match of the exported PDF.
 * Falls back to a CSS layout with the exact same proportions when no image.
 */
export function StickerPreview() {
  const rows = useStickerStore((s) => s.rows);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);

  const focus: StickerRow | null =
    rows.find((r) => r.selected && r.imageFile) ??
    rows.find((r) => r.imageFile) ??
    rows.find((r) => r.selected) ??
    rows[0] ??
    null;

  useEffect(() => {
    if (!focus?.imageFile) {
      setPreviewUrl(null);
      return;
    }
    let cancelled = false;
    setRendering(true);
    renderStickerCanvas(focus.imageFile, focus.artName, focus.size, focus.upc)
      .then((canvas) => {
        if (cancelled) return;
        setPreviewUrl(canvas.toDataURL('image/jpeg', 0.85));
        setRendering(false);
      })
      .catch(() => {
        if (!cancelled) setRendering(false);
      });
    return () => { cancelled = true; };
  }, [focus?.id, focus?.artName, focus?.size, focus?.upc, focus?.imageFile]);

  return (
    <aside className="lg:sticky lg:top-24 self-start">
      <div className="flex items-center justify-between mb-3">
        <span className="eyebrow">Live Preview</span>
        <span className="eyebrow text-[10px]!">4 × 6 in · 300 dpi</span>
      </div>

      <div
        className="card overflow-hidden mx-auto relative"
        style={{ aspectRatio: '4 / 6', maxWidth: '320px', containerType: 'inline-size' } as React.CSSProperties}
      >
        {rendering && (
          <div className="absolute inset-0 flex items-center justify-center z-10"
            style={{ background: 'rgba(248,246,241,0.75)' }}>
            <span className="text-[11px] text-ink-4">Rendering…</span>
          </div>
        )}

        {previewUrl ? (
          /* Exact canvas render — pixel-perfect PDF match */
          <img src={previewUrl} alt={focus?.artName} className="w-full h-full object-cover" />
        ) : (
          /* CSS layout — matches PDF proportions, no image loaded yet */
          <StickerLayoutPlaceholder focus={focus} />
        )}
      </div>

      <p className="text-[11px] text-ink-4 text-center mt-3 leading-relaxed">
        {focus
          ? focus.imageFile
            ? rendering
              ? 'Rendering ' + focus.artName + '…'
              : 'Showing: ' + focus.artName
            : 'Add an image to ' + focus.artName + ' to preview'
          : 'Select or add an image to preview a sticker'}
      </p>
    </aside>
  );
}

function StickerLayoutPlaceholder({ focus }: { focus: StickerRow | null }) {
  const barcodeRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = barcodeRef.current;
    if (!el || !focus?.upc) return;
    renderBarcode(focus.upc).then((bc) => {
      if (!bc) return;
      const ctx = el.getContext('2d');
      if (!ctx) return;
      el.width = bc.width;
      el.height = bc.height;
      ctx.drawImage(bc, 0, 0);
    });
  }, [focus?.upc]);

  const hasValidUpc = !!focus?.upc && /^\d{12}$/.test(focus.upc);

  return (
    <div className="relative w-full h-full bg-paper-2">
      {/* Placeholder image graphic */}
      <div className="w-full h-full flex flex-col items-center justify-center text-center px-6">
        <svg
          viewBox="0 0 64 64"
          className="w-10 h-10 mb-2 text-ink-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.25}
        >
          <rect x="6" y="10" width="52" height="44" rx="3" />
          <path d="M6 42l14-14 12 12 8-8 18 18" />
          <circle cx="22" cy="22" r="4" />
        </svg>
        <p className="text-[10px] text-ink-4 max-w-50">
          Product image previews here
        </p>
      </div>

      {/* Floating white label — matches the PDF label exactly */}
      <div
        className="absolute bg-white flex items-stretch overflow-hidden shadow-sm"
        style={{ bottom: LABEL_BOTTOM, left: LABEL_SIDE, right: LABEL_SIDE, height: LABEL_HEIGHT }}
      >
        {/* Left: art name (top) + size (bottom) */}
        <div
          className="flex flex-col justify-between min-w-0 flex-1"
          style={{ padding: `${LABEL_PAD_CQW} ${LABEL_PAD_CQW}` }}
        >
          <p
            className="leading-none truncate uppercase text-[#111]"
            style={{ fontFamily: "'Baskerville Display PT', Baskerville, serif", fontSize: NAME_SIZE }}
            title={focus?.artName}
          >
            {focus?.artName || 'Art Name'}
          </p>
          <p
            className="leading-none truncate text-[#444]"
            style={{ fontFamily: "'Tw Cen MT', 'Trebuchet MS', sans-serif", fontSize: SIZE_SIZE }}
          >
            {focus?.size || 'Size'}
          </p>
        </div>

        {/* Right: barcode zone */}
        <div
          className="shrink-0 flex items-center justify-center"
          style={{ width: BARCODE_W_CQW, padding: `0 ${LABEL_PAD_CQW}` }}
        >
          {hasValidUpc ? (
            <canvas ref={barcodeRef} className="w-full h-auto" />
          ) : (
            <FauxBarcode value={focus?.upc} />
          )}
        </div>
      </div>
    </div>
  );
}

function FauxBarcode({ value }: { value?: string }) {
  const seed = (value ?? '000000').replace(/\D/g, '').slice(0, 12) || '0';
  const bars: number[] = [];
  for (let i = 0; i < 40; i++) {
    const ch = seed.charCodeAt(i % seed.length) + i * 7;
    bars.push(((ch * 31) % 3) + 1);
  }
  return (
    <svg viewBox="0 0 80 28" width="100%" height="100%" preserveAspectRatio="none">
      {(() => {
        let x = 0;
        return bars.map((w, i) => {
          const fill = i % 2 === 0 ? '#18171a' : 'transparent';
          const rect = <rect key={i} x={x} y={0} width={w} height={28} fill={fill} />;
          x += w;
          return rect;
        });
      })()}
    </svg>
  );
}
