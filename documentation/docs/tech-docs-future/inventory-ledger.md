---
title: Inventory Ledger (Per Part)
---

# Inventory Ledger (Per Part)

A clear, per-part history of stock movements with filters. Accessible from the Inventory list via a "View Ledger" button per spare part.

## Scope

- Button "View Ledger" on each part in Inventory opens that part’s ledger.
- Two tabs in the ledger view:
  - Parts Used (from repair jobs)
  - Stock Adjustments (Add/Remove/Correction)

## Columns (per tab)

- Date/Time
- Quantity (show + / - depending on movement)
- Reference:
  - Parts Used: Repair Job ID and Device Internal ID
  - Stock Adjustments: Adjustment Type (Add/Remove/Correction)
- Performed By (who used the part or applied the adjustment)
- Running Balance (for that part)

Note: No Notes column (not required).

## Filters

- Date range
- Technician (for Parts Used)
- Transaction type (for Adjustments)

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
2) Should we still show a "Stock Adjustments" tab here if we already have a dedicated stock adjustment popup/modal in Inventory? Or should the ledger focus only on Parts Used history, with a link to the existing adjustment UI?

## Visual examples

Main Inventory table (/inventory)

| SKU | Name | Category | Stock Level | Unit Cost | Supplier | Compatible Models | Actions |
|---|---|---|---:|---:|---|---|---|
| BAT-IPH12 | Battery – iPhone 12 | Battery | 42 | $12.50 | PartsCo | iPhone 12 | [View Ledger] [Adjust Stock] |
| SCR-IPH13 | Screen – iPhone 13 | Screen | 18 | $69.00 | GlassPro | iPhone 13 | [View Ledger] [Adjust Stock] |

Clicking [View Ledger] opens the per-part ledger page.

Parts Used (tab)

| Date/Time | Device ID | Technician | Qty (−) | Balance |
|---|---|---|---:|---:|
| 2025-02-12 10:14 | 00123456 | Ahmed Khan | −1 | 42 |
| 2025-02-12 09:02 | 00123390 | Sara Ali | −2 | 43 |

Stock Adjustments (tab)

| Date/Time | Type | Qty (+/−) | Performed By | Reason/Reference (if any) | Balance |
|---|---|---:|---|---|---:|
| 2025-02-11 16:30 | Add | +20 | Ops Manager | Invoice #12345 | 45 |
| 2025-02-10 11:05 | Correction | +1 | Ops Manager | Count correction | 25 |


