import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  buildProductDetailsRoute,
  ROUTES,
} from "../../constants/routes";
import { ALL_NIGERIA_LOCATION, isCategoryMarkerQuery, NIGERIAN_LOCATIONS } from "../../lib/searchContext";
import { isSellerVerified } from "../../lib/sellerVerification";
import {
  getJobSearchStrip,
  type JobCategoryType,
  type JobStripType,
  type MockJobListing,
} from "../../lib/mockData";
import { api } from "../../services/api";
import type { Ad } from "../../types";
import ListingCard from "../listings/ListingCard";
import BackButton from "../ui/BackButton";
import { CategoryBubbleAvatar } from "./CategoryBubbleAvatar";
import DropdownSelect from "../ui/DropdownSelect";
import { getBubbleInitials, getCategoryBubbleImage } from "../../lib/categoryBubbleImages";

type NavigateTo = (to: string) => void;
type SortValue = "newest" | "price-low" | "price-high";
type VerifiedValue = "all" | "verified" | "unverified";
type JobView = "grid" | "list";

type JobSearchResultsViewProps = {
  query: string;
  navigate: NavigateTo;
  view: JobView;
  locationFilter?: string;
};

const JOB_CATEGORIES: Array<"all" | JobCategoryType> = ["all", "Full Time", "Part Time", "Internship"];
const JOB_STRIP_ITEMS: Array<{ name: JobStripType; image?: string }> = [
  { name: "Full Time", image: getCategoryBubbleImage("jobs", "Full Time") },
  { name: "Part Time", image: getCategoryBubbleImage("jobs", "Part Time") },
  { name: "Internship", image: getCategoryBubbleImage("jobs", "Internship") },
  { name: "Contract", image: getCategoryBubbleImage("jobs", "Contract") },
  { name: "Remote", image: getCategoryBubbleImage("jobs", "Remote") },
  { name: "Temporary", image: getCategoryBubbleImage("jobs", "Temporary") },
];
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

function formatSalary(item: MockJobListing) {
  return `₦ ${Math.round(item.ad.price * 0.89).toLocaleString()} - ${item.ad.price.toLocaleString()}`;
}

function toJobResult(ad: Ad): MockJobListing {
  return { id: ad.id, ad, categoryType: "Full Time", stripCategory: "Full Time" } as MockJobListing;
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
  name: JobStripType;
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

function sortJobResults(results: MockJobListing[], sortBy: SortValue) {
  return [...results].sort((left, right) => {
    if (sortBy === "price-low") return left.ad.price - right.ad.price;
    if (sortBy === "price-high") return right.ad.price - left.ad.price;
    const rightCreatedAt = right.ad.createdAt ? new Date(right.ad.createdAt).getTime() : 0;
    const leftCreatedAt = left.ad.createdAt ? new Date(left.ad.createdAt).getTime() : 0;
    return rightCreatedAt - leftCreatedAt;
  });
}

function JobFilters({
  selectedCategory,
  onSelectedCategoryChange,
  sortBy,
  onSortByChange,
  selectedLocation,
  onSelectedLocationChange,
  verifiedFilter,
  onVerifiedFilterChange,
  selectedMaxSalary,
  onSelectedMaxSalaryChange,
  maxSalary,
}: {
  selectedCategory: "all" | JobCategoryType;
  onSelectedCategoryChange: (value: "all" | JobCategoryType) => void;
  sortBy: SortValue;
  onSortByChange: (value: SortValue) => void;
  selectedLocation: string;
  onSelectedLocationChange: (value: string) => void;
  verifiedFilter: VerifiedValue;
  onVerifiedFilterChange: (value: VerifiedValue) => void;
  selectedMaxSalary: number;
  onSelectedMaxSalaryChange: (value: number) => void;
  maxSalary: number;
}) {
  const [showAllCategories, setShowAllCategories] = useState(false);
  const visibleCategories = showAllCategories ? JOB_CATEGORIES : JOB_CATEGORIES.slice(0, 3);

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
            aria-label="Sort job results"
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
          {visibleCategories.map((option) => (
            <FilterOption
              key={option}
              label={option === "all" ? "Show All" : option}
              checked={selectedCategory === option}
              onClick={() => onSelectedCategoryChange(option)}
            />
          ))}
          {JOB_CATEGORIES.length > 3 ? (
            <button type="button" className="pt-1 text-left text-[15px] text-[#3f3c46]" onClick={() => setShowAllCategories((current) => !current)}>
              {showAllCategories ? "Show less" : "Show more"}
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

      <FilterPanel title="Salary">
        <div className="mb-4 flex items-center justify-between gap-3 text-[14px] text-[#5f5c68]">
          <span>{formatNaira(200000)}</span>
          <span>{formatNaira(selectedMaxSalary)}</span>
        </div>
        <input
          type="range"
          min={200000}
          max={maxSalary}
          step={Math.max(Math.round(maxSalary / 100), 1000)}
          value={selectedMaxSalary}
          onChange={(event) => onSelectedMaxSalaryChange(Number(event.target.value))}
          className="w-full accent-[#ff9715]"
          aria-label="Maximum job salary"
        />
      </FilterPanel>
    </div>
  );
}

export default function JobSearchResultsView({ query, navigate, view, locationFilter }: JobSearchResultsViewProps) {
  const initialStrip = getJobSearchStrip(query);
  const [selectedCategory, setSelectedCategory] = useState<"all" | JobCategoryType>("all");
  const [sortBy, setSortBy] = useState<SortValue>("newest");
  const [verifiedFilter, setVerifiedFilter] = useState<VerifiedValue>("all");
  const [selectedStripCategory, setSelectedStripCategory] = useState<JobStripType | "all">(initialStrip ?? "all");
  const [jobResults, setJobResults] = useState<MockJobListing[]>([]);
  const [resultTotal, setResultTotal] = useState(0);
  const maxSalary = useMemo(() => Math.max(...jobResults.map((item) => item.ad.price), 100200000), [jobResults]);
  const [selectedMaxSalary, setSelectedMaxSalary] = useState(100200000);
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
      const params = new URLSearchParams({ category: "jobs", pageSize: "24", imagesLimit: "1" });
      if (query && !isCategoryMarkerQuery(query)) params.set("q", query);
      if (locationFilter) params.set("location", locationFilter);
      const response = await api.ads(`?${params.toString()}`);
      setJobResults(response.data.map(toJobResult));
      setResultTotal(response.meta?.total ?? response.data.length);
    };
    void loadAds();
  }, [query, locationFilter]);

  useEffect(() => {
    setSelectedCategory("all");
    setSortBy("newest");
    setVerifiedFilter("all");
    setSelectedStripCategory(getJobSearchStrip(query) ?? "all");
    setSelectedMaxSalary(100200000);
    setMobileFiltersOpen(false);
  }, [query]);

  const filteredResults = useMemo(
    () =>
      sortJobResults(
        jobResults.filter((item) => {
          const verified = isSellerVerified(item.ad.user);
          const categoryMatches = selectedCategory === "all" || item.categoryType === selectedCategory;
          const stripMatches = selectedStripCategory === "all" || item.stripCategory === selectedStripCategory;
          const verifiedMatches =
            verifiedFilter === "all" ||
            (verifiedFilter === "verified" && verified) ||
            (verifiedFilter === "unverified" && !verified);
          const salaryMatches = item.ad.price <= selectedMaxSalary;
          return categoryMatches && stripMatches && verifiedMatches && salaryMatches;
        }),
        sortBy,
      ),
    [jobResults, selectedCategory, selectedMaxSalary, selectedStripCategory, sortBy, verifiedFilter],
  );

  return (
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
            <JobFilters
              selectedCategory={selectedCategory}
              onSelectedCategoryChange={setSelectedCategory}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              selectedLocation={locationFilter ?? ""}
              onSelectedLocationChange={onLocationChange}
              verifiedFilter={verifiedFilter}
              onVerifiedFilterChange={setVerifiedFilter}
              selectedMaxSalary={selectedMaxSalary}
              onSelectedMaxSalaryChange={setSelectedMaxSalary}
              maxSalary={maxSalary}
            />
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[256px_minmax(0,1fr)] xl:items-start xl:h-[calc(100vh-112px)] xl:overflow-hidden">
        <aside className="hidden space-y-4 xl:block xl:h-full xl:overflow-y-auto xl:pr-1">
          <JobFilters
            selectedCategory={selectedCategory}
            onSelectedCategoryChange={setSelectedCategory}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            selectedLocation={locationFilter ?? ""}
            onSelectedLocationChange={onLocationChange}
            verifiedFilter={verifiedFilter}
            onVerifiedFilterChange={setVerifiedFilter}
            selectedMaxSalary={selectedMaxSalary}
            onSelectedMaxSalaryChange={setSelectedMaxSalary}
            maxSalary={maxSalary}
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
                  Found <span className="text-[#ff9715]">{resultTotal.toLocaleString()}</span> results for "Job"
                </h1>
                <p className="mt-3 text-[24px] font-medium text-[#1f1d27]">Jobs In Nigeria</p>
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
              {JOB_STRIP_ITEMS.map((option) => (
                <StripBubble
                  key={option.name}
                  name={option.name}
                  image={option.image}
                  active={selectedStripCategory === option.name}
                  onClick={() => setSelectedStripCategory((current) => (current === option.name ? "all" : option.name))}
                />
              ))}
            </div>
          </div>

          <div className={view === "list" ? "space-y-4" : "grid grid-cols-2 gap-5 xl:grid-cols-3"}>
            {filteredResults.map((item) => (
              <ListingCard
                key={item.id}
                item={{
                  price: formatSalary(item),
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
  );
}
