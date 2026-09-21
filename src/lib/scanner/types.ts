export type NutritionFacts = {
  energy_kcal_100g: number | null;
  proteins_100g: number | null;
  carbohydrates_100g: number | null;
  sugars_100g: number | null;
  fat_100g: number | null;
  saturated_fat_100g: number | null;
  fiber_100g: number | null;
  sodium_100g: number | null;
};

export type NormalizedIngredient = {
  raw: string;
  normalized: string;
};

/** Produto já normalizado, independente do provider de origem. */
export type Product = {
  barcode: string;
  provider: string;
  providerId: string | null;
  name: string | null;
  brand: string | null;
  imageUrl: string | null;
  ingredientsRaw: string | null;
  ingredients: NormalizedIngredient[];
  nutrition: NutritionFacts;
};

export type RuleImpact = "positive" | "neutral" | "negative";

export type IngredientRule = {
  id: string;
  matchType: "ingredient" | "additive" | "category";
  matchValue: string;
  weight: number;
  impact: RuleImpact;
  explanation: string;
  source: string | null;
  methodologyVersion: string;
};

export type ScoreCategory = "muito_alinhado" | "alinhado" | "neutro" | "atencao" | "pouco_alinhado";

export const SCORE_CATEGORY_LABEL: Record<ScoreCategory, string> = {
  muito_alinhado: "Muito alinhado",
  alinhado: "Alinhado",
  neutro: "Neutro",
  atencao: "Atenção",
  pouco_alinhado: "Pouco alinhado",
};

/** Classe de cor (tokens já existentes no design system) por categoria. */
export const SCORE_CATEGORY_TONE: Record<
  ScoreCategory,
  { text: string; bg: string; border: string }
> = {
  muito_alinhado: { text: "text-success", bg: "bg-success/10", border: "border-success/40" },
  alinhado: { text: "text-primary", bg: "bg-secondary", border: "border-primary/30" },
  neutro: { text: "text-muted-foreground", bg: "bg-muted", border: "border-border" },
  atencao: { text: "text-gold", bg: "bg-gold/10", border: "border-gold/40" },
  pouco_alinhado: {
    text: "text-terracotta",
    bg: "bg-terracotta/10",
    border: "border-terracotta/40",
  },
};

export type ScoreReason = {
  ruleId: string;
  label: string;
  impact: RuleImpact;
};

export type ApoloScoreResult = {
  score: number;
  category: ScoreCategory;
  reasons: ScoreReason[];
  warnings: ScoreReason[];
  engineVersion: string;
};

export type ScanSource = "barcode" | "manual" | "photo_ingredients";

export type ProductLookupError =
  { type: "not_found" } | { type: "network_error" } | { type: "unknown"; message: string };

export type ProductLookupResult =
  { ok: true; product: Product } | { ok: false; error: ProductLookupError };
