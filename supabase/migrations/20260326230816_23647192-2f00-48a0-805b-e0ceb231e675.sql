ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS matched_skill text DEFAULT NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS skill_reasoning text DEFAULT NULL;