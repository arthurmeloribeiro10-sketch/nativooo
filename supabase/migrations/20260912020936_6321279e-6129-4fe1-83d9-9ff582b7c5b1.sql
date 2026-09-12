ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS meal_goal integer NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  ADD COLUMN IF NOT EXISTS weight_kg numeric(5,1),
  ADD COLUMN IF NOT EXISTS height_cm numeric(5,1),
  ADD COLUMN IF NOT EXISTS diet_goal text,
  ADD COLUMN IF NOT EXISTS activity_level text,
  ADD COLUMN IF NOT EXISTS food_preferences text,
  ADD COLUMN IF NOT EXISTS food_restrictions text,
  ADD COLUMN IF NOT EXISTS foods_include text,
  ADD COLUMN IF NOT EXISTS foods_avoid text,
  ADD COLUMN IF NOT EXISTS preferred_start_time time,
  ADD COLUMN IF NOT EXISTS prep_time text;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_meal_goal_range CHECK (meal_goal BETWEEN 1 AND 10),
  ADD CONSTRAINT profiles_weight_range CHECK (weight_kg IS NULL OR weight_kg BETWEEN 25 AND 300),
  ADD CONSTRAINT profiles_height_range CHECK (height_cm IS NULL OR height_cm BETWEEN 100 AND 250);

CREATE TABLE public.diet_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Meu plano',
  source text NOT NULL CHECK (source IN ('ai', 'template', 'manual')),
  summary text,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diet_plans TO authenticated;
GRANT ALL ON public.diet_plans TO service_role;
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "diet plans own" ON public.diet_plans FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE UNIQUE INDEX diet_plans_one_active_per_user ON public.diet_plans(user_id) WHERE active;

CREATE TABLE public.diet_plan_meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.diet_plans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  position integer NOT NULL CHECK (position >= 0),
  time_label text NOT NULL DEFAULT 'Livre',
  name text NOT NULL,
  items text[] NOT NULL DEFAULT '{}',
  kcal_estimate integer CHECK (kcal_estimate IS NULL OR kcal_estimate >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, position)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diet_plan_meals TO authenticated;
GRANT ALL ON public.diet_plan_meals TO service_role;
ALTER TABLE public.diet_plan_meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "diet plan meals own" ON public.diet_plan_meals FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.meals
  ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.diet_plans(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS origin text NOT NULL DEFAULT 'manual' CHECK (origin IN ('plan', 'manual')),
  ADD COLUMN IF NOT EXISTS kcal_estimated boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER diet_plans_set_updated_at BEFORE UPDATE ON public.diet_plans
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER diet_plan_meals_set_updated_at BEFORE UPDATE ON public.diet_plan_meals
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER meals_set_updated_at BEFORE UPDATE ON public.meals
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.apply_diet_plan(
  _name text,
  _source text,
  _summary text,
  _preferences jsonb,
  _meals jsonb,
  _day date
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  _plan_id uuid;
  _meal jsonb;
  _position integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF _source NOT IN ('ai', 'template', 'manual') THEN
    RAISE EXCEPTION 'Invalid plan source';
  END IF;
  IF jsonb_typeof(_meals) <> 'array' OR jsonb_array_length(_meals) < 1 OR jsonb_array_length(_meals) > 10 THEN
    RAISE EXCEPTION 'Plan must contain between 1 and 10 meals';
  END IF;

  UPDATE public.diet_plans SET active = false WHERE user_id = auth.uid() AND active;
  INSERT INTO public.diet_plans (user_id, name, source, summary, preferences, active)
  VALUES (auth.uid(), left(coalesce(nullif(trim(_name), ''), 'Meu plano'), 120), _source, _summary, coalesce(_preferences, '{}'::jsonb), true)
  RETURNING id INTO _plan_id;

  FOR _meal IN SELECT value FROM jsonb_array_elements(_meals)
  LOOP
    INSERT INTO public.diet_plan_meals (plan_id, user_id, position, time_label, name, items, kcal_estimate)
    VALUES (
      _plan_id,
      auth.uid(),
      _position,
      coalesce(nullif(_meal->>'time_label', ''), 'Livre'),
      left(coalesce(nullif(trim(_meal->>'name'), ''), 'Refeição'), 160),
      ARRAY(SELECT jsonb_array_elements_text(coalesce(_meal->'items', '[]'::jsonb))),
      CASE WHEN (_meal->>'kcal') ~ '^\d+$' THEN (_meal->>'kcal')::integer ELSE NULL END
    );
    _position := _position + 1;
  END LOOP;

  DELETE FROM public.meals
  WHERE user_id = auth.uid() AND day = _day AND done = false AND origin = 'plan';

  INSERT INTO public.meals (user_id, day, time_label, name, items, kcal, done, note, plan_id, origin, kcal_estimated)
  SELECT auth.uid(), _day, dpm.time_label, dpm.name, dpm.items, coalesce(dpm.kcal_estimate, 0), false,
         'Previsto no plano', _plan_id, 'plan', true
  FROM public.diet_plan_meals dpm
  WHERE dpm.plan_id = _plan_id
  ORDER BY dpm.position;

  RETURN _plan_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.apply_diet_plan(text, text, text, jsonb, jsonb, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_diet_plan(text, text, text, jsonb, jsonb, date) TO authenticated;

CREATE UNIQUE INDEX IF NOT EXISTS missions_user_day_title_unique ON public.missions(user_id, day, title);

UPDATE public.missions
SET title = 'Tempo ao ar livre pela manhã',
    detail = 'Aproveite a luz natural e consulte o índice UV para escolher proteção adequada.'
WHERE title = '15 minutos de sol antes das 10h';