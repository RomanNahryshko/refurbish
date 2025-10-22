---
title: Inventory Ledger (Per Part)
---

# Inventory Ledger (Per Part)

A clear, per-part history of stock movements with filters. Accessible from the Inventory list via a "View Ledger" button per spare part.

## Scope

- Button "View Ledger" on each part in Inventory opens that part’s ledger.
- Single combined table showing both Parts Used and Stock Adjustments in chronological order (no tabs).

## Columns

- Date/Time
- Type: Used | Add | Remove | Correction
- Device ID (for Used; empty for Adjustments)
- Quantity (show + / − depending on movement)
- Performed By
- Running Balance (for that part)

Note: No Notes column (not required).

## Filters

- Date range
- Technician (applies to Used rows)
- Transaction type (Used/Add/Remove/Correction)

## Assumptions (please confirm)

- Running Balance is calculated for the selected part within the chosen date range view (we’ll compute sequentially by date/time).
- Timezone for dates: local warehouse time.
- No CSV export in v1.

## Edge Cases

- Negative stock prevention remains unchanged (ledger is read-only).
- If a repair is cancelled after parts were recorded, the ledger will still show the prior usage (since stock already moved).
- Corrections (Adjustment type) appear as-is with positive or exact-set quantities depending on how we store them.

## Open Questions

1) Do we need a quick link from a ledger row to open the device page? (Nice-to-have)

## Visual examples

Main Inventory table (/inventory)

| SKU | Name | Category | Stock Level | Unit Cost | Supplier | Compatible Models | Actions |
|---|---|---|---:|---:|---|---|---|
| BAT-IPH12 | Battery – iPhone 12 | Battery | 42 | $12.50 | PartsCo | iPhone 12 | [View Ledger] [Adjust Stock] |
| SCR-IPH13 | Screen – iPhone 13 | Screen | 18 | $69.00 | GlassPro | iPhone 13 | [View Ledger] [Adjust Stock] |

Clicking [View Ledger] opens the per-part ledger page.

Ledger

| Date/Time | Type | Device ID | Technician/Performed By | Qty (+/−) | Balance |
|---|---|---|---|---:|---:|
| 2025-02-12 10:14 | Used | 00123456 (as link) | Ahmed Khan | −1 | 42 |
| 2025-02-12 09:02 | Used | 00123390 | Sara Ali | −2 | 43 |
| 2025-02-11 16:30 | Add |  | Ops Manager | +20 | 45 |
| 2025-02-10 11:05 | Correction |  | Ops Manager | +1 | 25 |


