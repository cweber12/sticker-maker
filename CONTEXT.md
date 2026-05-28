# Sticker Labeling Context

Defines canonical domain language for sticker generation so UI labels, spreadsheet values, and export behavior use the same terms.

## Language

**Diamond Art**:
A sticker product category identified from the Size field when it contains diamond art or diamond painting text variants.
_Avoid_: Diamond Painting

**Diamond Art mark mode**:
A single global setting that chooses barcode or diamond logo for all Diamond Art sticker rows.
_Avoid_: per-row override

**Logo fallback**:
If the diamond logo asset cannot be loaded, Diamond Art rows fall back to barcode rendering and report a non-blocking warning.
_Avoid_: hard export failure

## Relationships

- A **Sticker Row** can be classified as **Diamond Art** based on the **Size** value.
- **Diamond Art mark mode** applies to every **Diamond Art** row in an export.
- Non-**Diamond Art** rows always render a barcode in the right label region.
- **Logo fallback** can override logo mode at render time for affected rows only.

## Example dialogue

> **Dev:** "Should this row use the diamond logo mode?"
> **Domain expert:** "Only when the row is **Diamond Art**; otherwise use normal barcode behavior."

## Flagged ambiguities

- "Diamond Painting" and **Diamond Art** were both used for the same concept; resolved canonical term: **Diamond Art**.
