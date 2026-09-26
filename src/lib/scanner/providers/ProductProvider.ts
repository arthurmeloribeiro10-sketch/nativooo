import type { ProductLookupResult } from "../types";

/**
 * Abstração de fonte de produtos. Novos providers (ex.: base própria do
 * Apollo) implementam esta interface sem exigir mudanças no resto do scanner.
 */
export interface ProductProvider {
  readonly id: string;
  lookupByBarcode(barcode: string): Promise<ProductLookupResult>;
}
