---
title: Device Statuses
sidebar_position: 1
---

# Device Status Reference

This page explains what each device status means and what happens next.

## The 5 device statuses

**Received** 
- Phone just arrived in a new batch
- Operations manager needs to do initial QC
- Next step: Initial quality control

**Awaiting Repair**
- Initial QC found problems that need fixing
- Phone is waiting for a technician to pick it up
- Next step: Technician claims repair job

**In Repair**
- A technician is currently working on this phone
- Don't disturb the phone - someone is fixing it!
- Next step: Technician completes repair

**Final QC**
- Repairs are done, phone needs quality control check
- QC controller needs to test and grade it
- Next step: QC controller passes or fails it

**Graded**
- Phone passed final QC and got a grade (A, B, or C)
- Ready to sell to customers
- Next step: Goes to inventory/shipping

## Status flow

Every phone follows this path:
**Received** → **Awaiting Repair** → **In Repair** → **Final QC** → **Graded**

:::note Screenshot placeholder
Simple flow diagram of statuses (left to right) matching the text.
:::

## Special cases

Some phones skip steps:
- If initial QC finds no problems: **Received** → **Graded**
- If final QC fails: **Final QC** → **Awaiting Repair** (starts over)

## What each status means for you

**Operations Managers:** Focus on "Received" phones
**Technicians:** Look for "Awaiting Repair" phones  
**QC Controllers:** Work on "Final QC" phones
**General Managers:** Track how phones move through all statuses
