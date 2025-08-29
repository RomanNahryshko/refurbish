# Quick Login System

## Problem

Technicians don't have personal computers at their workstations and need quick access to the system from shared office computers. Current email/password login is too slow for frequent switching between users throughout the workday.

This feature will be implemented for all users in the system, though it primarily addresses the workflow needs of technicians using shared terminals.

## Implementation Options

### Option 1: Dual-Mode Login
Same login page with two tabs: "Standard Login" and "Quick PIN"
- Technicians set up an 8-digit PIN during their first normal login
- For daily use, they just enter their PIN on a numeric keypad

### Option 2: Separate Quick Login Page
Dedicated /quick-login link that can be bookmarked on shared computer
- Simple interface showing only PIN entry with numeric keypad

### Option 3: Progressive PIN Option
After entering email, system detects if user has PIN set up
- Offers PIN entry instead of password for faster access

### Option 4: Keep Current System + Auto-Logout
No changes to login process (the cheapest implementation) - technicians use email/password as usual
- We just add automatic logout after 15 minutes of inactivity
- Simplest approach with minimal development work
