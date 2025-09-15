# User Manual Writing Instructions

## Your Task
Write content for each page of the ReMobile Refurbish User Manual, one page at a time. This manual helps new employees learn their job quickly.

## Before You Start 
1. **Read the database schema**: Check `schema.sql` to understand data structure
2. **Explore the codebase**: Look at `/src/app`, `/src/components`, `/src/modules` to see actual features
3. **Check existing tech docs**: Review `/documentation/docs/tech-docs-mvp` for system details



## Writing Style Rules
✅ **DO:**
- Write like you're talking to a friend
- Use simple, everyday English words
- Give real examples from the actual work
- Keep sentences short (15 words or less when possible)
- Use "you" to speak directly to the reader
- Add personal tips like "I find it easier to..."
- Use bullet points instead of long paragraphs

❌ **DON'T:**
- Use complicated words when simple ones work
- Write long, formal sentences
- Use technical jargon without explaining it
- Make it sound like a boring manual
- Use passive voice ("The button should be clicked" → "Click the button")

## Target Audience
Pakistani workers in Dubai who:
- May not be native English speakers
- Are learning a new job
- Need clear, practical instructions
- Want to get work done quickly

## Content Guidelines
Each page should have:
1. **What this page is about** (1-2 sentences)
2. **When you need this** (real situation)
3. **Steps to do it** (numbered, clear actions)
4. **What happens next** (what to expect)
5. **Common problems** (if any)

## Page Completion Checklist

### Getting Started
- [x] `welcome.md` - Brief intro to ReMobile system (3-4 sentences max) ✅ COMPLETED
- [x] `login.md` - Login URL, first-time password change ✅ COMPLETED
- [x] `navigation.md` - Main menu items explained simply ✅ COMPLETED
- [x] `finding-devices.md` - How to search by IMEI or Internal ID ✅ COMPLETED

### Operations Manager
- [x] `overview.md` - What ops managers can do ✅ COMPLETED
- [x] `batch-intake.md` - Complete batch intake process (Create → Import → Review → Print) ✅ COMPLETED
- [x] `repair-job-creation.md` - How repair jobs are created automatically ✅ UPDATED
- [x] `manage-repair-jobs.md` - Tracking and reassigning repair jobs ✅ UPDATED

### Quality Control
- [x] `overview.md` - QC role and responsibilities ✅ COMPLETED
- [x] `initial-qc.md` - Checking new devices ✅ COMPLETED
- [x] `final-qc.md` - Checking after repair ✅ COMPLETED
- [x] `grading.md` - How to assign grades (A, B, C) ✅ COMPLETED
- [x] `qc-checklist.md` - Complete checklist ✅ COMPLETED

### Technician
- [x] `overview.md` - Technician levels (L1/L2/L3) explained ✅ COMPLETED
- [x] `claim-repair-job.md` - Picking jobs from queue ✅ COMPLETED
- [x] `complete-repair.md` - Marking done, recording parts ✅ COMPLETED
- [x] `repair-types.md` - Quick guide to each repair type ✅ COMPLETED

### General Manager
- [x] `overview.md` - Manager capabilities ✅ COMPLETED
- [x] `dashboard.md` - Understanding the numbers ✅ COMPLETED
- [x] `manage-users.md` - Add/edit/remove employees ✅ COMPLETED
- [x] `inventory.md` - Check spare parts stock ✅ COMPLETED

### Quick Reference
- [x] `device-statuses.md` - What each status means ✅ COMPLETED
- [x] `glossary.md` - Common terms (IMEI, Internal ID, etc.) ✅ COMPLETED
- [x] `who-to-ask.md` - Contact list for help ✅ COMPLETED

## 🎉 ALL 27 PAGES COMPLETED! 
**Total Pages Written:** 27/27
**Status:** User Manual Complete and Ready for Use

## Example of Good Writing

**Bad:** "The user should navigate to the batch intake module and initiate the creation process by clicking the appropriate button."

**Good:** "Go to Batch Intake and click 'Create New Batch'. Easy!"

**Bad:** "Upon successful authentication, the system will redirect you to the dashboard interface."

**Good:** "After you log in, you'll see your dashboard."

## File Locations
All content goes in: `/documentation/docs/user-manual/[section]/[page].md`

## Remember
- Each page should take 2-3 minutes to read max
- Include screenshots where helpful (mark as [Screenshot: description])
- Test instructions by actually doing the task in the system
- If something is confusing in the code, make it simple in the manual

## Start Writing!
Pick a page from the checklist above, mark it as in-progress, write it, then mark it done. Keep going until all pages are complete.
