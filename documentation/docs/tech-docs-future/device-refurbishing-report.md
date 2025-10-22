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

- Do you prefer counting unique devices per technician instead (instead of jobs)? If yes, we’ll deduplicate devices and add both metrics: Devices and Jobs.
- Do you want drill-down links (click a row to see underlying jobs/devices)?
- Any need to restrict technicians to see only their own numbers?


