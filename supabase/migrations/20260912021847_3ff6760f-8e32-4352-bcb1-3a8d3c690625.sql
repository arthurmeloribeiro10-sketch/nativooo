ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

ALTER TABLE public.missions
  ADD CONSTRAINT missions_status_valid CHECK (status IN ('pending', 'done', 'skipped'));

UPDATE public.missions
SET status = CASE WHEN done THEN 'done' ELSE 'pending' END;

CREATE OR REPLACE FUNCTION public.sync_mission_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.done = NEW.status = 'done';
  ELSIF NEW.done IS DISTINCT FROM OLD.done THEN
    NEW.status = CASE WHEN NEW.done THEN 'done' ELSE 'pending' END;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.sync_mission_status() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER missions_sync_status
BEFORE UPDATE ON public.missions
FOR EACH ROW EXECUTE FUNCTION public.sync_mission_status();