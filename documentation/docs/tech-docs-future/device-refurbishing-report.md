---
title: Device Refurbishing Report (By Technician, Model, Type)
---

# Device Refurbishing Report (By Technician, Model, Type)

A simple report to see accountability of repaired devices: who did the work, on what models, and what repair types, in a date range.

## Scope

- New "Reports" menu section with a page: "Device Refurbishing Report".
- Summary cards (totals): Devices repaired, Jobs completed, Date range shown.
- Tables/Charts:
  - By Technician: counts
  - By Model/Brand: counts
  - By Repair Type: counts

## Filters

- Date range (required)
- Technician(s)
- Brand/Model
- Repair Type

## Assumptions (please approve)

- Counting method: We’ll count completed repair jobs (not unique devices). Rationale: one device may have multiple different repairs by different technicians; jobs better reflect effort.
- “Device repaired by technician” means the technician completed at least one repair job on that device within the range.
- No CSV export in v1; on-screen view only.
- Role access: Admin, General Manager, Operations Manager.

## Edge Cases

- A device can appear under multiple technicians if different jobs were done by different people (expected when counting jobs).
- If a job is completed outside the filter range, it won’t count (even if started earlier).
- Cancelled/pending jobs are excluded.

## Open Questions

1) Count unique devices per technician instead of (or in addition to) jobs? If yes, we’ll add both metrics: Devices and Jobs.
2) Drill-down links from rows to the underlying jobs/devices?
3) Restrict technicians to view only their own numbers?

## Visual examples

Summary cards (top of page)

- Devices repaired: 128
- Jobs completed: 162
- Date range: 01–15 Feb 2025

By Technician (counts)

| Technician | Jobs | Devices |
|---|---:|---:|
| Ahmed Khan (L2) | 58 | 51 |
| Sara Ali (L3) | 66 | 59 |
| John Doe (L1) | 38 | 33 |

By Model/Brand (counts)

| Brand | Model | Jobs |
|---|---|---:|
| Apple | iPhone 12 | 45 |
| Apple | iPhone 13 | 33 |
| Samsung | S21 | 24 |

By Repair Type (counts)

| Repair Type | Jobs |
|---|---:|
| Glass Change | 64 |
| Battery Change | 52 |
| Housing Change | 31 |
| Software Update | 15 |


