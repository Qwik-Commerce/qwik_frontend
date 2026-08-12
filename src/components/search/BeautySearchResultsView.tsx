import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import {
  buildProductDetailsRoute,
  ROUTES,
} from "../../constants/routes";
import { ALL_NIGERIA_LOCATION, isCategoryMarkerQuery, NIGERIAN_LOCATIONS } from "../../lib/searchContext";
import { getAdConditionLabel } from "../../lib/adCondition";
import { isSellerVerified } from "../../lib/sellerVerification";
import {
  type BeautyCondition,
  type BeautyType,
  type MockBeautyListing,
} from "../../lib/mockData";
import { api } from "../../services/api";
import type { Ad } from "../../types";
import ListingCard from "../listings/ListingCard";
import BackButton from "../ui/BackButton";
import { CategoryBubbleAvatar } from "./CategoryBubbleAvatar";
import DropdownSelect from "../ui/DropdownSelect";
import { getBubbleInitials, getCategoryBubbleImage } from "../../lib/categoryBubbleImages";
import SeoHead from "../seo/SeoHead";
import { buildCanonicalUrl } from "../../lib/seoCanonical";

type NavigateTo = (to: string) => void;
type SortValue = "newest" | "price-low" | "price-high";
type VerifiedValue = "all" | "verified" | "unverified";
type BeautyView = "grid" | "list";
type BeautyBrand = MockBeautyListing["brand"];

type BeautySearchResultsViewProps = {
  query: string;
  navigate: NavigateTo;
  view: BeautyView;
  locationFilter?: string;
};

const BEAUTY_CATEGORY_OPTIONS: Array<"all" | MockBeautyListing["categoryType"]> = [
  "all",
  "Body Care",
  "Face Care",
  "Vitamin and Supplement",
  "Fragrance",
];
const BEAUTY_TYPE_OPTIONS: Array<"all" | BeautyType> = [
  "all",
  "Body Lotion",
  "Body Wash & Soap",
  "Body Oils",
];
const BEAUTY_STRIP_OPTIONS: Array<{ name: BeautyType; image?: string }> = [
  { name: "Body Lotion", image: getCategoryBubbleImage("beauty", "Body Lotion") },
  { name: "Body Wash & Soap", image: getCategoryBubbleImage("beauty", "Body Wash & Soap") },
  { name: "Body Oils", image: getCategoryBubbleImage("beauty", "Body Oils") },
  { name: "Body Creams & Milks", image: getCategoryBubbleImage("beauty", "Body Creams & Milks") },
  { name: "Body Scrubs", image: getCategoryBubbleImage("beauty", "Body Scrubs") },
  { name: "Shower Gel", image: getCategoryBubbleImage("beauty", "Shower Gel") },
];
const BEAUTY_BRAND_OPTIONS: Array<"all" | BeautyBrand> = ["all", "Nivea", "Dove", "L'Oreal", "Other"];
const BEAUTY_CONDITION_OPTIONS: Array<"all" | BeautyCondition> = ["all", "New", "Refurbished", "Used"];
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
  name: BeautyType;
  image?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="flex min-w-[92px] flex-col items-center gap-1.5 text-center">
      <CategoryBubbleAvatar
        alt={name}
        imageSrc={image}
        fallbackText={getBubbleInitials(name)}
        className={`grid h-[60px] w-[60px] place-items-center overflow-hidden rounded-full border ${active ? "border-[#1f1d27]" : "border-[#ddd9d2]"}`}
      />
      <span className="text-[13px] font-medium text-[#1f1d27]">{name}</span>
    </button>
  );
}

function sortBeautyResults(results: MockBeautyListing[], sortBy: SortValue) {
  return [...results].sort((left, right) => {
    if (sortBy === "price-low") return left.ad.price - right.ad.price;
    if (sortBy === "price-high") return right.ad.price - left.ad.price;
    const rightCreatedAt = right.ad.createdAt ? new Date(right.ad.createdAt).getTime() : 0;
    const leftCreatedAt = left.ad.createdAt ? new Date(left.ad.createdAt).getTime() : 0;
    return rightCreatedAt - leftCreatedAt;
  });
}

function toBeautyResult(ad: Ad): MockBeautyListing {
  const brand = BEAUTY_BRAND_OPTIONS.includes(ad.brand as BeautyBrand) ? (ad.brand as BeautyBrand) : "Other";
  const normalizedCondition = getAdConditionLabel(ad.condition);
  const condition = BEAUTY_CONDITION_OPTIONS.includes(normalizedCondition as BeautyCondition) ? (normalizedCondition as BeautyCondition) : "Used";
  return { id: ad.id, ad, categoryType: "Body Care", beautyType: "Body Lotion", stripCategory: "Body Lotion", brand, condition } as MockBeautyListing;
}

function BeautyFilters({
  selectedCategory,
  onSelectedCategoryChange,
  sortBy,
  onSortByChange,
  selectedLocation,
  onSelectedLocationChange,
  selectedType,
  onSelectedTypeChange,
  selectedBrand,
  onSelectedBrandChange,
  verifiedFilter,
  onVerifiedFilterChange,
  selectedMaxPrice,
  onSelectedMaxPriceChange,
  maxPrice,
}: {
  selectedCategory: "all" | MockBeautyListing["categoryType"];
  onSelectedCategoryChange: (value: "all" | MockBeautyListing["categoryType"]) => void;
  sortBy: SortValue;
  onSortByChange: (value: SortValue) => void;
  selectedLocation: string;
  onSelectedLocationChange: (value: string) => void;
  selectedType: "all" | BeautyType;
  onSelectedTypeChange: (value: "all" | BeautyType) => void;
  selectedBrand: "all" | BeautyBrand;
  onSelectedBrandChange: (value: "all" | BeautyBrand) => void;
  verifiedFilter: VerifiedValue;
  onVerifiedFilterChange: (value: VerifiedValue) => void;
  selectedMaxPrice: number;
  onSelectedMaxPriceChange: (value: number) => void;
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
            aria-label="Sort beauty results"
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
          {BEAUTY_CATEGORY_OPTIONS.map((option) => (
            <FilterOption
              key={option}
              label={option === "all" ? "Show All" : option}
              checked={selectedCategory === option}
              onClick={() => onSelectedCategoryChange(option)}
            />
          ))}
        </div>
      </FilterPanel>

      <FilterPanel title="Type">
        <div className="space-y-3">
          {BEAUTY_TYPE_OPTIONS.map((option) => (
            <FilterOption
              key={option}
              label={option === "all" ? "Show All" : option}
              checked={selectedType === option}
              onClick={() => onSelectedTypeChange(option)}
            />
          ))}
        </div>
      </FilterPanel>

      <FilterPanel title="Brands">
        <div className="space-y-3">
          {BEAUTY_BRAND_OPTIONS.map((option) => (
            <FilterOption
              key={option}
              label={option === "all" ? "Show All" : option}
              checked={selectedBrand === option}
              onClick={() => onSelectedBrandChange(option)}
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
          <span>{formatNaira(1000)}</span>
          <span>{formatNaira(selectedMaxPrice)}</span>
        </div>
        <input
          type="range"
          min={1000}
          max={maxPrice}
          step={Math.max(Math.round(maxPrice / 100), 1000)}
          value={selectedMaxPrice}
          onChange={(event) => onSelectedMaxPriceChange(Number(event.target.value))}
          className="w-full accent-[#ff9715]"
          aria-label="Maximum beauty price"
        />
      </FilterPanel>
    </div>
  );
}

export default function BeautySearchResultsView({ query, navigate, view, locationFilter }: BeautySearchResultsViewProps) {
  const routerLocation = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<"all" | MockBeautyListing["categoryType"]>("Body Care");
  const [sortBy, setSortBy] = useState<SortValue>("newest");
  const [selectedType, setSelectedType] = useState<"all" | BeautyType>("Body Lotion");
  const [selectedBrand, setSelectedBrand] = useState<"all" | BeautyBrand>("all");
  const [verifiedFilter, setVerifiedFilter] = useState<VerifiedValue>("all");
  const [selectedStripCategory, setSelectedStripCategory] = useState<BeautyType>("Body Lotion");
  const [beautyResults, setBeautyResults] = useState<MockBeautyListing[]>([]);
  const [resultTotal, setResultTotal] = useState(0);
  const [loadingAds, setLoadingAds] = useState(true);
  const maxPrice = useMemo(() => Math.max(...beautyResults.map((item) => item.ad.price), 100200000), [beautyResults]);
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
        const params = new URLSearchParams({ category: "beauty", pageSize: "24", imagesLimit: "1" });
        if (query && !isCategoryMarkerQuery(query)) params.set("q", query);
        if (locationFilter) params.set("location", locationFilter);
        const response = await api.ads(`?${params.toString()}`);
        setBeautyResults(response.data.map(toBeautyResult));
        setResultTotal(response.meta?.total ?? response.data.length);
      } finally {
        setLoadingAds(false);
      }
    };
    void loadAds();
  }, [query, locationFilter]);

  useEffect(() => {
    setSelectedCategory("Body Care");
    setSortBy("newest");
    setSelectedType("Body Lotion");
    setSelectedBrand("all");
    setVerifiedFilter("all");
    setSelectedStripCategory("Body Lotion");
    setSelectedMaxPrice(100200000);
    setMobileFiltersOpen(false);
  }, [query]);

  const filteredResults = useMemo(
    () =>
      sortBeautyResults(
        beautyResults.filter((item) => {
          const verified = isSellerVerified(item.ad.user);
          const categoryMatches = selectedCategory === "all" || item.categoryType === selectedCategory;
          const typeMatches = selectedType === "all" || item.beautyType === selectedType;
          const brandMatches = selectedBrand === "all" || item.brand === selectedBrand;
          const stripMatches = item.stripCategory === selectedStripCategory;
          const verifiedMatches =
            verifiedFilter === "all" ||
            (verifiedFilter === "verified" && verified) ||
            (verifiedFilter === "unverified" && !verified);
          const priceMatches = item.ad.price <= selectedMaxPrice;
          return categoryMatches && typeMatches && brandMatches && stripMatches && verifiedMatches && priceMatches;
        }),
        sortBy,
      ),
    [beautyResults, selectedBrand, selectedCategory, selectedMaxPrice, selectedStripCategory, selectedType, sortBy, verifiedFilter],
  );

  return (
    <>
      <SeoHead
        title="Beauty Products for Sale in Nigeria | Qwik"
        description="Discover beauty and personal care products for sale across Nigeria on Qwik."
        canonicalUrl={buildCanonicalUrl(routerLocation.pathname, routerLocation.search)}
      />
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
            <BeautyFilters
              selectedCategory={selectedCategory}
              onSelectedCategoryChange={setSelectedCategory}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              selectedType={selectedType}
              onSelectedTypeChange={setSelectedType}
              selectedLocation={locationFilter ?? ""}
              onSelectedLocationChange={onLocationChange}
              selectedBrand={selectedBrand}
              onSelectedBrandChange={setSelectedBrand}
              verifiedFilter={verifiedFilter}
              onVerifiedFilterChange={setVerifiedFilter}
              selectedMaxPrice={selectedMaxPrice}
              onSelectedMaxPriceChange={setSelectedMaxPrice}
              maxPrice={maxPrice}
            />
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[256px_minmax(0,1fr)] xl:items-start xl:h-[calc(100vh-112px)] xl:overflow-hidden">
        <aside className="hidden space-y-4 xl:block xl:h-full xl:overflow-y-auto xl:pr-1">
          <BeautyFilters
            selectedCategory={selectedCategory}
            onSelectedCategoryChange={setSelectedCategory}
            sortBy={sortBy}
            onSortByChange={setSortBy}
              selectedLocation={locationFilter ?? ""}
              onSelectedLocationChange={onLocationChange}
            selectedType={selectedType}
            onSelectedTypeChange={setSelectedType}
            selectedBrand={selectedBrand}
            onSelectedBrandChange={setSelectedBrand}
            verifiedFilter={verifiedFilter}
            onVerifiedFilterChange={setVerifiedFilter}
            selectedMaxPrice={selectedMaxPrice}
            onSelectedMaxPriceChange={setSelectedMaxPrice}
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
                  Found <span className="text-[#ff9715]">{loadingAds ? "\u2026" : resultTotal.toLocaleString()}</span> results for "Beauty"
                </h1>
                <p className="mt-3 text-[24px] font-medium text-[#1f1d27]">Body Care In Nigeria</p>
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
            <div className="flex min-w-max items-start gap-8 sm:gap-10">
              {BEAUTY_STRIP_OPTIONS.map((option) => (
                <StripBubble
                  key={option.name}
                  name={option.name}
                  image={option.image}
                  active={selectedStripCategory === option.name}
                  onClick={() => setSelectedStripCategory(option.name)}
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
                imageHeightClassName="h-[230px] sm:h-[260px]"
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
