# SMRC Race for Gold — User Manual

## Overview

The SMRC Race for Gold (RFG) website tracks a running club competition where members earn points by racing throughout the year. Points are awarded based on race distance and performance — personal records (PRs) earn the most, followed by age-graded PRs, first-time distances, and participation.

**Live site:** https://smrc-rfg.vercel.app

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Site Password](#site-password)
3. [Leaderboard](#leaderboard)
4. [Submit a Race](#submit-a-race)
5. [Runners Directory](#runners-directory)
6. [Runner Detail Page](#runner-detail-page)
7. [2025 Results (Hall of Fame)](#2025-results)
8. [Admin Dashboard](#admin-dashboard)
9. [Scoring System](#scoring-system)
10. [Age-Graded PR Targets](#age-graded-pr-targets)
11. [Technical Details](#technical-details)

---

## Getting Started

Navigate to the site URL. You'll be prompted for a **site password** to access the site. Once entered, you'll stay logged in for 30 days.

The navigation bar at the top provides access to all sections:

- **Leaderboard** — Current season standings
- **Submit Race** — Submit a race result for review
- **Runners** — Browse all runners and their profiles
- **2025 Results** — Previous year's champions
- **Admin** — Administrative dashboard (requires separate admin password)

On mobile devices, the navigation collapses into a hamburger menu (three horizontal lines) in the top-right corner.

---

## Site Password

The site is password-protected to keep it private to club members. Enter the site password on the login screen to access all public pages. The login session lasts 30 days before you'll need to re-enter it.

---

## Leaderboard

The leaderboard shows the current season's standings, ranked by total points.

**Desktop view:**
- A full table showing each runner's rank, name, individual race scores, total points, and efficiency rating
- Race scores are color-coded:
  - **Gold badges** — 12+ points (PR-level performances)
  - **Blue badges** — 6-11 points (AG PR or first-time distances)
  - **Gray badges** — 1-4 points (participation)
- Click any runner's name to view their full profile

**Mobile view:**
- A card layout showing rank, name, total points, race count, and efficiency
- Individual race score badges shown below each card
- Tap a card to view the runner's profile

**Efficiency** is an informational metric calculated as total points divided by number of races. It does not affect standings.

---

## Submit a Race

Any club member can submit a race result. Submissions go into a review queue and must be approved by an admin before appearing on the leaderboard.

### How to Submit

1. Navigate to **Submit Race**
2. Select your name from the **Runner** dropdown (sorted by last name)
3. Enter the **Race Name** (e.g., "Flying Pig Marathon")
4. Select the **Race Date** (cannot be a future date)
5. Select the **Distance** from the dropdown:
   - 5k, 4 mile, 5 mile, 10k, 8 mile, 15k, 10 mile, Half Marathon, Full Marathon, 50k, 50 Mile, 100 Mile
6. Enter your **Finish Time** in hours, minutes, and seconds
7. Click **Submit Race Result**

You'll see a confirmation message. The submission is now pending admin review.

### What Happens Next

- A notification is sent to the admin team via Discord
- An admin will review and approve or reject the submission
- Once approved, the system automatically calculates your points based on the scoring rules
- Your result appears on the leaderboard and your runner profile

---

## Runners Directory

The **Runners** page shows all registered runners as cards, sorted by last name. Each card displays the runner's name in **Last, First (Nickname)** format and their current age.

Click any card to view that runner's full profile.

---

## Runner Detail Page

Each runner has a detail page showing:

### Runner Info
- Full name and nickname
- Current age (calculated dynamically from birthday)
- Date of birth

### 2026 Race History
A table of all approved races for the current season, showing:
- Race number (chronological order)
- Race name, date, and distance
- Finish time
- Points earned
- Points type (PR, AG PR, 1st Time, Participation)
- Total points at the bottom

### Personal Records & Targets
A table showing PR data for each distance the runner has raced:
- **PR** — All-time personal record for that distance
- **AG PR** — Best age-graded performance time
- **AG PR Date** — When the AG PR was set
- **Age @ Race** — Runner's age when the AG PR was achieved
- **Factor @ Race** — Age-grading factor at the time
- **AG Time** — The age-graded equivalent time (locked from best performance)
- **Today's Factor** — Current age-grading factor (changes on birthday)
- **Target** — The time to beat for an age-graded PR at current age

### Distances Not Yet Raced
Lists any standard distances the runner hasn't competed in yet. Racing a new distance earns first-time distance points.

---

## 2025 Results

A commemorative page honoring the top three finishers from the previous season:

- **Gold** — 1st place
- **Silver** — 2nd place
- **Bronze** — 3rd place

Also includes season highlights and aggregate statistics (total PRs, AG PRs, participation races, and total race count for the year).

---

## Admin Dashboard

The admin dashboard requires a separate admin password. It is divided into five sections, accessible via tabs:

### Pending Submissions

Review race submissions from club members.

- Each submission shows the runner name, race name, date, distance, finish time, and submission date
- **Approve** — Calculates points automatically and adds the result to the leaderboard
- **Reject** — Removes the submission from the queue

Points are calculated automatically based on:
1. Is it faster than the runner's PR? → PR points
2. Is it faster than the runner's age-graded target? → AG PR points
3. Is it a first-time distance? → First-time distance points
4. Otherwise → Participation points

### Approved Results

View and manage all approved race results for the current season.

- Results are sorted by race date (oldest first)
- Each row shows runner name (linked to profile), race details, points, type, and submission date
- **Edit** — Modify race name, date, distance, or finish time. Points and type are automatically recalculated when time or distance changes. The system checks if the edit affects PR/AG PR classification.
- **Delete** — Remove a result. If the deleted result was a PR or AG PR, the runner's data is automatically restored to its previous state. A confirmation dialog prevents accidental deletion.

### Manage Runners

View, edit, and delete runner records.

**Current Runners table:**
- Shows all runners with name (linked to profile), birthday, age, and race count
- **Edit** — Opens a full edit form below the table with:
  - Nickname, full name, birthday
  - Complete PR data for all 12 distances (PR time, AG PR time, AG PR date, age at race, factor, AG time, today's factor, target)
  - After saving, all of the runner's race results are automatically rescored if PR data changes affected scoring
- **Delete** — Removes the runner. Blocked if the runner has approved race results (delete those first)

### Add Runner

Add a new runner to the system with a full form:
- **Nickname** (required, must be unique)
- **Full Name** (required)
- **Birthday** (optional — used for age calculation and age-grading)
- **PR data** for all 12 distances — leave blank for unraced distances. Times can be entered in H:MM:SS or MM:SS format.

### Upload Data

Upload an SMRC Excel spreadsheet for data import. The system reads the file and displays a summary of sheets and row counts.

---

## Scoring System

Points are awarded per race. **No stacking** — a runner receives only the highest applicable score for each race.

### Actual PR Points
Awarded when the finish time beats the runner's all-time personal record for that distance.

| Distance | Points |
|----------|--------|
| 5k / 4 mile | 8 |
| 5 mile / 10k | 9 |
| 8 mile / 15k | 11 |
| 10 mile | 12 |
| Half Marathon | 13 |
| Full Marathon | 16 |
| 50k | 17 |
| 50 Mile | 18 |
| 100 Mile | 19 |

### AG PR / First-Time Distance Points
Awarded when the finish time beats the runner's age-graded target, OR when racing a distance for the first time.

| Distance | Points |
|----------|--------|
| 5k / 4 mile | 6 |
| 5 mile / 10k | 7 |
| 8 mile / 15k | 8 |
| 10 mile | 9 |
| Half Marathon | 10 |
| Full Marathon | 12 |
| 50k | 13 |
| 50 Mile | 14 |
| 100 Mile | 15 |

### Participation Points
Awarded for completing a race without setting a PR or AG PR.

| Distance Category | Points |
|-------------------|--------|
| Up to 5 mile (5k, 4 mile, 5 mile) | 1 |
| Up to 8 mile (10k, 8 mile) | 2 |
| Up to Half Marathon (15k, 10 mile, Half Marathon) | 3 |
| Marathon & beyond (Full Marathon, 50k, 50 Mile, 100 Mile) | 4 |

---

## Age-Graded PR Targets

The age-grading system accounts for natural aging so that runners can continue to set meaningful PRs as they get older.

### How It Works

1. **AG Time** = finish time × age-grading factor at the age the race was run. This represents the runner's best age-adjusted performance and is locked in from the original data.

2. **Target** = AG Time ÷ current age-grading factor. This is the finish time needed TODAY to match the runner's best age-adjusted performance.

3. The **target automatically adjusts** when a runner's age changes (on their birthday). As the runner ages and their factor decreases, the target time gets slower (more generous).

### Key Rules
- A new actual PR does **not** change the AG time or target — those are anchored to the original best age-graded performance
- An AG PR (beating the target) does **not** change the target — it only records the achievement
- The target only changes when the runner's birthday passes and their age-grading factor updates
- Age-grading factors are based on WMA/USATF 2015 male road standards

### Example
If a runner set a 10K PR of 37:22 at age 45 (factor 0.9267):
- AG Time = 37:22 × 0.9267 = 34:37 (locked)
- At age 54 (factor 0.8594): Target = 34:37 ÷ 0.8594 = **40:17**
- At age 55 (factor 0.8572): Target = 34:37 ÷ 0.8572 = **40:23**

---

## Technical Details

### Notifications
When a race is submitted, a notification is automatically sent to the admin team via a Discord webhook.

### Data Integrity
- Deleting a race result that was a PR or AG PR automatically restores the runner's previous PR data
- Editing a race result automatically recalculates the scoring classification
- Editing a runner's PR data automatically rescores all of their race results
- Race submissions cannot have future dates

### Automated Tests
The application includes 23 automated API tests covering scoring accuracy, data integrity, authentication, and validation. Run with `npm test` (requires dev server running).

### Technology Stack
- **Frontend:** Next.js 16, React, TypeScript, Tailwind CSS, Poppins font
- **Database:** Turso (cloud SQLite)
- **Hosting:** Vercel
- **Notifications:** Discord webhooks
- **Testing:** Vitest

---

*SMRC © 2026*
*Run all the miles, drink all the beer.*
