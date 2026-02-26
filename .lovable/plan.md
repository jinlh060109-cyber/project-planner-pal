

# Onboarding Step 1 — Implementation Plan

## Summary

Build the first onboarding screen that appears after registration. It collects the user's role/situation and optional north star objective, using the established clean & minimal design system.

## Database

The `profiles` table already has `onboarding_completed` (boolean). We need two new columns to store Step 1 data:

- **`current_role`** (text, nullable) — stores the user's role/life situation
- **`north_star`** (text, nullable) — stores the optional north star objective

A migration will add these columns.

## Routing & Flow

- New route: `/onboarding` — renders the `Onboarding` page
- **ProtectedRoute** updated: after auth check, also query the user's profile. If `onboarding_completed` is `false`, redirect to `/onboarding` instead of showing the dashboard.
- The `/onboarding` route itself is also protected (requires auth).

## New Files

### `src/pages/Onboarding.tsx`

Single-page component for Step 1 with the following structure:

```text
┌─────────────────────────────────────┐
│  ← (greyed out)     [Step 1 of 2]  │
│                                     │
│   Let's build your strategic        │
│   profile                           │
│                                     │
│   This takes 3 minutes...           │
│                                     │
│   ┌─────────────────────────────┐   │
│   │ What's your current role... │   │
│   └─────────────────────────────┘   │
│                                     │
│   ┌─────────────────────────────┐   │
│   │ What's your north star...   │   │
│   └─────────────────────────────┘   │
│                                     │
│              [Continue →]           │
└─────────────────────────────────────┘
```

**Design details:**
- Centered card on desktop (max-width 520px), full-bleed on mobile
- 40px vertical padding inside card
- DM Serif Display for heading, DM Sans for body
- Background: `bg-background`, card: `bg-card`
- Progress pill: `bg-muted text-muted-foreground` badge, top-right
- Back arrow: `ArrowLeft` from lucide, greyed out (`text-muted-foreground/40`) on Step 1
- Inputs: full-width, use existing `Input` component with custom focus styling (`focus-visible:ring-indigo-500` matching `#6366F1`)
- Validation state: red border + helper text on empty role field when submit attempted
- Filled state: `Check` icon from lucide rendered inside a wrapper on the right side of the input
- CTA: indigo button (`bg-[#6366F1] hover:bg-[#5558E6]`), full-width on mobile, right-aligned on desktop
- Enter key on north star field triggers submit
- "Continue" saves `current_role` and `north_star` to the `profiles` table via upsert, then navigates to `/onboarding/step2` (placeholder — just navigates, page doesn't exist yet)

## Edited Files

### `src/App.tsx`
- Add `/onboarding` route pointing to `Onboarding`, wrapped in `ProtectedRoute`

### `src/components/ProtectedRoute.tsx`
- After confirming user is authenticated, fetch their profile
- If `onboarding_completed === false` and current path is not `/onboarding`, redirect to `/onboarding`
- If `onboarding_completed === true` and current path is `/onboarding`, redirect to `/dashboard`

## Technical Notes

- The indigo accent (`#6366F1`) is specified in the design spec for the CTA and input focus. This will be applied via Tailwind arbitrary values rather than adding a new design token, keeping the design system clean.
- No new dependencies required — uses existing `Input`, `Button`, `Badge`, `Card` components plus lucide icons.
- The profile query in `ProtectedRoute` uses the existing Supabase client and the user's auth session.

