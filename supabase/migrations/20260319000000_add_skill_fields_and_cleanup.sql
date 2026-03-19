-- Add matched_skill and skill_reasoning columns to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS matched_skill TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS skill_reasoning TEXT;

-- Add DELETE policy to profiles (for future account deletion support)
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = user_id);

-- Drop unused tables that are not referenced anywhere in the application
DROP TABLE IF EXISTS public.objectives;
DROP TABLE IF EXISTS public.skills;
