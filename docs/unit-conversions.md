# Unit Conversion Reference

All canvas rendering targets **300 DPI**. The canvas pixel (`px`) is the single source of truth.  
PDF export uses jsPDF with `unit: 'in'`, so canvas pixels are converted to inches before writing.

---

## Base Conversion Rates

| From → To         | Formula                   | Example (1 px)      |
|-------------------|---------------------------|---------------------|
| `px` → inches     | `px ÷ 300`                | `1 px = 0.00333 in` |
| `px` → mm         | `px × 25.4 ÷ 300`         | `1 px = 0.0847 mm`  |
| `px` → PDF pt     | `px × 72 ÷ 300`           | `1 px = 0.24 pt`    |
| inches → `px`     | `in × 300`                | `1 in = 300 px`     |
| mm → `px`         | `mm × 300 ÷ 25.4`         | `1 mm = 11.81 px`   |
| PDF pt → `px`     | `pt × 300 ÷ 72`           | `1 pt = 4.17 px`    |

> **Design-unit scale factor:** Several constants in `render-sticker.ts` carry a comment like
> `"N units × 3.82 scale"`. One design unit ≈ 3.82 canvas px ≈ 0.0127 in ≈ 0.323 mm.  
> The scale is an internal authoring convenience; the canvas-px value is what is rendered.

---

## Sticker Dimensions

| Constant     | Canvas px | Inches | mm     | PDF pt |
|--------------|-----------|--------|--------|--------|
| `STICKER_W`  | 1 200     | 4.000  | 101.60 | 288.0  |
| `STICKER_H`  | 1 800     | 6.000  | 152.40 | 432.0  |

jsPDF page is created as `[STICKER_W_IN, STICKER_H_IN]` = `[4, 6]` inches.  
The full canvas image is placed at origin `(0, 0)` filling the entire page.

---

## Layout Constants (`render-sticker.ts`)

| Constant         | Canvas px | Design units | Inches | mm    | PDF pt |
|------------------|-----------|--------------|--------|-------|--------|
| `LABEL_INSET`    | 46        | ≈ 12 u       | 0.153  | 3.89  | 11.0   |
| `LABEL_H`        | 171       | ≈ 45 u       | 0.570  | 14.48 | 41.0   |
| `LABEL_PAD`      | 38        | ≈ 10 u       | 0.127  | 3.22  | 9.1    |
| `TEXT_AREA_W`    | 650       | ≈ 170 u      | 2.167  | 55.04 | 156.0  |
| `BARCODE_ZONE_W` | 382       | = 100 u      | 1.273  | 32.33 | 91.7   |

- `LABEL_INSET` — gap between the floating white strip and all four sticker edges
- `LABEL_H` — height of the floating white info strip
- `LABEL_PAD` — inner horizontal padding inside the strip
- `TEXT_AREA_W` — max width reserved for Art Name + Size text (left side of strip)
- `BARCODE_ZONE_W` — width reserved for the UPC-A barcode (right side of strip; always held even when barcode is absent)

### Derived layout values

| Value          | Canvas px | Inches | mm     |
|----------------|-----------|--------|--------|
| Label X        | 46        | 0.153  | 3.89   |
| Label Y        | 1 583     | 5.277  | 134.05 |
| Label width    | 1 108     | 3.693  | 93.82  |
| Text X         | 84        | 0.280  | 7.11   |
| Barcode zone X | 688       | 2.293  | 58.27  |

- Label Y = `STICKER_H − LABEL_INSET − LABEL_H` (1800 − 46 − 171)
- Label width = `STICKER_W − 2 × LABEL_INSET` (1200 − 92)
- Text X = `labelX + LABEL_PAD` (46 + 38)
- Barcode zone X = `labelX + labelW − LABEL_PAD − BARCODE_ZONE_W` (46 + 1108 − 38 − 382)

---

## Typography

### Font sizes

| Text element  | Canvas px | PDF pt  | Inches | mm   |
|---------------|-----------|---------|--------|------|
| Art Name      | 60        | 14.4    | 0.200  | 5.08 |
| Size          | 38        | 9.1     | 0.127  | 3.22 |
| Min (floor)   | 10        | 2.4     | 0.033  | 0.85 |

- Art Name and Size shrink 1 px at a time via `fitFontSize` until text fits within `TEXT_AREA_W`
- Rendering stops shrinking at 10 px (floor)

### Text Y baseline (from canvas top)

| Text element | Canvas px | Inches | mm     |
|--------------|-----------|--------|--------|
| Art Name Y   | 1 683     | 5.610  | 142.45 |
| Size Y       | 1 748     | 5.827  | 148.05 |

- Art Name Y = `labelY + 100` (1583 + 100)
- Size Y = `labelY + 165` (1583 + 165)

### Letter spacing

| Text element | Canvas px | Inches | mm   |
|--------------|-----------|--------|------|
| Art Name     | 12        | 0.040  | 1.02 |
| Size         | 1         | 0.003  | 0.08 |

---

## Barcode (bwip-js UPC-A)

| bwip-js param | Value  |
|---------------|--------|
| `bcid`        | `upca` |
| `scale`       | `4`    |
| `height`      | `18`   |
| `includetext` | `true` |

- `scale: 4` — 4 px per module in the generated offscreen canvas
- `height: 18` — bar height in bwip-js native mm (≈ 213 canvas px at equivalent DPI)
- The barcode canvas is drawn into the sticker scaled to `BARCODE_ZONE_W` and vertically centred in `LABEL_H`

### Barcode sizing in the sticker canvas

| Dimension    | Canvas px | Inches | mm    |
|--------------|-----------|--------|-------|
| Drawn width  | 382       | 1.273  | 32.33 |
| Drawn height | ≈ 290     | 0.967  | 24.56 |

- Drawn width = `BARCODE_ZONE_W` (fixed)
- Drawn height is proportional: `barcodeCanvas.height / barcodeCanvas.width × 382`
- At `scale: 4`, bwip-js produces ≈ 380 × 290 px (95 modules wide)

---

## PDF Export Summary

| Property          | Value                           |
|-------------------|---------------------------------|
| Library           | jsPDF                           |
| Orientation       | portrait                        |
| Unit              | inches (`'in'`)                 |
| Page format       | `[4, 6]` in = `[1200, 1800]` px |
| Image format      | JPEG                            |
| JPEG quality      | 0.95                            |
| Image placement   | `(x=0, y=0, w=4in, h=6in)`     |
| DPI embedded      | 300 (pixels ÷ page size)        |
