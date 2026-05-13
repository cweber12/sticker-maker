import { useEffect, useRef, useState } from 'react';
import { useStickerStore } from '@/store/useStickerStore';
import { renderStickerCanvas, renderBarcode, STICKER_W, STICKER_H } from '@/utils/render-sticker';
import type { StickerRow } from '@/types';

/** A known-valid UPC-A used for the sample barcode preview. */
const SAMPLE_UPC = '012345678905';

const VALID_UPC_RE = /^\d{12}$/;

/**
 * StickerPreview — 4×6 in print-ready label preview.
 *
 * - With image: renders via renderStickerCanvas — pixel-perfect PDF match.
 * - Without image: CSS placeholder scaled to exact canvas proportions.
 *
 * "Preview barcode" toggle: renders a sample UPC-A barcode when the row has
 * no valid UPC, so the user can see the full label layout before adding UPCs.
 */
export function StickerPreview() {
  const rows = useStickerStore((s) => s.rows);
  const layout = useStickerStore((s) => s.layout);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [sampleBarcode, setSampleBarcode] = useState(false);

  const focus: StickerRow | null =
    rows.find((r) => r.selected && r.imageFile) ??
    rows.find((r) => r.imageFile) ??
    rows.find((r) => r.selected) ??
    rows[0] ??
    null;

  const hasValidUpc = VALID_UPC_RE.test(focus?.upc ?? '');
  // When sample toggle is on and no real UPC exists, substitute the sample UPC.
  const upcForRender = hasValidUpc ? focus!.upc : sampleBarcode ? SAMPLE_UPC : (focus?.upc ?? '');

  useEffect(() => {
    if (!focus?.imageFile) {
      setPreviewUrl(null);
      return;
    }
    let cancelled = false;
    setRendering(true);
    renderStickerCanvas(focus.imageFile, focus.artName, focus.size, upcForRender, layout)
      .then((canvas) => {
        if (cancelled) return;
        setPreviewUrl(canvas.toDataURL('image/jpeg', 0.85));
        setRendering(false);
      })
      .catch(() => {
        if (!cancelled) setRendering(false);
      });
    return () => { cancelled = true; };
  }, [focus?.id, focus?.artName, focus?.size, upcForRender, focus?.imageFile, layout]);

  return (
    <aside className="lg:sticky lg:top-24 self-start">
      <div className="flex items-center justify-between mb-3 gap-2">
        <span className="eyebrow">Live Preview</span>
        <div className="flex items-center gap-2">
          {/* Sample barcode toggle — only relevant when row has no valid UPC */}
          {!hasValidUpc && (
            <button
              type="button"
              onClick={() => setSampleBarcode((b) => !b)}
              title="Show a sample barcode to preview the label layout"
              className={`inline-flex items-center gap-1 text-[10px] font-mono tracking-[0.08em] uppercase px-1.5 py-0.5 rounded border transition-colors ${
                sampleBarcode
                  ? 'border-sienna text-sienna bg-[color-mix(in_oklab,var(--color-sienna)_8%,transparent)]'
                  : 'border-rule text-ink-4 hover:border-ink-4'
              }`}
            >
              <svg className="size-2.5" viewBox="0 0 16 16" fill="currentColor">
                <rect x="0" y="0" width="1.5" height="16" />
                <rect x="2.5" y="0" width="1" height="16" />
                <rect x="4.5" y="0" width="2" height="16" />
                <rect x="7.5" y="0" width="1" height="16" />
                <rect x="9.5" y="0" width="1.5" height="16" />
                <rect x="12" y="0" width="1" height="16" />
                <rect x="14" y="0" width="2" height="16" />
              </svg>
              {sampleBarcode ? 'Sample on' : 'Preview barcode'}
            </button>
          )}
          <span className="eyebrow text-[10px]!">4 × 6 in · 300 dpi</span>
        </div>
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
          <img src={previewUrl} alt={focus?.artName} className="w-full h-full object-cover" />
        ) : (
          <StickerLayoutPlaceholder focus={focus} sampleBarcode={sampleBarcode} />
        )}
      </div>

      <p className="text-[11px] text-ink-4 text-center mt-3 leading-relaxed">
        {focus
          ? focus.imageFile
            ? rendering
              ? 'Rendering ' + focus.artName + '…'
              : 'Showing: ' + focus.artName + (sampleBarcode && !hasValidUpc ? ' · sample barcode' : '')
            : 'Add an image to ' + focus.artName + ' to preview'
          : 'Select or add an image to preview a sticker'}
      </p>
    </aside>
  );
}

function StickerLayoutPlaceholder({
  focus,
  sampleBarcode,
}: {
  focus: StickerRow | null;
  sampleBarcode: boolean;
}) {
  const barcodeRef = useRef<HTMLCanvasElement>(null);
  const layout = useStickerStore((s) => s.layout);

  const hasValidUpc = VALID_UPC_RE.test(focus?.upc ?? '');
  const showBarcode = hasValidUpc || sampleBarcode;
  const upcToRender = hasValidUpc ? (focus!.upc) : SAMPLE_UPC;

  useEffect(() => {
    const el = barcodeRef.current;
    if (!el || !showBarcode) return;
    renderBarcode(upcToRender).then((bc) => {
      if (!bc) return;
      const ctx = el.getContext('2d');
      if (!ctx) return;
      el.width = bc.width;
      el.height = bc.height;
      ctx.drawImage(bc, 0, 0);
    });
  }, [upcToRender, showBarcode]);

  // Convert canvas px → % / cqw units of the preview container.
  const labelBottom = `${(layout.labelInset / STICKER_H) * 100}%`;
  const labelSide   = `${(layout.labelInset / STICKER_W) * 100}%`;
  const labelHeight = `${(layout.labelHeight / STICKER_H) * 100}%`;
  const labelPadCqw = `${(layout.labelPadding / STICKER_W) * 100}cqw`;
  const nameSize    = `${(layout.nameFontSize / STICKER_W) * 100}cqw`;
  const sizeSize    = `${(layout.sizeFontSize / STICKER_W) * 100}cqw`;
  const barcodeWCqw = `${(layout.barcodeZoneWidth / STICKER_W) * 100}cqw`;

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

      {/* Floating white label — matches PDF canvas layout exactly */}
      <div
        className="absolute bg-white flex items-stretch overflow-hidden shadow-sm"
        style={{ bottom: labelBottom, left: labelSide, right: labelSide, height: labelHeight }}
      >
        {/* Left: art name (top) + size (bottom) — padded */}
        <div
          className="flex flex-col justify-between min-w-0 flex-1"
          style={{ padding: `${labelPadCqw} ${labelPadCqw}` }}
        >
          <p
            className="leading-none truncate uppercase text-[#111]"
            style={{ fontFamily: "'Baskerville Display PT', Baskerville, serif", fontSize: nameSize }}
            title={focus?.artName}
          >
            {focus?.artName || 'Art Name'}
          </p>
          <p
            className="leading-none truncate text-[#444]"
            style={{ fontFamily: "'Tw Cen MT', 'Trebuchet MS', sans-serif", fontSize: sizeSize }}
          >
            {focus?.size || 'Size'}
          </p>
        </div>

        {/* Right: barcode zone — no padding, flush to label top/right/bottom */}
        <div className="shrink-0 overflow-hidden" style={{ width: barcodeWCqw }}>
          {showBarcode ? (
            <canvas
              ref={barcodeRef}
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
          ) : (
            <FauxBarcode />
          )}
        </div>
      </div>
    </div>
  );
}

function FauxBarcode() {
  return (
    <svg viewBox="0 0 80 28" width="100%" height="100%" preserveAspectRatio="none">
      {[2,1,3,1,2,1,1,2,1,3,1,2,2,1,1,2,3,1,2,1,1,3,2,1,1,2,1,2,3,1].map((w, i) => {
        let x = 0;
        for (let j = 0; j < i; j++) x += [2,1,3,1,2,1,1,2,1,3,1,2,2,1,1,2,3,1,2,1,1,3,2,1,1,2,1,2,3,1][j];
        return i % 2 === 0
          ? <rect key={i} x={x} y={0} width={w} height={28} fill="#18171a" />
          : null;
      })}
    </svg>
  );
}

