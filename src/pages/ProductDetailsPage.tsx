import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Lightbox from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import { SiteFooter, SiteHeader } from "../components/AppShell";
import SeoHead from "../components/seo/SeoHead";
import { ROUTES, buildProductDetailsRoute } from "../constants/routes";
import { FallbackImage } from "../components/ui/FallbackImage";
import { ImagePlaceholder } from "../components/ui/ImagePlaceholder";
import { UserAvatar } from "../components/ui/UserAvatar";
import ListingCard from "../components/listings/ListingCard";
import { useToast } from "../context/ToastContext";
import { useUserCache } from "../hooks/useUserCache";
import { formatMemberSince } from "../lib/currentUser";
import { buildLoginRoute, ensureFreshVerifiedEmail } from "../lib/emailVerification";
import { getAdConditionLabel } from "../lib/adCondition";
import { isSellerVerified } from "../lib/sellerVerification";
import { getToken } from "../services/auth";
import { API_BASE_URL, api } from "../services/api";
import type { Ad, AdReview, User } from "../types";

function LocationPin({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return <span className={`${className} inline-block animate-spin rounded-full border-2 border-current border-t-transparent`} aria-hidden="true" />;
}

function formatReviewDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function ReviewStars({ rating }: { rating: number }) {
  const clampedRating = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <div className="flex items-center gap-1" aria-label={`${clampedRating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className={`text-[15px] leading-none ${index < clampedRating ? "text-[#ff9715]" : "text-[#d8d4dd]"}`}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </div>
  );
}

function ReviewListSkeleton() {
  return (
    <div className="mt-5 space-y-4" aria-label="Loading reviews">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-[12px] border border-[#efedf2] p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-[#f2f2f4]" />
            <div className="min-w-0 flex-1">
              <div className="h-4 w-32 animate-pulse rounded bg-[#f2f2f4]" />
              <div className="mt-2 h-4 w-24 animate-pulse rounded bg-[#f2f2f4]" />
              <div className="mt-3 h-4 w-full animate-pulse rounded bg-[#f2f2f4]" />
              <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-[#f2f2f4]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReportModal({
  open,
  reason,
  onReasonChange,
  onClose,
  onSubmit,
  submitting,
}: {
  open: boolean;
  reason: string;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label="Report listing">
      <div className="w-full max-w-[520px] rounded-[16px] bg-white p-4 shadow-xl sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[20px] font-semibold text-[#2f2d38]">Report listing</h3>
            <p className="mt-1 text-[13px] text-[#7a7684]">Tell us why this listing should be reviewed.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[8px] px-2 py-1.5 text-[13px] text-[#7a7684] transition hover:bg-[#f4f3f6]"
            disabled={submitting}
          >
            Close
          </button>
        </div>

        <textarea
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          rows={5}
          maxLength={500}
          placeholder="Describe the issue with this listing"
          className="mt-4 w-full resize-y rounded-[10px] border border-[#d8d4de] px-3 py-2 text-[14px] text-[#2f2d38] outline-none transition focus:border-[#ffb46a] focus:ring-2 focus:ring-[#ffb46a]/25"
        />
        <p className="mt-1 text-right text-[12px] text-[#9f9ba8]">{reason.trim().length}/500</p>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-[40px] rounded-[9px] border border-[#d8d4de] px-4 text-[14px] text-[#6f6b77] transition hover:bg-[#f4f3f6]"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="h-[40px] rounded-[9px] bg-gradient-to-r from-amber to-orange px-4 text-[14px] font-medium text-white shadow-glow disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatPhoneForDisplay(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 13 && digits.startsWith("234")) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  return phone;
}

function ProductDetailsSkeleton({ navigate, canonicalUrl }: { navigate: (to: string) => void; canonicalUrl: string }) {
  return (
    <div className="min-h-screen bg-page text-ink">
      <SeoHead canonicalUrl={canonicalUrl} />
      <SiteHeader navigate={navigate} />
      <main className="mx-auto w-full max-w-[1360px] px-4 pb-12 pt-4 sm:px-6 sm:pb-16 sm:pt-6 lg:px-10">
        <section className="rounded-[18px] bg-[#efefef] p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr_320px]">
            <div>
              <div className="h-[320px] w-full animate-pulse rounded-[14px] bg-white sm:h-[420px]" />
              <div className="mt-3 grid grid-cols-5 gap-1.5 sm:grid-cols-8 xl:grid-cols-10">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-[48px] animate-pulse rounded-[4px] bg-white sm:h-[54px]" />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-5 w-36 animate-pulse rounded bg-white" />
              <div className="h-10 w-4/5 animate-pulse rounded bg-white" />
              <div className="h-4 w-52 animate-pulse rounded bg-white" />
              <div className="h-12 w-56 animate-pulse rounded bg-white" />
              <div className="h-10 w-64 animate-pulse rounded bg-white" />
            </div>
            <div className="h-[220px] animate-pulse rounded-[14px] bg-white" />
          </div>
        </section>
      </main>
    </div>
  );
}

export default function ProductDetailsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { error: showError, info, success, showToast } = useToast();
  const { id } = useParams<{ id: string }>();
  const cachedUserResult = useUserCache();
  const [ad, setAd] = useState<Ad | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(cachedUserResult.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [markingUnavailable, setMarkingUnavailable] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [sharePending, setSharePending] = useState(false);
  const [isPhoneRevealed, setIsPhoneRevealed] = useState(false);
  const [isFollowingSeller, setIsFollowingSeller] = useState(false);
  const [followersCount, setFollowersCount] = useState<number | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [reviews, setReviews] = useState<AdReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [similarAds, setSimilarAds] = useState<Ad[]>([]);
  const [similarAdsLoading, setSimilarAdsLoading] = useState(false);
  const productId = id ?? "";
  const canonicalPath = productId ? `/product-details/${encodeURIComponent(productId)}` : "/product-details";
  const canonicalUrl = `${window.location.origin}${canonicalPath}`;

  // Sync cached user updates
  useEffect(() => {
    if (cachedUserResult.user) {
      setCurrentUser(cachedUserResult.user);
    }
  }, [cachedUserResult.user]);

  // Fetch ad and save status (fast path)
  const fetchAd = useCallback(async (isCancelled: () => boolean = () => false) => {
    try {
      setLoading(true);
      setError(null);
      if (!id) throw new Error("No product ID provided");

      const result = await api.adById(id);
      if (isCancelled()) return;
      setAd(result.data);

      const token = getToken();
      if (token) {
        // Fetch save status (fast, non-blocking)
        api.isSaved(id)
          .then((savedResponse) => {
            if (!isCancelled()) {
              setIsSaved(savedResponse.data.saved);
            }
          })
          .catch(() => {
            if (!isCancelled()) {
              setIsSaved(false);
            }
          });

        // Load follow status in background (deferred)
        if (result.data.user?.id) {
          setTimeout(() => {
            api.getFollowStatus(result.data.user!.id)
              .then((followStatus) => {
                if (!isCancelled()) {
                  setIsFollowingSeller(followStatus.data.isFollowing);
                  setFollowersCount(followStatus.data.followersCount);
                }
              })
              .catch(() => {
                if (!isCancelled()) {
                  setIsFollowingSeller(false);
                  setFollowersCount(null);
                }
              });
          }, 0);
        }
      }
    } catch (err) {
      if (!isCancelled()) {
        setError(err instanceof Error ? err.message : "Failed to load product");
        console.error("Error fetching product:", err);
      }
    } finally {
      if (!isCancelled()) {
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    void fetchAd(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [fetchAd]);

  useEffect(() => {
    setIsPhoneRevealed(false);
    setIsFollowingSeller(false);
    setFollowersCount(null);
    setFollowLoading(false);
    setReviews([]);
    setReviewsLoading(false);
    setReviewsError(null);
    setSelectedRating(5);
    setReviewText("");
    setSubmittingReview(false);
    setReportOpen(false);
    setReportReason("");
    setSubmittingReport(false);
    setSimilarAds([]);
    setSimilarAdsLoading(false);
  }, [id]);

  useEffect(() => {
    if (!productId) return;
    if (location.pathname === canonicalPath) return;
    navigate(canonicalPath, { replace: true });
  }, [canonicalPath, location.pathname, navigate, productId]);

  const fetchReviews = useCallback(async (adId: string, isCancelled: () => boolean = () => false) => {
    setReviewsLoading(true);
    setReviewsError(null);
    try {
      const response = await api.getReviews(adId);
      if (isCancelled()) return;
      setReviews(response.data);
    } catch (err) {
      if (isCancelled()) return;
      setReviews([]);
      setReviewsError(err instanceof Error ? err.message : "Unable to load reviews right now.");
    } finally {
      if (isCancelled()) return;
      setReviewsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ad?.id) return;
    let cancelled = false;
    void fetchReviews(ad.id, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [ad?.id, fetchReviews]);

  // Fetch other active ads in the same category as "Similar Ads".
  useEffect(() => {
    const categorySlug = ad?.category?.slug;
    const currentAdId = ad?.id;
    if (!categorySlug || !currentAdId) return;
    let cancelled = false;
    setSimilarAdsLoading(true);
    api.ads(`?category=${encodeURIComponent(categorySlug)}&pageSize=8&imagesLimit=1`)
      .then((response) => {
        if (cancelled) return;
        setSimilarAds(response.data.filter((item) => item.id !== currentAdId).slice(0, 4));
      })
      .catch(() => {
        if (!cancelled) setSimilarAds([]);
      })
      .finally(() => {
        if (!cancelled) setSimilarAdsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ad?.id, ad?.category?.slug]);

  const handleOpenReportModal = () => {
    if (!ad) return;
    const token = getToken();
    if (!token) {
      showError("Please log in to report this listing");
      navigate("/login");
      return;
    }
    if (currentUser?.id && ad.user?.id === currentUser.id) {
      showError("You cannot report your own ad");
      return;
    }
    setReportOpen(true);
  };

  const handleSubmitReport = async () => {
    if (!ad) return;
    const token = getToken();
    if (!token) {
      showError("Please log in to report this listing");
      navigate("/login");
      return;
    }
    if (currentUser?.id && ad.user?.id === currentUser.id) {
      showError("You cannot report your own ad");
      return;
    }

    const reason = reportReason.trim();
    if (reason.length < 5) {
      showError("Please provide at least 5 characters.");
      return;
    }

    try {
      setSubmittingReport(true);
      await api.reportAd(ad.id, { reason });
      setReportOpen(false);
      setReportReason("");
      success("Report submitted");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Unable to submit report right now");
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!ad) return;
    const token = getToken();
    if (!token) {
      showError("Please log in to leave a review");
      navigate("/login");
      return;
    }
    if (currentUser?.id && ad.user?.id === currentUser.id) {
      showError("You cannot review your own ad");
      return;
    }

    const text = reviewText.trim();
    if (!text) {
      showError("Please write a short review.");
      return;
    }

    try {
      setSubmittingReview(true);
      await api.postReview(ad.id, { rating: selectedRating, text });
      setReviewText("");
      setSelectedRating(5);
      success("Review submitted");
      await fetchReviews(ad.id);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Unable to submit review right now");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = getToken();
      if (!token) {
        showError("Please log in to save products");
        return;
      }
      if (!id) return;
      setSaving(true);
      if (isSaved) await api.unsaveAd(id);
      else await api.saveAd(id);
      setIsSaved(!isSaved);
      success(isSaved ? "Product removed from saved items" : "Product saved");
    } catch (err) {
      console.error("Error saving product:", err);
      showError(err instanceof Error ? err.message : "Unable to update saved products right now");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkUnavailable = async () => {
    try {
      if (!id) return;
      setMarkingUnavailable(true);
      const response = await api.markAdUnavailable(id);
      setAd(response.data);
      info("Ad marked as unavailable");
    } catch (err) {
      console.error("Error marking unavailable:", err);
      showError(err instanceof Error ? err.message : "Unable to update this ad right now");
    } finally {
      setMarkingUnavailable(false);
    }
  };

  const handleChatSeller = async () => {
    const token = getToken();
    const currentPath = `${location.pathname}${location.search}`;

    if (!token) {
      showToast({
        title: "Login Required",
        message: "Please sign in or create an account to chat with the seller.",
        actions: [
          {
            label: "Sign In",
            onClick: () => navigate(buildLoginRoute(currentPath)),
          },
          {
            label: "Create Account",
            onClick: () => {
              const params = new URLSearchParams({ next: currentPath });
              navigate(`${ROUTES.SIGNUP}?${params.toString()}`);
            },
          },
        ],
        durationMs: 7000,
      });
      return;
    }

    if (!ad?.user?.id) {
      showError("Seller information is unavailable for this ad");
      return;
    }

    const params = new URLSearchParams({
      recipient: ad.user.id,
      ad: ad.id,
      seller: ad.user.fullName || "Seller",
      title: ad.title,
    });

    const nextPath = `/messages?${params.toString()}`;
    const canContinue = await ensureFreshVerifiedEmail({
      navigate,
      nextPath,
      fallbackUser: currentUser,
      onUnverified: () => showError("Please verify your email to continue."),
    });
    if (!canContinue) return;

    navigate(nextPath);
  };

  const handleStartOffer = async () => {
    const token = getToken();
    if (!token) {
      showError("Please log in to send an offer.");
      navigate("/login");
      return;
    }

    if (!ad) return;

    const nextPath = `/make-offer?adId=${encodeURIComponent(ad.id)}`;
    const canContinue = await ensureFreshVerifiedEmail({
      navigate,
      nextPath,
      fallbackUser: currentUser,
      onUnverified: () => showError("Please verify your email to continue."),
    });
    if (!canContinue) return;

    navigate(nextPath);
  };

  const handleToggleFollowSeller = async () => {
    const token = getToken();
    if (!token) {
      showError("Please log in to follow sellers");
      return;
    }

    if (!ad?.user?.id) {
      showError("Seller information is unavailable");
      return;
    }

    if (currentUser?.id && currentUser.id === ad.user.id) {
      showError("You cannot follow yourself");
      return;
    }

    const previousFollowing = isFollowingSeller;
    const previousCount = followersCount;
    setFollowLoading(true);

    if (previousFollowing) {
      setIsFollowingSeller(false);
      setFollowersCount((current) => (typeof current === "number" ? Math.max(0, current - 1) : current));
    } else {
      setIsFollowingSeller(true);
      setFollowersCount((current) => (typeof current === "number" ? current + 1 : 1));
    }

    try {
      if (previousFollowing) {
        await api.unfollowUser(ad.user.id);
      } else {
        await api.followUser(ad.user.id);
      }

      const statusResponse = await api.getFollowStatus(ad.user.id);
      setIsFollowingSeller(statusResponse.data.isFollowing);
      setFollowersCount(statusResponse.data.followersCount);
    } catch (err) {
      setIsFollowingSeller(previousFollowing);
      setFollowersCount(previousCount);
      showError(err instanceof Error ? err.message : "Unable to update follow status right now");
    } finally {
      setFollowLoading(false);
    }
  };

  const sellerPhoneRaw = ad?.user?.phone?.trim() ?? "";
  const sellerPhoneDigits = sellerPhoneRaw.replace(/\D/g, "");
  const sellerPhoneDisplay = sellerPhoneRaw ? formatPhoneForDisplay(sellerPhoneRaw) : "Phone not available";
  const sellerPhoneDial = sellerPhoneDigits
    ? sellerPhoneDigits.startsWith("0")
      ? `+234${sellerPhoneDigits.slice(1)}`
      : sellerPhoneDigits.startsWith("234")
        ? `+${sellerPhoneDigits}`
        : `+${sellerPhoneDigits}`
    : "";

  const handleCallSeller = () => {
    if (!sellerPhoneRaw) {
      showError("Seller phone number is unavailable");
      return;
    }

    if (!isPhoneRevealed) {
      setIsPhoneRevealed(true);
      return;
    }

    if (!sellerPhoneDial) {
      showError("Seller phone number is invalid");
      return;
    }

    window.location.href = `tel:${sellerPhoneDial}`;
  };

  const handleShareAd = async () => {
    if (!ad) return;
    const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, "");
    const shareUrl = `${apiOrigin}/api/ads/${ad.id}/share-preview`;
    const sharePayload = {
      title: ad.title,
      text: `Check out this listing on Qwik: ${ad.title}`,
      url: shareUrl,
    };

    try {
      setSharePending(true);
      if (navigator.share) {
        await navigator.share(sharePayload);
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      success("Listing link copied");
    } catch {
      showError("Unable to share this listing right now");
    } finally {
      setSharePending(false);
    }
  };

  if (loading) return <ProductDetailsSkeleton navigate={navigate} canonicalUrl={canonicalUrl} />;
  if (error || !ad) {
    return (
      <div className="min-h-screen bg-page text-ink">
        <SeoHead canonicalUrl={canonicalUrl} noindex />
        <SiteHeader navigate={navigate} />
        <main className="mx-auto grid min-h-[60vh] w-full max-w-[1728px] place-items-center px-6 py-16">
          <div className="max-w-md rounded-[18px] border border-[#f0d1d1] bg-white px-6 py-8 text-center">
            <h1 className="text-[24px] font-medium">Failed to load product</h1>
            <p className="mt-3 text-[15px] text-[#6d6a74]">{error || "Product not found"}</p>
            <button
              type="button"
              onClick={() => {
                void fetchAd();
              }}
              className="mt-5 rounded-[8px] bg-gradient-to-r from-amber to-orange px-4 py-2 text-[15px] text-white"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  const gallery = ad.images?.map((img: any) => img.url).filter(Boolean) || [];
  const lightboxSlides = gallery.map((src: string) => ({ src }));
  const selected = gallery[activeImage] ?? gallery[0];
  const specs = ad.specifications || {};
  const specArray = Object.entries(specs)
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "" && String(v).toUpperCase() !== "NONE")
    .map(([k, v]) => [
      k.replace(/([A-Z])/g, " $1").replace(/^./, (str: string) => str.toUpperCase()).trim(),
      v,
    ]) as Array<[string, unknown]>;
  const sellerName = ad.user?.fullName || "Seller";
  const sellerAvatarUrl = ad.user?.profile?.avatarUrl || "";
  const sellerMeta = formatMemberSince(ad.user?.createdAt);
  const productPrice = Number.isFinite(ad.price) ? ad.price : undefined;
  const seoTitle = `${ad.title} | Qwik`;
  const seoDescription = (ad.description || "Browse this product on Qwik.").trim().slice(0, 160);
  const seoImage = ad.images?.[0]?.url;
  const brandName = ad.brand || ad.category?.name || "Qwik";
  const breadcrumbCategory = ad.category?.name || "Listings";
  const availability = ad.status === "SOLD" ? "https://schema.org/SoldOut" : "https://schema.org/InStock";
  const productStructuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: ad.title,
    description: seoDescription,
    sku: ad.id,
    category: breadcrumbCategory,
    brand: {
      "@type": "Brand",
      name: brandName,
    },
    image: ad.images?.map((image) => image.url).filter(Boolean),
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: "NGN",
      price: typeof productPrice === "number" ? productPrice.toFixed(0) : undefined,
      availability,
      itemCondition: "https://schema.org/UsedCondition",
    },
    seller: {
      "@type": "Organization",
      name: sellerName,
    },
  };
  const breadcrumbStructuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${window.location.origin}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: breadcrumbCategory,
        item: `${window.location.origin}/search`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: ad.title,
        item: canonicalUrl,
      },
    ],
  };
  const isOwner = Boolean(currentUser?.id && ad.user?.id === currentUser.id);
  const isAuthenticated = Boolean(getToken());
  const canLeaveReview = isAuthenticated && !isOwner;
  const canReportListing = isAuthenticated && !isOwner;
  const sellerVerified = isSellerVerified(ad.user);
  const sellerAllAdsPath = ad.user?.id ? `/users/${encodeURIComponent(ad.user.id)}` : "/search";

  const showPreviousImage = () => {
    if (gallery.length <= 1) return;
    setActiveImage((current) => (current - 1 + gallery.length) % gallery.length);
  };

  const showNextImage = () => {
    if (gallery.length <= 1) return;
    setActiveImage((current) => (current + 1) % gallery.length);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(event.changedTouches[0]?.clientX ?? null);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null || gallery.length <= 1) return;
    const endX = event.changedTouches[0]?.clientX;
    if (typeof endX !== "number") {
      setTouchStartX(null);
      return;
    }
    const deltaX = endX - touchStartX;
    const SWIPE_THRESHOLD = 40;
    if (deltaX <= -SWIPE_THRESHOLD) {
      showNextImage();
    } else if (deltaX >= SWIPE_THRESHOLD) {
      showPreviousImage();
    }
    setTouchStartX(null);
  };

  const detailRows = specArray.length > 0
    ? specArray
    : [["Condition", getAdConditionLabel(ad.condition) ?? "Not specified"], ["Availability", ad.status ?? "Available"]] as Array<[string, unknown]>;

  return (
    <div className="min-h-screen bg-page text-ink">
      <SeoHead
        title={seoTitle}
        description={seoDescription}
        canonicalUrl={canonicalUrl}
        ogType="product"
        ogImage={seoImage}
        structuredData={[productStructuredData, breadcrumbStructuredData]}
      />
      <SiteHeader navigate={navigate} />

      <main className="mx-auto w-full max-w-[1360px] px-4 pb-12 pt-4 sm:px-6 sm:pb-16 sm:pt-6 lg:px-10">
        <section className="rounded-[20px] bg-[#ececef] p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[440px_minmax(0,1fr)] xl:gap-12">
            <div className="min-w-0">
              <div
                className="relative h-[300px] w-full overflow-hidden rounded-[14px] bg-white sm:h-[420px]"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {selected ? (
                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    aria-label="Open product image viewer"
                    className="h-full w-full cursor-zoom-in"
                  >
                    <FallbackImage
                      src={selected}
                      alt={ad.title}
                      className="h-full w-full"
                      fallbackClassName="rounded-[14px]"
                      loading="eager"
                    />
                  </button>
                ) : (
                  <ImagePlaceholder className="rounded-[14px]" />
                )}
                {gallery.length > 1 ? (
                  <>
                    <button
                      type="button"
                      aria-label="Show previous image"
                      onClick={showPreviousImage}
                      className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/55 px-2.5 py-2 text-white transition hover:bg-black/70"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      aria-label="Show next image"
                      onClick={showNextImage}
                      className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/55 px-2.5 py-2 text-white transition hover:bg-black/70"
                    >
                      ›
                    </button>
                  </>
                ) : null}
              </div>
              {gallery.length > 0 ? (
                <div className="mt-3 grid grid-cols-5 gap-1.5 overflow-x-auto pb-1 sm:grid-cols-8 xl:grid-cols-10">
                  {gallery.map((src: string, idx: number) => (
                    <button
                      key={`${src}-${idx}`}
                      className={`overflow-hidden rounded-[4px] border ${idx === activeImage ? "border-orange" : "border-transparent"}`}
                      onClick={() => setActiveImage(idx)}
                      type="button"
                    >
                      <FallbackImage
                        src={src}
                        alt={`thumb-${idx + 1}`}
                        className="h-[48px] w-full sm:h-[54px]"
                        fallbackClassName="h-[48px] sm:h-[54px]"
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="rounded-[14px] bg-transparent p-0.5">
                {sellerVerified ? <p className="mb-2 text-[14px] font-medium text-[#57b77a]">Verified Seller</p> : null}
                <h1 className="text-[30px] font-medium leading-tight text-[#2c2a31]">{ad.title}</h1>
                <p className="mt-1.5 flex items-center gap-1 text-[14px] text-[#6d6a74] sm:text-[15px]">
                  <LocationPin className="h-4 w-4" />
                  <span>{ad.location}</span>
                </p>
                <div className="mt-3 flex items-center gap-2.5">
                  <h2 className="text-[44px] font-semibold leading-none text-[#161420]">₦ {ad.price.toLocaleString()}</h2>
                  {getAdConditionLabel(ad.condition) ? (
                    <span className="rounded-[8px] bg-badge-bg px-2 py-1 text-[12px] font-medium text-[#ff9715]">{getAdConditionLabel(ad.condition)}</span>
                  ) : null}
                </div>
                <p className="mt-1.5 text-[13px] text-[#57b77a]">Check market price</p>
                <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2.5 sm:w-fit">
                  <button
                    className="h-[44px] w-full rounded-[8px] bg-gradient-to-r from-amber to-orange px-5 text-[14px] font-medium text-white shadow-glow transition-all duration-200 hover:opacity-95 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb357] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    onClick={() => void handleChatSeller()}
                    type="button"
                  >
                    Chat Seller
                  </button>
                  <button
                    aria-label={isSaved ? "Remove product from saved items" : "Save product"}
                    className="flex h-[42px] w-[42px] items-center justify-center rounded-[8px] border border-[#d9d7de] bg-white transition-all duration-200 hover:border-[#b9b6c2] hover:bg-[#f8f8fa] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb357] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    onClick={handleSave}
                    disabled={saving}
                    type="button"
                  >
                    {saving ? (
                      <Spinner className="h-5 w-5" />
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill={isSaved ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="M6.5 4.8c0-1 .8-1.8 1.8-1.8h7.4c1 0 1.8.8 1.8 1.8v16.1L12 17.5l-5.5 3.4V4.8Z" />
                      </svg>
                    )}
                  </button>
                    <button
                      aria-label="Share listing"
                      className="flex h-[42px] w-[42px] items-center justify-center rounded-[8px] border border-[#d9d7de] bg-white text-[#7e7b86] transition-all duration-200 hover:border-[#b9b6c2] hover:bg-[#f8f8fa] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb357] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      onClick={() => void handleShareAd()}
                      disabled={sharePending}
                      type="button"
                    >
                      {sharePending ? (
                        <Spinner className="h-5 w-5" />
                      ) : (
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="18" cy="5" r="2.5" />
                          <circle cx="6" cy="12" r="2.5" />
                          <circle cx="18" cy="19" r="2.5" />
                          <path d="m8.4 10.8 7.2-4.2" />
                          <path d="m8.4 13.2 7.2 4.2" />
                        </svg>
                      )}
                    </button>
                </div>
              </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  <aside className="rounded-[14px] border border-[#e1dfe6] bg-white p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <UserAvatar name={sellerName} imageUrl={sellerAvatarUrl} alt={sellerName} className="h-11 w-11 rounded-full object-cover text-[12px]" enableViewer />
                        <div>
                          <p className="text-[15px] font-medium text-[#2f2d38]">{sellerName}</p>
                          <p className="text-[12px] text-[#8f8b98]">{sellerMeta}</p>
                          {typeof followersCount === "number" ? (
                            <p className="text-[12px] text-[#8f8b98]">{followersCount} follower{followersCount === 1 ? "" : "s"}</p>
                          ) : null}
                        </div>
                      </div>
                      {!isOwner ? (
                        <button
                          className={`h-8 rounded-[7px] px-2.5 text-[12px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb357] focus-visible:ring-offset-2 focus-visible:ring-offset-white ${isFollowingSeller ? "bg-[#e9f4ec] text-[#2f8f53]" : "bg-badge-bg text-[#ff9715] hover:bg-[#ffe2c5]"}`}
                          onClick={handleToggleFollowSeller}
                          disabled={followLoading}
                          type="button"
                        >
                          {followLoading ? "..." : isFollowingSeller ? "Following" : "Follow"}
                        </button>
                      ) : null}
                    </div>

                    <button
                      className="mt-2 text-[13px] font-medium text-[#ff9715]"
                      type="button"
                      onClick={() => navigate(sellerAllAdsPath)}
                    >
                      See all ads
                    </button>

                    <div className="mt-4 space-y-2">
                      <button
                        className="h-10 w-full rounded-[8px] border border-[#ffb46a] bg-[#fff7ef] px-4 text-[14px] font-medium text-[#d97706] transition-colors duration-200 hover:bg-[#ffefdc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb357] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                        onClick={() => void handleStartOffer()}
                        type="button"
                      >
                        Make Offer
                      </button>
                      <button
                        className="h-10 w-full rounded-[8px] bg-badge-bg px-4 text-[14px] font-medium text-[#ff9715] transition-colors duration-200 hover:bg-[#ffe2c5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb357] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                        onClick={handleCallSeller}
                        type="button"
                      >
                        {isPhoneRevealed ? sellerPhoneDisplay : "View Number"}
                      </button>
                    </div>
                  </aside>

                  <div className="rounded-[14px] border border-[#e5e3e9] bg-white p-4 sm:p-5">
                    <h3 className="mb-3 text-[36px] font-normal leading-none">Product Details</h3>
                    <p className="mb-5 max-w-[680px] text-[15px] leading-[1.45] text-[#5f5c68]">{ad.description}</p>
                    <div className="grid grid-cols-1 gap-x-8 gap-y-4 text-[14px] sm:grid-cols-2">
                      {detailRows.map(([k, v]: [string, unknown]) => (
                        <div key={k}>
                          <p className="text-[#8f8b98]">{k}</p>
                          <p className="font-medium text-[#2d2b33]">{v === true ? "Yes" : v === false ? "No" : String(v)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
          </div>
        </section>

          <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.08fr_0.92fr] lg:gap-6">
            <div className="rounded-[14px] border border-[#e5e3e9] bg-white p-4 sm:p-5">
              <h4 className="mb-2 text-[18px] font-semibold">Safety tips</h4>
              <ul className="space-y-1.5 text-[13px] text-[#6f6b77]">
                <li className="flex items-start gap-2"><span className="mt-0.5 text-[#57b77a]">•</span><span>Inspect the item before payment</span></li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-[#57b77a]">•</span><span>Meet seller in a safe public place</span></li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-[#57b77a]">•</span><span>Do not send advance payment</span></li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-[#57b77a]">•</span><span>Verify item condition and documents</span></li>
                <li className="flex items-start gap-2"><span className="mt-0.5 text-[#57b77a]">•</span><span>Report suspicious listings</span></li>
              </ul>
              <div className="mt-3 flex items-center gap-2">
                {isOwner ? (
                  <button
                    className="rounded-[8px] bg-badge-bg px-3 py-2 text-[13px] text-[#ff9715] transition-colors duration-200 hover:bg-[#ffe2c5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb357] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    onClick={handleMarkUnavailable}
                    disabled={markingUnavailable}
                    type="button"
                  >
                    {markingUnavailable ? "Marking..." : "Mark Unavailable"}
                  </button>
                ) : null}
                {!isOwner ? (
                  <button
                    type="button"
                    onClick={handleOpenReportModal}
                    className="rounded-[8px] border border-[#ffb46a] bg-[#fff7ef] px-3 py-2 text-[13px] font-medium text-[#d97706] transition-colors duration-200 hover:bg-[#ffefdc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb357] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                    Report listing
                  </button>
                ) : null}
                {!isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="text-[12px] text-[#9f9ba8] underline-offset-2 transition hover:text-[#7f7b87] hover:underline"
                  >
                    Login to report
                  </button>
                ) : null}
              </div>
            </div>

            <div className="rounded-[14px] border border-[#e5e3e9] bg-white p-4 sm:p-5">
              <h4 className="text-[36px] font-normal leading-none">Reviews</h4>
              {canLeaveReview ? (
                <div className="mt-4 rounded-[12px] border border-[#efedf2] p-4">
                  <p className="text-[14px] font-medium text-[#2f2d38]">Leave a review</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Select rating">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const value = index + 1;
                      return (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={selectedRating === value}
                          onClick={() => setSelectedRating(value)}
                          className={`text-[22px] leading-none transition ${value <= selectedRating ? "text-[#ff9715]" : "text-[#d8d4dd]"}`}
                        >
                          ★
                        </button>
                      );
                    })}
                  </div>
                  <textarea
                    value={reviewText}
                    onChange={(event) => setReviewText(event.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Share your experience with this listing"
                    className="mt-3 w-full resize-y rounded-[10px] border border-[#d8d4de] px-3 py-2 text-[14px] text-[#2f2d38] outline-none transition focus:border-[#ffb46a] focus:ring-2 focus:ring-[#ffb46a]/25"
                  />
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-[12px] text-[#9f9ba8]">{reviewText.trim().length}/500</span>
                    <button
                      type="button"
                      onClick={() => void handleSubmitReview()}
                      disabled={submittingReview}
                      className="h-[38px] rounded-[9px] bg-gradient-to-r from-amber to-orange px-4 text-[13px] font-medium text-white shadow-glow disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submittingReview ? "Submitting..." : "Submit review"}
                    </button>
                  </div>
                </div>
              ) : !isAuthenticated ? (
                <div className="mt-4 rounded-[12px] border border-[#efedf2] p-4">
                  <p className="text-[13px] text-[#7f7b87]">Log in to leave a review for this listing.</p>
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="mt-3 h-[36px] rounded-[8px] border border-[#d8d4de] px-3 text-[13px] text-[#6f6b77] transition hover:bg-[#f4f3f6]"
                  >
                    Go to login
                  </button>
                </div>
              ) : null}

              {reviewsLoading ? (
                <ReviewListSkeleton />
              ) : reviewsError ? (
                <p className="mt-5 text-[14px] text-[#b84a4a]">{reviewsError}</p>
              ) : reviews.length === 0 ? (
                <p className="mt-5 text-[14px] text-[#8f8b98]">No reviews yet.</p>
              ) : (
                <div className="mt-5 space-y-4 overflow-x-hidden">
                  {reviews.map((review) => (
                    <article key={review.id} className="rounded-[12px] border border-[#efedf2] p-4">
                      <div className="flex items-start gap-3">
                        <UserAvatar
                          name={review.user.fullName}
                          className="h-10 w-10 shrink-0 rounded-full text-[12px]"
                          alt={review.user.fullName}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-[14px] font-medium text-[#2f2d38]">{review.user.fullName}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <ReviewStars rating={review.rating} />
                                <span className="text-[12px] text-[#9f9ba8]">{formatReviewDate(review.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <p className="mt-3 break-words text-[14px] leading-[1.55] text-[#5f5c68]">{review.text}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="mt-6 rounded-[14px] border border-dashed border-[#ddd9e4] bg-[#fbfafc] p-4 sm:p-5">
            <h4 className="text-[28px] font-normal">Similar Ads</h4>
            {similarAdsLoading ? (
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-[200px] animate-pulse rounded-[14px] bg-white sm:h-[240px]" />
                ))}
              </div>
            ) : similarAds.length === 0 ? (
              <p className="mt-2 text-[14px] text-[#7f7b87]">No similar ads found right now.</p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {similarAds.map((item) => (
                  <ListingCard
                    key={item.id}
                    item={{
                      price: `₦ ${item.price.toLocaleString()}`,
                      title: item.title,
                      description: item.description,
                      location: item.location,
                      image: item.images?.[0]?.url,
                      verifiedSeller: isSellerVerified(item.user),
                    }}
                    interactive
                    onClick={() => navigate(buildProductDetailsRoute(item.id))}
                    clampTitleLines={1}
                    clampDescriptionLines={1}
                    clampLocationLines={1}
                    imageHeightClassName="h-[110px] sm:h-[140px]"
                  />
                ))}
              </div>
            )}
        </section>
      </main>

      <SiteFooter navigate={navigate} />

      <Lightbox
        open={isLightboxOpen}
        close={() => setIsLightboxOpen(false)}
        index={activeImage}
        slides={lightboxSlides}
        plugins={[Counter, Zoom]}
        zoom={{ maxZoomPixelRatio: 4, zoomInMultiplier: 2, doubleTapDelay: 300, scrollToZoom: true }}
        controller={{ closeOnBackdropClick: true }}
        carousel={{ finite: gallery.length <= 1 }}
        on={{ view: ({ index }) => setActiveImage(index) }}
      />
      <ReportModal
        open={reportOpen && canReportListing}
        reason={reportReason}
        onReasonChange={setReportReason}
        onClose={() => {
          if (submittingReport) return;
          setReportOpen(false);
        }}
        onSubmit={handleSubmitReport}
        submitting={submittingReport}
      />
    </div>
  );
}
