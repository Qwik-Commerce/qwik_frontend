import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { buildProductDetailsRoute } from "../constants/routes";
import { reconcileVerificationRequiredError } from "../lib/emailVerification";
import { api, isEmailVerificationRequiredError } from "../services/api";
import { getToken } from "../services/auth";
import type { Ad } from "../types";
import SeoHead from "../components/seo/SeoHead";

function formatNaira(value: number) {
  return `₦${value.toLocaleString()}`;
}

function formatOfferMessage(ad: Ad, amount: number) {
  return [
    `Offer: ${formatNaira(amount)}`,
    `Ad: ${ad.title}`,
    `Listed price: ${formatNaira(ad.price)}`,
    `Product link: ${buildProductDetailsRoute(ad.id)}`,
  ].join("\n");
}

export default function MakeOfferPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { error: showError, success } = useToast();
  const adId = searchParams.get("adId") || "";
  const [selected, setSelected] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAd() {
      if (!adId) {
        setError("Choose a product before making an offer.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await api.adById(adId);
        if (!cancelled) setAd(response.data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load product details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadAd();

    return () => {
      cancelled = true;
    };
  }, [adId]);

  const quickPrices = useMemo(() => {
    const basePrice = ad?.price || 0;
    if (!basePrice) return [];

    return [0.95, 0.9, 0.85, 0.8].map((factor) => {
      const value = Math.max(1, Math.round(basePrice * factor));
      return { label: formatNaira(value), value: String(value) };
    });
  }, [ad?.price]);

  const amount = Number(price);
  const validationError = !price.trim()
    ? "Enter an offer amount."
    : !Number.isFinite(amount) || amount <= 0
      ? "Offer amount must be greater than zero."
      : null;

  const handleSubmit = async () => {
    if (submitting) return;
    if (!getToken()) {
      showError("Please log in to send an offer.");
      navigate("/login");
      return;
    }
    if (!ad?.user?.id) {
      setError("Seller information is unavailable for this product.");
      return;
    }
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const createOfferConversation = () => api.createConversation({
        recipientId: ad.user.id,
        adId: ad.id,
        message: formatOfferMessage(ad, amount),
        clientId: crypto.randomUUID(),
        messageType: "offer",
        offerAmount: amount,
      });

      const response = await createOfferConversation();
      success("Offer sent to the seller.");
      navigate(buildProductDetailsRoute(ad.id));
    } catch (err) {
      if (isEmailVerificationRequiredError(err)) {
        const verified = await reconcileVerificationRequiredError({
          error: err,
          navigate,
          nextPath: `/make-offer?adId=${encodeURIComponent(ad.id)}`,
          onUnverified: () => showError("Please verify your email to continue."),
        });

        if (verified) {
          try {
            const retryResponse = await api.createConversation({
              recipientId: ad.user.id,
              adId: ad.id,
              message: formatOfferMessage(ad, amount),
              clientId: crypto.randomUUID(),
              messageType: "offer",
              offerAmount: amount,
            });
            success("Offer sent to the seller.");
            navigate(buildProductDetailsRoute(ad.id));
            return;
          } catch (retryErr) {
            const retryMessage = retryErr instanceof Error ? retryErr.message : "Unable to send your offer right now.";
            setError(retryMessage);
            showError(retryMessage);
            return;
          }
        }

        return;
      }
      const message = err instanceof Error ? err.message : "Unable to send your offer right now.";
      setError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-black p-4">
      <SeoHead noindex />
      <div className="w-full max-w-[370px] rounded-[28px] bg-white p-6">
        <h1 className="mb-6 text-center text-[36px] font-medium text-[#23222b]">Make an offer</h1>

        {loading ? (
          <div className="mb-6 h-[120px] animate-pulse rounded-[18px] bg-[#f6efe4]" />
        ) : ad ? (
          <div className="mb-6 rounded-[18px] bg-[#f7f7f9] p-4">
            <p className="truncate text-[18px] font-semibold text-[#23222b]">{ad.title}</p>
            <p className="mt-1 text-[15px] text-[#85828e]">Listed at {formatNaira(ad.price)}</p>
          </div>
        ) : null}

        {error ? <p className="mb-4 rounded-[12px] bg-[#fff2f2] p-3 text-[14px] text-[#b42318]">{error}</p> : null}

        <div className="mb-6 grid grid-cols-2 gap-3">
          {quickPrices.map((priceOption) => (
            <button
              key={priceOption.label}
              type="button"
              onClick={() => {
                setSelected(priceOption.label);
                setPrice(priceOption.value);
              }}
              className={`h-[48px] rounded-[10px] text-[18px] ${
                selected === priceOption.label ? "bg-[#ffe6bf] text-[#ff970f]" : "bg-[#f6efe4] text-[#ff970f]"
              }`}
            >
              {priceOption.label}
            </button>
          ))}
        </div>

        <label className="mb-2 block text-[33px] text-[#9b98a4]">Enter Price</label>
        <input
          type="number"
          inputMode="numeric"
          min="1"
          value={price}
          onChange={(e) => {
            setSelected(null);
            setPrice(e.target.value);
            setError(null);
          }}
          placeholder="Enter your offer amount"
          className="mb-6 h-[48px] w-full rounded-[10px] border border-[#e2e0e8] bg-[#f7f7f9] px-3 text-[17px] text-[#85828e] outline-none"
        />

        <button
          type="button"
          className="h-[50px] w-full rounded-[10px] bg-gradient-to-r from-amber to-orange text-[24px] font-semibold text-white shadow-glow disabled:cursor-not-allowed disabled:bg-none disabled:bg-[#ececf0] disabled:text-[#b9b7bf] disabled:shadow-none"
          onClick={() => void handleSubmit()}
          disabled={loading || submitting || !ad || Boolean(validationError)}
        >
          {submitting ? "Sending..." : "Send offer"}
        </button>
      </div>
    </div>
  );
}
