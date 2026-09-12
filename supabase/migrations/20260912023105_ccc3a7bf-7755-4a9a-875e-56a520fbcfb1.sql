ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS metabolic_sex text;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_birth_date_range CHECK (birth_date IS NULL OR birth_date BETWEEN DATE '1920-01-01' AND DATE '2010-12-31'),
  ADD CONSTRAINT profiles_metabolic_sex_valid CHECK (metabolic_sex IS NULL OR metabolic_sex IN ('female', 'male'));

CREATE TABLE public.health_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL CHECK (provider IN ('apple_health')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'paused', 'error')),
  permissions text[] NOT NULL DEFAULT '{}',
  device_name text,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_connections TO authenticated;
GRANT ALL ON public.health_connections TO service_role;
ALTER TABLE public.health_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "health connections own" ON public.health_connections
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.health_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connection_id uuid REFERENCES public.health_connections(id) ON DELETE CASCADE,
  metric_type text NOT NULL CHECK (metric_type IN ('steps', 'sleep_minutes', 'heart_rate', 'blood_glucose', 'blood_pressure_systolic', 'blood_pressure_diastolic')),
  value numeric NOT NULL,
  unit text NOT NULL,
  measured_at timestamptz NOT NULL,
  end_at timestamptz,
  source_name text NOT NULL,
  source_device text,
  external_id text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, external_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_samples TO authenticated;
GRANT ALL ON public.health_samples TO service_role;
ALTER TABLE public.health_samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "health samples own" ON public.health_samples
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX health_samples_user_metric_measured_idx
  ON public.health_samples (user_id, metric_type, measured_at DESC);

CREATE TRIGGER health_connections_set_updated_at
  BEFORE UPDATE ON public.health_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();