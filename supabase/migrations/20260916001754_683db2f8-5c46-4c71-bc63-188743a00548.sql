CREATE TABLE public.community_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('post', 'reply')),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  reply_id uuid REFERENCES public.post_replies(id) ON DELETE CASCADE,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((kind = 'post' AND reply_id IS NULL) OR (kind = 'reply' AND reply_id IS NOT NULL))
);

GRANT SELECT, UPDATE, DELETE ON public.community_notifications TO authenticated;
GRANT ALL ON public.community_notifications TO service_role;

ALTER TABLE public.community_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications own read" ON public.community_notifications
FOR SELECT TO authenticated
USING (auth.uid() = recipient_id);

CREATE POLICY "notifications own update" ON public.community_notifications
FOR UPDATE TO authenticated
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

CREATE POLICY "notifications own delete" ON public.community_notifications
FOR DELETE TO authenticated
USING (auth.uid() = recipient_id);

CREATE INDEX community_notifications_recipient_created_idx
ON public.community_notifications (recipient_id, created_at DESC);

CREATE INDEX community_notifications_recipient_unread_idx
ON public.community_notifications (recipient_id, created_at DESC)
WHERE read_at IS NULL;

CREATE TRIGGER community_notifications_set_updated_at
BEFORE UPDATE ON public.community_notifications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.notify_community_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.community_notifications (recipient_id, actor_id, kind, post_id)
  SELECT DISTINCT participant.user_id, NEW.user_id, 'post', NEW.id
  FROM (
    SELECT user_id FROM public.community_posts
    UNION
    SELECT user_id FROM public.post_replies
  ) AS participant
  WHERE participant.user_id <> NEW.user_id;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_community_post() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_community_post() TO service_role;

CREATE TRIGGER community_post_notifications
AFTER INSERT ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION public.notify_community_post();

CREATE OR REPLACE FUNCTION public.notify_community_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_id uuid;
BEGIN
  SELECT user_id INTO owner_id
  FROM public.community_posts
  WHERE id = NEW.post_id;

  IF owner_id IS NOT NULL AND owner_id <> NEW.user_id THEN
    INSERT INTO public.community_notifications (recipient_id, actor_id, kind, post_id, reply_id)
    VALUES (owner_id, NEW.user_id, 'reply', NEW.post_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_community_reply() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_community_reply() TO service_role;

CREATE TRIGGER community_reply_notifications
AFTER INSERT ON public.post_replies
FOR EACH ROW EXECUTE FUNCTION public.notify_community_reply();

ALTER PUBLICATION supabase_realtime ADD TABLE public.community_notifications;