import { useState } from 'react';
import { useStickerStore } from '@/store/useStickerStore';
import {
  DEFAULT_LAYOUT,
  DESIGN_UNIT_PX,
  STICKER_W,
  STICKER_H,
} from '@/utils/render-sticker';
import type { LayoutConfig } from '@/types';

/**
 * LayoutEditor — interactive editor for the floating-label layout.
 *
 * Shows an annotated 4×6 sticker diagram with measurement callouts.
 * Inputs are in design units (1 du ≈ 3.82 canvas px ≈ 0.0127 in).
 * Values are stored internally as canvas pixels; mm + inch readouts are
 * derived live for verification against the docs.
 */
type FieldKey = keyof LayoutConfig;

interface Field {
  key: FieldKey;
  label: string;
  hint: string;
  min: number;   // min design units
  max: number;   // max design units
  step: number;
}

const FIELDS: Field[] = [
  { key: 'labelInset',       label: 'Outer padding',    hint: 'Margin from label to all 4 sticker edges.',         min: 0,  max: 40,  step: 0.5 },
  { key: 'labelHeight',      label: 'Label height',     hint: 'Total height of the white info strip.',             min: 20, max: 120, step: 0.5 },
  { key: 'labelPadding',     label: 'Inner padding',    hint: 'Horizontal padding inside the label.',              min: 0,  max: 30,  step: 0.5 },
  { key: 'textAreaWidth',    label: 'Text area width',  hint: 'Max width for Art Name and Size (text shrinks).',   min: 50, max: 250, step: 1   },
  { key: 'barcodeZoneWidth', label: 'Barcode width',    hint: 'Reserved width for the UPC-A barcode.',             min: 30, max: 200, step: 1   },
];

const FONT_FIELDS: Field[] = [
  { key: 'nameFontSize',     label: 'Art Name size',    hint: 'Starting font size (px @ 300dpi); shrinks to fit.', min: 20, max: 120, step: 1 },
  { key: 'sizeFontSize',     label: 'Size text size',   hint: 'Starting font size (px @ 300dpi); shrinks to fit.', min: 12, max: 80,  step: 1 },
];

const pxToDu = (px: number) => +(px / DESIGN_UNIT_PX).toFixed(2);
const duToPx = (du: number) => +(du * DESIGN_UNIT_PX).toFixed(2);
const pxToMm = (px: number) => +(px * 25.4 / 300).toFixed(2);
const pxToIn = (px: number) => +(px / 300).toFixed(3);

export function LayoutEditor() {
  const layout = useStickerStore((s) => s.layout);
  const setLayout = useStickerStore((s) => s.setLayout);
  const resetLayout = useStickerStore((s) => s.resetLayout);
  const [open, setOpen] = useState(false);

  const isDirty = (Object.keys(DEFAULT_LAYOUT) as FieldKey[]).some(
    (k) => layout[k] !== DEFAULT_LAYOUT[k]
  );

  return (
    <div className="card overflow-hidden">
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-paper-2 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-4 min-w-0">
          <svg className="size-5 text-ink-3 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9h18M3 15h18M9 3v18M15 3v18" />
          </svg>
          <div>
            <div className="font-display text-[18px] leading-tight text-ink">Sticker layout</div>
            <div className="text-[12px] text-ink-3 mt-0.5">
              Adjust label dimensions, padding, and text sizes. Applied to every exported PDF.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isDirty && (
            <span className="eyebrow text-sienna text-[10px]!">Modified</span>
          )}
          <svg
            className={`size-4 text-ink-4 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-rule-soft px-6 py-6 grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-8">
          {/* ─── Annotated diagram ─── */}
          <div className="space-y-3">
            <span className="eyebrow">Diagram</span>
            <LayoutDiagram layout={layout} />
            <div className="text-[11px] text-ink-4 leading-relaxed">
              All measurements in design units (1 du ≈ 3.82 px @ 300 dpi).
              <br />Sticker: 4 × 6 in · 1200 × 1800 px.
            </div>
          </div>

          {/* ─── Controls ─── */}
          <div className="space-y-6">
            <div>
              <span className="eyebrow mb-3 block">Label geometry</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {FIELDS.map((f) => (
                  <LayoutField
                    key={f.key}
                    field={f}
                    valuePx={layout[f.key]}
                    onChange={(px) => setLayout({ [f.key]: px } as Partial<LayoutConfig>)}
                  />
                ))}
              </div>
            </div>

            <div>
              <span className="eyebrow mb-3 block">Typography</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {FONT_FIELDS.map((f) => (
                  <LayoutField
                    key={f.key}
                    field={f}
                    valuePx={layout[f.key]}
                    onChange={(px) => setLayout({ [f.key]: px } as Partial<LayoutConfig>)}
                    /* Font sizes are stored as px directly (no design-unit conversion). */
                    unit="px"
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-rule-soft">
              <div className="text-[11.5px] text-ink-4">
                Changes apply live to the preview and to every downloaded sticker.
              </div>
              <button
                type="button"
                onClick={resetLayout}
                disabled={!isDirty}
                className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed"
                title="Restore default layout values"
              >
                <svg className="size-3.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6M20 20v-6h-6M20 4a9 9 0 00-15 4M4 20a9 9 0 0015-4" />
                </svg>
                Reset to defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Field input — one row per editable value
// ─────────────────────────────────────────────────────────────

function LayoutField({
  field,
  valuePx,
  onChange,
  unit = 'du',
}: {
  field: Field;
  valuePx: number;
  onChange: (px: number) => void;
  unit?: 'du' | 'px';
}) {
  // Display value depends on unit
  const display = unit === 'du' ? pxToDu(valuePx) : Math.round(valuePx);
  const handleSet = (next: number) => {
    const clamped = Math.min(field.max, Math.max(field.min, next));
    onChange(unit === 'du' ? duToPx(clamped) : clamped);
  };

  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[12px] font-medium text-ink">{field.label}</span>
        <span className="font-mono text-[10.5px] text-ink-4 num-tabular">
          {pxToMm(valuePx)} mm · {pxToIn(valuePx)} in
        </span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={field.min}
          max={field.max}
          step={field.step}
          value={display}
          onChange={(e) => handleSet(parseFloat(e.target.value))}
          className="flex-1 accent-sienna"
        />
        <input
          type="number"
          min={field.min}
          max={field.max}
          step={field.step}
          value={display}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!Number.isNaN(v)) handleSet(v);
          }}
          className="w-16 px-2 py-1 text-[12px] font-mono num-tabular border border-rule rounded bg-white focus:outline-none focus:border-ink-3"
        />
        <span className="text-[10px] text-ink-4 font-mono w-4">{unit}</span>
      </div>
      <p className="text-[10.5px] text-ink-4 mt-1 leading-snug">{field.hint}</p>
    </label>
  );
}

// ─────────────────────────────────────────────────────────────
// Annotated SVG diagram — 4×6 sticker with measurement callouts
// ─────────────────────────────────────────────────────────────

function LayoutDiagram({ layout }: { layout: LayoutConfig }) {
  // Render at a fixed SVG viewbox using actual canvas px coordinates,
  // so geometry is a true-to-scale schematic.
  const W = STICKER_W;
  const H = STICKER_H;
  const labelX = layout.labelInset;
  const labelY = H - layout.labelInset - layout.labelHeight;
  const labelW = W - layout.labelInset * 2;
  const labelH = layout.labelHeight;

  const textX = labelX + layout.labelPadding;
  const textW = layout.textAreaWidth;
  const barX = labelX + labelW - layout.labelPadding - layout.barcodeZoneWidth;
  const barW = layout.barcodeZoneWidth;

  // Tick / annotation styling
  const tick = { stroke: '#a09691', strokeWidth: 3, strokeLinecap: 'round' as const };
  const dim  = { stroke: '#c2a37d', strokeWidth: 3 };

  return (
    <svg
      viewBox={`-80 -40 ${W + 200} ${H + 160}`}
      className="w-full h-auto rounded border border-rule bg-paper"
      style={{ aspectRatio: `${W + 200} / ${H + 200}` }}
    >
      {/* Sticker bounds */}
      <rect x={0} y={0} width={W} height={H} fill="#f0ebe1" stroke="#3a3530" strokeWidth={4} />

      {/* Image area hint */}
      <g opacity={0.4}>
        <line x1={0} y1={0} x2={W} y2={labelY} {...tick} strokeDasharray="14 14" />
        <text x={W / 2} y={labelY / 2} textAnchor="middle" fontSize={64} fill="#7d736b" fontStyle="italic">
          product image
        </text>
      </g>

      {/* Label box */}
      <rect x={labelX} y={labelY} width={labelW} height={labelH} fill="#ffffff" stroke="#3a3530" strokeWidth={3} />

      {/* Text area */}
      <rect
        x={textX} y={labelY + layout.labelPadding}
        width={textW} height={labelH - layout.labelPadding * 2}
        fill="rgba(193,90,52,0.06)" stroke="rgba(193,90,52,0.55)" strokeWidth={2} strokeDasharray="10 6"
      />

      {/* Barcode zone */}
      <rect
        x={barX} y={labelY + layout.labelPadding}
        width={barW} height={labelH - layout.labelPadding * 2}
        fill="rgba(58,77,53,0.08)" stroke="rgba(58,77,53,0.55)" strokeWidth={2} strokeDasharray="10 6"
      />
      {/* Faux barcode bars */}
      <g transform={`translate(${barX + 20}, ${labelY + layout.labelPadding + 10})`}>
        {Array.from({ length: 18 }).map((_, i) => (
          <rect key={i} x={i * (barW - 40) / 18} y={0} width={(barW - 40) / 36} height={labelH - layout.labelPadding * 2 - 20} fill="#3a3530" />
        ))}
      </g>

      {/* ─── Dimension callouts ─── */}

      {/* Outer padding — left edge */}
      <DimVert x={-30} y1={H - labelY < labelH * 2 ? labelY : 0} y2={labelY} label={`${pxToDu(layout.labelInset)} du`} />
      {/* Label height — right edge */}
      <DimVert x={W + 30} y1={labelY} y2={labelY + labelH} label={`H = ${pxToDu(layout.labelHeight)} du`} />
      {/* Outer padding — bottom */}
      <DimHoriz y={H + 40} x1={0} x2={labelX} label={`${pxToDu(layout.labelInset)} du`} below />
      {/* Text width */}
      <DimHoriz y={labelY - 30} x1={textX} x2={textX + textW} label={`${pxToDu(layout.textAreaWidth)} du`} />
      {/* Barcode width */}
      <DimHoriz y={labelY - 30} x1={barX} x2={barX + barW} label={`${pxToDu(layout.barcodeZoneWidth)} du`} />
      {/* Inner pad */}
      <DimHoriz y={labelY + labelH + 30} x1={labelX} x2={textX} label={`${pxToDu(layout.labelPadding)} du`} below />

      {/* Section labels */}
      <text x={textX + textW / 2} y={labelY + labelH / 2 + 18} textAnchor="middle"
        fontSize={42} fill="#7d4933" fontStyle="italic">
        text
      </text>
      <text x={barX + barW / 2} y={labelY - 12} textAnchor="middle"
        fontSize={32} fill="#3a4d35" fontFamily="monospace">
        barcode
      </text>

      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="#c2a37d" />
        </marker>
      </defs>
    </svg>
  );

  // ─── helpers (closed over the layout-aware tick / dim styles) ───
  function DimVert({ x, y1, y2, label }: { x: number; y1: number; y2: number; label: string }) {
    return (
      <g>
        <line x1={x} y1={y1} x2={x} y2={y2} {...dim} markerStart="url(#arr)" markerEnd="url(#arr)" />
        <line x1={x - 12} y1={y1} x2={x + 12} y2={y1} {...tick} />
        <line x1={x - 12} y1={y2} x2={x + 12} y2={y2} {...tick} />
        <text
          x={x - 10} y={(y1 + y2) / 2} textAnchor="end"
          fontSize={36} fill="#5a4f47" fontFamily="monospace"
          dominantBaseline="middle"
        >
          {label}
        </text>
      </g>
    );
  }

  function DimHoriz({
    y, x1, x2, label, below,
  }: { y: number; x1: number; x2: number; label: string; below?: boolean }) {
    return (
      <g>
        <line x1={x1} y1={y} x2={x2} y2={y} {...dim} markerStart="url(#arr)" markerEnd="url(#arr)" />
        <line x1={x1} y1={y - 12} x2={x1} y2={y + 12} {...tick} />
        <line x1={x2} y1={y - 12} x2={x2} y2={y + 12} {...tick} />
        <text
          x={(x1 + x2) / 2} y={below ? y + 36 : y - 14} textAnchor="middle"
          fontSize={32} fill="#5a4f47" fontFamily="monospace"
        >
          {label}
        </text>
      </g>
    );
  }
}
