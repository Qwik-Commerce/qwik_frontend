/**
 * Route constants for the Qwik frontend application
 * Centralized route definitions for consistency and maintainability
 */

// Authentication routes
export const ROUTES = {
  // Home
  HOME: "/",
  ABOUT: "/about",
  CAREER: "/career",
  TERMS: "/terms",
  PRIVACY_POLICY: "/privacy-policy",
  BLOG: "/blog",
  SUPPORT: "/support",
  FAQS: "/faqs",
  
  // Authentication
  SIGNIN: "/signin",
  SIGNUP: "/signup",
  LOGIN: "/login",
  LOGIN_PASSWORD: "/login-password",
  RECOVER_PASSWORD: "/recover-password",
  CREATE_PASSWORD: "/create-password",
  
  // Onboarding
  WELCOME: "/welcome",
  VERIFY_EMAIL: "/verify-email",
  
  // Products & Listings
  PRODUCT_DETAILS: "/product-details",
  PRODUCT_DETAILS_WITH_ID: "/product-details/:id",
  PRODUCTS_WITH_ID: "/products/:id",
  POST: "/post",
  POST_DETAILS: "/post-details",
  NEW_ADVERT_DETAILS: "/new-advert-details",
  PROMOTE_AD: "/promote-ad",
  MAKE_OFFER: "/make-offer",
  
  // Search
  SEARCH: "/search",
  SEARCH_RESULTS: "/search-results",
  SEARCH_RESULTS_LIST: "/search-results-list",
  
  // Dashboard & Ads
  ADS_DASHBOARD: "/ads-dashboard",
  
  // Notifications
  NOTIFICATIONS: "/notifications",
  NOTIFICATION_EMPTY: "/notification-empty",
  NOTIFICATION_SETTINGS: "/notification-settings",
  NOTIFICATION_SETTINGS_EMAIL: "/notification-settings-email",
  
  // Settings & Account
  PROFILE_SETTINGS: "/profile-settings",
  PUBLIC_USER_PROFILE: "/users/:id",
  CHAT_SETTINGS: "/chat-settings",
  ACCOUNT: "/account",
  REFERRALS: "/referrals",
  GET_VERIFIED: "/get-verified",
  GET_VERIFIED_BUSINESS_INFO: "/get-verified/business-info",
  GET_VERIFIED_DOCUMENT_UPLOAD: "/get-verified/document-upload",
  GET_VERIFIED_REVIEW: "/get-verified/review",
  GET_VERIFIED_PAYMENT: "/get-verified/payment",
  GET_VERIFIED_SUCCESSFUL: "/get-verified/successful",
  
  // Messages & Social
  MESSAGES: "/messages",
  
  // User Collections
  SAVED: "/saved",
  
  // Payment
  PLAN_PAYMENT: "/plan-payment",
  PREMIUM_PLAN_PAYMENT: "/premium-plan-payment",
  PAYMENT_CALLBACK: "/payment/callback",
  
  // Error pages
  ADMIN_VERIFICATION: "/admin/verification",
  ADMIN_REFERRALS: "/admin/referrals",
  NOT_FOUND: "/not-found",
};

/**
 * Helper function to build dynamic product routes with ID
 */
export const buildProductDetailsRoute = (id: string | number) => {
  return `/product-details/${id}`;
};

/**
 * Helper function to build dynamic product routes with ID (alternative path)
 */
export const buildProductRoute = (id: string | number) => {
  return `/products/${id}`;
};

/**
 * Helper function to build search route with query params
 */
export const buildSearchRoute = (query?: string) => {
  if (!query) return ROUTES.SEARCH;
  return `${ROUTES.SEARCH}?q=${encodeURIComponent(query)}`;
};

/**
 * Helper function to build search results route with query params
 */
export const buildSearchResultsRoute = (query?: string) => {
  if (!query) return ROUTES.SEARCH_RESULTS;
  return `${ROUTES.SEARCH_RESULTS}?q=${encodeURIComponent(query)}`;
};

/**
 * Helper function to build search results route with category params
 */
export const buildSearchResultsCategoryRoute = (category: string, subcategory?: string) => {
  const params = new URLSearchParams({ category });
  if (subcategory) params.set("subcategory", subcategory);
  return `${ROUTES.SEARCH_RESULTS}?${params.toString()}`;
};

/**
 * Helper function to build search results list route with query params
 */
export const buildSearchResultsListRoute = (query?: string) => {
  if (!query) return ROUTES.SEARCH_RESULTS_LIST;
  return `${ROUTES.SEARCH_RESULTS_LIST}?q=${encodeURIComponent(query)}`;
};

/**
 * Helper function to build search results list route with category params
 */
export const buildSearchResultsListCategoryRoute = (category: string, subcategory?: string) => {
  const params = new URLSearchParams({ category });
  if (subcategory) params.set("subcategory", subcategory);
  return `${ROUTES.SEARCH_RESULTS_LIST}?${params.toString()}`;
};
