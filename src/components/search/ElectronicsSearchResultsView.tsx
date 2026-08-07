import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  buildProductDetailsRoute,
  ROUTES,
} from "../../constants/routes";
import { ALL_NIGERIA_LOCATION, isCategoryMarkerQuery, NIGERIAN_LOCATIONS } from "../../lib/searchContext";
import { getAdConditionLabel } from "../../lib/adCondition";
import { isSellerVerified } from "../../lib/sellerVerification";
import ListingCard from "../listings/ListingCard";
import {
  type ElectronicsCondition,
  type ElectronicsType,
  type MockElectronicsListing,
} from "../../lib/mockData";
import { api } from "../../services/api";
import type { Ad } from "../../types";
import BackButton from "../ui/BackButton";
import { CategoryBubbleAvatar } from "./CategoryBubbleAvatar";
import DropdownSelect from "../ui/DropdownSelect";
import { getBubbleInitials, getCategoryBubbleImage } from "../../lib/categoryBubbleImages";

type NavigateTo = (to: string) => void;
type SortValue = "newest" | "price-low" | "price-high";
type VerifiedValue = "all" | "verified" | "unverified";
type ElectronicsView = "grid" | "list";
type SearchResultMode = "exact" | "related";
type ElectronicsBrand = MockElectronicsListing["brand"];
type StripCategory = MockElectronicsListing["stripCategory"];

type ElectronicsSearchResultsViewProps = {
  query: string;
  navigate: NavigateTo;
  view: ElectronicsView;
  locationFilter?: string;
};

const ELECTRONICS_FILTER_TYPES: Array<"all" | ElectronicsType> = [
  "all",
  "Laptops & Computers",
  "Audio & Music Equipment",
  "Computer Hardware",
  "Monitors",
];
const ELECTRONICS_FILTER_BRANDS: Array<"all" | ElectronicsBrand> = ["all", "Asus", "Apple", "HP", "Dell", "Lenovo"];
const ELECTRONICS_FILTER_CONDITIONS: Array<"all" | ElectronicsCondition> = [
  "all",
  "New",
  "Refurbished",
  "Used",
];
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
const STRIP_CATEGORIES: Array<{ name: StripCategory | "all"; image?: string }> = [
  { name: "all" as const },
  { name: "Laptops", image: getCategoryBubbleImage("electronics", "Laptops") },
  { name: "Desktop", image: getCategoryBubbleImage("electronics", "Desktop") },
  { name: "Server", image: getCategoryBubbleImage("electronics", "Server") },
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

function StripBubble({
  name,
  image,
  active,
  onClick,
}: {
  name: StripCategory | "all";
  image?: string;
  active: boolean;
  onClick: () => void;
}) {
  const displayName = name === "all" ? "All" : name;
  return (
    <button type="button" onClick={onClick} className="flex min-w-[92px] flex-col items-center gap-1.5 text-center">
      {name === "all" ? (
        <div className={`grid h-[60px] w-[60px] place-items-center overflow-hidden rounded-full border font-medium text-[#1f1d27] ${active ? "border-[#1f1d27]" : "border-[#ddd9d2]"}`}>
          All
        </div>
      ) : (
        <CategoryBubbleAvatar
          alt={displayName}
          imageSrc={image}
          fallbackText={getBubbleInitials(displayName)}
          className={`grid h-[60px] w-[60px] place-items-center overflow-hidden rounded-full border ${active ? "border-[#1f1d27]" : "border-[#ddd9d2]"}`}
        />
      )}
      <span className="text-[13px] font-medium text-[#1f1d27]">{displayName}</span>
    </button>
  );
}

function sortElectronicsResults(results: MockElectronicsListing[], sortBy: SortValue) {
  return [...results].sort((left, right) => {
    if (sortBy === "price-low") return left.ad.price - right.ad.price;
    if (sortBy === "price-high") return right.ad.price - left.ad.price;
    const rightCreatedAt = right.ad.createdAt ? new Date(right.ad.createdAt).getTime() : 0;
    const leftCreatedAt = left.ad.createdAt ? new Date(left.ad.createdAt).getTime() : 0;
    return rightCreatedAt - leftCreatedAt;
  });
}

function toElectronicsResult(ad: Ad): MockElectronicsListing {
  const brand = ELECTRONICS_FILTER_BRANDS.includes(ad.brand as ElectronicsBrand) ? (ad.brand as ElectronicsBrand) : "Apple";
  const normalizedCondition = getAdConditionLabel(ad.condition);
  const condition = ELECTRONICS_FILTER_CONDITIONS.includes(normalizedCondition as ElectronicsCondition) ? (normalizedCondition as ElectronicsCondition) : "Used";
  const stripCategory = ad.category?.slug === "desktop-computers" ? "Desktop" : ad.category?.slug === "servers" ? "Server" : "Laptops";
  return { id: ad.id, ad, electronicsType: "Laptops & Computers", stripCategory, brand, condition } as MockElectronicsListing;
}

function ElectronicsFilters({
  selectedType,
  onSelectedTypeChange,
  sortBy,
  onSortByChange,
  selectedLocation,
  onSelectedLocationChange,
  selectedBrand,
  onSelectedBrandChange,
  verifiedFilter,
  onVerifiedFilterChange,
  selectedMaxPrice,
  onSelectedMaxPriceChange,
  maxPrice,
  selectedCondition,
  onSelectedConditionChange,
}: {
  selectedType: "all" | ElectronicsType;
  onSelectedTypeChange: (value: "all" | ElectronicsType) => void;
  sortBy: SortValue;
  onSortByChange: (value: SortValue) => void;
  selectedLocation: string;
  onSelectedLocationChange: (value: string) => void;
  selectedBrand: "all" | ElectronicsBrand;
  onSelectedBrandChange: (value: "all" | ElectronicsBrand) => void;
  verifiedFilter: VerifiedValue;
  onVerifiedFilterChange: (value: VerifiedValue) => void;
  selectedMaxPrice: number;
  onSelectedMaxPriceChange: (value: number) => void;
  maxPrice: number;
  selectedCondition: "all" | ElectronicsCondition;
  onSelectedConditionChange: (value: "all" | ElectronicsCondition) => void;
}) {
  const [showAllTypes, setShowAllTypes] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);
  const visibleTypeOptions = showAllTypes ? ELECTRONICS_FILTER_TYPES : ELECTRONICS_FILTER_TYPES.slice(0, 4);
  const visibleBrandOptions = showAllBrands ? ELECTRONICS_FILTER_BRANDS : ELECTRONICS_FILTER_BRANDS.slice(0, 3);

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
            aria-label="Sort electronics results"
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
          {visibleTypeOptions.map((option) => (
            <FilterOption
              key={option}
              label={option === "all" ? "Show All" : option}
              checked={selectedType === option}
              onClick={() => onSelectedTypeChange(option)}
            />
          ))}
          {ELECTRONICS_FILTER_TYPES.length > 4 ? (
            <button type="button" className="pt-1 text-[15px] text-[#1f1d27]" onClick={() => setShowAllTypes((current) => !current)}>
              {showAllTypes ? "Show less" : "Show more"}
            </button>
          ) : null}
        </div>
      </FilterPanel>

      <FilterPanel title="Brand">
        <div className="space-y-3">
          {visibleBrandOptions.map((option) => (
            <FilterOption
              key={option}
              label={option === "all" ? "Show All" : option}
              checked={selectedBrand === option}
              onClick={() => onSelectedBrandChange(option)}
            />
          ))}
          {ELECTRONICS_FILTER_BRANDS.length > 3 ? (
            <button type="button" className="pt-1 text-[15px] text-[#1f1d27]" onClick={() => setShowAllBrands((current) => !current)}>
              {showAllBrands ? "Show less" : "Show more"}
            </button>
          ) : null}
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
          aria-label="Maximum electronics price"
        />
      </FilterPanel>

      <FilterPanel title="Condition">
        <div className="space-y-3">
          {ELECTRONICS_FILTER_CONDITIONS.map((option) => (
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

export default function ElectronicsSearchResultsView({ query, navigate, view, locationFilter }: ElectronicsSearchResultsViewProps) {
  const [selectedType, setSelectedType] = useState<"all" | ElectronicsType>("all");
  const [sortBy, setSortBy] = useState<SortValue>("newest");
  const [selectedBrand, setSelectedBrand] = useState<"all" | ElectronicsBrand>("all");
  const [verifiedFilter, setVerifiedFilter] = useState<VerifiedValue>("all");
  const [selectedStripCategory, setSelectedStripCategory] = useState<StripCategory | "all" >("all");
  const [electronicsResults, setElectronicsResults] = useState<MockElectronicsListing[]>([]);
  const [resultTotal, setResultTotal] = useState(0);
  const [loadingAds, setLoadingAds] = useState(true);
  const [resultMode, setResultMode] = useState<SearchResultMode>("exact");
  const [relatedTo, setRelatedTo] = useState("");
  const maxPrice = useMemo(
    () => Math.max(...electronicsResults.map((item) => item.ad.price), 100200000),
    [electronicsResults],
  );
  const [selectedMaxPrice, setSelectedMaxPrice] = useState(100200000);
  const [selectedCondition, setSelectedCondition] = useState<"all" | ElectronicsCondition>("all");
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
        const params = new URLSearchParams({ category: "electronics", pageSize: "24", imagesLimit: "1" });
        if (query && !isCategoryMarkerQuery(query)) params.set("q", query);
        if (locationFilter) params.set("location", locationFilter);
        const response = await api.ads(`?${params.toString()}`);
        setElectronicsResults(response.data.map(toElectronicsResult));
        setResultTotal(response.meta?.total ?? response.data.length);
        setResultMode(response.meta?.resultMode === "related" ? "related" : "exact");
        setRelatedTo(response.meta?.relatedTo ?? query);
      } finally {
        setLoadingAds(false);
      }
    };
    void loadAds();
  }, [query, locationFilter]);

  useEffect(() => {
    setSelectedType("all");
    setSortBy("newest");
    setSelectedBrand("all");
    setVerifiedFilter("all");
    setSelectedStripCategory("all");
    setSelectedCondition("all");
    setSelectedMaxPrice(100200000);
    setMobileFiltersOpen(false);
  }, [query]);

  const filteredResults = useMemo(
    () =>
      sortElectronicsResults(
        electronicsResults.filter((item) => {
          const verified = isSellerVerified(item.ad.user);
          const typeMatches = selectedType === "all" || item.electronicsType === selectedType;
          const stripMatches = selectedStripCategory === "all" || item.stripCategory === selectedStripCategory;
          const brandMatches = selectedBrand === "all" || item.brand === selectedBrand;
          const verifiedMatches =
            verifiedFilter === "all" ||
            (verifiedFilter === "verified" && verified) ||
            (verifiedFilter === "unverified" && !verified);
          const priceMatches = item.ad.price <= selectedMaxPrice;
          const conditionMatches = selectedCondition === "all" || item.condition === selectedCondition;
          return typeMatches && stripMatches && brandMatches && verifiedMatches && priceMatches && conditionMatches;
        }),
        sortBy,
      ),
    [electronicsResults, selectedBrand, selectedCondition, selectedMaxPrice, selectedStripCategory, selectedType, sortBy, verifiedFilter],
  );

  return (
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
            <ElectronicsFilters
              selectedType={selectedType}
              onSelectedTypeChange={setSelectedType}
              sortBy={sortBy}
              onSortByChange={setSortBy}
                selectedLocation={locationFilter ?? ""}
                onSelectedLocationChange={onLocationChange}
              selectedBrand={selectedBrand}
              onSelectedBrandChange={setSelectedBrand}
              verifiedFilter={verifiedFilter}
              onVerifiedFilterChange={setVerifiedFilter}
              selectedMaxPrice={selectedMaxPrice}
              onSelectedMaxPriceChange={setSelectedMaxPrice}
              maxPrice={maxPrice}
              selectedCondition={selectedCondition}
              onSelectedConditionChange={setSelectedCondition}
            />
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[256px_minmax(0,1fr)] xl:items-start xl:h-[calc(100vh-112px)] xl:overflow-hidden">
        <aside className="hidden space-y-4 xl:block xl:h-full xl:overflow-y-auto xl:pr-1">
          <ElectronicsFilters
            selectedType={selectedType}
            onSelectedTypeChange={setSelectedType}
            sortBy={sortBy}
            onSortByChange={setSortBy}
              selectedLocation={locationFilter ?? ""}
              onSelectedLocationChange={onLocationChange}
            selectedBrand={selectedBrand}
            onSelectedBrandChange={setSelectedBrand}
            verifiedFilter={verifiedFilter}
            onVerifiedFilterChange={setVerifiedFilter}
            selectedMaxPrice={selectedMaxPrice}
            onSelectedMaxPriceChange={setSelectedMaxPrice}
            maxPrice={maxPrice}
            selectedCondition={selectedCondition}
            onSelectedConditionChange={setSelectedCondition}
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
                  Found <span className="text-[#ff9715]">{loadingAds ? "\u2026" : resultTotal.toLocaleString()}</span> results for "Electronics"
                </h1>
                <p className="mt-3 text-[24px] font-medium text-[#1f1d27]">Laptops and Computer In Nigeria</p>
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
            <div className="flex min-w-max items-start justify-between gap-8 sm:gap-12">
              {STRIP_CATEGORIES.map((category) => (
                <StripBubble
                  key={category.name}
                  name={category.name}
                  image={category.image}
                  active={selectedStripCategory === category.name}
                  onClick={() => setSelectedStripCategory(category.name)}
                />
              ))}
            </div>
          </div>

          {resultMode === "related" && filteredResults.length > 0 ? (
            <div className="mb-5 rounded-[20px] border border-[#ffe1b8] bg-[#fff8ef] px-5 py-4">
              <p className="text-[18px] font-medium text-[#1f1d27]">No exact results found</p>
              <p className="mt-1 text-[14px] leading-[1.6] text-[#6d6a74]">
                Related ads you may like for “{relatedTo || query || "Electronics"}”.
              </p>
            </div>
          ) : null}

          {loadingAds ? (
            <div className="grid grid-cols-2 gap-5 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <article key={i} className="rounded-[22px] bg-white p-3 shadow-[0_10px_26px_rgba(31,29,39,0.04)]">
                  <div className="h-[230px] animate-pulse rounded-[16px] bg-[#f2f2f4] sm:h-[260px]" />
                  <div className="space-y-3 pt-4">
                    <div className="h-5 w-28 animate-pulse rounded bg-[#f2f2f4]" />
                    <div className="h-4 w-4/5 animate-pulse rounded bg-[#f2f2f4]" />
                  </div>
                </article>
              ))}
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="rounded-[24px] border border-[#ddd9d2] bg-white px-6 py-12 text-center shadow-[0_8px_24px_rgba(31,29,39,0.05)]">
              <h2 className="text-[22px] font-medium text-[#1f1d27]">
                {resultMode === "related" ? "No exact results found" : "No results found"}
              </h2>
              <p className="mt-3 text-[15px] leading-[1.6] text-[#6d6a74]">
                Try another electronics keyword or adjust the filters to widen your search.
              </p>
            </div>
          ) : view === "list" ? (
            <div className="space-y-4">
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
                  variant="list"
                  clampTitleLines={2}
                  clampDescriptionLines={3}
                  clampLocationLines={1}
                  imageHeightClassName="h-[230px] sm:h-[260px]"
                  onClick={() => navigate(buildProductDetailsRoute(item.ad.id))}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 xl:grid-cols-3">
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
                  clampTitleLines={2}
                  clampDescriptionLines={3}
                  clampLocationLines={1}
                  imageHeightClassName="h-[230px] sm:h-[260px]"
                  onClick={() => navigate(buildProductDetailsRoute(item.ad.id))}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
