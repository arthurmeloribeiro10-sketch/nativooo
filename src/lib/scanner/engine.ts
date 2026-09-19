import type { ApoloScoreResult, IngredientRule, Product, ScoreCategory, ScoreReason } from "./types";

const BASELINE_SCORE = 60;
const ENGINE_VERSION = "v1";

const CATEGORY_THRESHOLDS: Array<{ min: number; category: ScoreCategory }> = [
  { min: 85, category: "muito_alinhado" },
  { min: 65, category: "alinhado" },
  { min: 45, category: "neutro" },
  { min: 25, category: "atencao" },
  { min: 0, category: "pouco_alinhado" },
];

function categoryForScore(score: number): ScoreCategory {
  return CATEGORY_THRESHOLDS.find((t) => score >= t.min)?.category ?? "pouco_alinhado";
}

function matchesIngredientRule(rule: IngredientRule, normalizedIngredients: string[]): boolean {
  if (rule.matchType === "category") return false; // categorias são avaliadas à parte
  return normalizedIngredients.some((ingredient) => ingredient.includes(rule.matchValue.toLowerCase()));
}

/**
 * Heurísticas de categoria — não dependem de casar texto de ingrediente,
 * dependem da forma do produto (quantos ingredientes, etc). Mantidas fora
 * da tabela ingredient_rules porque o "match" aqui é estrutural, não textual.
 */
function categoryRuleApplies(rule: IngredientRule, product: Product): boolean {
  if (rule.matchType !== "category") return false;
  const count = product.ingredients.length;
  if (rule.matchValue === "lista curta de ingredientes") return count > 0 && count <= 5;
  if (rule.matchValue === "comida real") return count > 0 && count <= 6;
  return false;
}

/**
 * Product → IngredientsNormalizer (chamado antes, em normalizer.ts) →
 * IngredientRules/NutritionRules (aqui) → ApoloScoreEngine (aqui) →
 * Score + reasons + warnings. Determinístico: mesma entrada sempre produz
 * a mesma saída, sem chamada a LLM.
 */
export function computeApoloScore(product: Product, rules: IngredientRule[]): ApoloScoreResult {
  const normalizedIngredients = product.ingredients.map((i) => i.normalized);

  if (normalizedIngredients.length === 0) {
    return {
      score: BASELINE_SCORE,
      category: categoryForScore(BASELINE_SCORE),
      reasons: [],
      warnings: [
        {
          ruleId: "insufficient-data",
          label: "Sem lista de ingredientes disponível para este produto.",
          impact: "neutral",
        },
      ],
      engineVersion: ENGINE_VERSION,
    };
  }

  const matched = rules.filter(
    (rule) => matchesIngredientRule(rule, normalizedIngredients) || categoryRuleApplies(rule, product),
  );

  // Uma regra só conta uma vez mesmo se casar com vários ingredientes.
  const uniqueMatched = Array.from(new Map(matched.map((r) => [r.id, r])).values());

  const delta = uniqueMatched.reduce((sum, rule) => sum + rule.weight, 0);
  const score = Math.max(0, Math.min(100, Math.round(BASELINE_SCORE + delta)));

  const toReason = (rule: IngredientRule): ScoreReason => ({
    ruleId: rule.id,
    label: rule.explanation,
    impact: rule.impact,
  });

  return {
    score,
    category: categoryForScore(score),
    reasons: uniqueMatched.filter((r) => r.impact === "positive").map(toReason),
    warnings: uniqueMatched.filter((r) => r.impact === "negative").map(toReason),
    engineVersion: ENGINE_VERSION,
  };
}
