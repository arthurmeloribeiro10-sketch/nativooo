DROP POLICY IF EXISTS "posts readable" ON public.community_posts;
CREATE POLICY "posts own read" ON public.community_posts
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reactions readable" ON public.post_reactions;
CREATE POLICY "reactions own read" ON public.post_reactions
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles readable by authenticated" ON public.profiles;
CREATE POLICY "profiles own read" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

REVOKE EXECUTE ON FUNCTION public.community_ranking() FROM authenticated;