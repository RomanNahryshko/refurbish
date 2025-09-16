---
title: Device Statuses
sidebar_position: 1
---

# Statuses Reference

This page explains what each status means.

## 4 device statuses:

- **Awaiting Repair**:
    - Phone just imported in a new batch
    - Initial QC is passed
- **In Repair***:
    - Initial QC found problems that need fixing
    - Phone is waiting for a technician to pick it up
    - Or repair in progress
- **Final QC**:
    - Repairs are done, phone needs quality control check
    - QC controller needs to test and grade it
- **Graded**:
    - Phone passed final QC and got a grade (A, B, or C)
    - Ready to sell to customers 

*Within **In Repair** there're 3 substatuses:
- **Pending** 
- **In Progress**
- **Completed**




## Special cases

Some phones skip steps:
- If initial QC finds no problems: **Received** → **Graded**
- If final QC fails: **Final QC** → **Awaiting Repair** (starts over)
