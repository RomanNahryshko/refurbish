---
sidebar_position: 4
title: Failed Device & Scrap Management
---

# Failed Device & Scrap Management

:::danger[HIGH PRIORITY]
Critical for handling non-repairable devices
:::

## Overview
Implement comprehensive handling for devices that fail QC or are deemed irrepairable.

## Key Requirements

### Failed QC Handling
- Define workflow for phones that fail initial QC but aren't worth repairing
- Set thresholds for repair cost vs. device value decisions
- Create status tracking for "Not Worth Repairing" devices

### Irreparable Device Management
- Implement "Scrap" or "Parts Phone" status in the system
- Track devices that have failed multiple repair attempts
- Define maximum repair attempt limits before scrapping
- Create workflow for harvesting usable parts from scrapped devices

## Business Rules
- How many times can a phone fail final QC before it's scrapped?
- What approval process is needed for scrapping decisions?
- How to track salvaged parts from scrapped devices?
- Disposal/recycling workflow for completely unusable devices

## Implementation Considerations
- New device statuses: "Scrap", "Parts Only", "Pending Disposal"
- Scrap reason tracking and reporting
- Integration with inventory for salvaged parts
- Compliance with e-waste regulations