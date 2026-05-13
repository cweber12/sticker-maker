# Sticker Maker — GitHub Copilot Instructions

## Project Overview
A browser-based React + TypeScript app that generates product stickers as PDFs.
Users import an Excel spreadsheet and product images, review a data table, then export
print-ready 4×6in PDF stickers (1200×1800px @ 300dpi) with the product image on top
and a white info strip at the bottom containing Art Name, Size (left) and a UPC-A
barcode (right).

## Stack
- **Framework:** Vite + React 19 + TypeScript (strict)
- **Styling:** Tailwind CSS v4 (no config file — CSS-based via `@import "tailwindcss"`)
- **State:** Zustand
- **Spreadsheet parsing:** ExcelJS (browser-safe; CSV handled via FileReader)
- **Barcode generation:** bwip-js (client-side UPC-A canvas rendering)
- **PDF generation:** jsPDF (canvas → PDF, 4×6in)
- **No backend** — everything runs in the browser

## Folder Structure
```
src/
  components/      # UI components — one folder per component (PascalCase)
  features/        # Feature modules (spreadsheet, images, export) — own store slices
  hooks/           # Custom React hooks (use-prefixed)
  store/           # Zustand store (useStickerStore.ts)
  types/           # Shared TypeScript types (index.ts)
  utils/           # Pure utility functions (camelCase filenames)
```

## Naming Conventions
- **Files:** kebab-case (`sticker-row.ts`, `parse-spreadsheet.ts`)
- **React components:** PascalCase (`DataTable.tsx`, `SpreadsheetImporter.tsx`)
- **Functions/variables:** camelCase
- **Types/interfaces:** PascalCase with descriptive names (`StickerRow`, `ColumnMap`)
- **Constants:** UPPER_SNAKE_CASE

## Code Style
- TypeScript strict mode — no implicit `any`; use explicit types on all function signatures
- Prefer named exports over default exports for utilities and types
- Default exports only for React components
- No inline styles — use Tailwind utility classes exclusively
- Keep components focused: extract logic to hooks or utils when a component exceeds ~80 lines
- Prefer `const` arrow functions for utilities; use `function` keyword for React components and hooks
- Always handle loading, error, and empty states in UI components

## Commit Message Convention
Format: `type(scope): short description`

Types: `feat`, `fix`, `refactor`, `style`, `chore`, `docs`, `test`
Scopes: `spreadsheet`, `images`, `export`, `ui`, `store`, `types`, `config`

Examples:
- `feat(spreadsheet): parse Art Name, Size, UPC from xlsx`
- `feat(export): generate 4x6 PDF sticker with UPC-A barcode`
- `fix(images): fuzzy match filenames to art names case-insensitively`
- `style(ui): improve table row hover and selection states`

After completing any set of changes, always draft a commit message for the user to review.
