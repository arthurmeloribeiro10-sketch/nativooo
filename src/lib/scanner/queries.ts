import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { OpenFoodFactsProvider } from "./providers/OpenFoodFactsProvider";
import { ensureNormalizedIngredients } from "./normalizer";
import { computeApoloScore } from "./engine";
import type {
  ApoloScoreResult,
  IngredientRule,
  Product,
  ProductLookupError,
  ScanSource,
} from "./types";

// As tabelas do scanner (products, product_scans, product_scores,
// ingredient_rules, saved_products, product_provider_cache) existem só na
// migration supabase/migrations/20260919120000_*.sql — ainda NÃO foram
// aplicadas ao projeto Supabase remoto nem entraram no `Database` gerado.
// Por isso o cast `any` local abaixo. Assim que a migration rodar, rode de
// novo `supabase gen types typescript` e troque este arquivo para usar
// `supabase` tipado normalmente, removendo o cast e os `any` abaixo.
/* eslint-disable @typescript-eslint/no-explicit-any */
const db = supabase as any;

const provider = new OpenFoodFactsProvider();

function mapRuleRow(row: any): IngredientRule {
  return {
    id: row.id,
    matchType: row.match_type,
    matchValue: row.match_value,
    weight: Number(row.weight),
    impact: row.impact,
    explanation: row.explanation,
    source: row.source,
    methodologyVersion: row.methodology_version,
  };
}

function mapProductRow(row: any): Product {
  return {
    barcode: row.barcode,
    provider: row.provider,
    providerId: row.provider_id,
    name: row.name,
    brand: row.brand,
    imageUrl: row.image_url,
    ingredientsRaw: row.ingredients_raw,
    ingredients: row.ingredients_normalized ?? [],
    nutrition: row.nutrition ?? {},
  };
}

export function useIngredientRules() {
  return useQuery({
    queryKey: ["scanner", "ingredient-rules"],
    queryFn: async (): Promise<IngredientRule[]> => {
      const { data, error } = await db.from("ingredient_rules").select("*").eq("active", true);
      if (error) throw error;
      return (data ?? []).map(mapRuleRow);
    },
    staleTime: 60 * 60 * 1000,
  });
}

async function fetchCachedProduct(barcode: string): Promise<Product | null> {
  const { data, error } = await db
    .from("products")
    .select("*")
    .eq("barcode", barcode)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProductRow(data) : null;
}

async function cacheProduct(product: Product): Promise<string> {
  const { data, error } = await db
    .from("products")
    .upsert(
      {
        barcode: product.barcode,
        provider: product.provider,
        provider_id: product.providerId,
        name: product.name,
        brand: product.brand,
        image_url: product.imageUrl,
        ingredients_raw: product.ingredientsRaw,
        ingredients_normalized: product.ingredients,
        nutrition: product.nutrition,
      },
      { onConflict: "barcode" },
    )
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export type ScanOutcome =
  | {
      ok: true;
      scanId: string | null;
      product: Product;
      productId: string;
      result: ApoloScoreResult;
    }
  | { ok: false; error: ProductLookupError };

/** barcode → cache Apollo → provider externo → normaliza → score → salva → mostra. */
export function useScanBarcode(userId: string | undefined) {
  const qc = useQueryClient();
  const rules = useIngredientRules();

  return useMutation({
    mutationFn: async ({
      barcode,
      source,
    }: {
      barcode: string;
      source: ScanSource;
    }): Promise<ScanOutcome> => {
      let product = await fetchCachedProduct(barcode);

      if (!product) {
        const lookup = await provider.lookupByBarcode(barcode);
        if (!lookup.ok) return { ok: false, error: lookup.error };
        product = ensureNormalizedIngredients(lookup.product);
      }

      const productId = await cacheProduct(product);
      const result = computeApoloScore(product, rules.data ?? []);

      const { data: scoreRow, error: scoreError } = await db
        .from("product_scores")
        .upsert(
          {
            product_id: productId,
            score: result.score,
            category: result.category,
            reasons: result.reasons,
            warnings: result.warnings,
            engine_version: result.engineVersion,
          },
          { onConflict: "product_id,engine_version" },
        )
        .select("id")
        .single();
      if (scoreError) throw scoreError;

      let scanId: string | null = null;
      if (userId) {
        const { data: scanRow, error: scanError } = await db
          .from("product_scans")
          .insert({
            user_id: userId,
            product_id: productId,
            score_id: scoreRow.id,
            barcode,
            source,
          })
          .select("id")
          .single();
        if (scanError) throw scanError;
        scanId = scanRow.id as string;
      }

      return { ok: true, scanId, product, productId, result };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scanner", "history", userId] });
    },
  });
}

export function useSaveProduct(userId: string | undefined) {
  return useMutation({
    mutationFn: async (productId: string) => {
      if (!userId) throw new Error("Usuário não autenticado");
      const { error } = await db
        .from("saved_products")
        .upsert(
          { user_id: userId, product_id: productId },
          { onConflict: "user_id,product_id", ignoreDuplicates: true },
        );
      if (error) throw error;
    },
  });
}

export type ScanHistoryItem = {
  scanId: string;
  scannedAt: string;
  barcode: string;
  product: Product | null;
  score: number | null;
  category: string | null;
};

export function useScanHistory(userId: string | undefined) {
  return useQuery({
    queryKey: ["scanner", "history", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<ScanHistoryItem[]> => {
      const { data, error } = await db
        .from("product_scans")
        .select("id, scanned_at, barcode, products(*), product_scores(score, category)")
        .eq("user_id", userId)
        .order("scanned_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        scanId: row.id,
        scannedAt: row.scanned_at,
        barcode: row.barcode,
        product: row.products ? mapProductRow(row.products) : null,
        score: row.product_scores?.score ?? null,
        category: row.product_scores?.category ?? null,
      }));
    },
  });
}
