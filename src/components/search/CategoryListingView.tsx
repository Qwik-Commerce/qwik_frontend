import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { buildProductDetailsRoute } from "../../constants/routes";
import { ALL_NIGERIA_LOCATION, isCategoryMarkerQuery, NIGERIAN_LOCATIONS } from "../../lib/searchContext";
import { isSellerVerified } from "../../lib/sellerVerification";
import { CategoryBubbleAvatar } from "./CategoryBubbleAvatar";
import { getCategoryBubbleImage, type CategoryBubbleGroup } from "../../lib/categoryBubbleImages";
import { api } from "../../services/api";
import type { Ad } from "../../types";
import { getAdConditionLabel } from "../../lib/adCondition";
import ListingCard from "../listings/ListingCard";
import VerifiedSellerBadge from "../listings/VerifiedSellerBadge";
import BackButton from "../ui/BackButton";
import DropdownSelect from "../ui/DropdownSelect";
import { FallbackImage } from "../ui/FallbackImage";
import { ImagePlaceholder } from "../ui/ImagePlaceholder";
import SeoHead from "../seo/SeoHead";
import { buildCanonicalUrl } from "../../lib/seoCanonical";

type NavigateTo = (to: string) => void;
type SortValue = "newest" | "price-low" | "price-high";
type VerifiedValue = "all" | "verified" | "unverified";
type ViewMode = "grid" | "list";
type SearchResultMode = "exact" | "related";

export type CategorySubtype = {
  name: string;
  tone: string;
  initials: string;
};

export type CategoryListingConfig = {
  slug: string;
  imageGroup: CategoryBubbleGroup;
  displayQuery: string;
  heading: string;
  rangeLabel: "Price" | "Salary";
  rangeMin: number;
  rangeMax: number;
  subtypes: CategorySubtype[];
  storageKey: string;
};

type CategoryListingViewProps = {
  config: CategoryListingConfig;
  query: string;
  navigate: NavigateTo;
  locationFilter?: string;
};

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

function formatNaira(value: number) {
  return `₦ ${value.toLocaleString()}`;
}

function readStoredView(key: string): ViewMode {
  if (typeof window === "undefined") return "grid";
  try {
    return window.localStorage.getItem(key) === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
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
  image,
  subtype,
  active,
  onClick,
}: {
  image?: string;
  subtype: CategorySubtype;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="flex min-w-[92px] flex-col items-center gap-1.5 text-center sm:min-w-[100px]">
      <CategoryBubbleAvatar
        alt={subtype.name}
        imageSrc={image}
        fallbackText={subtype.initials}
        className={`grid h-[60px] w-[60px] place-items-center overflow-hidden rounded-full border ${active ? "border-[#1f1d27]" : "border-[#ddd9d2]"}`}
        fallbackTextClassName="text-[#1f1d27]"
      />
      <span className="text-[13px] font-medium leading-[1.15] text-[#1f1d27]">{subtype.name}</span>
    </button>
  );
}

function sortAds(ads: Ad[], sortBy: SortValue) {
  return [...ads].sort((left, right) => {
    if (sortBy === "price-low") return left.price - right.price;
    if (sortBy === "price-high") return right.price - left.price;
    const r = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    const l = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    return r - l;
  });
}

function CategoryFilters({
  config,
  selectedSubtype,
  onSelectedSubtypeChange,
  sortBy,
  onSortByChange,
  selectedLocation,
  onSelectedLocationChange,
  verifiedFilter,
  onVerifiedFilterChange,
  selectedMaxPrice,
  onSelectedMaxPriceChange,
}: {
  config: CategoryListingConfig;
  selectedSubtype: string;
  onSelectedSubtypeChange: (value: string) => void;
  sortBy: SortValue;
  onSortByChange: (value: SortValue) => void;
  selectedLocation: string;
  onSelectedLocationChange: (value: string) => void;
  verifiedFilter: VerifiedValue;
  onVerifiedFilterChange: (value: VerifiedValue) => void;
  selectedMaxPrice: number;
  onSelectedMaxPriceChange: (value: number) => void;
}) {
  const [showAllSubtypes, setShowAllSubtypes] = useState(false);
  const visibleSubtypes = showAllSubtypes ? config.subtypes : config.subtypes.slice(0, 4);

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
            aria-label="Sort results"
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
          <FilterOption label="Show All" checked={selectedSubtype === "all"} onClick={() => onSelectedSubtypeChange("all")} />
          {visibleSubtypes.map((subtype) => (
            <FilterOption
              key={subtype.name}
              label={subtype.name}
              checked={selectedSubtype === subtype.name}
              onClick={() => onSelectedSubtypeChange(subtype.name)}
            />
          ))}
          {config.subtypes.length > 4 ? (
            <button type="button" className="pt-1 text-left text-[15px] text-[#3f3c46]" onClick={() => setShowAllSubtypes((current) => !current)}>
              {showAllSubtypes ? "Show less" : "Show more"}
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

      <FilterPanel title={config.rangeLabel}>
        <div className="mb-4 flex items-center justify-between gap-3 text-[14px] text-[#5f5c68]">
          <span>{formatNaira(config.rangeMin)}</span>
          <span>{formatNaira(selectedMaxPrice)}</span>
        </div>
        <input
          type="range"
          min={config.rangeMin}
          max={config.rangeMax}
          step={Math.max(Math.round(config.rangeMax / 100), 1000)}
          value={selectedMaxPrice}
          onChange={(event) => onSelectedMaxPriceChange(Number(event.target.value))}
          className="w-full accent-[#ff9715]"
          aria-label={`Maximum ${config.rangeLabel.toLowerCase()}`}
        />
      </FilterPanel>
    </div>
  );
}

export default function CategoryListingView({ config, query, navigate, locationFilter }: CategoryListingViewProps) {
  const routerLocation = useLocation();
  const [selectedSubtype, setSelectedSubtype] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortValue>("newest");
  const [verifiedFilter, setVerifiedFilter] = useState<VerifiedValue>("all");
  const [selectedMaxPrice, setSelectedMaxPrice] = useState(config.rangeMax);
  const [ads, setAds] = useState<Ad[]>([]);
  const [resultTotal, setResultTotal] = useState(0);
  const [resultMode, setResultMode] = useState<SearchResultMode>("exact");
  const [relatedTo, setRelatedTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [view, setView] = useState<ViewMode>(() => readStoredView(config.storageKey));

  const onLocationChange = (value: string) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (value) params.set("location", value);
    else params.delete("location");
    const search = params.toString();
    navigate(`${window.location.pathname}${search ? `?${search}` : ""}`);
  };

  useEffect(() => {
    try {
      window.localStorage.setItem(config.storageKey, view);
    } catch {
      /* ignore */
    }
  }, [config.storageKey, view]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        const params = new URLSearchParams({ category: config.slug, pageSize: "24", imagesLimit: "1" });
        if (query && !isCategoryMarkerQuery(query)) params.set("q", query);
        if (locationFilter) params.set("location", locationFilter);
        const response = await api.ads(`?${params.toString()}`);
        if (!cancelled) {
          setAds(response.data);
          setResultTotal(response.meta?.total ?? response.data.length);
          setResultMode(response.meta?.resultMode === "related" ? "related" : "exact");
          setRelatedTo(response.meta?.relatedTo ?? query);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : "Failed to load ads");
          setAds([]);
          setResultTotal(0);
          setResultMode("exact");
          setRelatedTo("");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [config.slug, query, locationFilter]);

  useEffect(() => {
    setSelectedSubtype("all");
    setSortBy("newest");
    setVerifiedFilter("all");
    setSelectedMaxPrice(config.rangeMax);
    setMobileFiltersOpen(false);
  }, [config.rangeMax, config.slug, query]);

  const filteredAds = useMemo(
    () =>
      sortAds(
        ads.filter((ad) => {
          const verified = isSellerVerified(ad.user);
          const subtypeMatches =
            selectedSubtype === "all" ||
            (ad.title + " " + ad.description).toLowerCase().includes(selectedSubtype.toLowerCase());
          const verifiedMatches =
            verifiedFilter === "all" ||
            (verifiedFilter === "verified" && verified) ||
            (verifiedFilter === "unverified" && !verified);
          const priceMatches = ad.price <= selectedMaxPrice;
          return subtypeMatches && verifiedMatches && priceMatches;
        }),
        sortBy,
      ),
    [ads, selectedSubtype, selectedMaxPrice, sortBy, verifiedFilter],
  );

  const headingQuery = query?.trim() || config.displayQuery;

  return (
    <>
      <SeoHead
        title={`${config.heading} | Qwik`}
        description={`Browse ${config.heading} listings across Nigeria on Qwik, Nigeria's trusted online marketplace.`}
        canonicalUrl={buildCanonicalUrl(routerLocation.pathname, routerLocation.search)}
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
            <CategoryFilters
              config={config}
              selectedSubtype={selectedSubtype}
              onSelectedSubtypeChange={setSelectedSubtype}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              selectedLocation={locationFilter ?? ""}
              onSelectedLocationChange={onLocationChange}
              verifiedFilter={verifiedFilter}
              onVerifiedFilterChange={setVerifiedFilter}
              selectedMaxPrice={selectedMaxPrice}
              onSelectedMaxPriceChange={setSelectedMaxPrice}
            />
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[256px_minmax(0,1fr)] xl:items-start xl:h-[calc(100vh-112px)] xl:overflow-hidden">
        <aside className="hidden space-y-4 xl:block xl:h-full xl:overflow-y-auto xl:pr-1">
          <CategoryFilters
            config={config}
            selectedSubtype={selectedSubtype}
            onSelectedSubtypeChange={setSelectedSubtype}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            selectedLocation={locationFilter ?? ""}
            onSelectedLocationChange={onLocationChange}
            verifiedFilter={verifiedFilter}
            onVerifiedFilterChange={setVerifiedFilter}
            selectedMaxPrice={selectedMaxPrice}
            onSelectedMaxPriceChange={setSelectedMaxPrice}
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
                  Found <span className="text-[#ff9715]">{loading ? "\u2026" : resultTotal.toLocaleString()}</span> results for "{headingQuery}"
                </h1>
                <p className="mt-3 text-[24px] font-medium text-[#1f1d27]">{config.heading}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start pt-1" role="group" aria-label="Toggle results view">
              <button
                type="button"
                onClick={() => setView("grid")}
                aria-pressed={view === "grid"}
                className={`grid h-10 w-10 place-items-center rounded-[10px] ${view === "grid" ? "bg-[#fff3e5]" : "bg-transparent hover:bg-[#f4f1eb]"}`}
                aria-label="Grid view"
                title="Grid view"
              >
                <GridIcon active={view === "grid"} />
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                aria-pressed={view === "list"}
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
              {config.subtypes.map((subtype) => (
                <StripBubble
                  key={subtype.name}
                  image={getCategoryBubbleImage(config.imageGroup, subtype.name)}
                  subtype={subtype}
                  active={selectedSubtype === subtype.name}
                  onClick={() => setSelectedSubtype((current) => (current === subtype.name ? "all" : subtype.name))}
                />
              ))}
            </div>
          </div>

          {resultMode === "related" && filteredAds.length > 0 ? (
            <div className="mb-5 rounded-[20px] border border-[#ffe1b8] bg-[#fff8ef] px-5 py-4">
              <p className="text-[18px] font-medium text-[#1f1d27]">No exact results found</p>
              <p className="mt-1 text-[14px] leading-[1.6] text-[#6d6a74]">
                Related ads you may like for “{relatedTo || headingQuery}”.
              </p>
            </div>
          ) : null}

          {loading ? (
            <div className="grid grid-cols-2 gap-5 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <article key={index} className="rounded-[24px] border border-[#ddd9d2] bg-white p-3 shadow-[0_8px_24px_rgba(31,29,39,0.05)]">
                  <div className="h-[230px] animate-pulse rounded-[18px] bg-[#f2f2f4] sm:h-[260px]" />
                  <div className="space-y-3 pt-4">
                    <div className="h-5 w-28 animate-pulse rounded bg-[#f2f2f4]" />
                    <div className="h-4 w-4/5 animate-pulse rounded bg-[#f2f2f4]" />
                    <div className="h-4 w-full animate-pulse rounded bg-[#f2f2f4]" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-[#f2f2f4]" />
                  </div>
                </article>
              ))}
            </div>
          ) : errorMessage ? (
            <div className="rounded-[24px] border border-[#f0d1d1] bg-white px-6 py-12 text-center shadow-[0_8px_24px_rgba(31,29,39,0.05)]">
              <h2 className="text-[22px] font-medium text-[#1f1d27]">Failed to load ads</h2>
              <p className="mt-3 text-[15px] leading-[1.6] text-[#6d6a74]">{errorMessage}</p>
            </div>
          ) : filteredAds.length === 0 ? (
            <div className="rounded-[24px] border border-[#ddd9d2] bg-white px-6 py-12 text-center shadow-[0_8px_24px_rgba(31,29,39,0.05)]">
              <h2 className="text-[22px] font-medium text-[#1f1d27]">
                {resultMode === "related" ? "No exact results found" : "No results found"}
              </h2>
              <p className="mt-3 text-[15px] leading-[1.6] text-[#6d6a74]">
                Try another keyword or adjust the filters to widen your search.
              </p>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 gap-5 xl:grid-cols-3">
              {filteredAds.map((ad) => (
                <ListingCard
                  key={ad.id}
                  item={{
                    price: formatNaira(ad.price),
                    title: ad.title,
                    description: ad.description,
                    location: ad.location,
                    image: ad.images?.[0]?.url,
                    verifiedSeller: isSellerVerified(ad.user),
                  }}
                    href={buildProductDetailsRoute(ad.id)}
                    showBadge={Boolean(getAdConditionLabel(ad.condition))}
                    badgeLabel={getAdConditionLabel(ad.condition) ?? undefined}
                  interactive
                  clampTitleLines={2}
                  clampDescriptionLines={3}
                  clampLocationLines={1}
                  imageHeightClassName="h-[230px] sm:h-[255px]"
                  onClick={() => navigate(buildProductDetailsRoute(ad.id))}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredAds.map((ad) => (
                <article
                  key={ad.id}
                  className="flex cursor-pointer gap-3 overflow-hidden rounded-[24px] border border-[#ddd9d2] bg-white p-3 shadow-[0_8px_24px_rgba(31,29,39,0.05)] transition hover:shadow-[0_12px_28px_rgba(31,29,39,0.08)] sm:gap-6 sm:rounded-[28px] sm:p-4"
                  onClick={() => navigate(buildProductDetailsRoute(ad.id))}
                >
                  <div className="relative h-[120px] w-[120px] shrink-0 overflow-hidden rounded-[16px] bg-[#f2f2f4] sm:h-[210px] sm:w-[280px] sm:rounded-[20px]">
                    {isSellerVerified(ad.user) ? <VerifiedSellerBadge /> : null}
                    {ad.images?.[0]?.url ? (
                      <FallbackImage
                        src={ad.images[0].url}
                        alt={ad.title}
                        className="h-full w-full object-cover"
                        fallback={<ImagePlaceholder title="" labelClassName="hidden" className="h-full rounded-[16px] sm:rounded-[20px]" />}
                      />
                    ) : (
                      <ImagePlaceholder title="" labelClassName="hidden" className="h-full rounded-[16px] sm:rounded-[20px]" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col py-1 sm:py-3">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <h3 className="m-0 whitespace-nowrap text-[16px] font-semibold leading-none sm:text-[20px]">{formatNaira(ad.price)}</h3>
                    </div>
                    <h4
                      className="mb-1.5 mt-2 text-[15px] font-medium leading-[1.25] sm:mb-2 sm:mt-3 sm:text-[18px]"
                      style={{ display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                    >
                      {ad.title}
                    </h4>
                    <p
                      className="mb-2 text-[13px] leading-[1.4] text-[#6d6a74] sm:mb-3 sm:text-[15px]"
                      style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                    >
                      {ad.description}
                    </p>
                    <div className="mt-auto flex items-end justify-between gap-2">
                      <small className="truncate text-[13px] text-[#4b4a54] sm:text-[15px]">{ad.location}</small>
                      {getAdConditionLabel(ad.condition) ? (
                        <span className="shrink-0 rounded-[8px] bg-[#f5ebdc] px-2 py-0.5 text-[11px] font-medium text-[#c07a1f] sm:text-[12px]">
                          {getAdConditionLabel(ad.condition)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
    </>
  );
}

export const CATEGORY_LISTING_CONFIGS: Record<string, CategoryListingConfig> = {
  properties: {
    slug: "properties",
    imageGroup: "properties",
    displayQuery: "Properties",
    heading: "Properties In Nigeria",
    rangeLabel: "Price",
    rangeMin: 0,
    rangeMax: 1000000000,
    storageKey: "qwik:category:properties:viewMode",
    subtypes: [
      { name: "Houses & Apartments", initials: "HA", tone: "#e2f1e9" },
      { name: "Commercial Property", initials: "Cp", tone: "#dde8f5" },
      { name: "Short Let", initials: "Sl", tone: "#f1e4ee" },
      { name: "Event Centers", initials: "Ec", tone: "#e9edff" },
      { name: "Property Services", initials: "Ps", tone: "#f2e8dd" },
    ],
  },
  agriculture: {
    slug: "agriculture",
    imageGroup: "agriculture",
    displayQuery: "Agriculture",
    heading: "Agricultural Product In Nigeria",
    rangeLabel: "Price",
    rangeMin: 0,
    rangeMax: 50000000,
    storageKey: "qwik:category:agriculture:viewMode",
    subtypes: [
      { name: "Food & Beverages", initials: "FB", tone: "#e5f1df" },
      { name: "Farm Animals", initials: "FA", tone: "#fdecd1" },
      { name: "Seeds & Fertilizers", initials: "SF", tone: "#f4e8c2" },
      { name: "Farm Machinery & Equipment", initials: "FM", tone: "#eef3fb" },
      { name: "Farm Animal Feed & Supplement", initials: "FS", tone: "#dceaf4" },
    ],
  },
  art: {
    slug: "art",
    imageGroup: "art",
    displayQuery: "Art",
    heading: "Arts In Nigeria",
    rangeLabel: "Price",
    rangeMin: 0,
    rangeMax: 20000000,
    storageKey: "qwik:category:art:viewMode",
    subtypes: [
      { name: "Paintings", initials: "Pt", tone: "#f0e8f7" },
      { name: "Canva design", initials: "CD", tone: "#e3e8f3" },
      { name: "Awards", initials: "Aw", tone: "#f9ecd6" },
    ],
  },
  "sports-leisure": {
    slug: "sports-leisure",
    imageGroup: "sports",
    displayQuery: "Sports & Leisure",
    heading: "Sports & Leisure In Nigeria",
    rangeLabel: "Price",
    rangeMin: 0,
    rangeMax: 30000000,
    storageKey: "qwik:category:sports:viewMode",
    subtypes: [
      { name: "Personal Mobility", initials: "PM", tone: "#e7eefb" },
      { name: "Sports Equipment", initials: "SE", tone: "#fbe5d6" },
      { name: "Massagers", initials: "Ms", tone: "#e6f0e0" },
      { name: "Musical Instrument", initials: "MI", tone: "#f1e5dc" },
      { name: "Fitness & Personal Training Services", initials: "FS", tone: "#dceaf4" },
    ],
  },
};
