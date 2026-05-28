import { useStickerStore } from '@/store/useStickerStore';
import { SpreadsheetImporter } from '@/components/SpreadsheetImporter/SpreadsheetImporter';
import { ColumnMapper } from '@/components/ColumnMapper/ColumnMapper';
import { ImageImporter } from '@/components/ImageImporter/ImageImporter';
import { DataTable } from '@/components/DataTable/DataTable';
import { ExportPanel } from '@/components/ExportPanel/ExportPanel';
import { StickerPreview } from '@/components/StickerPreview/StickerPreview';
import { LayoutEditor } from '@/components/LayoutEditor/LayoutEditor';

type StepKey = 'import' | 'map' | 'images' | 'review' | 'layout' | 'export';

const STEPS: { key: StepKey; label: string }[] = [
  { key: 'import', label: 'Spreadsheet' },
  { key: 'map', label: 'Columns' },
  { key: 'images', label: 'Images' },
  { key: 'review', label: 'Review' },
  { key: 'layout', label: 'Layout' },
  { key: 'export', label: 'Export' },
];

function App() {
  const rawHeaders = useStickerStore((s) => s.rawHeaders);
  const rows = useStickerStore((s) => s.rows);
  const clearAll = useStickerStore((s) => s.clearAll);

  const hasHeaders = rawHeaders.length > 0;
  const hasRows = rows.length > 0;
  const withImages = rows.filter((r) => r.imageFile).length;
  const selected = rows.filter((r) => r.selected).length;
  const selectedReady = rows.filter((r) => r.selected && r.imageFile).length;

  const stepState = (key: StepKey): 'pending' | 'active' | 'done' => {
    switch (key) {
      case 'import':
        return hasHeaders ? 'done' : 'active';
      case 'map':
        if (!hasHeaders) return 'pending';
        return hasRows ? 'done' : 'active';
      case 'images':
        if (!hasRows) return 'pending';
        return withImages > 0 ? 'done' : 'active';
      case 'review':
        if (!hasRows) return 'pending';
        return selected > 0 ? 'done' : 'active';
      case 'layout':
        if (!hasRows) return 'pending';
        return selected > 0 ? 'active' : 'pending';
      case 'export':
        if (!hasRows) return 'pending';
        return selectedReady > 0 ? 'active' : 'pending';
    }
  };

  return (
    <div className="min-h-screen">
      {/* ─────────────── Header ─────────────── */}
      <header className="sticky top-0 z-30 border-b border-[var(--color-rule)] bg-[color-mix(in_oklab,var(--color-paper)_88%,transparent)] backdrop-blur-md">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Mark />
              <div className="flex items-baseline gap-2.5">
                <span className="wordmark text-[26px] leading-none text-[var(--color-ink)]">
                  Sticker
                </span>
                <span className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-[var(--color-ink-4)] pt-1">
                  / Maker
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-5 text-[12px] text-[var(--color-ink-3)] num-tabular">
              <Stat label="Rows" value={rows.length} />
              <span className="h-3 w-px bg-[var(--color-rule)]" />
              <Stat label="Images" value={withImages} />
              <span className="h-3 w-px bg-[var(--color-rule)]" />
              <Stat label="Selected" value={selected} />
            </div>

            {hasHeaders && (
              <button
                onClick={clearAll}
                className="btn-ghost hover:!text-[var(--color-sienna)]"
                title="Reset and start over"
              >
                <svg className="size-3.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M9 7V4h6v3m-7 0v13a2 2 0 002 2h4a2 2 0 002-2V7" />
                </svg>
                Reset
              </button>
            )}
          </div>

          <nav className="pb-3 -mt-1 overflow-x-auto">
            <ol className="flex items-center gap-1.5 min-w-max">
              {STEPS.map((step, i) => {
                const state = stepState(step.key);
                return (
                  <li key={step.key} className="flex items-center gap-1.5">
                    <span className="step-chip" data-state={state}>
                      <span className="step-num">{i + 1}</span>
                      <span>{step.label}</span>
                    </span>
                    {i < STEPS.length - 1 && (
                      <span
                        className="block h-px w-6"
                        style={{
                          background:
                            state === 'done'
                              ? 'var(--color-ink-3)'
                              : 'var(--color-rule-soft)',
                        }}
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </header>

      {/* ─────────────── Main ─────────────── */}
      <main className="mx-auto max-w-[1280px] px-6 lg:px-10 py-10 lg:py-14">
        {!hasHeaders && <Hero />}

        <div className="space-y-10">
          {!hasHeaders && (
            <SectionBlock
              number="01"
              title="Import your spreadsheet"
              hint="Excel (.xlsx, .xls) or CSV — we'll detect Art Name, Size, and UPC columns."
            >
              <SpreadsheetImporter />
            </SectionBlock>
          )}

          {hasHeaders && !hasRows && (
            <SectionBlock
              number="02"
              title="Map your columns"
              hint="Confirm which spreadsheet columns map to each sticker field."
            >
              <ColumnMapper />
            </SectionBlock>
          )}

          {hasRows && (
            <div className="reveal space-y-10">
              <SectionBlock
                number="03"
                title="Attach product images"
                hint="Drop a batch — filenames are matched to Art Names — or add images per row below."
              >
                <ImageImporter />
              </SectionBlock>

              <SectionBlock
                number="04"
                title="Review &amp; select stickers"
                hint="Pick rows to export. The preview reflects the active row."
              >
                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-8">
                  <DataTable />
                  <StickerPreview />
                </div>
              </SectionBlock>

              <SectionBlock
                number="05"
                title="Fine-tune the layout"
                hint="Optional — adjust label dimensions and text sizes. Defaults match the print spec."
              >
                <LayoutEditor />
              </SectionBlock>

              <SectionBlock
                number="06"
                title="Export print-ready PDFs"
                hint="Each sticker exports at 4×6 in / 300 dpi with UPC-A or Diamond Art logo mode."
              >
                <ExportPanel />
              </SectionBlock>
            </div>
          )}
        </div>

        <Footer />
      </main>
    </div>
  );
}

function Mark() {
  return (
    <span
      className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-brand-700)] text-white"
      aria-hidden
    >
      <span
        className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[var(--color-sienna)]"
        style={{ boxShadow: '0 0 0 2px var(--color-paper)' }}
      />
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2v-8z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v6h6" />
      </svg>
    </span>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="font-mono text-[14px] font-medium text-[var(--color-ink)]">{value}</span>
      <span className="eyebrow !text-[9.5px]">{label}</span>
    </span>
  );
}

function Hero() {
  return (
    <section className="reveal mb-12 max-w-[680px]">
      <p className="eyebrow mb-4">Print-ready · 4×6 in · 300 dpi</p>
      <h1 className="font-display text-[44px] sm:text-[56px] lg:text-[68px] leading-[0.95] text-[var(--color-ink)]">
        From spreadsheet
        <br />
        to{' '}
        <span className="text-[var(--color-brand-600)]">
          shelf-ready
        </span>{' '}
        labels.
      </h1>
      <p className="mt-5 text-[15px] leading-relaxed text-[var(--color-ink-3)] max-w-[520px]">
        Drop in your product catalog, attach images in bulk, and export
        barcoded sticker PDFs — all in your browser, no uploads.
      </p>
    </section>
  );
}

function SectionBlock({
  number,
  title,
  hint,
  children,
}: {
  number: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="reveal">
      <header className="mb-4 flex items-end justify-between gap-6 border-b border-[var(--color-rule-soft)] pb-3">
        <div className="flex items-baseline gap-4 min-w-0">
          <span className="font-mono text-[11px] font-medium tracking-[0.1em] text-[var(--color-sienna)]">
            {number}
          </span>
          <h2
            className="font-display text-[22px] sm:text-[26px] leading-tight text-[var(--color-ink)]"
            dangerouslySetInnerHTML={{ __html: title }}
          />
        </div>
        {hint && (
          <p className="hidden sm:block text-[12.5px] text-[var(--color-ink-3)] max-w-[420px] text-right leading-snug">
            {hint}
          </p>
        )}
      </header>
      <div>{children}</div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-20 pt-6 border-t border-[var(--color-rule-soft)] flex items-center justify-between text-[11px] text-[var(--color-ink-4)]">
      <span className="font-mono tracking-[0.1em] uppercase">Sticker Maker</span>
      <span>Runs locally · No data leaves your browser</span>
    </footer>
  );
}

export default App;
