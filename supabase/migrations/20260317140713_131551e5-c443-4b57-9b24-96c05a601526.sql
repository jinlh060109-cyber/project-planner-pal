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