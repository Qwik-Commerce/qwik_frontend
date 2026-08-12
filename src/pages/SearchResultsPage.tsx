import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  buildProductDetailsRoute,
  buildSearchResultsRoute,
  buildSearchRoute,
} from "../constants/routes";
import { SiteFooter, SiteHeader } from "../components/AppShell";
import BeautySearchResultsView from "../components/search/BeautySearchResultsView";
import CategoryListingView, { CATEGORY_LISTING_CONFIGS } from "../components/search/CategoryListingView";
import ElectronicsSearchResultsView from "../components/search/ElectronicsSearchResultsView";
import FashionSearchResultsView from "../components/search/FashionSearchResultsView";
import FurnituresSearchResultsView from "../components/search/FurnituresSearchResultsView";
import JobSearchResultsView from "../components/search/JobSearchResultsView";
import PhonesSearchResultsView from "../components/search/PhonesSearchResultsView";
import ListingCard, { type ListingCardItem } from "../components/listings/ListingCard";
import VehicleSearchResultsView from "../components/search/VehicleSearchResultsView";
import BackButton from "../components/ui/BackButton";
import DropdownSelect from "../components/ui/DropdownSelect";
import { isBeautySearchQuery, isElectronicsSearchQuery, isFashionSearchQuery, isFurnitureSearchQuery, isJobSearchQuery, isPhonesSearchQuery, isVehicleSearchQuery } from "../lib/mockData";
import { getCategorySearchContext, getLocationSearchParam, NIGERIAN_LOCATIONS } from "../lib/searchContext";
import { isSellerVerified } from "../lib/sellerVerification";
import { api } from "../services/api";
import type { Ad, Category } from "../types";
import SeoHead from "../components/seo/SeoHead";
import { buildCanonicalUrl } from "../lib/seoCanonical";
import { buildItemListSchema } from "../lib/seoStructuredData";

type SortValue = "newest" | "price-low" | "price-high";
type VerifiedValue = "all" | "verified" | "unverified";
type SearchResultMode = "exact" | "related";

type Listing = ListingCardItem;

type SearchListing = Listing & { id: string };

const SORT_OPTIONS: Array<{ label: string; value: SortValue }> = [
  { label: "Newest first", value: "newest" },
  { label: "Price: Low to High", value: "price-low" },
  { label: "Price: High to Low", value: "price-high" },
];

const VERIFIED_OPTIONS: Array<{ label: string; value: VerifiedValue }> = [
  { label: "Show All", value: "all" },
  { label: "Verified Seller", value: "verified" },
  { label: "Unverified Seller", value: "unverified" },
];

function toConditionDisplay(value: string) {
  return value === "Brand New" ? "New" : value;
}

function toConditionQueryValue(value: string) {
  return value === "New" ? "Brand New" : value;
}

function GridResultSkeleton() {
  return (
    <article className="rounded-[22px] bg-white p-3 shadow-[0_10px_26px_rgba(31,29,39,0.04)]">
      <div className="h-[230px] animate-pulse rounded-[16px] bg-[#f2f2f4] sm:h-[260px]" />
      <div className="space-y-3 pt-4">
        <div className="h-5 w-28 animate-pulse rounded bg-[#f2f2f4]" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-[#f2f2f4]" />
        <div className="h-4 w-full animate-pulse rounded bg-[#f2f2f4]" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-[#f2f2f4]" />
      </div>
    </article>
  );
}

function formatNaira(value: number) {
  return `₦ ${value.toLocaleString()}`;
}

function FilterPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[22px] bg-white px-4 py-5 shadow-[0_10px_26px_rgba(31,29,39,0.04)] sm:px-5">
      <p className="mb-4 text-[15px] font-medium text-[#1f1d27]">{title}</p>
      {children}
    </div>
  );
}

function FilterOption({
  label,
  checked,
  onClick,
}: {
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 text-left text-[15px] text-[#2f2d37]">
      <span className={`grid h-7 w-7 place-items-center rounded-[8px] border ${checked ? "border-[#9a989f] bg-[#6f6d75] text-white" : "border-[#d6d2da] bg-white"}`}>
        {checked ? <span className="text-[14px] leading-none">✓</span> : null}
      </span>
      <span>{label}</span>
    </button>
  );
}

function GridIcon({ active = false }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 ${active ? "text-[#ff9715]" : "text-[#1f1d27]"}`} fill="currentColor" aria-hidden="true">
      <path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z" />
    </svg>
  );
}

function ListIcon({ active = false }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 ${active ? "text-[#ff9715]" : "text-[#1f1d27]"}`} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M8 7h12M8 12h12M8 17h12" />
      <circle cx="4" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="17" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function toListing(ad: Ad): SearchListing {
  return {
    id: ad.id,
    price: formatNaira(ad.price),
    title: ad.title,
    description: ad.description,
    location: ad.location,
    image: ad.images?.[0]?.url,
    verifiedSeller: isSellerVerified(ad.user),
  };
}

function sortAds(ads: Ad[], sortBy: SortValue) {
  return [...ads].sort((left, right) => {
    if (sortBy === "price-low") return left.price - right.price;
    if (sortBy === "price-high") return right.price - left.price;
    const rightCreatedAt = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    const leftCreatedAt = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    return rightCreatedAt - leftCreatedAt;
  });
}

function SearchFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  selectedSubcategory,
  onSubcategoryChange,
  selectedLocation,
  onLocationChange,
  sortBy,
  onSortByChange,
  selectedMinPrice,
  onMinPriceChange,
  selectedMaxPrice,
  maxPrice,
  onMaxPriceChange,
  verifiedFilter,
  onVerifiedFilterChange,
  condition,
  onConditionChange,
}: {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedSubcategory: string;
  onSubcategoryChange: (value: string) => void;
  selectedLocation: string;
  onLocationChange: (value: string) => void;
  sortBy: SortValue;
  onSortByChange: (value: SortValue) => void;
  selectedMinPrice: number;
  onMinPriceChange: (value: number) => void;
  selectedMaxPrice: number;
  maxPrice: number;
  onMaxPriceChange: (value: number) => void;
  verifiedFilter: VerifiedValue;
  onVerifiedFilterChange: (value: VerifiedValue) => void;
  condition: string;
  onConditionChange: (value: string) => void;
}) {
  const selectedCategoryObj = categories.find((c) => c.id === selectedCategory || c.slug === selectedCategory);
  const subcategoryOptions = selectedCategoryObj?.children ?? [];
  return (
    <div className="space-y-4">
      <FilterPanel title="Region">
        <DropdownSelect
          label=""
          placeholder="All Nigeria"
          value={selectedLocation}
          options={[
            { value: "", label: "All Nigeria" },
            ...NIGERIAN_LOCATIONS.filter((loc) => loc !== "All Nigeria").map((location) => ({ value: location, label: location })),
          ]}
          onChange={onLocationChange}
        />
      </FilterPanel>

      <FilterPanel title="Sort by">
        <div className="relative">
          <select
            value={sortBy}
            onChange={(event) => onSortByChange(event.target.value as SortValue)}
            className="w-full appearance-none bg-transparent pr-7 text-[15px] text-[#ff9715] outline-none"
            aria-label="Sort search results"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[#9794a1]">›</span>
        </div>
      </FilterPanel>

      <FilterPanel title="Categories">
        <div className="space-y-3">
          <FilterOption label="Show All" checked={selectedCategory === ""} onClick={() => onCategoryChange("")} />
          {categories.map((category) => (
            <FilterOption
              key={category.id}
              label={category.name}
              checked={selectedCategory === category.id || selectedCategory === category.slug}
              onClick={() => {
                onCategoryChange(category.id);
                onSubcategoryChange("");
              }}
            />
          ))}
        </div>
      </FilterPanel>

      {subcategoryOptions.length > 0 ? (
        <FilterPanel title="Subcategory">
          <div className="space-y-3">
            <FilterOption label="All" checked={selectedSubcategory === ""} onClick={() => onSubcategoryChange("")} />
            {subcategoryOptions.map((sub) => (
              <FilterOption key={sub.id} label={sub.name} checked={selectedSubcategory === sub.id} onClick={() => onSubcategoryChange(sub.id)} />
            ))}
          </div>
        </FilterPanel>
      ) : null}

      <FilterPanel title="Price">
        <div className="mb-4 flex items-center justify-between gap-3 text-[14px] text-[#5f5c68]">
          <span>{formatNaira(selectedMinPrice)}</span>
          <span>{formatNaira(selectedMaxPrice)}</span>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[13px] text-[#5f5c68]">Min</label>
            <input
              type="number"
              value={selectedMinPrice || ""}
              onChange={(event) => onMinPriceChange(Number(event.target.value) || 0)}
              className="w-full rounded border border-[#d6d2da] bg-white px-3 py-2 text-[14px] text-[#1f1d27]"
              placeholder="Min price"
            />
          </div>
          <div>
            <label className="text-[13px] text-[#5f5c68]">Max</label>
            <input
              type="number"
              value={selectedMaxPrice || ""}
              onChange={(event) => onMaxPriceChange(Number(event.target.value) || maxPrice)}
              className="w-full rounded border border-[#d6d2da] bg-white px-3 py-2 text-[14px] text-[#1f1d27]"
              placeholder="Max price"
            />
          </div>
        </div>
      </FilterPanel>

      <FilterPanel title="Condition">
        <div className="space-y-2">
          {["New", "Foreign Used", "Local Used"].map((cond) => (
            <button
              key={cond}
              type="button"
              onClick={() => onConditionChange(condition === cond ? "" : cond)}
              className="flex w-full items-center gap-3 text-left text-[15px] text-[#2f2d37]"
            >
              <span className={`grid h-7 w-7 place-items-center rounded-[8px] border ${condition === cond ? "border-[#9a989f] bg-[#6f6d75] text-white" : "border-[#d6d2da] bg-white"}`}>
                {condition === cond ? <span className="text-[14px] leading-none">✓</span> : null}
              </span>
              <span>{cond}</span>
            </button>
          ))}
        </div>
      </FilterPanel>

      <FilterPanel title="Verified Seller">
        <div className="space-y-3">
          {VERIFIED_OPTIONS.map((option) => (
            <FilterOption
              key={option.value}
              label={option.label}
              checked={verifiedFilter === option.value}
              onClick={() => onVerifiedFilterChange(option.value)}
            />
          ))}
        </div>
      </FilterPanel>
    </div>
  );
}

export default function SearchResultsPage() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() || "";
  const categoryContext = getCategorySearchContext(`?${searchParams.toString()}`);
  const categorySlug = categoryContext?.slug;
  const categoryViewLocation = getLocationSearchParam(`?${searchParams.toString()}`);

  if (categorySlug === "vehicles" || isVehicleSearchQuery(query)) {
    return (
      <div className="min-h-screen bg-page text-ink">
        <SiteHeader navigate={navigate} />
        <VehicleSearchResultsView query={query} navigate={navigate} view="grid" locationFilter={categoryViewLocation} />
        <SiteFooter navigate={navigate} />
      </div>
    );
  }

  if (categorySlug === "electronics" || isElectronicsSearchQuery(query)) {
    return (
      <div className="min-h-screen bg-page text-ink">
        <SiteHeader navigate={navigate} />
        <ElectronicsSearchResultsView query={query} navigate={navigate} view="grid" locationFilter={categoryViewLocation} />
        <SiteFooter navigate={navigate} />
      </div>
    );
  }

  if (categorySlug === "phones-tablets" || isPhonesSearchQuery(query)) {
    return (
      <div className="min-h-screen bg-page text-ink">
        <SiteHeader navigate={navigate} />
        <PhonesSearchResultsView query={query} navigate={navigate} view="grid" locationFilter={categoryViewLocation} />
        <SiteFooter navigate={navigate} />
      </div>
    );
  }

  if (categorySlug === "beauty" || isBeautySearchQuery(query)) {
    return (
      <div className="min-h-screen bg-page text-ink">
        <SiteHeader navigate={navigate} />
        <BeautySearchResultsView query={query} navigate={navigate} view="grid" locationFilter={categoryViewLocation} />
        <SiteFooter navigate={navigate} />
      </div>
    );
  }

  if (categorySlug === "fashion" || isFashionSearchQuery(query)) {
    return (
      <div className="min-h-screen bg-page text-ink">
        <SiteHeader navigate={navigate} />
        <FashionSearchResultsView query={query} navigate={navigate} view="grid" locationFilter={categoryViewLocation} />
        <SiteFooter navigate={navigate} />
      </div>
    );
  }

  if (categorySlug === "jobs" || isJobSearchQuery(query)) {
    return (
      <div className="min-h-screen bg-page text-ink">
        <SiteHeader navigate={navigate} />
        <JobSearchResultsView query={query} navigate={navigate} view="grid" locationFilter={categoryViewLocation} />
        <SiteFooter navigate={navigate} />
      </div>
    );
  }

  const categoryListingConfig = categorySlug ? CATEGORY_LISTING_CONFIGS[categorySlug] : undefined;
  if (categoryListingConfig) {
    return (
      <div className="min-h-screen bg-page text-ink">
        <SiteHeader navigate={navigate} />
        <CategoryListingView
          config={categoryListingConfig}
          query={query}
          navigate={navigate}
          locationFilter={categoryViewLocation}
        />
        <SiteFooter navigate={navigate} />
      </div>
    );
  }

  if (categorySlug === "furniture-appliances" || isFurnitureSearchQuery(query)) {
    return (
      <div className="min-h-screen bg-page text-ink">
        <SiteHeader navigate={navigate} />
        <FurnituresSearchResultsView query={query} navigate={navigate} view="grid" locationFilter={categoryViewLocation} />
        <SiteFooter navigate={navigate} />
      </div>
    );
  }

  const resultsLabel = query || "All Ads";
  const [categories, setCategories] = useState<Category[]>([]);
  const [matchedAds, setMatchedAds] = useState<Ad[]>([]);
  const [resultTotal, setResultTotal] = useState(0);
  const [resultMode, setResultMode] = useState<SearchResultMode>("exact");
  const [relatedTo, setRelatedTo] = useState("");
  const [loadingAds, setLoadingAds] = useState(true);
  const [adsError, setAdsError] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Parse URL params (for generic search results only)
  const sortBy = (searchParams.get("sort") as SortValue) || "newest";
  const selectedCategory = searchParams.get("category") || "";
  const selectedSubcategory = searchParams.get("subcategory") || "";
  const filtersLocation = searchParams.get("location") || "";
  const selectedMinPrice = Number(searchParams.get("minPrice")) || 0;
  const selectedMaxPrice = Number(searchParams.get("maxPrice")) || 0;
  const verifiedParam = searchParams.get("verified");
  const verifiedFilter: VerifiedValue = verifiedParam === "true" ? "verified" : verifiedParam === "false" ? "unverified" : "all";
  const rawCondition = searchParams.get("condition") || "";
  const condition = toConditionDisplay(rawCondition);

  // Update URL params helper
  const updateSearchParam = useCallback(
    (key: string, value: string | undefined) => {
      const newParams = new URLSearchParams(searchParams);
      if (value === undefined || value === "") {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
      navigate(`${window.location.pathname}?${newParams.toString()}`, { replace: true });
    },
    [searchParams, navigate],
  );

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.categories();
        setCategories(response.data);
      } catch {
        setCategories([]);
      }
    };
    void fetchCategories();
  }, []);

  // Fetch ads with all filter params
  const loadAds = useCallback(async () => {
    try {
      setLoadingAds(true);
      setAdsError(null);
      const params = new URLSearchParams({ pageSize: "24", imagesLimit: "1" });
      if (query) params.set("q", query);
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedSubcategory) params.set("subcategory", selectedSubcategory);
      if (filtersLocation) params.set("location", filtersLocation);
      if (selectedMinPrice > 0) params.set("minPrice", String(selectedMinPrice));
      if (selectedMaxPrice > 0) params.set("maxPrice", String(selectedMaxPrice));
      if (sortBy && sortBy !== "newest") params.set("sort", sortBy);
      if (condition) params.set("condition", toConditionQueryValue(condition));

      const response = await api.ads(`?${params.toString()}`);
      setMatchedAds(response.data);
      setResultTotal(response.meta?.total ?? response.data.length);
      setResultMode(response.meta?.resultMode === "related" ? "related" : "exact");
      setRelatedTo(response.meta?.relatedTo ?? query);
    } catch (err) {
      setAdsError(err instanceof Error ? err.message : "Failed to load ads");
      setMatchedAds([]);
      setResultTotal(0);
      setResultMode("exact");
      setRelatedTo("");
    } finally {
      setLoadingAds(false);
    }
  }, [query, selectedCategory, selectedSubcategory, filtersLocation, selectedMinPrice, selectedMaxPrice, sortBy, condition, verifiedFilter]);

  useEffect(() => {
    void loadAds();
  }, [loadAds]);

  // Client-side filter for verified sellers (backend doesn't support yet)
  const filteredAds = useMemo(() => {
    return matchedAds.filter((ad) => {
      const verified = isSellerVerified(ad.user);
      if (verifiedFilter === "verified" && !verified) return false;
      if (verifiedFilter === "unverified" && verified) return false;
      return true;
    });
  }, [matchedAds, verifiedFilter]);

  const results = filteredAds.map(toListing);
  const displayedResultCount = verifiedFilter === "all" ? resultTotal : results.length;

  return (
    <div className="min-h-screen bg-page text-ink">
      <SeoHead
        title={query ? `Search Results for "${query}" | Qwik` : "Browse All Ads in Nigeria | Qwik"}
        description={query ? `Browse search results for "${query}" on Qwik, Nigeria's trusted online marketplace.` : "Browse all ads for sale across Nigeria on Qwik."}
        canonicalUrl={buildCanonicalUrl(routerLocation.pathname, routerLocation.search)}
        structuredData={filteredAds.length > 0 ? [buildItemListSchema(filteredAds)] : []}
      />
      <SiteHeader navigate={navigate} />

      <main className="mx-auto w-full max-w-[1728px] px-4 pb-20 pt-8 sm:px-6 lg:px-12">
        {mobileFiltersOpen ? (
          <div className="fixed inset-0 z-[110] bg-[#1f1d27]/38 xl:hidden" onClick={() => setMobileFiltersOpen(false)}>
            <div
              className="ml-auto h-full w-[min(88vw,360px)] overflow-y-auto bg-page px-4 py-6 shadow-[0_18px_40px_rgba(31,29,39,0.18)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-[20px] font-medium text-[#1f1d27]">Filters</h2>
                <button type="button" className="text-[14px] text-[#ff9715]" onClick={() => setMobileFiltersOpen(false)}>
                  Close
                </button>
              </div>
              <SearchFilters
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={(val) => {
                  updateSearchParam("category", val || undefined);
                  updateSearchParam("subcategory", undefined);
                }}
                selectedSubcategory={selectedSubcategory}
                onSubcategoryChange={(val) => updateSearchParam("subcategory", val || undefined)}
                selectedLocation={filtersLocation}
                onLocationChange={(val) => updateSearchParam("location", val || undefined)}
                sortBy={sortBy}
                onSortByChange={(val) => updateSearchParam("sort", val === "newest" ? undefined : val)}
                selectedMinPrice={selectedMinPrice}
                onMinPriceChange={(val) => updateSearchParam("minPrice", val > 0 ? String(val) : undefined)}
                selectedMaxPrice={selectedMaxPrice}
                maxPrice={Math.max(...matchedAds.map((ad) => ad.price), 100200000)}
                onMaxPriceChange={(val) => updateSearchParam("maxPrice", val > 0 ? String(val) : undefined)}
                verifiedFilter={verifiedFilter}
                onVerifiedFilterChange={(val) => {
                  if (val === "verified") updateSearchParam("verified", "true");
                  else if (val === "unverified") updateSearchParam("verified", "false");
                  else updateSearchParam("verified", undefined);
                }}
                condition={condition}
                onConditionChange={(val) => updateSearchParam("condition", val || undefined)}
              />
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[256px_minmax(0,1fr)] xl:items-start xl:h-[calc(100vh-112px)] xl:overflow-hidden">
          <aside className="hidden space-y-4 xl:block xl:h-full xl:overflow-y-auto xl:pr-1">
            <SearchFilters
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={(val) => {
                updateSearchParam("category", val || undefined);
                updateSearchParam("subcategory", undefined);
              }}
              selectedSubcategory={selectedSubcategory}
              onSubcategoryChange={(val) => updateSearchParam("subcategory", val || undefined)}
              selectedLocation={filtersLocation}
              onLocationChange={(val) => updateSearchParam("location", val || undefined)}
              sortBy={sortBy}
              onSortByChange={(val) => updateSearchParam("sort", val === "newest" ? undefined : val)}
              selectedMinPrice={selectedMinPrice}
              onMinPriceChange={(val) => updateSearchParam("minPrice", val > 0 ? String(val) : undefined)}
              selectedMaxPrice={selectedMaxPrice}
              maxPrice={Math.max(...matchedAds.map((ad) => ad.price), 100200000)}
              onMaxPriceChange={(val) => updateSearchParam("maxPrice", val > 0 ? String(val) : undefined)}
              verifiedFilter={verifiedFilter}
              onVerifiedFilterChange={(val) => {
                if (val === "verified") updateSearchParam("verified", "true");
                else if (val === "unverified") updateSearchParam("verified", "false");
                else updateSearchParam("verified", undefined);
              }}
              condition={condition}
              onConditionChange={(val) => updateSearchParam("condition", val || undefined)}
            />
          </aside>

          <section className="min-w-0 xl:h-full xl:overflow-y-auto xl:pr-1">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <BackButton />
            </div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="inline-flex h-11 items-center justify-center rounded-[12px] border border-[#e2ded7] bg-white px-4 text-[14px] font-medium text-[#1f1d27] shadow-[0_8px_20px_rgba(31,29,39,0.05)] xl:hidden"
                >
                  Filters
                </button>
                <h1 className="text-[28px] font-medium tracking-[-0.02em] text-[#1f1d27] sm:text-[36px]">
                  Found <span className="text-[#ff9715]">{loadingAds ? "\u2026" : displayedResultCount.toLocaleString()}</span> results for "{resultsLabel}"
                </h1>
              </div>
              <div className="flex items-center gap-2 self-start">
                <button
                  type="button"
                  onClick={() => navigate(buildSearchResultsRoute(query || undefined))}
                  className="grid h-10 w-10 place-items-center rounded-[10px] bg-[#fff3e5]"
                  aria-label="Grid view"
                  title="Grid view"
                >
                  <GridIcon active />
                </button>
                <button
                  type="button"
                  onClick={() => navigate(buildSearchRoute(query || undefined))}
                  className="grid h-10 w-10 place-items-center rounded-[10px] bg-transparent hover:bg-[#f4f1eb]"
                  aria-label="List view"
                  title="List view"
                >
                  <ListIcon />
                </button>
              </div>
            </div>
            {loadingAds ? (
              <div className="grid grid-cols-2 gap-5 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <GridResultSkeleton key={index} />
                ))}
              </div>
            ) : adsError ? (
              <div className="rounded-[24px] border border-[#f0d1d1] bg-white px-6 py-12 text-center shadow-[0_8px_24px_rgba(31,29,39,0.05)]">
                <h2 className="text-[22px] font-medium text-[#1f1d27]">Failed to load ads</h2>
                <p className="mt-3 text-[15px] leading-[1.6] text-[#6d6a74]">{adsError}</p>
                <button
                  type="button"
                  onClick={loadAds}
                  className="mt-5 rounded-[8px] bg-gradient-to-r from-amber to-orange px-4 py-2 text-[15px] text-white"
                >
                  Retry
                </button>
              </div>
            ) : results.length === 0 ? (
              <div className="rounded-[24px] border border-[#ddd9d2] bg-white px-6 py-12 text-center shadow-[0_8px_24px_rgba(31,29,39,0.05)]">
                <h2 className="text-[22px] font-medium text-[#1f1d27]">
                  {resultMode === "related" ? "No exact results found" : "No results found"}
                </h2>
                <p className="mt-3 text-[15px] leading-[1.6] text-[#6d6a74]">
                  Try another keyword or adjust the filters to widen your search for “{resultsLabel}”.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {resultMode === "related" ? (
                  <div className="rounded-[20px] border border-[#ffe1b8] bg-[#fff8ef] px-5 py-4">
                    <p className="text-[18px] font-medium text-[#1f1d27]">No exact results found</p>
                    <p className="mt-1 text-[14px] leading-[1.6] text-[#6d6a74]">
                      Related ads you may like for “{relatedTo || resultsLabel}”.
                    </p>
                  </div>
                ) : null}
                <div className="grid grid-cols-2 gap-5 xl:grid-cols-3">
                  {results.map((item) => (
                    <ListingCard
                      key={item.id}
                      item={item}
                      href={buildProductDetailsRoute(item.id)}
                      interactive
                      clampTitleLines={2}
                      clampDescriptionLines={3}
                      clampLocationLines={1}
                      imageHeightClassName="h-[230px] sm:h-[260px]"
                      onClick={() => navigate(buildProductDetailsRoute(item.id))}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <SiteFooter navigate={navigate} />
    </div>
  );
}
