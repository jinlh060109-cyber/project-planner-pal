

# Sub-SWOT Skill Profiles on /profile

## 1. Database Migration

Create `sub_swots` table with text array columns for each SWOT quadrant:

```sql
CREATE TABLE public.sub_swots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  strength text[] DEFAULT '{}',
  weakness text[] DEFAULT '{}',
  opportunity text[] DEFAULT '{}',
  threat text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.sub_swots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own sub_swots"
  ON public.sub_swots FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## 2. New Component: `SubSwotEditModal.tsx`

Modal following the exact same visual pattern as `SwotEditModal` (overlay blur, slide-up, accent styling). Contains:

- **Part 1 — Identity**: Name input + description textarea
- **Part 2 — Four mini SWOT fields**: Each with a colored dot header, up to 3 text inputs, "+ Add item" / trash buttons. Uses `Collapsible` from radix for expand/collapse.
- **Part 3 — Footer**: Cancel (outline) + Save skill (#6366F1 filled)

On save: upserts to `sub_swots` table (insert if no `id`, update if editing). Filters empty strings from arrays before saving.

## 3. Profile Page Changes (`Profile.tsx`)

Insert a new section between the SWOT Profile Cards section and the Footer section:

- **Section header**: "Skill Profiles" — same `text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground` style
- **Card list**: Fetched from `sub_swots` on page load alongside existing data. Each card shows name (bold), description (truncated), "Edit →" link, and a red trash icon with inline delete confirmation
- **Empty state**: "No skill profiles yet — add one below" (muted italic)
- **Add button**: Dashed border full-width button with "+" icon + "Add skill profile"
- **State**: `subSwots` array, `editingSubSwot` (null | SubSwot | "new"), `deletingId` for inline confirm

## 4. Files Changed

| File | Action |
|------|--------|
| Migration SQL | Create `sub_swots` table + RLS |
| `src/components/SubSwotEditModal.tsx` | New — create/edit modal |
| `src/pages/Profile.tsx` | Add skill profiles section + state/fetching |

No changes to dashboard, onboarding, or edge functions.

