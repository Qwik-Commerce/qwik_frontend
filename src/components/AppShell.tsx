import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { LocationPin } from "./icons/LocationPin";
import { ROUTES } from "../constants/routes";
import { useToast } from "../context/ToastContext";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { ensureFreshVerifiedEmail } from "../lib/emailVerification";
import { UserAvatar } from "./ui/UserAvatar";
import { ALL_NIGERIA_LOCATION, NIGERIAN_LOCATIONS, getCategorySearchContext, isSearchResultsPath } from "../lib/searchContext";
import { getToken } from "../services/auth";
import { api } from "../services/api";
import { getRealtimeSocket, UNREAD_MESSAGES_REFRESH_EVENT, UNREAD_NOTIFICATIONS_REFRESH_EVENT } from "../services/realtime";

type NavigateTo = (to: string) => void;
type HeaderIcon = "bell" | "bookmark" | "mail";

function FooterDisabledButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      className="mb-2.5 block cursor-not-allowed text-[14px] text-[#5f6071]/70"
    >
      {children}
    </button>
  );
}

function IconBox({
  children,
  onClick,
  active = false,
  ariaLabel,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`grid h-8 w-8 place-items-center rounded-lg sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-[42px] lg:w-[42px] ${active ? "bg-[#0a0820] text-white" : "bg-[#ececec] text-[#1f1d27]"}`}
    >
      {children}
    </button>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" />
    </svg>
  );
}

const MOBILE_CHROME_HIDDEN_PATHS = [ROUTES.MESSAGES];
const LOCATION_OPTIONS = NIGERIAN_LOCATIONS;

function isProductDetailsPath(pathname: string) {
  return pathname.startsWith("/product-details/") || pathname.startsWith("/products/");
}

export function SiteHeader({
  navigate,
  activeIcon,
}: {
  navigate: NavigateTo;
  activeIcon?: HeaderIcon;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(ALL_NIGERIA_LOCATION);
  const [locationOpen, setLocationOpen] = useState(false);
  const desktopLocationRef = useRef<HTMLDivElement | null>(null);
  const mobileLocationRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const { error: showError } = useToast();
  const { user: currentUserRecord, display: currentUser } = useCurrentUser();
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const categoryContext = getCategorySearchContext(location.search);
  const showMarketplaceSearch = location.pathname === ROUTES.HOME || isSearchResultsPath(location.pathname);
  const showDesktopSearch = showMarketplaceSearch || isProductDetailsPath(location.pathname);
  const showMobileSearch = showMarketplaceSearch;
  const searchPlaceholder = location.pathname === ROUTES.HOME
    ? "I am looking for ..."
    : categoryContext
      ? `Search in ${categoryContext.name}`
      : "Search all categories";
  const hideOnMobile = MOBILE_CHROME_HIDDEN_PATHS.includes(location.pathname);
  const locationLabel = selectedLocation === ALL_NIGERIA_LOCATION ? "Nig." : selectedLocation;

  const handlePostAdClick = async () => {
    const token = getToken();
    if (!token) {
      showError("Please log in to post an ad.");
      navigate(ROUTES.LOGIN);
      return;
    }

    const canContinue = await ensureFreshVerifiedEmail({
      navigate,
      nextPath: ROUTES.POST,
      fallbackUser: currentUserRecord,
      onUnverified: () => showError("Please verify your email to continue."),
    });
    if (!canContinue) return;

    navigate(ROUTES.POST);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    const query = searchQuery.trim();
    if (query) params.set("q", query);
    if (categoryContext) params.set("category", categoryContext.slug);
    if (selectedLocation !== ALL_NIGERIA_LOCATION) params.set("location", selectedLocation);
    navigate(`${ROUTES.SEARCH}${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleLocationSelect = (option: string) => {
    setSelectedLocation(option);
    setLocationOpen(false);

    if (!showMarketplaceSearch) return;

    // TODO: remove this frontend URL-state bridge once every category search view consumes backend location filters.
    const params = new URLSearchParams(location.search);
    if (categoryContext) params.set("category", categoryContext.slug);
    if (option === ALL_NIGERIA_LOCATION) {
      params.delete("location");
    } else {
      params.set("location", option);
    }
    navigate(`${location.pathname}${params.toString() ? `?${params.toString()}` : ""}`);
  };

  useEffect(() => {
    const nextLocation = new URLSearchParams(location.search).get("location");
    setSelectedLocation(nextLocation || ALL_NIGERIA_LOCATION);
  }, [location.search]);

  useEffect(() => {
    let cancelled = false;

    const refreshUnreadNotifications = () => {
      if (!currentUserRecord?.id) {
        setUnreadNotificationCount(0);
        return;
      }

      void api.getUnreadNotificationCount()
        .then((response) => {
          if (!cancelled) setUnreadNotificationCount(response.data.count);
        })
        .catch(() => {
          if (!cancelled) setUnreadNotificationCount(0);
        });
    };

    const refreshUnreadCount = () => {
      if (!currentUserRecord?.id) {
        setUnreadMessageCount(0);
        setUnreadNotificationCount(0);
        return;
      }

      void api.getUnreadMessageCount()
        .then((response) => {
          if (!cancelled) setUnreadMessageCount(response.data.count);
        })
        .catch(() => {
          if (!cancelled) setUnreadMessageCount(0);
        });
    };

    refreshUnreadCount();
    refreshUnreadNotifications();

    const socket = getRealtimeSocket();
    const handleUnreadCount = ({ count }: { count: number }) => setUnreadMessageCount(count);
    const handleNewMessage = () => refreshUnreadCount();
    const handleRefresh = () => refreshUnreadCount();
    const handleNotificationRefresh = (event: Event) => {
      const notificationEvent = event as CustomEvent<{ count?: number }>;
      if (typeof notificationEvent.detail?.count === "number") {
        setUnreadNotificationCount(notificationEvent.detail.count);
        return;
      }
      refreshUnreadNotifications();
    };
    const handleNewNotification = () => refreshUnreadNotifications();

    socket?.on("messages:unread-count", handleUnreadCount);
    socket?.on("message:new", handleNewMessage);
    socket?.on("notification:new", handleNewNotification);
    window.addEventListener(UNREAD_MESSAGES_REFRESH_EVENT, handleRefresh);
    window.addEventListener(UNREAD_NOTIFICATIONS_REFRESH_EVENT, handleNotificationRefresh as EventListener);

    return () => {
      cancelled = true;
      socket?.off("messages:unread-count", handleUnreadCount);
      socket?.off("message:new", handleNewMessage);
      socket?.off("notification:new", handleNewNotification);
      window.removeEventListener(UNREAD_MESSAGES_REFRESH_EVENT, handleRefresh);
      window.removeEventListener(UNREAD_NOTIFICATIONS_REFRESH_EVENT, handleNotificationRefresh as EventListener);
    };
  }, [currentUserRecord?.id]);

  useEffect(() => {
    if (!locationOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        !desktopLocationRef.current?.contains(target) &&
        !mobileLocationRef.current?.contains(target)
      ) {
        setLocationOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLocationOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [locationOpen]);

  const renderSearchControls = (
    mode: "mobile" | "desktop",
    locationRef: React.RefObject<HTMLDivElement>,
  ) => {
    const mobile = mode === "mobile";
    const visible = mobile ? showMobileSearch : showDesktopSearch;
    if (!visible) return null;

    return (
      <div
        className={
          mobile
            ? `${hideOnMobile ? "hidden" : "flex"} relative z-[90] mx-auto w-full max-w-[1728px] min-w-0 items-center gap-1.5 bg-page/95 px-4 pb-1 pt-1.5 sm:px-6 md:hidden`
            : "order-3 mt-2.5 hidden w-full min-w-0 items-center gap-2.5 md:flex lg:order-2 lg:mt-0 lg:flex-1"
        }
      >
        <form
            onSubmit={handleSearchSubmit}
            className={
              mobile
                ? "flex h-10 min-w-0 max-w-[280px] flex-1 items-center gap-1.5 rounded-[9px] border-2 border-orange px-2 text-left text-[16px] text-[#b6b3bd]"
                : "flex h-11 w-full items-center gap-2 rounded-[10px] border-2 border-orange px-3 text-left text-[14px] text-[#b6b3bd] lg:h-[42px] lg:w-[250px] lg:rounded-[8px] lg:px-[13px] lg:text-[16px]"
            }
          >
            <button type="submit" className="text-[#f5932b]" aria-label="Search">
              <SearchIcon />
            </button>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className={`w-full min-w-0 bg-transparent text-[#1f1d27] outline-none placeholder:text-[#b6b3bd] ${mobile ? "text-[16px]" : ""}`}
              placeholder={searchPlaceholder}
              aria-label="Search listings"
            />
          </form>
        <div ref={locationRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setLocationOpen((open) => !open)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setLocationOpen((open) => !open);
              }
            }}
            aria-haspopup="listbox"
            aria-expanded={locationOpen}
            className={
              mobile
                ? "flex h-10 max-w-[104px] items-center gap-0.5 rounded-lg px-1.5 text-[13px] text-[#6f6c78] transition hover:bg-white hover:text-[#1f1d27] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff9715] focus-visible:ring-offset-2 focus-visible:ring-offset-page active:scale-[0.98]"
                : "flex h-10 max-w-[190px] items-center gap-1 rounded-lg px-2 text-[16px] text-[#6f6c78] transition hover:bg-white hover:text-[#1f1d27] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff9715] focus-visible:ring-offset-2 focus-visible:ring-offset-page active:scale-[0.98]"
            }
          >
            <LocationPin className="pointer-events-none h-4 w-4 shrink-0" />
            <span className="pointer-events-none truncate">{locationLabel}</span>
            <span className={`pointer-events-none text-[12px] transition ${locationOpen ? "rotate-180" : ""}`} aria-hidden="true">⌄</span>
          </button>
          {locationOpen ? (
            <div
              role="listbox"
              aria-label="Choose location"
              onWheel={(event) => event.stopPropagation()}
              onTouchMove={(event) => event.stopPropagation()}
              className="absolute right-0 top-[calc(100%+8px)] z-[140] max-h-[280px] w-[min(210px,calc(100vw-32px))] overflow-y-auto overscroll-contain rounded-[14px] border border-[#e8e5df] bg-white py-2 shadow-[0_18px_50px_rgba(31,29,39,0.16)] md:left-0 md:right-auto md:max-h-[340px]"
            >
              {LOCATION_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={selectedLocation === option}
                  onClick={() => handleLocationSelect(option)}
                  className={`block w-full px-4 py-2.5 text-left text-[14px] transition hover:bg-[#fff3e5] focus:bg-[#fff3e5] focus:outline-none ${
                    selectedLocation === option ? "font-semibold text-[#ff9715]" : "text-[#3f3c48]"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <>
      <header className={`${hideOnMobile ? "hidden md:flex" : "flex"} sticky top-0 z-[100] mx-auto w-full max-w-[1728px] flex-nowrap items-center gap-1 bg-page/95 px-3 py-0.5 backdrop-blur-sm sm:gap-1.5 sm:px-4 md:gap-2 md:px-6 lg:gap-4 lg:px-12 lg:py-1`}>
        <button
          className="relative h-[44px] w-[44px] shrink-0 overflow-hidden rounded-full bg-white sm:h-[50px] sm:w-[50px] md:h-[54px] md:w-[54px] lg:h-[58px] lg:w-[58px]"
          onClick={() => navigate("/")}
        >
          <img
            src="/images/logo-header.png"
            alt="Qwik logo"
            className="h-full w-full object-cover"
          />
        </button>

        {renderSearchControls("desktop", desktopLocationRef)}

        <div className="relative z-30 ml-auto flex flex-nowrap items-center justify-end gap-1 shrink-0 pointer-events-auto sm:gap-1.5 md:gap-1.5 lg:order-3 lg:w-auto lg:gap-2">
        <IconBox
          onClick={() => navigate(ROUTES.NOTIFICATIONS)}
          active={activeIcon === "bell"}
          ariaLabel={unreadNotificationCount > 0 ? `Notifications, ${unreadNotificationCount > 9 ? "9+" : unreadNotificationCount} unread` : "Notifications"}
        >
          <span className="relative grid h-5 w-5 place-items-center">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M18 9.5a6 6 0 0 0-12 0c0 7-2.6 7.5-2.6 7.5h17.2S18 16.5 18 9.5" />
              <path d="M14.2 20a2.4 2.4 0 0 1-4.4 0" />
            </svg>
            {unreadNotificationCount > 0 ? (
              <span className="absolute -right-2.5 -top-2.5 grid min-h-[18px] min-w-[18px] place-items-center rounded-full bg-[#f04438] px-1 text-[10px] font-semibold leading-none text-white shadow-[0_4px_10px_rgba(240,68,56,0.32)] ring-2 ring-page">
                {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
              </span>
            ) : null}
          </span>
        </IconBox>
        <IconBox
          onClick={() => navigate("/saved")}
          active={activeIcon === "bookmark"}
          ariaLabel="Saved listings"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M6.5 4.8c0-1 .8-1.8 1.8-1.8h7.4c1 0 1.8.8 1.8 1.8v16.1L12 17.5l-5.5 3.4V4.8Z" />
          </svg>
        </IconBox>
        <IconBox
          onClick={() => navigate("/messages")}
          active={activeIcon === "mail"}
          ariaLabel={unreadMessageCount > 0 ? `Messages, ${unreadMessageCount > 9 ? "9+" : unreadMessageCount} unread` : "Messages"}
        >
          <span className="relative grid h-5 w-5 place-items-center">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              aria-hidden="true"
            >
              <rect x="4" y="6" width="16" height="12" rx="3" />
              <path d="m7.5 9.5 4.5 3.3 4.5-3.3" />
            </svg>
            {unreadMessageCount > 0 ? (
              <span className="absolute -right-2.5 -top-2.5 grid min-h-[18px] min-w-[18px] place-items-center rounded-full bg-[#f04438] px-1 text-[10px] font-semibold leading-none text-white shadow-[0_4px_10px_rgba(240,68,56,0.32)] ring-2 ring-page">
                {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
              </span>
            ) : null}
          </span>
        </IconBox>
        <button
          onClick={() => navigate("/profile-settings")}
          className="cursor-pointer rounded-full shrink-0"
          type="button"
          aria-label={currentUserRecord ? `${currentUser.fullName} profile` : "Profile"}
        >
          {currentUserRecord ? (
            <UserAvatar
              name={currentUser.fullName}
              imageUrl={currentUser.avatarUrl}
              alt={`${currentUser.fullName} profile`}
              className="h-8 w-8 rounded-full object-cover sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-[42px] lg:w-[42px]"
            />
          ) : (
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#ececee] text-[#6d6a74] sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-[42px] lg:w-[42px]" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 19c1.8-3.1 4.1-4.6 7-4.6s5.2 1.5 7 4.6" />
              </svg>
            </span>
          )}
        </button>
        <button
          className="h-8 cursor-pointer rounded-[9px] bg-gradient-to-r from-amber to-orange px-2 text-[11px] font-medium text-white shadow-glow shrink-0 whitespace-nowrap sm:h-9 sm:px-2.5 sm:text-[12px] md:h-10 md:px-3 md:text-[13px] lg:h-[42px] lg:rounded-[8px] lg:px-[16px] lg:text-[16px]"
          onClick={() => void handlePostAdClick()}
        >
          Post Ad
        </button>
        </div>
      </header>
      {renderSearchControls("mobile", mobileLocationRef)}
    </>
  );
}

export function SiteFooter({ navigate }: { navigate: NavigateTo }) {
  const location = useLocation();
  const hideOnMobile = MOBILE_CHROME_HIDDEN_PATHS.includes(location.pathname);

  return (
    <footer className={`${hideOnMobile ? "hidden md:grid" : "grid"} grid-cols-3 gap-4 bg-[#040316] px-4 py-10 text-[#b0afbc] sm:gap-6 sm:px-6 lg:px-10 xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_1.8fr] xl:px-[70px] xl:py-[76px]`}>
      <button
        onClick={() => navigate("/")}
        className="col-span-3 mt-2 text-left text-[40px] leading-none text-[#ff9412] sm:col-span-1 sm:text-[58px]"
      >
        qwik
      </button>
      <div className="col-span-1">
        <h5 className="mb-3.5 text-[18px] font-medium text-[#efeff5]">About</h5>
        <button
          className="mb-2.5 block text-[14px] text-[#5f6071]"
          onClick={() => navigate(ROUTES.ABOUT)}
        >
          About Qwik
        </button>
        <button onClick={() => navigate(ROUTES.CAREER)} className="mb-2.5 block text-[14px] text-[#5f6071]">Career</button>
        <button onClick={() => navigate(ROUTES.TERMS)} className="mb-2.5 block text-[14px] text-[#5f6071]">Terms</button>
        <button onClick={() => navigate(ROUTES.PRIVACY_POLICY)} className="mb-2.5 block text-[14px] text-[#5f6071]">Privacy Policy</button>
      </div>
      <div className="col-span-1">
        <h5 className="mb-3.5 text-[18px] font-medium text-[#efeff5]">
          Resources
        </h5>
        <button onClick={() => navigate(ROUTES.BLOG)} className="mb-2.5 block text-[14px] text-[#5f6071]">Blog</button>
        <FooterDisabledButton>Instagram</FooterDisabledButton>
        <FooterDisabledButton>Youtube</FooterDisabledButton>
        <FooterDisabledButton>Twitter</FooterDisabledButton>
      </div>
      <div className="col-span-1">
        <h5 className="mb-3.5 text-[18px] font-medium text-[#efeff5]">
          Support
        </h5>
        <button onClick={() => navigate(ROUTES.SUPPORT)} className="mb-2.5 block text-[14px] text-[#5f6071]">help@qwik.ng</button>
        <button onClick={() => navigate(ROUTES.FAQS)} className="mb-2.5 block text-[14px] text-[#5f6071]">FAQs</button>
      </div>
      <div className="col-span-2 sm:col-span-1">
        <h5 className="mb-3.5 text-[18px] font-medium text-[#efeff5]">
          Download
        </h5>
        <div className="flex gap-2.5 sm:flex-col sm:gap-2.5">
          <a
            href="https://apps.apple.com/ng/app/qwik-nigeria-buy-sell-qwik/id1634841175"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[10px] bg-[#1b1a2f] px-2 text-[13px] text-[#76798d]/80 sm:w-[160px] sm:flex-none sm:justify-start sm:px-4 sm:text-[14px]"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 fill-current text-[#666877]"
              aria-hidden="true"
            >
              <path d="M16.5 12.8c0-2 1.7-3 1.8-3.1-1-.1-2-.6-2.6-1.3-1.1-1.1-2.7-1-3.4-.7-.7.3-1.3.7-2 .7-.8 0-1.5-.4-2.3-.7-1-.4-2.3-.1-3.2.8-1.7 1.8-1.4 5.2.3 7.9.8 1.3 1.8 2.7 3.1 2.7 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8 2.2-1.2 3-2.5c.5-.7.8-1.5 1-2.1-.1-.1-2.1-.8-2.1-3.7ZM14.9 6.5c.7-.8 1.1-1.8 1-2.8-1 .1-2 .6-2.7 1.4-.6.7-1.1 1.8-1 2.8 1.1.1 2.1-.5 2.7-1.4Z" />
            </svg>
            <span>App Store</span>
          </a>
          <button disabled aria-disabled="true" type="button" className="flex h-12 flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-[10px] bg-[#1b1a2f] px-2 text-[13px] text-[#76798d]/80 sm:w-[160px] sm:flex-none sm:justify-start sm:px-4 sm:text-[14px]">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 fill-current text-[#666877]"
              aria-hidden="true"
            >
              <path d="M5.5 3.6v16.8L14 12 5.5 3.6Zm1.4-.9 9.8 5.6-2 2L6.9 2.7Zm0 18.6 7.8-7.6 2 2-9.8 5.6Zm10.8-12.4 2.4 1.4c1.2.7 1.2 2.1 0 2.8l-2.4 1.4-2.2-2.8 2.2-2.8Z" />
            </svg>
            <span>Play Store</span>
          </button>
        </div>
      </div>
      <div className="col-span-3 sm:col-span-3 xl:col-span-1">
        <h5 className="mb-3.5 text-[18px] font-medium text-[#efeff5]">
          Stay up to date
        </h5>
        <p className="mb-2.5 text-[14px] leading-[1.38] text-[#5f6071]">
          Get news, offers, promotions & the best deals sent to your inbox.
        </p>
        <div className="mt-2 flex flex-row gap-2">
          <input
            className="h-[54px] flex-1 rounded-[10px] border border-[#ff9b00] bg-transparent px-3 text-[15px] text-[#b5b5c3] outline-none"
            placeholder="@email"
          />
          <button className="h-[54px] shrink-0 rounded-[10px] bg-gradient-to-r from-amber to-orange px-[18px] text-[15px] text-white shadow-glow">
            Subscribe
          </button>
        </div>
      </div>
    </footer>
  );
}
