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

- Metrics:
  - Devices: count unique devices that passed Final QC in the selected date range.
  - Jobs: count completed repair jobs in the selected date range.
- “Device repaired by technician” means the technician completed at least one repair job on that device (devices counted only if they subsequently passed Final QC in-range).
- Exports: PDF report (download button). CSV not required.
- Role access: Admin, General Manager, Operations Manager (not visible to Technicians).

## Edge Cases

- A device can appear under multiple technicians if different jobs were done by different people (expected when counting jobs).
- If a job is completed outside the filter range, it won’t count (even if started earlier).
- Cancelled/pending jobs are excluded.

## Decisions 

1) Devices metric: Yes — include unique devices (Final QC pass). Show both Devices and Jobs.
2) Drill-down: OK — clicking a row opens a filtered list of underlying jobs/devices.
3) Technician restriction: Not applicable — report is hidden from Technicians.

## Visual examples

Filters UI

| Filter | Control | Example |
|---|---|---|
| Date Range | From/To date pickers | 2025-02-01 → 2025-02-15 |
| Technician(s) | Multi-select | Ahmed Khan, Sara Ali |
| Brand | Select | Apple |
| Model | Select (dependent on Brand) | iPhone 12 |
| Repair Type | Multi-select | Battery Change, Glass Change |
| Batch | Select | BATCH-2025-02-03-007 |

Summary cards (top row)

| Metric | Value |
|---|---:|
| Devices repaired | 128 (clickable) |
| Jobs completed | 162 (clickable) |
| Date range | 01–15 Feb 2025 |
| Actions | Download PDF |

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

By Batch (counts)

| Batch | Devices | Jobs |
|---|---:|---:|
| BATCH-2025-02-03-007 | 42 | 53 |
| BATCH-2025-02-01-004 | 36 | 45 |

Click actions (from Summary cards)

1) Devices repaired → Devices Detail (filter-respecting list)

| IMEI | Model | Color | Storage |
|---|---|---|---|
| 356789012345678 | iPhone 12 | Black | 64GB |
| 356789012345679 | iPhone 12 | Red | 128GB |

2) Jobs completed → Jobs Detail (filter-respecting list)

| Device ID | IMEI | Model | Repair Type | Technician | Completed At |
|---|---|---|---|---|---|
| 00012345 | 356789012345678 | iPhone 12 | Battery Change | Sara Ali | 2025-02-03 14:11 |
| 00012346 | 356789012345679 | iPhone 12 | Glass Change | Ahmed Khan | 2025-02-03 15:22 |


