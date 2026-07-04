import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import { api } from "../../services/api";
import { persistLegalConsentFromUser, setRole, setToken } from "../../services/auth";
import { GoogleIcon } from "../icons/SocialIcons";
import { resolveUserLoginRedirectFromSearch } from "../../lib/authRedirect";

const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const READY_TIMEOUT_MS = 8000;

type GoogleCredentialResponse = { credential?: string };

type GooglePromptNotification = {
  isNotDisplayed?: () => boolean;
  isSkippedMoment?: () => boolean;
  getNotDisplayedReason?: () => string;
  getSkippedReason?: () => string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            ux_mode?: "popup" | "redirect";
            auto_select?: boolean;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              type?: string;
              shape?: string;
              width?: number;
              text?: string;
              logo_alignment?: string;
              locale?: string;
            }
          ) => void;
          prompt: (momentListener?: (notification: GooglePromptNotification) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;
let initializedClientId: string | null = null;
let activeCredentialHandler: ((response: GoogleCredentialResponse) => void) | null = null;

function loadGoogleScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SCRIPT_SRC}"]`);
    if (existing) {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => {
        scriptPromise = null;
        reject(new Error("Failed to load Google Identity script"));
      }, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Failed to load Google Identity script"));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

function ensureGoogleInitialized(clientId: string) {
  if (!window.google?.accounts?.id) {
    throw new Error("Google Identity script is not ready");
  }

  if (initializedClientId === clientId) {
    return;
  }

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response: GoogleCredentialResponse) => {
      activeCredentialHandler?.(response);
    },
    ux_mode: "popup",
    use_fedcm_for_prompt: true,
  });

  initializedClientId = clientId;
}

type Props = {
  /** Label shown when Google is not configured (button stays disabled). */
  disabledLabel?: string;
  requiresLegalConsent?: boolean;
  hasAcceptedLegal?: boolean;
  onLegalConsentRequired?: () => void;
};

type Status = "loading" | "ready" | "error" | "submitting";

export default function GoogleSignInButton({
  disabledLabel = "Continue with Google",
  requiresLegalConsent = false,
  hasAcceptedLegal = false,
  onLegalConsentRequired,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { error: showError, success } = useToast();
  const userRedirectTarget = resolveUserLoginRedirectFromSearch(location.search, "/welcome");

  const navigateRef = useRef(navigate);
  const showErrorRef = useRef(showError);
  const successRef = useRef(success);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);
  useEffect(() => { showErrorRef.current = showError; }, [showError]);
  useEffect(() => { successRef.current = success; }, [success]);

  const consentAccepted = !requiresLegalConsent || hasAcceptedLegal;
  const consentAcceptedRef = useRef(consentAccepted);
  useEffect(() => {
    consentAcceptedRef.current = consentAccepted;
  }, [consentAccepted]);

  const requireLegalConsent = () => {
    if (consentAcceptedRef.current) return true;

    if (onLegalConsentRequired) {
      onLegalConsentRequired();
    } else {
      showErrorRef.current("Please accept the Terms of Use and Privacy Policy to continue.");
    }

    return false;
  };

  const [status, setStatus] = useState<Status>("loading");
  const isConfigured = Boolean(GOOGLE_CLIENT_ID);

  useEffect(() => {
    if (!isConfigured) return;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    timeoutId = setTimeout(() => {
      if (!cancelled) setStatus((prev) => (prev === "loading" ? "error" : prev));
    }, READY_TIMEOUT_MS);

    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google || !containerRef.current) return;
        try {
          activeCredentialHandler = async (response: GoogleCredentialResponse) => {
            if (!requireLegalConsent()) {
              setStatus("ready");
              return;
            }

            if (!response.credential) {
              setStatus("ready");
              return;
            }
            try {
              setStatus("submitting");
              const res = await api.googleAuth({
                credential: response.credential,
                termsAccepted: true,
                privacyAccepted: true,
              });
              setToken(res.data.token);
              setRole(res.data.user.role);
              persistLegalConsentFromUser(res.data.user);
              successRef.current("Signed in with Google");
              navigateRef.current(userRedirectTarget);
            } catch (err) {
              showErrorRef.current(err instanceof Error ? err.message : "Google sign-in failed");
              setStatus("ready");
            }
          };
          ensureGoogleInitialized(GOOGLE_CLIENT_ID!);
          containerRef.current.innerHTML = "";
          const width = Math.min(containerRef.current.clientWidth || 320, 400);
          window.google.accounts.id.renderButton(containerRef.current, {
            theme: "outline",
            size: "large",
            type: "standard",
            shape: "rectangular",
            text: "continue_with",
            logo_alignment: "left",
            locale: "en",
            width,
          });
          setStatus("ready");
          if (timeoutId) clearTimeout(timeoutId);
        } catch (err) {
          console.error("Google button init failed", err);
          setStatus("error");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setStatus("error");
      });

    return () => {
      cancelled = true;
      activeCredentialHandler = null;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isConfigured, userRedirectTarget]);

  const triggerGooglePrompt = () => {
    if (!requireLegalConsent()) return;

    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.cancel();
        window.google.accounts.id.prompt((notification?: GooglePromptNotification) => {
          const notDisplayed = notification?.isNotDisplayed?.() ?? false;
          const skipped = notification?.isSkippedMoment?.() ?? false;
          if (!notDisplayed && !skipped) return;

          const reason = notification?.getNotDisplayedReason?.() || notification?.getSkippedReason?.() || "";
          if (reason) {
            console.info("Google prompt unavailable", reason);
          }
          setStatus("ready");
        });
      } catch (err) {
        console.error(err);
        setStatus("ready");
      }
    } else {
      setStatus("loading");
    }
  };

  if (!isConfigured) {
    return (
      <button
        className="mb-[10px] flex h-[48px] w-full cursor-not-allowed items-center justify-center gap-2 rounded-[10px] bg-[#d9d9dc] text-[14px] text-[#8b8a94] opacity-70 transition-all duration-200"
        type="button"
        disabled
        aria-disabled="true"
        title="Coming soon"
      >
        <GoogleIcon />
        <span>{disabledLabel}</span>
      </button>
    );
  }

  return (
    <div className="mb-[10px] w-full">
      <div
        ref={containerRef}
        className="flex w-full justify-center"
        aria-busy={status === "submitting"}
        style={{
          display: "none",
          minHeight: 40,
          opacity: status === "submitting" ? 0.6 : 1,
          pointerEvents: status === "submitting" ? "none" : "auto",
        }}
      />

      {(status === "ready" || status === "submitting") && (
        <button
          type="button"
          onClick={triggerGooglePrompt}
          aria-disabled={status === "submitting"}
          disabled={status === "submitting"}
          className="flex h-[48px] w-full items-center justify-center gap-2 rounded-[10px] border border-[#dedee1] bg-white text-[14px] text-[#1f1f29] transition-colors hover:bg-[#fafafb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb357] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <GoogleIcon />
          <span>Continue with Google</span>
        </button>
      )}

      {status === "loading" && (
        <div
          className="flex h-[48px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#ececee] text-[14px] text-[#8b8a94]"
          aria-live="polite"
        >
          <GoogleIcon />
          <span>Loading Google sign-in…</span>
        </div>
      )}

      {status === "error" && (
        <button
          type="button"
          onClick={triggerGooglePrompt}
          className="flex h-[48px] w-full items-center justify-center gap-2 rounded-[10px] border border-[#dedee1] bg-white text-[14px] text-[#1f1f29] transition-colors hover:bg-[#fafafb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb357] focus-visible:ring-offset-2"
        >
          <GoogleIcon />
          <span>Continue with Google</span>
        </button>
      )}
    </div>
  );
}
