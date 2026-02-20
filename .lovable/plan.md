

# SWOT Planner — Implementation Plan

## Phase 1: Foundation & Authentication

### User Accounts
- Sign up / login page with email & password
- User profiles table to store the personal SWOT portfolio data
- Protected routes — only authenticated users access the dashboard

---

## Phase 2: Personal SWOT Portfolio (Simplified Onboarding)

### Quick Setup Flow
- A guided onboarding after first login: user enters their **strengths, weaknesses, opportunities, and threats** as free-text items
- Optional **north star objective** — a single high-level life goal
- Optional **skill profiles** (up to 2 for free tier) — specific skills being developed
- Portfolio saved to the database, editable anytime from a settings/profile page

---

## Phase 3: Daily Dashboard & Task Input (Core Experience)

### Four-Quadrant Dashboard
- **Visual grid layout** showing Strength, Weakness, Opportunity, and Threat quadrants with distinct subtle color coding
- Each quadrant shows today's tasks with completion checkboxes
- **Balance indicator** — a simple visual (e.g., a donut chart or bar) showing task distribution across quadrants
- Imbalance nudges: if one quadrant dominates, show a gentle message

### Natural Language Task Input
- Single text input at the top — user types a task in plain language
- Task is created and placed into a quadrant (initially manual selection, AI classification wired up later)
- Each task shows its quadrant assignment and a brief reasoning placeholder
- User can **override/reassign** any task to a different quadrant via drag or dropdown
- Tasks can be marked complete, edited, or deleted

### AI Classification (Prepared for Integration)
- Architecture ready for an edge function that calls an external AI API (Minimax, Kimi, etc.)
- The edge function will receive the task text + user's portfolio context and return a quadrant + reasoning
- For now, a manual quadrant picker serves as fallback until the AI provider is connected

---

## Phase 4: Task History & Weekly View

### History
- View past days' tasks grouped by date
- Filter by quadrant or completion status

### Weekly Strategic Report (Basic)
- Summary view of the past 7 days: tasks completed per quadrant, balance trend
- Simple chart showing quadrant distribution over the week

---

## Design Direction

- **Clean & minimal** — generous white space, light background
- Each quadrant has a **soft pastel accent color** (e.g., blue for Strength, amber for Weakness, green for Opportunity, red for Threat)
- Clear typography hierarchy — the quadrant names and task text are the stars
- Mobile-responsive layout — quadrants stack vertically on small screens

---

## Technical Approach

- **Lovable Cloud** (Supabase) for database, auth, and edge functions
- Tables: `profiles`, `swot_items` (portfolio), `skills`, `tasks`, `objectives`
- Edge function ready for AI classification API calls
- Row-level security so each user only sees their own data

