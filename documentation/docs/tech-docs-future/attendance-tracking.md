# Attendance & Time Tracking Module

## Problem

Staff need a simple way to track their work hours, and management needs visibility into attendance patterns, total hours worked, and correlation with productivity. Current system has no time tracking, making it difficult to manage payroll, overtime, and capacity planning.

:::info Key Requirement
Check-in/out must be **separate from login** - explicit actions that staff perform when arriving/leaving work, not tied to system authentication.
:::

## Implementation Approach

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="checkin" label="Check-In/Out Methods" default>

### Option A: PIN-Based Quick Check (Recommended)
Leverage the PIN system we're already implementing for quick login

**How it works:**
- Dedicated `/attendance` page with large Check In/Out buttons
- Staff enter their 8-digit PIN to check in or out
- System automatically determines action based on last status
- Works perfectly on shared terminals

**Benefits:**
- ✅ Uses existing PIN infrastructure
- ✅ Super fast for technicians (10 seconds max)
- ✅ Works on any device including mobile

### Option B: Mobile-Optimized Micro Page
Separate mobile-friendly URL for attendance only

**How it works:**
- Minimal page at `/checkin` with just PIN entry
- Auto-redirects after successful punch
- Can be bookmarked on phones
- No navigation, just attendance action

### Option C: Kiosk Mode
Dedicated always-open attendance terminal

**How it works:**
- Special kiosk page that stays logged in
- Staff select their name and enter PIN
- Visual confirmation of check-in/out
- Ideal for entrance/exit placement

</TabItem>
  <TabItem value="dashboard" label="Attendance Dashboard">

## Dashboard Design

### KPI Cards (Top Row)
- **Currently Present**: Real-time count of checked-in staff
- **Average Hours Today**: Running average of worked hours
- **Missing Punches**: Staff who forgot to check out yesterday

### Daily View Table
| Employee | Role | Check In | Check Out | Total Hours |
|----------|------|----------|-----------|-------------|
| Ahmed T. | Technician L2 | 09:05 | 18:30 | 9h 25m |
| Danish K. | QC Controller | 08:55 | — | 5h 10m (still in) |
| Sara M. | Technician L1 | 09:15 | 13:00 | 3h 45m |
| | | 14:00 | 18:00 | 4h 00m |

:::tip Multiple Shifts
Notice Sara's two entries - system supports multiple check-in/out cycles per day for breaks or split shifts.
:::

### Monthly Summary View
- Total working days per employee
- Total hours worked
- Average daily hours

</TabItem>
  <TabItem value="features" label="Additional Features">

## Management Features

### Manual Corrections
Managers can edit attendance records with a required reason for the change.

### My Attendance Page (For All Users)
Simple page showing:
- Today's check-in/out times
- Current week and month totals

### Slack Integration (Optional)

**Channel Notifications:**
Simple check-in/out messages posted to a dedicated channel:
- "Ahmed checked in at 09:05 AM"
- "Sara checked out at 06:30 PM"

**Slash Commands:**
- `/checkin` - Check in via Slack
- `/checkout` - Check out via Slack

</TabItem>
</Tabs>

:::caution Out of Scope
This module does **not** include: payroll calculations, leave/vacation tracking, biometric devices, or GPS tracking.
:::

:::info Future Opportunity
Once this module collects attendance data, it enables a **Workforce Planning Dashboard** that could answer the key business question: "How many technicians do I need to hire to refurbish X devices per month?"

By combining attendance hours with repair completion rates, the system could:
- Calculate current capacity (devices/day per technician)
- Predict staffing needs for target production volumes
- Show which technician levels (L1/L2/L3) to hire for optimal output

This isn't part of the initial module, but the attendance data makes this powerful planning tool possible.
:::
