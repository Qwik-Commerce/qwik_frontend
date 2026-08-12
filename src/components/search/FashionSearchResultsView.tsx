import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import {
  buildProductDetailsRoute,
  buildSearchRoute,
  ROUTES,
} from "../../constants/routes";
import { ALL_NIGERIA_LOCATION, isCategoryMarkerQuery, NIGERIAN_LOCATIONS } from "../../lib/searchContext";
import { isSellerVerified } from "../../lib/sellerVerification";
import {
  getFashionSearchState,
  type FashionBrand,
  type FashionCategory,
  type FashionColor,
  type FashionCondition,
  type FashionSearchState,
  type FashionStripItem,
  type FashionStyle,
  type FashionType,
  type MockFashionListing,
} from "../../lib/mockData";
import { getAdConditionLabel } from "../../lib/adCondition";
import { api } from "../../services/api";
import type { Ad } from "../../types";
import ListingCard from "../listings/ListingCard";
import BackButton from "../ui/BackButton";
import SeoHead from "../seo/SeoHead";
import { buildCanonicalUrl } from "../../lib/seoCanonical";
import { buildCategoryBreadcrumbSchema, buildItemListSchema } from "../../lib/seoStructuredData";
import { CategoryBubbleAvatar } from "./CategoryBubbleAvatar";
import DropdownSelect from "../ui/DropdownSelect";
import { getBubbleInitials, getCategoryBubbleImage } from "../../lib/categoryBubbleImages";

type NavigateTo = (to: string) => void;
type SortValue = "newest" | "price-low" | "price-high";
type VerifiedValue = "all" | "verified" | "unverified";
type FashionView = "grid" | "list";

type FashionSearchResultsViewProps = {
  query: string;
  navigate: NavigateTo;
  view: FashionView;
  locationFilter?: string;
};

type FashionStateConfig = {
  canonicalQuery: string;
  title: string;
  subtitle: string;
  stripItems: Array<{ name: FashionStripItem; image?: string; routeQuery?: string }>;
  defaultStrip: FashionStripItem | "all";
  defaultCategory: "all" | FashionCategory;
};

const FASHION_CATEGORY_OPTIONS: Array<"all" | FashionCategory> = ["all", "Men's Fashion", "Women's Fashion", "Baby & Kids Fashion"];
const FASHION_TYPE_OPTIONS: Array<"all" | FashionType> = ["all", "Clothings", "Bags", "Jewelry", "Shoe"];
const FASHION_BRAND_OPTIONS: Array<"all" | FashionBrand> = ["all", "Nike", "Louis Vuitton", "Adidas"];
const FASHION_STYLE_OPTIONS: Array<"all" | FashionStyle> = ["all", "Casual", "Formal", "Vintage"];
const FASHION_COLOR_OPTIONS: Array<"all" | FashionColor> = ["all", "Black", "Multi", "White"];
const FASHION_CONDITION_OPTIONS: Array<"all" | FashionCondition> = ["all", "New", "Used"];
const VERIFIED_OPTIONS: Array<{ label: string; value: VerifiedValue }> = [
  { label: "Show All", value: "all" },
  { label: "Verified Seller", value: "verified" },
  { label: "Unverified Seller", value: "unverified" },
];
const SORT_OPTIONS: Array<{ label: string; value: SortValue }> = [
  { label: "Newest first", value: "newest" },
  { label: "Price: Low to High", value: "price-low" },
  { label: "Price: High to Low", value: "price-high" },
];

const FASHION_STATE_CONFIG: Record<FashionSearchState, FashionStateConfig> = {
  general: {
    canonicalQuery: "Fashion",
    title: "Fashion",
    subtitle: "Fashion In Nigeria",
    defaultStrip: "all",
    defaultCategory: "all",
    stripItems: [
      { name: "Men's Fashion", image: getCategoryBubbleImage("fashion", "Men's Fashion"), routeQuery: "Men's Fashion" },
      { name: "Women's Fashion", image: getCategoryBubbleImage("fashion", "Women's Fashion"), routeQuery: "Women's Fashion" },
      { name: "Baby & Kids Fashion", image: getCategoryBubbleImage("fashion", "Baby & Kids Fashion"), routeQuery: "Baby & Kids Fashion" },
    ],
  },
  men: {
    canonicalQuery: "Men's Fashion",
    title: "Men's Fashion",
    subtitle: "Men's Fashion In Nigeria",
    defaultStrip: "Shirt",
    defaultCategory: "Men's Fashion",
    stripItems: [
      { name: "Shirt", image: "/fashion-categories/mens%20fashion/shirt.png" },
      { name: "Suits", image: "/fashion-categories/mens%20fashion/suit.png" },
      { name: "T-shirt & Tanks", image: "/fashion-categories/mens%20fashion/t-shirts-and%20-tanks.png" },
      { name: "Jeans", image: "/fashion-categories/mens%20fashion/jeans.png" },
      { name: "Active Wear", image: "/fashion-categories/mens%20fashion/active-wear.png" },
      { name: "Bags", image: "/fashion-categories/mens%20fashion/bags.png" },
      { name: "Jewelry", image: "/fashion-categories/mens%20fashion/jewelry.png" },
    ],
  },
  women: {
    canonicalQuery: "Women's Fashion",
    title: "Women's Fashion",
    subtitle: "Women's Fashion In Nigeria",
    defaultStrip: "Shirt",
    defaultCategory: "Women's Fashion",
    stripItems: [
      { name: "Shirt", image: "/fashion-categories/womens%20fashion/shirt.png" },
      { name: "Suits", image: "/fashion-categories/womens%20fashion/suit.png" },
      { name: "Jeans", image: "/fashion-categories/womens%20fashion/jeans.png" },
      { name: "Dresses", image: "/fashion-categories/womens%20fashion/dresses.png" },
      { name: "Active Wear", image: "/fashion-categories/womens%20fashion/active-wear.png" },
      { name: "Bags", image: "/fashion-categories/womens%20fashion/bags.png" },
      { name: "Jewelry", image: "/fashion-categories/womens%20fashion/jewelries.png" },
    ],
  },
  "baby-kids": {
    canonicalQuery: "Baby & Kids Fashion",
    title: "Baby & Kids Fashion",
    subtitle: "Baby & Kid's Fashion In Nigeria",
    defaultStrip: "Clothing set",
    defaultCategory: "Baby & Kids Fashion",
    stripItems: [
      { name: "Clothing set", image: "/fashion-categories/kids%20fashion/clothing-set.png" },
      { name: "Ball Gowns", image: "/fashion-categories/kids%20fashion/ball-gown.png" },
      { name: "Dresses", image: "/fashion-categories/kids%20fashion/dresses.png" },
      { name: "Jeans", image: "/fashion-categories/kids%20fashion/jeans.png" },
      { name: "Shirt", image: "/fashion-categories/kids%20fashion/shirts.png" },
      { name: "Shoes", image: "/fashion-categories/kids%20fashion/shoes.png" },
      { name: "Caps", image: "/fashion-categories/kids%20fashion/cap.png" },
    ],
  },
};

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

function FilterOption({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
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

function StripBubble({
  name,
  image,
  active,
  onClick,
}: {
  name: FashionStripItem;
  image?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="flex min-w-[92px] flex-col items-center gap-1.5 text-center sm:min-w-[100px]">
      <CategoryBubbleAvatar
        alt={name}
        imageSrc={image}
        fallbackText={getBubbleInitials(name)}
        className={`grid h-[60px] w-[60px] place-items-center overflow-hidden rounded-full border ${active ? "border-[#1f1d27]" : "border-[#ddd9d2]"}`}
      />
      <span className="text-[13px] font-medium leading-[1.15] text-[#1f1d27]">{name}</span>
    </button>
  );
}

function sortFashionResults(results: MockFashionListing[], sortBy: SortValue) {
  return [...results].sort((left, right) => {
    if (sortBy === "price-low") return left.ad.price - right.ad.price;
    if (sortBy === "price-high") return right.ad.price - left.ad.price;
    const rightCreatedAt = right.ad.createdAt ? new Date(right.ad.createdAt).getTime() : 0;
    const leftCreatedAt = left.ad.createdAt ? new Date(left.ad.createdAt).getTime() : 0;
    return rightCreatedAt - leftCreatedAt;
  });
}

function toFashionResult(ad: Ad): MockFashionListing {
  const brand = FASHION_BRAND_OPTIONS.includes(ad.brand as FashionBrand) ? (ad.brand as FashionBrand) : "Nike";
  const normalizedCondition = getAdConditionLabel(ad.condition);
  const condition = FASHION_CONDITION_OPTIONS.includes(normalizedCondition as FashionCondition) ? (normalizedCondition as FashionCondition) : "Used";
  return {
    id: ad.id,
    ad,
    categoryType: "Men's Fashion",
    fashionType: "Clothings",
    stripCategory: "Shirt",
    brand,
    style: "Casual",
    color: "Black",
    condition,
  } as MockFashionListing;
}

function FashionFilters({
  selectedCategory,
  onSelectedCategoryChange,
  selectedType,
  onSelectedTypeChange,
  selectedBrand,
  onSelectedBrandChange,
  selectedStyle,
  onSelectedStyleChange,
  selectedColor,
  onSelectedColorChange,
  verifiedFilter,
  onVerifiedFilterChange,
  selectedMaxPrice,
  onSelectedMaxPriceChange,
  selectedCondition,
  onSelectedConditionChange,
  sortBy,
  onSortByChange,
  selectedLocation,
  onSelectedLocationChange,
  maxPrice,
}: {
  selectedCategory: "all" | FashionCategory;
  onSelectedCategoryChange: (value: "all" | FashionCategory) => void;
  selectedType: "all" | FashionType;
  onSelectedTypeChange: (value: "all" | FashionType) => void;
  selectedBrand: "all" | FashionBrand;
  onSelectedBrandChange: (value: "all" | FashionBrand) => void;
  selectedStyle: "all" | FashionStyle;
  onSelectedStyleChange: (value: "all" | FashionStyle) => void;
  selectedColor: "all" | FashionColor;
  onSelectedColorChange: (value: "all" | FashionColor) => void;
  verifiedFilter: VerifiedValue;
  onVerifiedFilterChange: (value: VerifiedValue) => void;
  selectedMaxPrice: number;
  onSelectedMaxPriceChange: (value: number) => void;
  selectedCondition: "all" | FashionCondition;
  onSelectedConditionChange: (value: "all" | FashionCondition) => void;
  sortBy: SortValue;
  onSortByChange: (value: SortValue) => void;
  selectedLocation: string;
  onSelectedLocationChange: (value: string) => void;
  maxPrice: number;
}) {
  return (
    <div className="space-y-4">
      <FilterPanel title="Region">
        <DropdownSelect
          label=""
          placeholder={ALL_NIGERIA_LOCATION}
          value={selectedLocation}
          options={[
            { value: "", label: ALL_NIGERIA_LOCATION },
            ...NIGERIAN_LOCATIONS.filter((loc) => loc !== ALL_NIGERIA_LOCATION).map((location) => ({ value: location, label: location })),
          ]}
          onChange={onSelectedLocationChange}
        />
      </FilterPanel>

      <FilterPanel title="Sort by">
        <div className="relative">
          <select
            value={sortBy}
            onChange={(event) => onSortByChange(event.target.value as SortValue)}
            className="w-full appearance-none bg-transparent pr-7 text-[15px] text-[#ff9715] outline-none"
            aria-label="Sort fashion results"
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
          {FASHION_CATEGORY_OPTIONS.map((option) => (
            <FilterOption
              key={option}
              label={option === "all" ? "Show All" : option}
              checked={selectedCategory === option}
              onClick={() => onSelectedCategoryChange(option)}
            />
          ))}
        </div>
      </FilterPanel>

      <FilterPanel title="Types">
        <div className="space-y-3">
          {FASHION_TYPE_OPTIONS.map((option) => (
            <FilterOption
              key={option}
              label={option === "all" ? "Show All" : option}
              checked={selectedType === option}
              onClick={() => onSelectedTypeChange(option)}
            />
          ))}
        </div>
      </FilterPanel>

      <FilterPanel title="Brand">
        <div className="space-y-3">
          {FASHION_BRAND_OPTIONS.map((option) => (
            <FilterOption
              key={option}
              label={option === "all" ? "Show All" : option}
              checked={selectedBrand === option}
              onClick={() => onSelectedBrandChange(option)}
            />
          ))}
        </div>
      </FilterPanel>

      <FilterPanel title="Style">
        <div className="space-y-3">
          {FASHION_STYLE_OPTIONS.map((option) => (
            <FilterOption
              key={option}
              label={option === "all" ? "Show All" : option}
              checked={selectedStyle === option}
              onClick={() => onSelectedStyleChange(option)}
            />
          ))}
        </div>
      </FilterPanel>

      <FilterPanel title="Color">
        <div className="space-y-3">
          {FASHION_COLOR_OPTIONS.map((option) => (
            <FilterOption
              key={option}
              label={option === "all" ? "Show All" : option}
              checked={selectedColor === option}
              onClick={() => onSelectedColorChange(option)}
            />
          ))}
        </div>
      </FilterPanel>

      <FilterPanel title="Verified Sellers">
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

      <FilterPanel title="Price">
        <div className="mb-4 flex items-center justify-between gap-3 text-[14px] text-[#5f5c68]">
          <span>{formatNaira(200000)}</span>
          <span>{formatNaira(selectedMaxPrice)}</span>
        </div>
        <input
          type="range"
          min={200000}
          max={maxPrice}
          step={Math.max(Math.round(maxPrice / 100), 1000)}
          value={selectedMaxPrice}
          onChange={(event) => onSelectedMaxPriceChange(Number(event.target.value))}
          className="w-full accent-[#ff9715]"
          aria-label="Maximum fashion price"
        />
      </FilterPanel>

      <FilterPanel title="Condition">
        <div className="space-y-3">
          {FASHION_CONDITION_OPTIONS.map((option) => (
            <FilterOption
              key={option}
              label={option === "all" ? "Show All" : option}
              checked={selectedCondition === option}
              onClick={() => onSelectedConditionChange(option)}
            />
          ))}
        </div>
      </FilterPanel>
    </div>
  );
}

export default function FashionSearchResultsView({ query, navigate, view, locationFilter }: FashionSearchResultsViewProps) {
  const routerLocation = useLocation();
  const state = getFashionSearchState(query) ?? "general";
  const stateConfig = FASHION_STATE_CONFIG[state];
  const [selectedCategory, setSelectedCategory] = useState<"all" | FashionCategory>(stateConfig.defaultCategory);
  const [selectedType, setSelectedType] = useState<"all" | FashionType>("all");
  const [selectedBrand, setSelectedBrand] = useState<"all" | FashionBrand>("all");
  const [selectedStyle, setSelectedStyle] = useState<"all" | FashionStyle>("all");
  const [selectedColor, setSelectedColor] = useState<"all" | FashionColor>("all");
  const [verifiedFilter, setVerifiedFilter] = useState<VerifiedValue>("all");
  const [selectedCondition, setSelectedCondition] = useState<"all" | FashionCondition>("all");
  const [sortBy, setSortBy] = useState<SortValue>("newest");
  const [selectedStripCategory, setSelectedStripCategory] = useState<FashionStripItem | "all">(stateConfig.defaultStrip);
  const [fashionResults, setFashionResults] = useState<MockFashionListing[]>([]);
  const [resultTotal, setResultTotal] = useState(0);
  const [loadingAds, setLoadingAds] = useState(true);
  const maxPrice = useMemo(() => Math.max(...fashionResults.map((item) => item.ad.price), 100200000), [fashionResults]);
  const [selectedMaxPrice, setSelectedMaxPrice] = useState(100200000);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const onLocationChange = (value: string) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (value) params.set("location", value);
    else params.delete("location");
    const search = params.toString();
    navigate(`${window.location.pathname}${search ? `?${search}` : ""}`);
  };

  const navigateToView = (path: string) => {
    if (typeof window === "undefined") {
      navigate(path);
      return;
    }
    navigate(`${path}${window.location.search}`);
  };

  useEffect(() => {
    const loadAds = async () => {
      setLoadingAds(true);
      try {
        const params = new URLSearchParams({ category: "fashion", pageSize: "24", imagesLimit: "1" });
        if (query && !isCategoryMarkerQuery(query)) params.set("q", query);
        if (locationFilter) params.set("location", locationFilter);
        const response = await api.ads(`?${params.toString()}`);
        setFashionResults(response.data.map(toFashionResult));
        setResultTotal(response.meta?.total ?? response.data.length);
      } finally {
        setLoadingAds(false);
      }
    };
    void loadAds();
  }, [query, locationFilter]);

  useEffect(() => {
    setSelectedCategory(stateConfig.defaultCategory);
    setSelectedType("all");
    setSelectedBrand("all");
    setSelectedStyle("all");
    setSelectedColor("all");
    setVerifiedFilter("all");
    setSelectedCondition("all");
    setSortBy("newest");
    setSelectedStripCategory(stateConfig.defaultStrip);
    setSelectedMaxPrice(100200000);
    setMobileFiltersOpen(false);
  }, [stateConfig]);

  const filteredResults = useMemo(
    () =>
      sortFashionResults(
        fashionResults.filter((item) => {
          const verified = isSellerVerified(item.ad.user);
          const categoryMatches = selectedCategory === "all" || item.categoryType === selectedCategory;
          const typeMatches = selectedType === "all" || item.fashionType === selectedType;
          const brandMatches = selectedBrand === "all" || item.brand === selectedBrand;
          const styleMatches = selectedStyle === "all" || item.style === selectedStyle;
          const colorMatches = selectedColor === "all" || item.color === selectedColor;
          const verifiedMatches =
            verifiedFilter === "all" ||
            (verifiedFilter === "verified" && verified) ||
            (verifiedFilter === "unverified" && !verified);
          const conditionMatches = selectedCondition === "all" || item.condition === selectedCondition;
          const priceMatches = item.ad.price <= selectedMaxPrice;
          const stripMatches = selectedStripCategory === "all" || item.stripCategory === selectedStripCategory || item.categoryType === selectedStripCategory;
          return categoryMatches && typeMatches && brandMatches && styleMatches && colorMatches && verifiedMatches && conditionMatches && priceMatches && stripMatches;
        }),
        sortBy,
      ),
    [fashionResults, selectedBrand, selectedCategory, selectedColor, selectedCondition, selectedMaxPrice, selectedStripCategory, selectedStyle, selectedType, sortBy, verifiedFilter],
  );

  return (
    <>
      <SeoHead
        title="Fashion for Sale in Nigeria | Qwik"
        description="Shop clothing, shoes and fashion accessories for sale across Nigeria on Qwik."
        canonicalUrl={buildCanonicalUrl(routerLocation.pathname, routerLocation.search)}
        structuredData={[
          buildCategoryBreadcrumbSchema("Fashion", buildCanonicalUrl(routerLocation.pathname, routerLocation.search)),
          ...(filteredResults.length > 0 ? [buildItemListSchema(filteredResults.map((item) => item.ad))] : []),
        ]}
      />
      <main className="mx-auto w-full max-w-[1728px] overflow-x-clip px-4 pb-20 pt-8 sm:px-6 lg:px-12">
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
            <FashionFilters
              selectedCategory={selectedCategory}
              onSelectedCategoryChange={setSelectedCategory}
              selectedType={selectedType}
              onSelectedTypeChange={setSelectedType}
              selectedBrand={selectedBrand}
              onSelectedBrandChange={setSelectedBrand}
              selectedStyle={selectedStyle}
              onSelectedStyleChange={setSelectedStyle}
              selectedColor={selectedColor}
              onSelectedColorChange={setSelectedColor}
              verifiedFilter={verifiedFilter}
              onVerifiedFilterChange={setVerifiedFilter}
              selectedMaxPrice={selectedMaxPrice}
              onSelectedMaxPriceChange={setSelectedMaxPrice}
              selectedCondition={selectedCondition}
              onSelectedConditionChange={setSelectedCondition}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              selectedLocation={locationFilter ?? ""}
              onSelectedLocationChange={onLocationChange}
              maxPrice={maxPrice}
            />
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[256px_minmax(0,1fr)] xl:items-start xl:h-[calc(100vh-112px)] xl:overflow-hidden">
        <aside className="hidden space-y-4 xl:block xl:h-full xl:overflow-y-auto xl:pr-1">
          <FashionFilters
            selectedCategory={selectedCategory}
            onSelectedCategoryChange={setSelectedCategory}
            selectedType={selectedType}
            onSelectedTypeChange={setSelectedType}
            selectedBrand={selectedBrand}
            onSelectedBrandChange={setSelectedBrand}
            selectedStyle={selectedStyle}
            onSelectedStyleChange={setSelectedStyle}
            selectedColor={selectedColor}
            onSelectedColorChange={setSelectedColor}
            verifiedFilter={verifiedFilter}
            onVerifiedFilterChange={setVerifiedFilter}
            selectedMaxPrice={selectedMaxPrice}
            onSelectedMaxPriceChange={setSelectedMaxPrice}
            selectedCondition={selectedCondition}
            onSelectedConditionChange={setSelectedCondition}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            selectedLocation={locationFilter ?? ""}
            onSelectedLocationChange={onLocationChange}
            maxPrice={maxPrice}
          />
        </aside>

        <section className="min-w-0 xl:h-full xl:overflow-y-auto xl:pr-1">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <BackButton />
          </div>
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="inline-flex h-11 items-center justify-center rounded-[12px] border border-[#e2ded7] bg-white px-4 text-[14px] font-medium text-[#1f1d27] shadow-[0_8px_20px_rgba(31,29,39,0.05)] xl:hidden"
              >
                Filters
              </button>
              <div>
                <h1 className="text-[28px] font-medium tracking-[-0.02em] text-[#1f1d27] sm:text-[36px]">
                  Found <span className="text-[#ff9715]">{loadingAds ? "\u2026" : resultTotal.toLocaleString()}</span> results for "{stateConfig.title}"
                </h1>
                <p className="mt-3 text-[24px] font-medium text-[#1f1d27]">{stateConfig.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start pt-1">
              <button
                type="button"
                onClick={() => navigateToView(ROUTES.SEARCH_RESULTS)}
                className={`grid h-10 w-10 place-items-center rounded-[10px] ${view === "grid" ? "bg-[#fff3e5]" : "bg-transparent hover:bg-[#f4f1eb]"}`}
                aria-label="Grid view"
                title="Grid view"
              >
                <GridIcon active={view === "grid"} />
              </button>
              <button
                type="button"
                onClick={() => navigateToView(ROUTES.SEARCH_RESULTS_LIST)}
                className={`grid h-10 w-10 place-items-center rounded-[10px] ${view === "list" ? "bg-[#fff3e5]" : "bg-transparent hover:bg-[#f4f1eb]"}`}
                aria-label="List view"
                title="List view"
              >
                <ListIcon active={view === "list"} />
              </button>
            </div>
          </div>

          <div className="mb-8 overflow-x-auto rounded-[28px] border border-[#ddd9d2] bg-white px-4 py-5 shadow-[0_8px_24px_rgba(31,29,39,0.05)] sm:px-6">
            <div className="flex min-w-max items-start gap-7 sm:gap-8">
              {stateConfig.stripItems.map((option) => (
                <StripBubble
                  key={option.name}
                  name={option.name}
                  image={option.image}
                  active={selectedStripCategory === option.name}
                  onClick={() => {
                    if (option.routeQuery) {
                      navigate(buildSearchRoute(option.routeQuery));
                      return;
                    }
                    setSelectedStripCategory((current) => (current === option.name ? "all" : option.name));
                  }}
                />
              ))}
            </div>
          </div>

          <div className={view === "list" ? "space-y-4" : "grid grid-cols-2 gap-5 xl:grid-cols-3"}>
            {filteredResults.map((item) => (
              <ListingCard
                key={item.id}
                item={{
                  price: formatNaira(item.ad.price),
                  title: item.ad.title,
                  description: item.ad.description,
                  location: item.ad.location,
                  image: item.ad.images?.[0]?.url,
                  verifiedSeller: isSellerVerified(item.ad.user),
                }}
                href={buildProductDetailsRoute(item.ad.id)}
                interactive
                variant={view === "list" ? "list" : "grid"}
                clampTitleLines={2}
                clampDescriptionLines={3}
                clampLocationLines={1}
                imageHeightClassName="h-[230px] sm:h-[255px]"
                onClick={() => navigate(buildProductDetailsRoute(item.ad.id))}
              />
            ))}
          </div>
        </section>
      </div>
      </main>
    </>
  );
}
