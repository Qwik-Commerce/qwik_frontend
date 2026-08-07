import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SiteFooter, SiteHeader } from "../components/AppShell";
import DropdownSelect from "../components/ui/DropdownSelect";
import { reconcileVerificationRequiredError } from "../lib/emailVerification";
import { getConditionOptionsForCategory, isConditionAllowedForCategory } from "../lib/postAdOptions";
import { ALL_NIGERIA_LOCATION, NIGERIAN_AREAS, NIGERIAN_LOCATIONS } from "../lib/searchContext";
import { api, isEmailVerificationRequiredError } from "../services/api";
import { useToast } from "../context/ToastContext";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { isProfileComplete, getProfileCompletionRedirect } from "../lib/profileCompletion";

const POST_DRAFT_KEY = "qwik_post_draft";

type PostDraft = {
  title?: string;
  description?: string;
  imageUrls?: string[];
  price?: string;
  negotiable?: boolean;
  categoryId?: string;
  subcategoryId?: string;
  categorySlug?: string;
  brand?: string;
  model?: string;
  condition?: string;
  color?: string;
  location?: string;
  locationState?: string;
  locationArea?: string;
  exchangeAvailable?: boolean;
};

function readDraft(): PostDraft {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(POST_DRAFT_KEY);
    return raw ? (JSON.parse(raw) as PostDraft) : {};
  } catch {
    return {};
  }
}

function writeDraft(draft: PostDraft) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(POST_DRAFT_KEY, JSON.stringify(draft));
}

function clearDraft() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(POST_DRAFT_KEY);
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" />
    </svg>
  );
}

function BookmarkIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="M6.5 4.8c0-1 .8-1.8 1.8-1.8h7.4c1 0 1.8.8 1.8 1.8v16.1L12 17.5l-5.5 3.4V4.8Z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[21px] w-[21px]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="M18 9.5a6 6 0 0 0-12 0c0 7-2.6 7.5-2.6 7.5h17.2S18 16.5 18 9.5" />
      <path d="M14.2 20a2.4 2.4 0 0 1-4.4 0" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[21px] w-[21px]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <rect x="4" y="6" width="16" height="12" rx="3" />
      <path d="m7.5 9.5 4.5 3.3 4.5-3.3" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[15px] w-[15px]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="M19 10c0 5.3-7 10-7 10s-7-4.7-7-10a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.4"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M16.5 12.8c0-2 1.7-3 1.8-3.1-1-.1-2-.6-2.6-1.3-1.1-1.1-2.7-1-3.4-.7-.7.3-1.3.7-2 .7-.8 0-1.5-.4-2.3-.7-1-.4-2.3-.1-3.2.8-1.7 1.8-1.4 5.2.3 7.9.8 1.3 1.8 2.7 3.1 2.7 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8 2.2-1.2 3-2.5c.5-.7.8-1.5 1-2.1-.1-.1-2.1-.8-2.1-3.7ZM14.9 6.5c.7-.8 1.1-1.8 1-2.8-1 .1-2 .6-2.7 1.4-.6.7-1.1 1.8-1 2.8 1.1.1 2.1-.5 2.7-1.4Z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M5.5 3.6v16.8L14 12 5.5 3.6Zm1.4-.9 9.8 5.6-2 2L6.9 2.7Zm0 18.6 7.8-7.6 2 2-9.8 5.6Zm10.8-12.4 2.4 1.4c1.2.7 1.2 2.1 0 2.8l-2.4 1.4-2.2-2.8 2.2-2.8Z" />
    </svg>
  );
}

function Footer() {
  return (
    <footer className="w-full overflow-hidden bg-deep px-[24px] py-[48px] text-[#5f5d6c] sm:px-[48px] lg:px-[70px] lg:pb-[116px] lg:pt-[112px]">
      <div className="mx-auto grid w-full max-w-[1320px] grid-cols-1 gap-[34px] xl:grid-cols-[minmax(80px,0.7fr)_minmax(390px,3.2fr)_minmax(140px,1fr)_minmax(300px,1.8fr)] xl:gap-[32px] 2xl:gap-[76px]">
        <div className="min-w-0 text-[38px] font-normal leading-none text-orange xl:pt-[4px]">
          qwik
        </div>

        <div className="grid min-w-0 grid-cols-3 gap-x-[14px] gap-y-7">
          <div className="min-w-0">
            <h5 className="mb-[16px] text-[14px] font-semibold text-white sm:text-[15px] xl:mb-[28px] xl:text-[17px]">
              About
            </h5>
            <a className="mb-[13px] block text-[13px] leading-snug text-[#5f5d6c] sm:text-[14px] xl:mb-[27px] xl:text-[17px]">
              About Qwik
            </a>
            <a className="mb-[13px] block text-[13px] leading-snug text-[#5f5d6c] sm:text-[14px] xl:mb-[27px] xl:text-[17px]">
              Career
            </a>
            <a className="block text-[13px] leading-snug text-[#5f5d6c] sm:text-[14px] xl:text-[17px]">
              Terms
            </a>
          </div>

          <div className="min-w-0">
            <h5 className="mb-[16px] text-[14px] font-semibold text-white sm:text-[15px] xl:mb-[28px] xl:text-[17px]">
              Resources
            </h5>
            <a className="mb-[13px] block text-[13px] leading-snug text-[#5f5d6c] sm:text-[14px] xl:mb-[27px] xl:text-[17px]">
              Blog
            </a>
            <a className="mb-[13px] block text-[13px] leading-snug text-[#5f5d6c] sm:text-[14px] xl:mb-[27px] xl:text-[17px]">
              Instagram
            </a>
            <a className="mb-[13px] block text-[13px] leading-snug text-[#5f5d6c] sm:text-[14px] xl:mb-[27px] xl:text-[17px]">
              Youtube
            </a>
            <a className="block text-[13px] leading-snug text-[#5f5d6c] sm:text-[14px] xl:text-[17px]">
              Twitter
            </a>
          </div>

          <div className="min-w-0">
            <h5 className="mb-[16px] text-[14px] font-semibold text-white sm:text-[15px] xl:mb-[28px] xl:text-[17px]">
              Support
            </h5>
            <a className="mb-[13px] block break-words text-[13px] leading-snug text-[#5f5d6c] sm:text-[14px] xl:mb-[27px] xl:text-[17px]">
              help@qwik.ng
            </a>
            <a className="block text-[13px] leading-snug text-[#5f5d6c] sm:text-[14px] xl:text-[17px]">
              FAQs
            </a>
          </div>
        </div>

        <div className="min-w-0">
          <h5 className="mb-[16px] text-[15px] font-semibold text-white xl:mb-[24px] xl:text-[17px]">
            Download
          </h5>
          <div className="flex w-full min-w-0 flex-row gap-[10px] xl:flex-col xl:gap-0">
            <button className="flex h-[52px] min-w-0 flex-1 items-center justify-center gap-2 rounded-[8px] bg-card/10 text-[14px] text-[#5f5d6c] sm:text-[15px] xl:mb-[24px] xl:h-[58px] xl:w-[142px] xl:flex-none xl:text-[17px]">
              <AppleIcon />
              App Store
            </button>
            <button className="flex h-[52px] min-w-0 flex-1 items-center justify-center gap-2 rounded-[8px] bg-card/10 text-[14px] text-[#5f5d6c] sm:text-[15px] xl:h-[58px] xl:w-[142px] xl:flex-none xl:text-[17px]">
              <PlayIcon />
              Play Store
            </button>
          </div>
        </div>

        <div className="min-w-0 max-w-full">
          <h5 className="mb-[10px] text-[15px] font-semibold text-white xl:mb-[11px] xl:text-[17px]">
            Stay up to date
          </h5>
          <p className="mb-[16px] text-[14px] leading-[1.45] text-[#5f5d6c] sm:text-[15px] xl:mb-[18px] xl:text-[17px] xl:leading-[1.35]">
            Get news, offers, promotions & the best deals sent to your inbox.
          </p>
          <div className="flex w-full min-w-0 flex-col gap-[10px] xl:flex-row xl:flex-nowrap xl:gap-[8px]">
            <input
              className="h-[54px] min-w-0 flex-1 rounded-[8px] border border-orange bg-transparent px-[14px] text-[16px] text-muted outline-none xl:h-[48px] xl:px-[12px]"
              placeholder="@email"
            />
            <button className="h-[52px] w-full shrink-0 rounded-[8px] bg-gradient-to-r from-amber to-orange px-[18px] text-[16px] text-white shadow-glow xl:h-[48px] xl:w-auto">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

function TextField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-[10px] block text-[15px] font-medium leading-none text-[#27242d]">
        {label}
      </span>
      <input
        type="text"
        className="h-[54px] w-full rounded-[12px] border border-[#dddbe4] bg-white px-[16px] text-[16px] text-[#201d27] outline-none transition placeholder:text-[#a4a0aa] focus:border-orange focus:ring-2 focus:ring-orange/20"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {

  return (
    <button
      className={`flex h-[24px] w-[44px] items-center rounded-full p-[2px] transition ${enabled ? "justify-end bg-gradient-to-r from-amber/30 to-orange/20" : "justify-start bg-card"}`}
      onClick={onToggle}
      type="button"
    >
      <span
        className={`h-[20px] w-[20px] rounded-full ${enabled ? "bg-gradient-to-r from-amber to-orange" : "bg-muted"}`}
      />
    </button>
  );
}

function Spinner() {
  return <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />;
}

export default function PostDetailsPage() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { user } = useCurrentUser();
  const [categorySlug, setCategorySlug] = useState("");
  const [condition, setCondition] = useState("");
  const [color, setColor] = useState("");
  const [locationState, setLocationState] = useState("");
  const [locationArea, setLocationArea] = useState("");
  const [exchangeAvailable, setExchangeAvailable] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const draft = readDraft();
    const draftCategorySlug = (draft.categorySlug || "").trim().toLowerCase();
    const draftCondition = draft.condition || "";
    const hasValidCondition = !draftCondition || isConditionAllowedForCategory(draftCondition, draftCategorySlug);

    setCategorySlug(draftCategorySlug);
    setCondition(hasValidCondition ? draftCondition : "");
    setColor(draft.color || "");
    setLocationState(draft.locationState || "");
    setLocationArea(draft.locationArea || "");
    setExchangeAvailable(draft.exchangeAvailable ?? true);

    if (!hasValidCondition) {
      writeDraft({ ...draft, categorySlug: draftCategorySlug, condition: "" });
    }
  }, []);

  const conditionOptions = useMemo(() => getConditionOptionsForCategory(categorySlug), [categorySlug]);

  const handleSubmit = async () => {
    if (submitting) return;

    const draft = readDraft();

    if (!draft.title || !draft.description || !draft.categoryId || !draft.price || !draft.imageUrls?.length) {
      setError("Please complete the previous steps first.");
      return;
    }

    // Check if profile is complete before submitting
    if (!isProfileComplete(user)) {
      showError("Complete your phone number and location before posting an ad.");
      navigate(getProfileCompletionRedirect("/post"));
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await api.createAd({
        categoryId: draft.subcategoryId || draft.categoryId,
        title: draft.title,
        description: draft.description,
        price: Number(draft.price),
        location: composedLocation,
        locationState: locationState.trim() || undefined,
        locationArea: locationArea.trim() || undefined,
        imageUrls: draft.imageUrls,
        brand: draft.brand,
        model: draft.model,
        condition: condition.trim(),
        specifications: {
          color: color.trim(),
          negotiable: draft.negotiable ?? true,
          exchangeAvailable,
        },
      });

      clearDraft();
      success("Ad created successfully. You can now promote it or manage it in My Ads.");
      navigate(`/promote-ad?adId=${encodeURIComponent(response.data.id)}`);
    } catch (err) {
      // Handle profile completion error from backend
      const errorResponse = (err as any)?.response?.data;
      if (errorResponse?.code === "PROFILE_INCOMPLETE") {
        showError("Complete your phone number and location before posting an ad.");
        navigate(getProfileCompletionRedirect("/post"));
        return;
      }

      if (isEmailVerificationRequiredError(err)) {
        const verified = await reconcileVerificationRequiredError({
          error: err,
          navigate,
          nextPath: "/post-details",
          onUnverified: () => showError("Please verify your email to continue."),
        });

        if (verified) {
          showError("Verification state was refreshed. Please submit your advert again.");
        }

        return;
      }
      setError(err instanceof Error ? err.message : "Failed to create advert");
    } finally {
      setSubmitting(false);
    }
  };

  const stateOptions = NIGERIAN_LOCATIONS.filter((loc) => loc !== ALL_NIGERIA_LOCATION);
  const areasForState = NIGERIAN_AREAS[locationState] ?? null;
  const composedLocation = locationArea.trim()
    ? `${locationArea.trim()}, ${locationState}`
    : locationState;
  const canSubmit = condition.trim().length > 0 && color.trim().length > 0 && locationState.trim().length > 0 && !submitting;

  return (
    <div className="min-h-screen bg-page font-outfit text-ink">
      <SiteHeader navigate={navigate} />

      <main className="mx-auto flex w-full max-w-[1512px] flex-col items-center px-[20px] pb-[80px] pt-[36px] sm:px-[40px] lg:pb-[100px]">
        <div className="relative mb-[18px] grid h-[54px] w-full max-w-[420px] place-items-center rounded-[28px] bg-white px-6">
          <button
            type="button"
            className="absolute left-[22px] flex items-center gap-1 text-[15px] text-[#9c98a5]"
            onClick={() => navigate("/post")}
          >
            <ChevronLeftIcon />
            Back
          </button>
          <h1 className="text-center text-[24px] font-normal leading-none text-ink sm:text-[26px]">
            New advert
          </h1>
        </div>

        <section className="w-full max-w-[420px] rounded-[28px] bg-white px-[20px] pb-[24px] pt-[24px] shadow-[0_14px_36px_rgba(26,24,35,0.06)] sm:px-[24px]">
          <div className="space-y-[24px]">
            <DropdownSelect
              label="Condition"
              placeholder="Is it new, used, which?"
              value={condition}
              options={conditionOptions.map((option) => ({ value: option, label: option }))}
              onChange={setCondition}
            />
            <TextField label="Colour" placeholder="What's the colour?" value={color} onChange={setColor} />
            <div className="space-y-[16px]">
              <DropdownSelect
                label="State"
                placeholder="Select your state"
                value={locationState}
                options={stateOptions.map((s) => ({ value: s, label: s }))}
                onChange={(val) => { setLocationState(val); setLocationArea(""); }}
              />
              {locationState && areasForState ? (
                <DropdownSelect
                  label="Area"
                  placeholder="Select your area"
                  value={locationArea}
                  options={areasForState.map((a) => ({ value: a, label: a }))}
                  onChange={setLocationArea}
                />
              ) : locationState ? (
                <TextField
                  label="Area / LGA / Neighbourhood (optional)"
                  placeholder="e.g. Port Harcourt, Enugu GRA..."
                  value={locationArea}
                  onChange={setLocationArea}
                />
              ) : null}
            </div>
          </div>

          <div className="mt-[26px] flex items-center justify-between gap-4">
            <span className="text-[16px] text-[#9c98a5]">
              Exchange available
            </span>
            <Toggle enabled={exchangeAvailable} onToggle={() => setExchangeAvailable((value) => !value)} />
          </div>

          {error && <p className="mt-[20px] text-[15px] text-[#d14343]">{error}</p>}

          <button
            type="button"
            onClick={() => {
              if (!canSubmit) return;
              writeDraft({
                ...readDraft(),
                categorySlug,
                condition: condition.trim(),
                color: color.trim(),
                location: composedLocation,
                locationState: locationState.trim() || undefined,
                locationArea: locationArea.trim() || undefined,
                exchangeAvailable,
              });
              void handleSubmit();
            }}
            className="mt-[26px] flex h-[56px] w-full items-center justify-center gap-2 rounded-[12px] bg-gradient-to-r from-amber to-orange text-[18px] font-semibold text-white shadow-glow transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-none disabled:bg-[#e1e1e6] disabled:text-[#aaa6b3] disabled:shadow-none"
            disabled={!canSubmit}
          >
            {submitting ? <Spinner /> : null}
            {submitting ? "Creating..." : "Next"}
          </button>
        </section>
      </main>

      <SiteFooter navigate={navigate} />
    </div>
  );
}
