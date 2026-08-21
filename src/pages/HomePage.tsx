import type { ComponentType } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SiteFooter, SiteHeader } from "../components/AppShell";
import VerifiedSellerBadge from "../components/listings/VerifiedSellerBadge";
import { buildSearchResultsCategoryRoute } from "../constants/routes";
import { FallbackImage } from "../components/ui/FallbackImage";
import { ImagePlaceholder } from "../components/ui/ImagePlaceholder";
import { getAdConditionLabel } from "../lib/adCondition";
import { getLocationSearchParam } from "../lib/searchContext";
import { isSellerVerified } from "../lib/sellerVerification";
import SeoHead from "../components/seo/SeoHead";
import { api, isApiError } from "../services/api";
import type { Ad } from "../types";

type Category = {
  name: string;
  shortName: string;
  tone: string;
  image?: string;
  icon?: ComponentType<{ className?: string }>;
  route: string;
};
type Product = Ad;

const categories: Category[] = [
  { name: "Vehicles", shortName: "Cars", image: "/category-images/vehicles.png", tone: "#f8ebe4", route: buildSearchResultsCategoryRoute("vehicles") },
  { name: "Phones & Tablets", shortName: "Phones", image: "/category-images/phone.png", tone: "#e9edff", route: buildSearchResultsCategoryRoute("phones-tablets") },
  { name: "Jobs", shortName: "Jobs", image: "/category-images/image.png", tone: "#f2e8dd", route: buildSearchResultsCategoryRoute("jobs") },
  { name: "Agriculture & Food", shortName: "Agriculture & Food", image: "/category-images/agriculture.png", tone: "#e5f1df", route: buildSearchResultsCategoryRoute("agriculture") },
  { name: "Sports & Leisure", shortName: "Sports", image: "/category-images/sports.png", tone: "#e7eefb", route: buildSearchResultsCategoryRoute("sports-leisure") },
  { name: "Fashion", shortName: "Fashion", image: "/category-images/fashion.png", tone: "#f6eadc", route: buildSearchResultsCategoryRoute("fashion") },
  { name: "Art", shortName: "Art", image: "/category-images/art.png", tone: "#f0e8f7", route: buildSearchResultsCategoryRoute("art") },
  { name: "Properties", shortName: "Properties", image: "/category-images/properties.png", tone: "#e2f1e9", route: buildSearchResultsCategoryRoute("properties") },
  { name: "Furniture & Appliances", shortName: "Furniture", image: "/category-images/furniture.png", tone: "#f4e3f4", route: buildSearchResultsCategoryRoute("furniture-appliances") },
  { name: "Electronics", shortName: "Electronics", image: "/category-images/electronics.png", tone: "#ebeef3", route: buildSearchResultsCategoryRoute("electronics") },
  { name: "Beauty", shortName: "Beauty", image: "/category-images/beauty.png", tone: "#f1e4ee", route: buildSearchResultsCategoryRoute("beauty") }
];

function LocationPin({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

type ViewMode = "grid" | "list";
const VIEW_MODE_STORAGE_KEY = "qwik:home:viewMode";

function readStoredViewMode(): ViewMode {
  if (typeof window === "undefined") return "grid";
  try {
    const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return stored === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

function GridIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <rect x="2" y="2" width="6" height="6" rx="1.4" />
      <rect x="12" y="2" width="6" height="6" rx="1.4" />
      <rect x="2" y="12" width="6" height="6" rx="1.4" />
      <rect x="12" y="12" width="6" height="6" rx="1.4" />
    </svg>
  );
}

function ListIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className} aria-hidden="true">
      <line x1="3" y1="5" x2="17" y2="5" />
      <line x1="3" y1="10" x2="17" y2="10" />
      <line x1="3" y1="15" x2="17" y2="15" />
    </svg>
  );
}

function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  const baseBtn = "grid h-9 w-9 place-items-center rounded-[10px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff9715] focus-visible:ring-offset-2 focus-visible:ring-offset-page";
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Toggle ads view">
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-pressed={mode === "grid"}
        aria-label="Grid view"
        className={`${baseBtn} ${mode === "grid" ? "text-[#ff9715]" : "text-[#1f1d27]/55 hover:text-[#1f1d27]"}`}
      >
        <GridIcon className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-pressed={mode === "list"}
        aria-label="List view"
        className={`${baseBtn} ${mode === "list" ? "text-[#ff9715]" : "text-[#1f1d27]/55 hover:text-[#1f1d27]"}`}
      >
        <ListIcon className="h-5 w-5" />
      </button>
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <article className="rounded-[22px] bg-white p-2.5 sm:rounded-[26px] sm:p-4">
      <div className="h-[170px] w-full animate-pulse rounded-[14px] bg-[#f2f2f4] sm:h-[260px] sm:rounded-[18px]" />
      <div className="space-y-3 px-0 pb-1 pt-3 sm:pt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="h-5 w-24 animate-pulse rounded bg-[#f2f2f4]" />
          <div className="h-7 w-12 animate-pulse rounded-[10px] bg-[#f2f2f4]" />
        </div>
        <div className="h-4 w-4/5 animate-pulse rounded bg-[#f2f2f4]" />
        <div className="h-4 w-full animate-pulse rounded bg-[#f2f2f4]" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-[#f2f2f4]" />
      </div>
    </article>
  );
}

function ProductRowSkeleton() {
  return (
    <article className="flex gap-4 rounded-[22px] bg-white p-3 sm:gap-6 sm:rounded-[26px] sm:p-4">
      <div className="h-[120px] w-[120px] shrink-0 animate-pulse rounded-[14px] bg-[#f2f2f4] sm:h-[200px] sm:w-[260px] sm:rounded-[18px]" />
      <div className="flex flex-1 flex-col gap-3 py-1">
        <div className="flex items-center gap-3">
          <div className="h-5 w-32 animate-pulse rounded bg-[#f2f2f4]" />
          <div className="h-7 w-12 animate-pulse rounded-[10px] bg-[#f2f2f4]" />
        </div>
        <div className="h-4 w-3/5 animate-pulse rounded bg-[#f2f2f4]" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-[#f2f2f4]" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-[#f2f2f4]" />
      </div>
    </article>
  );
}

function CategoryCard({ item, onClick }: { item: Category; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-[70px] shrink-0 flex-col items-center gap-1.5 text-center transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff9715] focus-visible:ring-offset-4 focus-visible:ring-offset-page active:scale-[0.96] sm:w-[82px] lg:w-[88px]"
      aria-label={`Browse ${item.name}`}
    >
      <span
        className="grid h-[48px] w-[48px] place-items-center overflow-hidden rounded-full shadow-[0_8px_18px_rgba(31,29,39,0.05)] transition duration-200 group-hover:scale-105 group-hover:shadow-[0_12px_24px_rgba(31,29,39,0.09)] sm:h-[52px] sm:w-[52px] lg:h-[56px] lg:w-[56px]"
        style={{ background: item.tone }}
      >
        {item.image ? (
          <FallbackImage
            src={item.image}
            alt=""
            fit="contain"
            className="h-[34px] w-[34px] rounded-full mix-blend-multiply sm:h-[38px] sm:w-[38px] lg:h-[40px] lg:w-[40px]"
            fallbackClassName="h-[34px] w-[34px] rounded-full sm:h-[38px] sm:w-[38px] lg:h-[40px] lg:w-[40px]"
            loading="eager"
            decoding="async"
          />
        ) : item.icon ? (
          <item.icon className="h-[30px] w-[30px] sm:h-[34px] sm:w-[34px] lg:h-[36px] lg:w-[36px]" />
        ) : null}
      </span>
      <span className="max-w-full text-[11px] font-medium leading-[1.15] text-[#1f1d27] sm:text-[12px] lg:text-[12px]">
        <span className="sm:hidden">{item.shortName}</span>
        <span className="hidden sm:inline">{item.name}</span>
      </span>
    </button>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedLocation = getLocationSearchParam(location.search);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListingsUnavailable, setIsListingsUnavailable] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>(() => readStoredViewMode());
  const PAGE_SIZE = 12;

  useEffect(() => {
    try {
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
    } catch {
      /* ignore */
    }
  }, [viewMode]);

  // Synchronous guard against concurrent duplicate fetches (React state updates lag behind rapid scroll events)
  const isFetchingRef = useRef(false);

  const fetchAds = useCallback(async (page: number = 1, shouldAppend: boolean = false) => {
    // Only guard the append (infinite-scroll / load-more) path: repeated scroll events can otherwise
    // fire concurrent requests for the same page and append the same ads twice. A full-replace fetch
    // (shouldAppend === false, e.g. initial load, location change, retry) is idempotent, so it's never blocked.
    if (shouldAppend && isFetchingRef.current) return;
    if (shouldAppend) isFetchingRef.current = true;
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      setIsListingsUnavailable(false);
      const params = new URLSearchParams({ pageSize: PAGE_SIZE.toString(), imagesLimit: "1", page: page.toString() });
      if (selectedLocation) params.set("location", selectedLocation);
      const result = await api.ads(`?${params.toString()}`);
      const newProducts = result.data || [];

      if (shouldAppend) {
        setProducts((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const deduped = newProducts.filter((item) => !existingIds.has(item.id));
          return [...prev, ...deduped];
        });
      } else {
        setProducts(newProducts);
      }
      
      setHasMore(newProducts.length === PAGE_SIZE);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ads");
      setIsListingsUnavailable(isApiError(err) && err.status === 503);
      console.error("Error fetching ads:", err);
    } finally {
      if (shouldAppend) isFetchingRef.current = false;
      if (page === 1) setLoading(false);
      else setLoadingMore(false);
    }
  }, [selectedLocation]);

  const handleLoadMore = useCallback(() => {
    fetchAds(currentPage + 1, true);
  }, [currentPage, fetchAds]);

  // Infinite scroll: auto-load more when user scrolls near bottom
  useEffect(() => {
    const handleScroll = () => {
      // Calculate scroll position
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const scrollPercent = (scrollTop + winHeight) / docHeight;

      // Trigger fetch when user is 70% down the page, has more, and not already loading
      if (scrollPercent > 0.7 && hasMore && !loadingMore) {
        console.log("📜 Scroll-triggered infinite load for page", currentPage + 1, "scrollPercent:", scrollPercent.toFixed(2));
        fetchAds(currentPage + 1, true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [currentPage, hasMore, loadingMore, fetchAds]);

  useEffect(() => {
    setCurrentPage(1);
    setProducts([]);
    setHasMore(true);
    fetchAds(1, false);
  }, [fetchAds]);
  return (
    <div className="min-h-screen bg-page text-ink">
      <SeoHead
        title="Qwik.ng – Nigeria's Trusted Online Marketplace"
        description="Buy, sell, and discover new and used items across Nigeria. Post ads for free and connect with buyers nationwide on Qwik."
        canonicalUrl="https://www.qwik.ng"
        ogImage="https://www.qwik.ng/images/logo-header.png"
      />
      <SiteHeader navigate={navigate} />

      <section className="mx-auto w-full max-w-[1728px] overflow-hidden px-4 pb-1 pt-5 sm:px-6 sm:pt-7 lg:px-12 xl:pt-8">
        <div className="category-scroll -mx-4 overflow-x-auto overscroll-x-contain px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-12 lg:px-12">
          <div className="flex w-max min-w-full flex-nowrap items-start gap-3 sm:gap-4 lg:gap-3 xl:justify-between xl:gap-4">
            {categories.map((item) => (
              <CategoryCard key={item.name} item={item} onClick={() => navigate(item.route)} />
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1728px] px-4 pb-16 pt-8 sm:px-6 lg:px-12 lg:pb-24 lg:pt-14">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-[26px] font-medium sm:text-[32px]">Top Ads</h2>
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>

        {loading && viewMode === "grid" && (
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        )}
        {loading && viewMode === "list" && (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <ProductRowSkeleton key={index} />
            ))}
          </div>
        )}
        {error && (
          <div className="rounded-[18px] border border-[#f0d1d1] bg-white px-6 py-8 text-center">
            {isListingsUnavailable ? (
              <>
                <p className="text-[18px] font-medium text-[#2f2d38]">Listings temporarily unavailable</p>
                <p className="mt-2 text-[15px] text-[#5f5d68]">
                  We're currently doing a quick system update. Listings are temporarily unavailable, but everything else is still available. Please try again in a moment.
                </p>
              </>
            ) : (
              <p className="text-[16px] text-[#d14343]">{error}</p>
            )}
            <button
              type="button"
              onClick={() => fetchAds(1, false)}
              className="mt-4 rounded-[8px] bg-gradient-to-r from-amber to-orange px-4 py-2 text-[15px] text-white"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && products.length === 0 && <p className="text-center text-lg text-gray-500">No ads available</p>}

        {!loading && !error && products.length > 0 && viewMode === "grid" && (
          <>
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              {products.map((item) => (
                <article
                  key={item.id}
                  className="cursor-pointer rounded-[22px] bg-white p-2.5 transition hover:scale-[1.01] sm:rounded-[26px] sm:p-4"
                  onClick={() => navigate(`/product-details/${item.id}`)}
                >
                  <div className="relative h-[170px] w-full overflow-hidden rounded-[14px] bg-white sm:h-[260px] sm:rounded-[18px]">
                    {isSellerVerified(item.user as any) ? <VerifiedSellerBadge /> : null}
                    {item.images?.[0]?.url ? (
                      <FallbackImage
                        src={item.images[0].url}
                        alt={item.title}
                        className="h-full w-full"
                        fallback={<ImagePlaceholder title="" labelClassName="hidden" className="rounded-[14px] sm:rounded-[18px]" />}
                      />
                    ) : (
                      <ImagePlaceholder title="" labelClassName="hidden" className="rounded-[14px] sm:rounded-[18px]" />
                    )}
                  </div>
                  <div className="px-0 pb-1 pt-3 sm:pt-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="m-0 min-w-0 text-[16px] font-semibold leading-none sm:text-[20px]">₦ {item.price.toLocaleString()}</h3>
                    </div>
                    <h4 className="mb-1.5 mt-3 text-[15px] font-medium leading-[1.25] sm:mt-4 sm:text-[18px]" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.title}</h4>
                    <p className="mb-2 text-[13px] leading-[1.35] text-muted sm:mb-3 sm:text-[15px] sm:leading-[1.4]" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.description}</p>
                    <div className="flex items-end justify-between gap-2">
                      <small className="flex min-w-0 items-center gap-1 text-[13px] text-[#4b4a54] sm:text-[15px]">
                        <LocationPin className="h-4 w-4 shrink-0" />
                        <span style={{ display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.location}</span>
                      </small>
                      {getAdConditionLabel(item.condition) ? (
                        <span className="shrink-0 rounded-[8px] bg-[#f5ebdc] px-2 py-0.5 text-[11px] font-medium text-[#c07a1f] sm:text-[12px]">
                          {getAdConditionLabel(item.condition)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {hasMore && !loadingMore && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="rounded-[8px] bg-gradient-to-r from-amber to-orange px-8 py-3 text-[15px] font-medium text-white transition hover:shadow-lg active:scale-95"
                >
                  Load More
                </button>
              </div>
            )}
            {loadingMore && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#ff9715]" />
                  <span className="text-[15px] text-muted">Loading more ads...</span>
                </div>
              </div>
            )}
          </>
        )}

        {!loading && !error && products.length > 0 && viewMode === "list" && (
          <>
            <div className="flex flex-col gap-4">
              {products.map((item) => (
                <article
                  key={item.id}
                  className="flex cursor-pointer gap-3 overflow-hidden rounded-[22px] bg-white p-3 transition hover:shadow-[0_8px_24px_rgba(31,29,39,0.06)] sm:gap-6 sm:rounded-[26px] sm:p-4"
                  onClick={() => navigate(`/product-details/${item.id}`)}
                >
                  <div className="relative h-[120px] w-[120px] shrink-0 overflow-hidden rounded-[14px] bg-[#f2f2f4] sm:h-[200px] sm:w-[260px] sm:rounded-[18px]">
                    {isSellerVerified(item.user as any) ? <VerifiedSellerBadge /> : null}
                    {item.images?.[0]?.url ? (
                      <FallbackImage
                        src={item.images[0].url}
                        alt={item.title}
                        className="h-full w-full"
                        fallback={<ImagePlaceholder title="" labelClassName="hidden" className="rounded-[14px] sm:rounded-[18px]" />}
                      />
                    ) : (
                      <ImagePlaceholder title="" labelClassName="hidden" className="rounded-[14px] sm:rounded-[18px]" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col py-1 sm:py-3">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <h3 className="m-0 min-w-0 text-[16px] font-semibold leading-none sm:text-[20px]">₦ {item.price.toLocaleString()}</h3>
                    </div>
                    <h4 className="mb-1.5 mt-2 text-[15px] font-medium leading-[1.25] sm:mb-2 sm:mt-3 sm:text-[18px]" style={{ display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.title}</h4>
                    <p className="mb-2 text-[13px] leading-[1.4] text-muted sm:mb-3 sm:text-[15px]" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.description}</p>
                    <div className="mt-auto flex items-end justify-between gap-2">
                      <small className="flex min-w-0 items-center gap-1 text-[13px] text-[#4b4a54] sm:text-[15px]">
                        <LocationPin className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </small>
                      {getAdConditionLabel(item.condition) ? (
                        <span className="shrink-0 rounded-[8px] bg-[#f5ebdc] px-2 py-0.5 text-[11px] font-medium text-[#c07a1f] sm:text-[12px]">
                          {getAdConditionLabel(item.condition)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {hasMore && !loadingMore && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="rounded-[8px] bg-gradient-to-r from-amber to-orange px-8 py-3 text-[15px] font-medium text-white transition hover:shadow-lg active:scale-95"
                >
                  Load More
                </button>
              </div>
            )}
            {loadingMore && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#ff9715]" />
                  <span className="text-[15px] text-muted">Loading more ads...</span>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <SiteFooter navigate={navigate} />
    </div>
  );
}
