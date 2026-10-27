# SMRC Site — User Manual

## Overview

The SMRC site is the club's private hub. It currently hosts two applications:

- **Race for Gold (RFG)** — a season-long points competition. Members earn points by racing; personal records (PRs) score highest, followed by age-graded PRs, first-time distances, and participation.
- **Attendance** — tracking for the Saturday club runs, with a season leaderboard, streaks, and year-over-year comparisons.

**Live site:** https://smrc-rfg.vercel.app

*Last updated: 2026-08-17 — documents the live site as of this date.*

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Site Password & Access](#site-password--access)
3. [Home Page](#home-page)

**Race for Gold**

4. [RFG Leaderboard](#rfg-leaderboard)
5. [Submit a Race](#submit-a-race)
6. [Runners Directory](#runners-directory)
7. [Runner Detail Page](#runner-detail-page)
8. [Race Recaps](#race-recaps)
9. [2025 Results (Hall of Fame)](#2025-results-hall-of-fame)
10. [RFG Admin](#rfg-admin)
11. [Scoring System](#scoring-system)
12. [Age-Graded PR Targets](#age-graded-pr-targets)

**Attendance**

13. [Attendance Leaderboard](#attendance-leaderboard)
14. [Attendance Runners](#attendance-runners)
15. [Attendance Admin](#attendance-admin)
16. [Timmy Year](#timmy-year)
17. [Name Mapping Between RFG and Attendance](#name-mapping-between-rfg-and-attendance)

**Reference**

18. [Analytics](#analytics)
19. [Technical Details](#technical-details)

---

## Getting Started

Navigate to the site URL. You'll be prompted for a **site password**. Once entered, you stay logged in for 30 days.

After logging in you land on the **SMRC home page**, a hub with two tiles:

- 🏅 **Race for Gold** — leaderboard, scores & results
- 📋 **2026 Attendance** — Saturday run tracking

Each application has its own navigation bar. On mobile the nav collapses into a hamburger menu (three horizontal lines) in the top-right corner.

**Race for Gold nav:** Home · Leaderboard · Submit Race · Runners · Recaps · 2025 Results · Admin

**Attendance nav:** Home · Leaderboard · Runners · Admin

---

## Site Password & Access

There are **three separate passwords**:

| Password | Unlocks |
|----------|---------|
| Site password | Everything public: home page, all RFG pages, all Attendance pages |
| RFG admin password | `/rfg/admin` and the RFG admin APIs |
| Attendance admin password | `/attendance/admin` and the attendance admin APIs |

The two admin passwords are independent — being signed in to RFG admin does **not** grant attendance admin, and vice versa.

Login sessions are stored in signed cookies (HMAC-SHA256), so a cookie value cannot be forged by hand. Login endpoints are rate limited to **5 attempts per 15 minutes per IP address**.

---

## Home Page

The landing page at `/` is a chooser between Race for Gold and Attendance. It sits behind the site password like everything else.

---

## RFG Leaderboard

The leaderboard at `/rfg` shows the current season's standings, ranked by total points.

**Desktop view:**
- Full table: rank, name, individual race scores, total points, and efficiency
- Race scores are color-coded:
  - **Gold badges** — 12+ points (PR-level performances)
  - **Blue badges** — 6-11 points (AG PR or first-time distances)
  - **Gray badges** — 1-4 points (participation)
- Click any runner's name to view their full profile

**Mobile view:**
- Card layout showing rank, name, total points, race count, and efficiency
- Individual race score badges below each card
- Tap a card to view the runner's profile

**Ranking and ties.** Runners are ordered by:

1. Total points (highest first)
2. **Race count** — if points are tied, more races ranks higher
3. Efficiency

Two runners share a rank only when points, race count, **and** efficiency all match; the next rank then skips (1, 1, 3).

**Efficiency** is an informational metric — total points divided by number of races. It does not affect standings beyond the final tiebreak.

**Hidden runners.** A runner flagged as hidden in the database is excluded from the leaderboard entirely. Runners with no approved results this season do not appear either.

---

## Submit a Race

Any club member can submit a race result. Submissions go into a review queue and must be approved by an RFG admin before appearing on the leaderboard.

### How to Submit

1. Navigate to **Submit Race**
2. Select your name from the **Runner** dropdown (sorted by last name)
3. Enter the **Race Name** (e.g., "Flying Pig Marathon")
4. Select the **Race Date** (cannot be a future date)
5. Select the **Distance**. The dropdown has two groups:
   - **Standard distances**, eligible for PR / AG PR scoring:
     5k, 4 mile, 5 mile, 10k, 8 mile, 15k, 10 mile, Half Marathon, Full Marathon, 50k, 50 Mile, 100 Mile
   - **Participation-only entries**, for races that do not map to a standard distance (trail races, relays, odd distances). These always score their listed point value and never touch PR data:
     - Participation up to 5 miles (1 pt)
     - Participation 5.01 - 8 miles (2 pts)
     - Participation 8.01 - 26.1 miles (3 pts)
     - Participation 26.3+ miles (4 pts)
6. Enter your **Finish Time** in hours, minutes, and seconds (must be greater than zero)
7. Click **Submit Race Result**

You'll see a confirmation message. The submission is now pending admin review.

### What Happens Next

- A notification is sent to the admin team via Discord
- An admin reviews and approves or rejects the submission
- On approval the system calculates points automatically from the scoring rules
- The result appears on the leaderboard and on your runner profile

---

## Runners Directory

`/rfg/runners` shows all registered runners as cards, sorted by last name. Each card shows the name in **Last, First (Nickname)** format plus current age, when a birthday is on file.

Click a card to open that runner's profile.

---

## Runner Detail Page

Each runner has a detail page showing:

### Runner Info
- Full name and nickname
- Current age, calculated dynamically from birthday
- Date of birth

### 2026 Race History
A table of all approved races for the current season, **sorted by race date**, showing:
- Race number
- Race name, date, and distance
- Finish time
- Points earned
- Points type (PR, AG PR, 1st Time, Participation)
- Total points at the bottom

### Personal Records & Targets
PR data for each distance the runner has raced:
- **PR** — all-time personal record for that distance
- **AG PR** — best age-graded performance time
- **AG PR Date** — when the AG PR was set
- **Age @ Race** — runner's age when the AG PR was achieved
- **Factor @ Race** — age-grading factor at that time
- **AG Time** — the age-graded equivalent time, locked from the best performance
- **Today's Factor** — current age-grading factor, which changes on the runner's birthday
- **Target** — the time to beat for an age-graded PR at the current age

### Distances Not Yet Raced
Any standard distances the runner has not competed in. Racing a new distance earns first-time distance points.

---

## Race Recaps

`/rfg/recaps` collects the written race reports members have emailed to the club.

- Recaps are grouped by runner; each runner row shows how many recaps they have
- Click a runner to expand their list, then click a recap to read the full text
- Each recap keeps its race name, race date, and the date of the original email

Recaps are imported from email and attachments by an admin script rather than submitted through the site.

---

## 2025 Results (Hall of Fame)

`/rfg/hall-of-fame` is a commemorative page honoring the top three finishers from the 2025 season:

- **Gold** — 1st place
- **Silver** — 2nd place
- **Bronze** — 3rd place

Each medalist card shows points, races, and efficiency. The page also carries 2025 season highlights and aggregate totals — PRs, AG PRs, participation races, and total races for the year.

---

## RFG Admin

`/rfg/admin` requires the RFG admin password. It has six pages, reachable from the admin sub-nav.

### Pending Submissions

Review race submissions from club members.

- Each submission shows the runner, race name, date, distance, finish time, and submission date
- **Approve** — calculates points automatically and adds the result to the leaderboard
- **Reject** — removes the submission from the queue

Approval logic, in order:

1. Is it a participation-only entry? → that entry's fixed point value, no PR tracking
2. Is it faster than the runner's PR? → PR points
3. Is it faster than the runner's age-graded target, or a first-time distance? → AG PR points
4. Otherwise → participation points for the distance

### Approved Results

View and manage all approved race results for the season.

- Sorted by race date, oldest first
- Each row shows runner (linked to profile), race details, points, type, and submission date
- **Edit** — modify race name, date, distance, or finish time. Points and type are recalculated automatically when time or distance changes, including any effect on PR/AG PR classification
- **Delete** — remove a result. If the deleted result was a PR or AG PR, the runner's previous PR data is restored automatically. A confirmation dialog prevents accidental deletion

### Manage Runners

View, edit, and delete runner records.

- Table shows all runners with name (linked to profile), birthday, age, and race count
- **Edit** — opens a full form with nickname, full name, birthday, and complete PR data for all 12 standard distances (PR time, AG PR time, AG PR date, age at race, factor, AG time, today's factor, target). Saving rescores all of that runner's race results if the PR changes affect scoring
- **Delete** — removes the runner; blocked if they have approved race results, which must be deleted first

### Add Runner

Add a new runner:
- **Nickname** (required, must be unique)
- **Full Name** (required)
- **Birthday** (optional — needed for age calculation and age grading)
- **PR data** for all 12 standard distances — leave blank for unraced distances. Times accept H:MM:SS or MM:SS

### Upload Data

Upload an SMRC Excel spreadsheet for data import. The system reads the file and displays a summary of sheets and row counts.

### Tech Stack

A read-only reference page listing the technologies behind the site: frontend, backend, hosting and deployment, data and seeding, authentication, notifications, testing, source control, and development tools.

### Analytics Dashboard

A site analytics panel appears at the **bottom of every RFG admin page**. See [Analytics](#analytics).

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
Awarded when the finish time beats the runner's age-graded target, or when racing a distance for the first time.

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

Awarded for completing a standard-distance race without setting a PR or AG PR:

| Distance Category | Points |
|-------------------|--------|
| Up to 5 mile (5k, 4 mile, 5 mile) | 1 |
| Up to 8 mile (10k, 8 mile) | 2 |
| Up to Half Marathon (15k, 10 mile, Half Marathon) | 3 |
| Marathon & beyond (Full Marathon, 50k, 50 Mile, 100 Mile) | 4 |

Races submitted under a **participation-only** dropdown entry score by mileage band instead:

| Entry | Points |
|-------|--------|
| Participation up to 5 miles | 1 |
| Participation 5.01 - 8 miles | 2 |
| Participation 8.01 - 26.1 miles | 3 |
| Participation 26.3+ miles | 4 |

Participation-only entries never create or update PR / AG PR records.

---

## Age-Graded PR Targets

The age-grading system accounts for natural aging so runners can keep setting meaningful PRs as they get older.

### How It Works

1. **AG Time** = finish time × age-grading factor at the age the race was run. This is the runner's best age-adjusted performance, locked in from the original data.
2. **Target** = AG Time ÷ current age-grading factor. This is the finish time needed TODAY to match that best age-adjusted performance.
3. The **target adjusts automatically** when a runner's age changes on their birthday. As the factor decreases with age, the target time gets slower — more generous.

### Key Rules
- A new actual PR does **not** change the AG time or target; those stay anchored to the original best age-graded performance
- An AG PR (beating the target) does **not** change the target; it only records the achievement
- The target only changes when the runner's birthday passes and their factor updates
- Age-grading factors are WMA/USATF 2015 male road standards
- Runners with no birthday on file have no age, and therefore no age-graded target

### Example
A runner set a 10K PR of 37:22 at age 45 (factor 0.9267):
- AG Time = 37:22 × 0.9267 = 34:37 (locked)
- At age 54 (factor 0.8594): Target = 34:37 ÷ 0.8594 = **40:17**
- At age 55 (factor 0.8572): Target = 34:37 ÷ 0.8572 = **40:23**

---

## Attendance Leaderboard

`/attendance` ranks members by how many Saturday runs they have attended in the current Timmy Year.

**Columns (desktop):** Rank · Runner · 2026 total · % · Streak · '25 (weeks 1-N) · YoY · '24 · '23

- **%** — attended weeks divided by approved weeks so far this year
- **Streak** — 🔥 consecutive most-recent weeks attended. Gold at 10+, blue at 5+
- **'25 (weeks 1-N)** — 2025 attendance over the *same number of weeks*, so the year-over-year comparison is like-for-like. The range in the header grows as the season goes on
- **YoY** — green ↑ / red ↓ against that same-weeks 2025 figure
- **'24 / '23** — full-year totals for those seasons

**Ranking and ties:** total for the current year, then current streak, then nickname. Two runners share a rank when total and streak both match.

Only runners with at least one attended week this season appear. Mobile shows the same data as cards; tapping a row or card opens that runner's attendance profile.

---

## Attendance Runners

`/attendance/runners` lists everyone in the attendance roster. A runner's detail page shows their week-by-week record plus totals and percentages for each Timmy Year on file, 2023 onward.

The attendance roster is **separate from the RFG roster** — it includes members who run on Saturdays but do not compete in Race for Gold. Where the same person exists in both, the attendance record carries a link to their RFG runner.

---

## Attendance Admin

`/attendance/admin` requires the attendance admin password, which is separate from the RFG one.

### RSVP Queue

RSVPs parsed from the weekly club email land here before they count.

- Each entry shows the runner, week date, status (in / out), and the raw text it was parsed from
- **Select all "in"** for a week, or pick entries individually
- **Approve** — creates the attendance week if it does not exist yet, marks the selected runners present, and clears the rest of that week's queue
- **Dismiss** — deletes the selected entries without recording attendance

Emails are matched to runners through the email mapping table (see [Name Mapping](#name-mapping-between-rfg-and-attendance)); an unrecognized address will not produce a queue entry.

### Weeks

A list of the season's weeks with status badges:

- **draft** — created but not counted in leaderboard percentages
- **approved** — final and counted

Click a week to open its detail page, where you can toggle each runner present or absent, save as draft, or **Save & Approve**. The header shows how many runners are currently marked present.

Weeks can also be created manually with a date and Timmy Year.

### Analytics Dashboard

The same site analytics panel appears at the bottom of the attendance admin page.

---

## Timmy Year

Attendance seasons do not follow the calendar year. A **Timmy Year** runs from the **second Saturday of December through the first Saturday of the following December**. Timmy Year 2026 began on 2025-12-13.

This is why December dates appear under the *following* year, and why "2026" attendance data starts in December 2025.

---

## Name Mapping Between RFG and Attendance

Members go by different nicknames in different places — the RFG spreadsheet, the attendance sheet, and the club email list. Three layers keep them tied together:

1. **`Runner_Name_Mapping.xlsx`** (in the SMRC folder, one level above the app) — maps every historical nickname variant to a full name and marks the one **preferred nickname** per person with `*`. `scripts/seed.ts` reads the first sheet and collapses variants onto the preferred nickname when rebuilding the RFG roster. The workbook also carries reference sheets for the attendance and email mappings.
2. **`attendance_runners.rfg_runner_id`** — links an attendance roster entry to its RFG runner. Attendance-only members leave this empty.
3. **`attendance_email_mappings`** — maps a member's email address to their attendance nickname, so RSVP emails can be parsed automatically. A member can have more than one address.

When someone's nickname changes, or a new member joins, all three need updating — otherwise the seed script creates a duplicate runner, or the member's RSVPs are silently ignored.

---

## Analytics

The site records page views — path, anonymous visitor ID, user agent, referrer, timestamp — for every page. The dashboard at the bottom of both admin areas shows:

- Total views, today's views, and views over the last 7 days
- Unique visitors, all time and today
- Top 10 pages by views
- Daily views for the last 14 days
- Top 5 referrers

If the analytics query fails, the dashboard shows an error message rather than disappearing.

---

## Technical Details

### Authentication
- Site and admin sessions use HMAC-SHA256 signed cookies, verified in Next.js middleware at the edge
- RFG admin and attendance admin use separate passwords and separate cookies
- Login endpoints are rate limited to 5 attempts per 15 minutes per IP

### Notifications
When a race is submitted, a notification is sent to the admin team through a Discord webhook.

### Data Integrity
- Deleting a race result that was a PR or AG PR restores the runner's previous PR data
- Editing a race result recalculates its scoring classification
- Editing a runner's PR data rescores all of their race results
- Race submissions cannot have future dates, and finish time must be positive
- Race history is ordered by race date

### Environments and Data
- **Live** — the production Turso database used by the deployed site
- **Dev** — a separate Turso database for local work. `node scripts/sync-dev-from-live.mjs` copies schema and rows from live into dev (the script only ever reads from live) and writes a JSON backup of dev to `backups/` first
- `npm run snapshot` and `npm run restore` capture and restore a database snapshot
- `npx tsx scripts/seed.ts` rebuilds the RFG tables from the Excel spreadsheets. **It drops and recreates tables — never run it against live during a season**
- `npx tsx scripts/seed-attendance.ts` imports historical attendance from the attendance spreadsheet

### Automated Tests
24 API tests cover scoring accuracy, data integrity, authentication, and validation. Run with `npm test`, which requires the dev server running.

### Technology Stack
- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Poppins font
- **Database:** Turso (cloud SQLite) via `@libsql/client`
- **Hosting:** Vercel
- **Notifications:** Discord webhooks
- **Testing:** Vitest for API tests, Playwright available
- **Data import:** `xlsx`

---

*SMRC © 2026*
*Run all the miles, drink all the beer.*
