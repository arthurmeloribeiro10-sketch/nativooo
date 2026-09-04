
CREATE OR REPLACE FUNCTION public.community_ranking()
RETURNS TABLE (user_id UUID, display_name TEXT, protocol_days BIGINT, missions_done BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id,
         p.display_name,
         COALESCE((SELECT count(*) FROM public.protocol_progress pp WHERE pp.user_id = p.id), 0),
         COALESCE((SELECT count(*) FROM public.missions m WHERE m.user_id = p.id AND m.done), 0)
  FROM public.profiles p
  ORDER BY 3 DESC, 4 DESC
  LIMIT 20;
$$;
REVOKE EXECUTE ON FUNCTION public.community_ranking() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.community_ranking() TO authenticated;
