/**
 * Canonical URL normalization for search/category pages.
 *
 * Only params that define genuinely distinct, indexable content are kept in the
 * canonical URL: `q`, `category`, `subcategory` (always emitted in this order).
 * Everything else — sort, minPrice, maxPrice, verified, condition, location,
 * pagination, and tracking params (utm_*, fbclid, gclid, etc.) — is a filter or
 * tracking param, not distinct content, so every such permutation canonicalizes
 * back to the same clean URL.
 */
const CANONICAL_PARAM_ORDER = ["q", "category", "subcategory"] as const;

export function buildCanonicalUrl(pathname: string, search: string): string {
  const params = new URLSearchParams(search);
  const kept = new URLSearchParams();
  for (const key of CANONICAL_PARAM_ORDER) {
    const value = params.get(key)?.trim();
    if (value) kept.set(key, value);
  }
  const queryString = kept.toString();
  return `https://www.qwik.ng${pathname}${queryString ? `?${queryString}` : ""}`;
}
