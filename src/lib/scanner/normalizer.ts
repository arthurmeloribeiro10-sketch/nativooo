import type { Product } from "./types";

/**
 * Limpa e separa o texto de ingredientes em itens individuais normalizados
 * (minúsculo, sem parênteses de detalhe, sem espaços redundantes).
 * Puramente textual — a interpretação (o que é aditivo, o que é positivo)
 * fica a cargo das IngredientRules no motor de score.
 */
export function normalizeIngredientsText(text: string): string[] {
  return text
    .replace(/\([^)]*\)/g, " ")
    .split(/[,;]/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

/** Garante que o produto tenha uma lista de ingredientes normalizada mesmo
 * quando o provider só devolveu o texto corrido (ingredients_text). */
export function ensureNormalizedIngredients(product: Product): Product {
  if (product.ingredients.length > 0) return product;
  if (!product.ingredientsRaw) return product;

  const fromText = normalizeIngredientsText(product.ingredientsRaw).map((normalized) => ({
    raw: normalized,
    normalized,
  }));
  return { ...product, ingredients: fromText };
}
