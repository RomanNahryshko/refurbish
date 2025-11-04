---
title: Inventory Ledger (Per Part)
---

# Inventory Ledger (Per Part)

A clear, per-part history of stock movements with filters. Accessible from the Inventory list via a "View Ledger" button per spare part.

## Page header (context)

- Title: Item Ledger
- Part label: e.g., Battery – iPhone 12 (SKU)
- Period: All time by default. If a date range is selected via filters, show "From <start date> to <end date>".
- Opening Balance at period start (computed) — shown only when a date range is applied.

## Scope

- Button "View Ledger" on each part in Inventory opens that part’s ledger.
- Single combined table showing both Parts Used and Stock Adjustments in chronological order (no tabs).

## Columns

- Date/Time
- Ref (e.g., Purchase Inv, Batch# 0001)
- Technician / Performed By
- Device ID (hyperlink to device page)
- Devices (Brand + Model + Storage + Color)
- Qty+ (incoming)
- Qty− (used)
- Balance (running)

Note: No Notes column (not required).

## Filters

- Date range (optional; if omitted, show All time)
- Technician (applies to Used rows)
- Transaction type (Used/Add/Remove/Correction)
- Batch (optional)

## Assumptions (please confirm)

- Running Balance is calculated for the selected part within the chosen date range view (we’ll compute sequentially by date/time).
- Timezone for dates: local warehouse time.
- No CSV export in v1.

## Edge Cases

- Negative stock prevention remains unchanged (ledger is read-only).
- If a repair is cancelled after parts were recorded, the ledger will still show the prior usage (since stock already moved).
- Corrections (Adjustment type) appear as-is with positive or exact-set quantities depending on how we store them.

## Open Questions

None for v1.

## Visual examples

Main Inventory table (/inventory)

| SKU | Name | Category | Stock Level | Unit Cost | Supplier | Compatible Models | Actions |
|---|---|---|---:|---:|---|---|---|
| BAT-IPH12 | Battery – iPhone 12 | Battery | 42 | $12.50 | PartsCo | iPhone 12 | [View Ledger] [Adjust Stock] |
| SCR-IPH13 | Screen – iPhone 13 | Screen | 18 | $69.00 | GlassPro | iPhone 13 | [View Ledger] [Adjust Stock] |

Clicking [View Ledger] opens the per-part ledger page.

Ledger

Header (context): Item Ledger • Battery – iPhone 12 • 01–10 Oct 2025
Note: Example shows a filtered date range. By default (no filter), header reads "All time" and the Opening Balance row is omitted.

| Date/Time | Ref | Technician / Performed By | Device ID | Devices | Qty+ | Qty− | Balance |
|---|---|---|---|---|---:|---:|---:|
| 2025-10-01 09:00 | Purchase Inv | Ops Manager |  |  | 100 |  | 100 |
| 2025-10-02 10:05 | Batch# 0001 | Ahmed Khan | 00123456 (link) | iPhone 12 128GB Red |  | 1 | 99 |
| 2025-10-02 13:20 | Batch# 0001 | Sara Ali | 0023456 (link) | iPhone 12 64GB Black |  | 1 | 98 |
| 2025-10-03 11:18 | Batch# 0002 | Ali | 14142564 (link) | iPhone 12 256GB Green |  | 1 | 97 |
| … | … | … | … | … | … | … | … |

Closing Balance row (fixed at bottom of the table):

|  |  |  |  | Closing Balance | 100 | 7 | 93 |


