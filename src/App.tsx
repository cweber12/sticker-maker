import { useStickerStore } from '@/store/useStickerStore'
import { SpreadsheetImporter } from '@/components/SpreadsheetImporter/SpreadsheetImporter'
import { ColumnMapper } from '@/components/ColumnMapper/ColumnMapper'
import { ImageImporter } from '@/components/ImageImporter/ImageImporter'
import { DataTable } from '@/components/DataTable/DataTable'
import { ExportPanel } from '@/components/ExportPanel/ExportPanel'

function App() {
  const rawHeaders = useStickerStore((s) => s.rawHeaders)
  const rows = useStickerStore((s) => s.rows)
  const clearAll = useStickerStore((s) => s.clearAll)

  return (
    <div className="min-h-screen bg-zinc-100">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900">
              <svg className="size-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-tight text-zinc-900">Sticker Maker</span>
          </div>
          {rows.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        {/* Step 1 */}
        <Step number={1} title="Import Spreadsheet">
          <SpreadsheetImporter />
        </Step>

        {/* Step 2 — column mapping */}
        {rawHeaders.length > 0 && (
          <Step number={2} title="Map Columns">
            <ColumnMapper />
          </Step>
        )}

        {/* Step 3 — image import + table */}
        {rows.length > 0 && (
          <>
            <Step number={3} title="Import Images">
              <ImageImporter />
            </Step>

            <Step number={4} title="Review & Select">
              <DataTable />
            </Step>

            <Step number={5} title="Export">
              <ExportPanel />
            </Step>
          </>
        )}
      </main>
    </div>
  )
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-bold text-white">
          {number}
        </span>
        <h2 className="text-sm font-semibold text-zinc-700">{title}</h2>
      </div>
      {children}
    </section>
  )
}

export default App
