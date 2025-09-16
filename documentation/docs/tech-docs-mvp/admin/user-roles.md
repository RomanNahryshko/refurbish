---
title: User Roles & Permissions
---

# User Roles & Permissions

This document outlines the user roles and their corresponding permissions within the ReMobile Refurbish system for the MVP.

### General Manager
- Provides input on key metrics (housing, battery, glass changes)
- Tracks bulk inventory of parts (batteries, housing)
- Full system access for reporting and analytics

### Operations Manager
**Intake & Triage:**
- Inputs data for all newly received phones
- Performs initial quality control (manual + Dr. Phone software)
- Records IMEI and initial QC results
**Workflow Management:**
- Decides necessary actions for phones that fail QA
- Assigns tasks to Technicians and Quality Control
- Can reassign repairs between technicians
**Quality Control:**
- Can perform Final QC and assign grades

### Quality Control (QC)
- Conducts post-repair quality control
- Performs manual visual inspection and touchscreen checks
- Runs software-based diagnostics
- Determines and assigns final grades (Ungraded, A, B, C)
- Makes pass/fail decisions based on manual assessment

### Technicians
**L1 Technician**: Housing change only
**L2 Technician**: Glass change only
**L3 Technician**: Battery and all other repairs only
- Perform physical repairs on devices
- Pick available repairs from queue (no direct assignment)
- Log and track repair completion
- **Cannot perform repairs outside their level** 