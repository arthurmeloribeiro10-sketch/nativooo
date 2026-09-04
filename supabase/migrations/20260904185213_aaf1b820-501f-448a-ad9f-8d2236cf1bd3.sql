
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Nativo',
  step_goal INTEGER NOT NULL DEFAULT 10000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles own write" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles own insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  day DATE NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
  title TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  pillar TEXT NOT NULL DEFAULT 'habitos',
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.missions TO authenticated;
GRANT ALL ON public.missions TO service_role;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "missions own" ON public.missions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  day DATE NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
  time_label TEXT NOT NULL DEFAULT 'Livre',
  name TEXT NOT NULL,
  items TEXT[] NOT NULL DEFAULT '{}',
  kcal INTEGER NOT NULL DEFAULT 0,
  done BOOLEAN NOT NULL DEFAULT false,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meals TO authenticated;
GRANT ALL ON public.meals TO service_role;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meals own" ON public.meals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.sleep_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  day DATE NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
  hours NUMERIC(3,1) NOT NULL,
  quality INTEGER NOT NULL DEFAULT 70,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, day)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sleep_logs TO authenticated;
GRANT ALL ON public.sleep_logs TO service_role;
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sleep own" ON public.sleep_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.step_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  day DATE NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
  steps INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, day)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.step_logs TO authenticated;
GRANT ALL ON public.step_logs TO service_role;
ALTER TABLE public.step_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "steps own" ON public.step_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.protocol_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 30),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, day_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.protocol_progress TO authenticated;
GRANT ALL ON public.protocol_progress TO service_role;
ALTER TABLE public.protocol_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "protocol own" ON public.protocol_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_posts TO authenticated;
GRANT ALL ON public.community_posts TO service_role;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts readable" ON public.community_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "posts own insert" ON public.community_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts own update" ON public.community_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts own delete" ON public.community_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.post_reactions TO authenticated;
GRANT ALL ON public.post_reactions TO service_role;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reactions readable" ON public.post_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "reactions own insert" ON public.post_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reactions own delete" ON public.post_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'Nativo'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
