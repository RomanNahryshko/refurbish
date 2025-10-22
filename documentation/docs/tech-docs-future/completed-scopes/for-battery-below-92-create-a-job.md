---
title: For battery < 92%, create a job
---

# For battery < 92%, create a job

This document describes the business flow for using the Battery Health value from supplier Excel imports to automatically create Battery Change repair jobs.

## Source of Data

- The Excel (.xlsx) import includes a column named "Batteryhealth".
- The value is numeric (e.g., 88 or 92) for each device.

## Where It Appears

- Batch Intake → Import devices page only.
- For each imported device, show: "Battery Health: X%" on the device card during the import review.
- Not shown on the Devices list or Device detail page. The value is used solely to drive automatic job creation.

## Business Rules

- Threshold: 92% (stored as a variable in code for easy changes later).
- If Battery Health < 92%:
  - Mark the device as Battery change required (pre-selected repair).
  - The device follows the Repairs path (not just grading) for that import review.
  - When the user completes the import review for that device, the system automatically creates a Battery Change repair job and moves the device into the Repair Queue.
- If Battery Health ≥ 92%:
  - Nothing is auto-marked. The user may still manually select Battery Change if desired.
- If Battery Health is missing or invalid:
  - Show "Unknown" and do not auto-mark any repair.

## User Override

- When Battery Health < 92%, Battery Change is pre-selected but users may unselect it before completing the device review.

## Flow Summary

1. User uploads the Excel file in Batch Intake → Import devices.
2. For each row/device, the system reads the numeric "Batteryhealth" value.
3. The device card displays Battery Health.
4. If Battery Health < 92%: pre-select Battery Change and set the device to the Repairs path.
5. User can review/adjust selections (including removing Battery Change if they choose).
6. On completion for that device, if Battery Change remains selected, the system creates a Battery Change repair job and places the device in the Repair Queue.

## Out of Scope

- No display of Battery Health on the Devices list or Device detail page.

## Acceptance Criteria

- Battery Health is read from "Batteryhealth" for each imported device.
- Devices with Battery Health < 92% show a clear indicator that Battery Change is required and the repair is pre-selected.
- Users can remove the pre-selection before submitting.
- Submitting a device with Battery Change selected results in an automatic Battery Change repair job.
- Devices with Battery Health ≥ 92% are not auto-marked.
- Missing/invalid Battery Health shows "Unknown" and no auto-selection.


