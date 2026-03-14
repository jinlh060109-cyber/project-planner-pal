

# Profile Page for SWOT Planner

## Overview

Build a `/profile` page with identity management, SWOT editing via modals, and avatar uploads. Add an avatar navigation link in the dashboard header.

## Database Considerations

No schema changes needed. Existing tables cover everything:
- **profiles**: `display_name`, `role_situation`, `north_star`, `avatar_url`
- **swot_items**: `quadrant`, `content`, `sort_order`, `user_id`
- **Storage bucket**: `avatars` (already public)

The user prompt references "arrays on profiles" for SWOT items, but the actual schema uses a separate `swot_items` table. The implementation will use that table instead.

Field mapping: user says `role` → actual column is `role_situation`; user says `north_star_objective` → actual column is `north_star`.

## Files to Create/Modify

### 1. `src/pages/Profile.tsx` (new)
Main profile page with three sections:
- **Identity Header**: Avatar (80px, upload to `avatars` bucket), display name, editable role input, north star textarea
- **SWOT Cards**: 2x2 grid of summary cards reading from `swot_items` table, each clickable to open edit modal
- **Footer**: Save button (role + north star only), coming soon placeholder card
- Loading state with skeleton shimmers, dirty-state detection with pulsing save button

### 2. `src/components/SwotEditModal.tsx` (new)
Modal for editing items in one quadrant:
- Fetches items from `swot_items` table for the selected quadrant
- Editable input rows with delete buttons, "+ Add item" (max 4)
- Save: deletes all existing items for that quadrant, inserts new ones
- Cancel/overlay click discards changes
- Styled per spec: dark surface, quadrant accent colors, blur overlay

### 3. `src/pages/Dashboard.tsx` (modify — header only)
- Add avatar button (32px circle) in the top-right, next to the date/logout
- Fetch `avatar_url` and `display_name` from profiles on mount
- Click navigates to `/profile`

### 4. `src/App.tsx` (modify)
- Add protected route for `/profile` → `Profile` component

## Key Implementation Details

- Avatar upload: file input accepting jpg/png/webp, uploads to `avatars` bucket at path `{user_id}/{timestamp}.ext`, updates `avatar_url` on profiles table
- SWOT modal save strategy: delete all `swot_items` where `user_id` and `quadrant` match, then insert new rows — simple and avoids diff logic
- Dirty state: track whether role or north_star changed from initial values; pulse the save button ring when dirty
- All styling uses the established design system colors (CSS variables, card backgrounds, border colors)
- Framer Motion for modal animations (already in deps)

