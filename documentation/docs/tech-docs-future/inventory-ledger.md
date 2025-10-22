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

## Open Questions (if any)

- Do we need a quick link from a ledger row to open the repair job or device page? (Nice-to-have)


