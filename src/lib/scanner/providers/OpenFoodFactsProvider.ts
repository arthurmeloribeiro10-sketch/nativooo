import type { Product, ProductLookupResult } from "../types";
import type { ProductProvider } from "./ProductProvider";

const BASE_URL = "https://world.openfoodfacts.org/api/v2/product";
const FIELDS = [
  "code",
  "product_name",
  "brands",
  "image_url",
  "ingredients_text",
  "ingredients",
  "nutriments",
].join(",");
const REQUEST_TIMEOUT_MS = 8000;

type OffNutriments = Record<string, number | undefined>;

type OffIngredient = { text?: string; id?: string };

type OffResponse = {
  status: number;
  product?: {
    code?: string;
    product_name?: string;
    brands?: string;
    image_url?: string;
    ingredients_text?: string;
    ingredients?: OffIngredient[];
    nutriments?: OffNutriments;
  };
};

function num(n: number | undefined): number | null {
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

function toProduct(barcode: string, raw: NonNullable<OffResponse["product"]>): Product {
  const nutriments = raw.nutriments ?? {};
  return {
    barcode,
    provider: "openfoodfacts",
    providerId: raw.code ?? barcode,
    name: raw.product_name?.trim() || null,
    brand: raw.brands?.trim() || null,
    imageUrl: raw.image_url || null,
    ingredientsRaw: raw.ingredients_text?.trim() || null,
    ingredients: (raw.ingredients ?? [])
      .map((i) => (i.text ?? i.id ?? "").trim())
      .filter(Boolean)
      .map((text) => ({ raw: text, normalized: text.toLowerCase() })),
    nutrition: {
      energy_kcal_100g: num(nutriments["energy-kcal_100g"]),
      proteins_100g: num(nutriments["proteins_100g"]),
      carbohydrates_100g: num(nutriments["carbohydrates_100g"]),
      sugars_100g: num(nutriments["sugars_100g"]),
      fat_100g: num(nutriments["fat_100g"]),
      saturated_fat_100g: num(nutriments["saturated-fat_100g"]),
      fiber_100g: num(nutriments["fiber_100g"]),
      sodium_100g: num(nutriments["sodium_100g"]),
    },
  };
}

export class OpenFoodFactsProvider implements ProductProvider {
  readonly id = "openfoodfacts";

  async lookupByBarcode(barcode: string): Promise<ProductLookupResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(`${BASE_URL}/${encodeURIComponent(barcode)}.json?fields=${FIELDS}`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        return { ok: false, error: { type: "network_error" } };
      }

      const data = (await res.json()) as OffResponse;
      if (data.status !== 1 || !data.product) {
        return { ok: false, error: { type: "not_found" } };
      }

      return { ok: true, product: toProduct(barcode, data.product) };
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return { ok: false, error: { type: "network_error" } };
      }
      return { ok: false, error: { type: "unknown", message: e instanceof Error ? e.message : "erro desconhecido" } };
    } finally {
      clearTimeout(timeout);
    }
  }
}
