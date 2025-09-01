# Multiple Device Selection for Technicians

## Problem

Currently, technicians can only claim one repair job at a time and must complete or cancel it before taking another job. In real workflow, technicians typically collect multiple devices (3-15 devices) in the morning and work on all of them throughout the day. 

:::caution Current Limitation
The one-job limitation forces technicians to repeatedly return to the shared computer to claim each new device, disrupting their workflow.
:::

:::info Implementation Note
Regardless of which approach we choose, we'll implement a **15-device maximum limit** per technician to prevent overloading and ensure quality control.
:::

## Implementation Options

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="simple" label="Simple Solutions" default>

### Option 1a: Remove Single Job Limitation (Quickest/Cheapest Implementation)
Simply allow technicians to claim additional jobs without completing current ones

:::tip Why This Works
No UI changes needed - just remove the restriction logic. Technicians can click "Start Repair" on multiple jobs consecutively.
:::

**Benefits:**
- ✅ Fastest and cheapest implementation option
- ✅ Solves the core workflow problem immediately
- ✅ Zero learning curve for technicians

### Option 1b: Batch Job Selection with Checkboxes
Allow technicians to select multiple pending repair jobs at once from the repair jobs list

**How it works:**
- Add checkboxes to the repair jobs table
- "Claim Selected Jobs" button to assign multiple jobs simultaneously
- All selected jobs move to "in_progress" status under the technician

**Benefits:**
- ✅ More efficient than clicking individual jobs
- ✅ Clear visual feedback of selected items
- ⚠️ Requires UI development time

</TabItem>
  <TabItem value="advanced" label="Advanced Solutions">

### Option 2: Device Basket System
Create a "device basket" where technicians can add devices before officially claiming them

Think of it like an online shopping cart, but for repair jobs. Technicians can:
- Browse and add devices to their basket
- Review basket contents before confirming
- Single "Start All Repairs" action to claim all devices in basket

### Option 3: Bulk Assignment Interface
Dedicated page for bulk device selection with enhanced filtering

**Features:**
- Filter devices by repair type, model, or complexity
- Visual device cards with quick selection
- Set daily capacity limit (max 15 devices per technician)

:::info Best For
Teams that want sophisticated filtering and capacity management
:::

### Option 4: Quick Claim Mode
Add a "Quick Claim" mode that automatically assigns the next available job after completing current one

**How it works:**
- Technician sets desired number of jobs (e.g., "claim 10 jobs")
- System automatically assigns jobs one by one as previous ones are completed
- Reduces trips to shared computer but maintains current single-job workflow

</TabItem>
</Tabs>

<details>
<summary>💡 Our Recommendation</summary>

**Start with Option 1a** - it's the quickest win that solves 80% of the problem with minimal effort. You can always add the checkbox interface (Option 1b) later if technicians want more convenience.

The advanced options are nice-to-have features, but the core issue is simply removing the artificial limitation that prevents multiple job assignments.

</details>
