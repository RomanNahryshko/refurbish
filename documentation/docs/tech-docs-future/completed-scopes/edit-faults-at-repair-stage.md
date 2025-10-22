---
title: Edit Faults at Repair Stage
---

# Edit Faults at Repair Stage

Allow authorized users to add/remove faults (repair tasks) for a device discovered later in the process, and automatically create or reconcile related repair jobs.

## Who Can Access (Roles)

- Super Admin, General Manager, Operations Manager.
- No access for Technicians or QC Controllers.

## Where This Action Lives

- Repair Jobs screen (Job Repair stage) as the primary entry point.
- Also accessible from the Device page, if available for that device status.

## What Can Be Edited

- Add new faults (repair types): Housing, Glass, Battery, Software, Other.
- Remove pending faults (i.e., cancel pending jobs). Completed jobs remain unchanged; in-progress jobs require confirmation before cancellation.
- When adding/removing faults - no notes/reason field.

## Business Flow (Assumptions)

1. Open the device from Repair Jobs (or Device page) and click "Edit Faults".
2. Select additional faults to add; optionally deselect pending faults to remove.
3. Submit changes:
   - For each newly added fault, the system creates a new pending repair job (not auto-assigned as usual).
   - For each removed fault:
     - If the related job is pending → cancel/remove totally (no preserving history, not needed).
     - If in_progress → ask for confirmation; on confirm - cancel/remove totally (no preserving history, not needed).
     - If completed → don't allow to edit/remove these.
4. Device status adjustments:
   - If any new jobs were created and device is in final_qc or graded, move device to awaiting_repair automatically.
5. Audit trail: QUESTION: shall we record who changed what and when? (requires additional development time)

## Constraints & Rules

- Duplicate prevention: if a job of the same repair type already exists and is pending/in_progress, do not create a duplicate; prompt the user. 

---
---
---

## Technical details (no need to approve/read this)
- Permissions: enforced via existing permission checks (`repair_jobs:update` and `repair_jobs:create`) and role mapping.

### UI Cues

- Modal or side panel titled "Edit Faults" with the same repair type selector used in QC pages.
- Warnings when attempting to remove in-progress jobs or when duplicates exist.
- Success toast summarizing: "Added X, removed Y".

### Acceptance Criteria

- Only Super Admin, GM, and Ops Manager can access Edit Faults.
- Adding faults creates corresponding pending repair jobs (no duplicates).
- Removing faults cancels pending jobs; in-progress removals require confirmation; completed jobs unaffected.
- If new jobs are added and device was in final_qc/graded, device status changes to awaiting_repair.
- Reason/notes is required and stored with an audit record.
- All changes are visible in device history.


