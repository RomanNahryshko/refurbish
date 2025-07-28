---
title: Label Generation
---

# Label Generation

After batch import and repair tasks creation/edits, the system allows users to generate and print physical labels for device identification.

## Label Structure:

- **Internal ID**: System-generated unique identifier (numbers only, 8 digits). Example: 0002341
- **IMEI**: 15-digit unique device identifier
- **Model Number**: Device model (e.g., iPhone 12, Samsung Galaxy S21)
- **Serial Number**: Device serial number

## Process Flow

1. Complete Dr. Phone data import
2. Review and modify  (repair tasks) as needed
3. Generate labels for devices in the batch
4. Print individual labels.

## Key Features

- **Label Purpose**: Physical identification only - status and details viewed in system
- **Permanent Identifiers**: Labels are not reprinted when device status changes (just no need)


## Technical Requirements

- **Label Printer**: Hassib shall we suggest printer models? Maybe you'll use some existing printers? Maybe such labels shall be sticky? etc.. - let's discuss this part.
- **Label Format**: Standard adhesive labels suitable for device attachment - Hassib please approve this assumption?
- **Print Trigger**: Manual action (button) by user close to each device.

## MVP Limitations

- No bulk label printing - MVP supports printing one label at a time only
- No barcode/QR code generation, abels contain text information only (no need QR code for now)
- No automatic reprinting on status changes (no need)
- Labels cannot be customized or edited in software