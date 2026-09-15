CREATE TABLE public.post_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT, UPDATE, DELETE ON public.post_replies TO authenticated;
GRANT ALL ON public.post_replies TO service_role;

ALTER TABLE public.post_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "replies own insert" ON public.post_replies
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "replies own update" ON public.post_replies
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "replies own delete" ON public.post_replies
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX post_replies_post_created_idx
ON public.post_replies (post_id, created_at);

CREATE TRIGGER post_replies_set_updated_at
BEFORE UPDATE ON public.post_replies
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();