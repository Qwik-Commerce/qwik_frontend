const SITE_ORIGIN = "https://www.qwik.ng";

/** Builds an ItemList schema from ads actually rendered on the page — never fabricated data. */
export function buildItemListSchema(ads: Array<{ id: string; title: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: ads.map((ad, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE_ORIGIN}/product-details/${encodeURIComponent(ad.id)}`,
      name: ad.title,
    })),
  };
}

/** Builds a Home > Category breadcrumb schema for a category listing page. */
export function buildCategoryBreadcrumbSchema(categoryName: string, categoryUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_ORIGIN}/` },
      { "@type": "ListItem", position: 2, name: categoryName, item: categoryUrl },
    ],
  };
}
