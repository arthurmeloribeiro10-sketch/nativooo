-- Scanner de produtos: cache de produtos, motor de score determinístico,
-- histórico de scans do usuário e favoritos.
-- ATENÇÃO: esta migration ainda NÃO foi aplicada ao banco remoto.
-- Precisa ser revisada e rodada (via Lovable ou `supabase db push`) antes do
-- scanner funcionar de ponta a ponta em produção.

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode text NOT NULL UNIQUE,
  provider text NOT NULL,
  provider_id text,
  name text,
  brand text,
  image_url text,
  ingredients_raw text,
  ingredients_normalized jsonb NOT NULL DEFAULT '[]'::jsonb,
  nutrition jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw_payload jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products readable" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "products writable by app" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "products refreshable by app" ON public.products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER products_set_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.product_provider_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  barcode text NOT NULL,
  raw_response jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, barcode)
);
GRANT SELECT, INSERT, UPDATE ON public.product_provider_cache TO authenticated;
GRANT ALL ON public.product_provider_cache TO service_role;
ALTER TABLE public.product_provider_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "provider cache readable" ON public.product_provider_cache FOR SELECT TO authenticated USING (true);
CREATE POLICY "provider cache writable by app" ON public.product_provider_cache FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "provider cache refreshable by app" ON public.product_provider_cache FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Regras do motor de score: dado de referência, versionado. Só o
-- service_role (migrations/admin) escreve; o app só lê.
CREATE TABLE public.ingredient_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key text NOT NULL UNIQUE,
  match_type text NOT NULL CHECK (match_type IN ('ingredient', 'additive', 'category')),
  match_value text NOT NULL,
  weight numeric(4, 1) NOT NULL,
  impact text NOT NULL CHECK (impact IN ('positive', 'neutral', 'negative')),
  explanation text NOT NULL,
  source text,
  methodology_version text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ingredient_rules TO authenticated;
GRANT ALL ON public.ingredient_rules TO service_role;
ALTER TABLE public.ingredient_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ingredient rules readable" ON public.ingredient_rules FOR SELECT TO authenticated USING (active);

-- Score computado e explicável, versionado por engine_version — permite
-- reprocessar produtos quando a metodologia mudar sem perder o histórico.
CREATE TABLE public.product_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  category text NOT NULL CHECK (category IN ('muito_alinhado', 'alinhado', 'neutro', 'atencao', 'pouco_alinhado')),
  reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  engine_version text NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, engine_version)
);
GRANT SELECT, INSERT ON public.product_scores TO authenticated;
GRANT ALL ON public.product_scores TO service_role;
ALTER TABLE public.product_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product scores readable" ON public.product_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "product scores writable by app" ON public.product_scores FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE public.product_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  score_id uuid REFERENCES public.product_scores(id) ON DELETE SET NULL,
  barcode text NOT NULL,
  source text NOT NULL DEFAULT 'barcode' CHECK (source IN ('barcode', 'manual', 'photo_ingredients')),
  added_to_meal_id uuid REFERENCES public.meals(id) ON DELETE SET NULL,
  scanned_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_scans TO authenticated;
GRANT ALL ON public.product_scans TO service_role;
ALTER TABLE public.product_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product scans own" ON public.product_scans FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX product_scans_user_scanned_at_idx ON public.product_scans (user_id, scanned_at DESC);

CREATE TABLE public.saved_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  saved_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.saved_products TO authenticated;
GRANT ALL ON public.saved_products TO service_role;
ALTER TABLE public.saved_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved products own" ON public.saved_products FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Primeiro lote de regras (metodologia v1) — determinístico, editável depois
-- por uma migration nova (nunca alterando o valor de metodologia já publicado).
INSERT INTO public.ingredient_rules (rule_key, match_type, match_value, weight, impact, explanation, source, methodology_version) VALUES
  ('v1-additive-hfcs', 'additive', 'xarope de milho rico em frutose', -18, 'negative', 'Xarope de milho rico em frutose é um dos aditivos menos alinhados com os critérios APOLO.', 'Critérios internos APOLO v1', 'v1'),
  ('v1-additive-hydrogenated-oil', 'additive', 'óleo vegetal hidrogenado', -15, 'negative', 'Óleos hidrogenados/parcialmente hidrogenados têm baixa prioridade nos critérios APOLO.', 'Critérios internos APOLO v1', 'v1'),
  ('v1-additive-artificial-sweetener', 'additive', 'adoçante artificial', -8, 'negative', 'Adoçantes artificiais entram como ponto de atenção, não como proibição.', 'Critérios internos APOLO v1', 'v1'),
  ('v1-additive-emulsifier', 'additive', 'emulsificante', -5, 'negative', 'Emulsificantes industriais pesam levemente contra a pontuação.', 'Critérios internos APOLO v1', 'v1'),
  ('v1-category-whole-food', 'category', 'comida real', 12, 'positive', 'Produto próximo de um alimento in natura ou minimamente processado.', 'Critérios internos APOLO v1', 'v1'),
  ('v1-category-short-ingredient-list', 'category', 'lista curta de ingredientes', 10, 'positive', 'Poucos ingredientes tende a indicar menos processamento.', 'Critérios internos APOLO v1', 'v1'),
  ('v1-ingredient-added-sugar', 'ingredient', 'açúcar', -6, 'negative', 'Açúcar adicionado entre os primeiros ingredientes reduz o alinhamento.', 'Critérios internos APOLO v1', 'v1'),
  ('v1-ingredient-whole-grain', 'ingredient', 'grão integral', 6, 'positive', 'Fonte de carboidrato de melhor qualidade.', 'Critérios internos APOLO v1', 'v1');
