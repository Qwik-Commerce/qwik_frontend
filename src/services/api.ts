import { clearAllAuthData, getToken, isTokenExpired } from "./auth";
import { disconnectRealtimeSocket } from "./realtime";
import type {
  User,
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  Category,
  Ad,
  AdReview,
  AdCreatePayload,
  AdUpdatePayload,
  SavedAd,
  Message,
  Conversation,
  ConversationCreatePayload,
  MessageSendPayload,
  Notification,
  NotificationSettings,
  PaginatedResponse,
  UploadResponse,
  SearchFilters,
  SearchResults,
  Offer,
  OfferCreatePayload,
  VerificationApplication,
  VerificationDocument,
  PaymentCheckoutResponse,
  AdminStats,
  AdminAnalytics,
  AdminReport,
  AdminAd,
  AdminReview,
  AdminAuditLogEntry,
  FollowStatus,
  FollowerSeller,
  FollowingSeller,
  PublicUserProfile
} from "../types/index";

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page: number;
    pageSize: number;
    total?: number;
    resultMode?: "exact" | "related";
    relatedTo?: string;
    exactMatches?: number;
  };
};

type ApiRequestInit = RequestInit & {
  staleTime?: number;
  cacheTime?: number;
  retry?: number;
};

type CachedResponse = {
  staleAt: number;
  expiresAt: number;
  response: ApiResponse<unknown>;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const GET_CACHE = new Map<string, CachedResponse>();
const IN_FLIGHT_GETS = new Map<string, Promise<ApiResponse<unknown>>>();
const ADS_STALE_TIME = 30_000;
const AD_DETAILS_STALE_TIME = 60_000;
const CATEGORIES_STALE_TIME = 5 * 60_000;
const SHORT_LIST_STALE_TIME = 15_000;
const ADMIN_STALE_TIME = 20_000;
const ADMIN_CACHE_TIME = 45_000;
const ADMIN_AUDIT_STALE_TIME = 5_000;
const ADMIN_AUDIT_CACHE_TIME = 12_000;

function clearAdminApiCache() {
  for (const key of GET_CACHE.keys()) {
    if (key.includes(":/admin/")) {
      GET_CACHE.delete(key);
      IN_FLIGHT_GETS.delete(key);
    }
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function friendlyRequestError(status: number, message?: string) {
  if (status === 503) return "Database unavailable. Please try again in a moment.";
  if (status >= 500) return "The server is having trouble. Please try again in a moment.";
  return message ?? "Request failed";
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isUnauthorizedError(error: unknown) {
  return isApiError(error) && error.status === 401;
}

export function isForbiddenError(error: unknown): error is ApiError {
  return isApiError(error) && error.status === 403;
}

async function request<T>(path: string, init?: ApiRequestInit): Promise<ApiResponse<T>> {
  const { staleTime = 0, cacheTime = 0, retry = 0, ...fetchInit } = init ?? {};
  const method = (fetchInit.method ?? "GET").toUpperCase();
  const token = getToken();
  const authToken = token && !isTokenExpired(token) ? token : null;

  if (token && !authToken) {
    clearAllAuthData();
  }

  const cacheKey = method === "GET" && cacheTime > 0 ? `${authToken ?? "guest"}:${path}` : "";
  const now = Date.now();
  const cached = cacheKey ? GET_CACHE.get(cacheKey) : undefined;

  if (cached && cached.staleAt > now) {
    return cached.response as ApiResponse<T>;
  }

  if (cacheKey) {
    const inFlight = IN_FLIGHT_GETS.get(cacheKey);
    if (inFlight) return inFlight as Promise<ApiResponse<T>>;
  }

  const performRequest = async () => {
    const headers: HeadersInit = {
      ...(fetchInit.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(fetchInit.headers ?? {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    };

    let lastError: unknown;
    for (let attempt = 0; attempt <= retry; attempt += 1) {
      try {
        const res = await fetch(`${API_BASE_URL}${path}`, { ...fetchInit, headers });
        const body = (await res.json().catch(() => ({}))) as ApiResponse<T>;
        if (!res.ok || !body.success) {
          if (authToken && res.status === 401) {
            clearAllAuthData();
            disconnectRealtimeSocket();
            GET_CACHE.clear();
          }
          const error = new ApiError(res.status, friendlyRequestError(res.status, body.message));
          if (attempt < retry && res.status >= 500) {
            lastError = error;
            await sleep(350 * (attempt + 1));
            continue;
          }
          throw error;
        }

        if (cacheKey) {
          const cachedAt = Date.now();
          GET_CACHE.set(cacheKey, {
            staleAt: cachedAt + staleTime,
            expiresAt: cachedAt + cacheTime,
            response: body as ApiResponse<unknown>,
          });
          window.setTimeout(() => {
            const entry = GET_CACHE.get(cacheKey);
            if (entry && entry.expiresAt <= Date.now()) GET_CACHE.delete(cacheKey);
          }, cacheTime);
        }

        return body;
      } catch (err) {
        lastError = err;
        if (attempt < retry) {
          await sleep(350 * (attempt + 1));
          continue;
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error("Request failed");
  };

  const promise = performRequest();
  if (cacheKey) IN_FLIGHT_GETS.set(cacheKey, promise as Promise<ApiResponse<unknown>>);
  try {
    return await promise;
  } finally {
    if (cacheKey) IN_FLIGHT_GETS.delete(cacheKey);
  }
}

export { type ApiResponse };

export function isEmailVerificationRequiredError(error: unknown) {
  if (isForbiddenError(error)) {
    return error.message.trim().toLowerCase() === "email verification required";
  }
  return false;
}

export const api = {
  // ===== Authentication Endpoints =====
  register: (payload: RegisterPayload) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  login: (payload: LoginPayload, options?: { authContext?: "admin" | "user" }) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      headers: options?.authContext ? { "X-Auth-Context": options.authContext } : undefined,
      body: JSON.stringify(payload)
    }),

  googleAuth: (payload: { credential: string; termsAccepted: boolean; privacyAccepted: boolean; referralCode?: string }) =>
    request<AuthResponse>("/auth/google", {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    request<null>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  resetPassword: (payload: ResetPasswordPayload) =>
    request<null>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  sendVerificationOtp: () =>
    request<{ message: string }>("/auth/send-verification-otp", {
      method: "POST",
      body: JSON.stringify({})
    }),

  resendVerificationOtp: () =>
    request<{ message: string }>("/auth/resend-verification-otp", {
      method: "POST",
      body: JSON.stringify({})
    }),

  verifyEmailOtp: (otp: string) =>
    request<AuthResponse>("/auth/verify-email-otp", {
      method: "POST",
      body: JSON.stringify({ otp })
    }),

  logout: () =>
    request<null>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({})
    }),

  // ===== User & Profile Endpoints =====
  me: () =>
    request<User>("/users/me", {
      staleTime: SHORT_LIST_STALE_TIME,
      cacheTime: SHORT_LIST_STALE_TIME * 2,
      retry: 1,
    }),

  updateMe: (payload: Partial<User> & { bio?: string; avatarUrl?: string }) =>
    request<User>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(payload)
    }).then((response) => {
      GET_CACHE.clear();
      return response;
    }),

  getUser: (id: string) => request<PublicUserProfile>(`/users/${id}`, { retry: 1 }),

  followUser: (id: string) => request<{ following: boolean; stats: { followers: number; following: number } }>(`/users/${id}/follow`, { method: "POST" }).then((response) => {
    GET_CACHE.clear();
    return response;
  }),

  unfollowUser: (id: string) => request<{ following: boolean; stats: { followers: number; following: number } }>(`/users/${id}/follow`, { method: "DELETE" }).then((response) => {
    GET_CACHE.clear();
    return response;
  }),

  getFollowStatus: (sellerId: string) => request<FollowStatus>(`/users/${sellerId}/follow-status`, {
    staleTime: SHORT_LIST_STALE_TIME,
    cacheTime: SHORT_LIST_STALE_TIME * 2,
  }),

  getMyFollowing: () => request<FollowingSeller[]>("/users/me/following", {
    staleTime: SHORT_LIST_STALE_TIME,
    cacheTime: SHORT_LIST_STALE_TIME * 2,
    retry: 1,
  }),

  getMyFollowers: () => request<FollowerSeller[]>("/users/me/followers", {
    staleTime: SHORT_LIST_STALE_TIME,
    cacheTime: SHORT_LIST_STALE_TIME * 2,
    retry: 1,
  }),

  // TODO: updateProfile - update user profile (bio, avatar, etc.)
  // updateProfile: (payload: UserProfile) => request<User>("/users/me/profile", { method: "PATCH", body: JSON.stringify(payload) }),

  // ===== Category Endpoints =====
  categories: () =>
    request<Category[]>("/categories", {
      staleTime: CATEGORIES_STALE_TIME,
      cacheTime: CATEGORIES_STALE_TIME * 2,
      retry: 1,
    }),

  // TODO: getCategory - fetch single category with details
  // getCategory: (slug: string) => request<Category>(`/categories/${slug}`),

  // ===== Ads/Listings Endpoints =====
  ads: (query = "") =>
    request<Ad[]>(`/ads${query}`, {
      staleTime: ADS_STALE_TIME,
      cacheTime: ADS_STALE_TIME * 2,
      retry: 1,
    }),

  adById: (id: string) =>
    request<Ad>(`/ads/${id}`, {
      staleTime: AD_DETAILS_STALE_TIME,
      cacheTime: AD_DETAILS_STALE_TIME * 2,
      retry: 1,
    }),

  // TODO: searchAds - search with filters (already route-ready)
  // searchAds: (filters: SearchFilters) => request<SearchResults>("/ads/search", { method: "POST", body: JSON.stringify(filters) }),

  createAd: (payload: AdCreatePayload) =>
    request<Ad>("/ads", {
      method: "POST",
      body: JSON.stringify(payload)
    }).then((response) => {
      GET_CACHE.clear();
      return response;
    }),

  updateAd: (id: string, payload: AdUpdatePayload) =>
    request<Ad>(`/ads/${id}`, { method: "PATCH", body: JSON.stringify(payload) }).then((response) => {
      GET_CACHE.clear();
      return response;
    }),

  pauseAd: (id: string) =>
    request<Ad>(`/ads/${id}/mark-unavailable`, { method: "PATCH" }).then((response) => {
      GET_CACHE.clear();
      return response;
    }),

  resumeAd: (id: string) =>
    request<Ad>(`/ads/${id}`, { method: "PATCH", body: JSON.stringify({ status: "ACTIVE" }) }).then((response) => {
      GET_CACHE.clear();
      return response;
    }),

  markAdSold: (id: string) =>
    request<Ad>(`/ads/${id}`, { method: "PATCH", body: JSON.stringify({ status: "SOLD" }) }).then((response) => {
      GET_CACHE.clear();
      return response;
    }),

  deleteAd: (id: string) =>
    request<null>(`/ads/${id}`, { method: "DELETE" }).then((response) => {
      GET_CACHE.clear();
      return response;
    }),

  markAdUnavailable: (id: string) =>
    request<Ad>(`/ads/${id}/mark-unavailable`, { method: "PATCH" }),

  promoteAd: (id: string, payload: { plan: "top-1-month" | "top-30-days" | "premium-1-month" | "premium-3-months" }) =>
    request<PaymentCheckoutResponse>(`/ads/${id}/promotions`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getUserAds: (status?: string) =>
    request<Ad[]>(`/users/me/ads${status ? `?status=${status}` : ""}`, {
      staleTime: SHORT_LIST_STALE_TIME,
      cacheTime: SHORT_LIST_STALE_TIME * 2,
      retry: 1,
    }),

  // ===== Saved Ads Endpoints =====
  savedAds: () =>
    request<Ad[]>("/users/me/saved", {
      staleTime: SHORT_LIST_STALE_TIME,
      cacheTime: SHORT_LIST_STALE_TIME * 2,
      retry: 1,
    }),

  saveAd: (id: string) =>
    request<null>(`/ads/${id}/save`, {
      method: "POST"
    }).then((response) => {
      GET_CACHE.clear();
      return response;
    }),

  unsaveAd: (id: string) =>
    request<null>(`/ads/${id}/save`, {
      method: "DELETE"
    }).then((response) => {
      GET_CACHE.clear();
      return response;
    }),

  isSaved: (id: string) =>
    request<{ saved: boolean }>(`/ads/${id}/saved`, {
      staleTime: SHORT_LIST_STALE_TIME,
      cacheTime: SHORT_LIST_STALE_TIME * 2,
    }),

  getReviews: (id: string) =>
    request<AdReview[]>(`/ads/${id}/reviews`, {
      staleTime: SHORT_LIST_STALE_TIME,
      cacheTime: SHORT_LIST_STALE_TIME * 2,
      retry: 1,
    }),

  postReview: (id: string, payload: { rating: number; text: string }) =>
    request<any>(`/ads/${id}/reviews`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  reportAd: (id: string, payload: { reason: string }) =>
    request<any>(`/ads/${id}/report`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  // ===== Messaging Endpoints =====
  getConversations: () => request<Conversation[]>("/conversations", { retry: 1 }),

  getConversation: (id: string) => request<Conversation>(`/conversations/${id}`, { retry: 1 }),

  getUnreadMessageCount: () => request<{ count: number }>("/conversations/unread-count", { retry: 1 }),

  createConversation: (payload: ConversationCreatePayload) =>
    request<Conversation>("/conversations", { method: "POST", body: JSON.stringify(payload) }),

  sendMessage: (payload: MessageSendPayload) =>
    request<Message>("/messages", { method: "POST", body: JSON.stringify(payload) }),

  updateOfferStatus: (messageId: string, status: "accepted" | "rejected") =>
    request<Message>(`/messages/${messageId}/offer-status`, { 
      method: "PATCH", 
      body: JSON.stringify({ status }) 
    }),

  // ===== Notification Endpoints =====
  getUnreadNotificationCount: () => request<{ count: number }>("/notifications/unread-count", { retry: 1 }),

  getNotifications: (unreadOnly?: boolean) =>
    request<Notification[]>(`/notifications${unreadOnly ? "?unread=true" : ""}`, {
      staleTime: SHORT_LIST_STALE_TIME,
      cacheTime: SHORT_LIST_STALE_TIME * 2,
      retry: 1,
    }),

  markNotificationAsRead: (id: string) =>
    request<Notification>(`/notifications/${id}/read`, { method: "PATCH" }).then((response) => {
      GET_CACHE.clear();
      return response;
    }),

  markAllNotificationsAsRead: () =>
    request<null>("/notifications/read-all", { method: "PATCH" }).then((response) => {
      GET_CACHE.clear();
      return response;
    }),

  getNotificationSettings: () =>
    request<NotificationSettings>("/users/me/notification-settings", { retry: 1 }),

  updateNotificationSettings: (payload: Partial<NotificationSettings>) =>
    request<NotificationSettings>("/users/me/notification-settings", { method: "PATCH", body: JSON.stringify(payload) }),

  // ===== Upload Endpoints =====
  uploadImages: (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    return request<UploadResponse>("/uploads/images", {
      method: "POST",
      body: formData,
    });
  },

  uploadDocuments: (files: File[], purpose = "verification_document") => {
    const formData = new FormData();
    files.forEach((file) => formData.append("documents", file));
    formData.append("purpose", purpose);
    return request<{ documents: VerificationDocument[] }>("/uploads/documents", {
      method: "POST",
      body: formData,
    });
  },

  // ===== Verification Endpoints =====
  verificationMe: () => request<VerificationApplication | null>("/verification/me"),

  createVerification: () =>
    request<VerificationApplication>("/verification", {
      method: "POST",
    }),

  updateVerificationBusinessInfo: (id: string, payload: Record<string, string>) =>
    request<VerificationApplication>(`/verification/${id}/business-info`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  addVerificationDocuments: (id: string, documents: VerificationDocument[]) =>
    request<VerificationApplication>(`/verification/${id}/documents`, {
      method: "POST",
      body: JSON.stringify({ documents }),
    }),

  submitVerification: (id: string) =>
    request<VerificationApplication>(`/verification/${id}/submit`, {
      method: "POST",
    }),

  // ===== Payment Endpoints =====
  checkoutPayment: (payload: { purpose: "VERIFICATION" | "AD_PROMOTION"; verificationId?: string; adId?: string; plan?: string; provider?: string; paymentMethod?: string }) =>
    request<PaymentCheckoutResponse>("/payments/checkout", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  verifyPayment: (reference: string) =>
    request<PaymentCheckoutResponse>("/payments/verify", {
      method: "POST",
      body: JSON.stringify({ reference }),
    }),

  paymentById: (id: string) => request<any>(`/payments/${id}`),

  // ===== Admin Endpoints =====
  adminStats: () => request<AdminStats>("/admin/stats", {
    staleTime: ADMIN_STALE_TIME,
    cacheTime: ADMIN_CACHE_TIME,
    retry: 1,
  }),

  adminAnalytics: () => request<AdminAnalytics>("/admin/analytics", {
    staleTime: ADMIN_STALE_TIME,
    cacheTime: ADMIN_CACHE_TIME,
    retry: 1,
  }),

  adminUsers: (params?: { page?: number; pageSize?: number; search?: string; role?: 'USER' | 'ADMIN'; status?: 'ACTIVE' | 'BANNED' }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
    if (params?.search) searchParams.set("search", params.search);
    if (params?.role) searchParams.set("role", params.role);
    if (params?.status) searchParams.set("status", params.status);
    const query = searchParams.toString();
    return request<User[]>(`/admin/users${query ? `?${query}` : ""}`, {
      staleTime: ADMIN_STALE_TIME,
      cacheTime: ADMIN_CACHE_TIME,
      retry: 1,
    });
  },

  banAdminUser: (id: string, reason?: string) =>
    request<User>(`/admin/users/${id}/ban`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }).then((response) => {
      clearAdminApiCache();
      return response;
    }),

  unbanAdminUser: (id: string) =>
    request<User>(`/admin/users/${id}/unban`, {
      method: "POST",
    }).then((response) => {
      clearAdminApiCache();
      return response;
    }),

  deleteAdminUser: (id: string, reason?: string) =>
    request<null>(`/admin/users/${id}`, {
      method: "DELETE",
      body: JSON.stringify(reason ? { reason } : {}),
    }).then((response) => {
      clearAdminApiCache();
      return response;
    }),

  adminAds: (params?: { page?: number; pageSize?: number; search?: string; status?: 'ACTIVE' | 'ARCHIVED' | 'SOLD' | 'DRAFT' }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
    if (params?.search) searchParams.set("search", params.search);
    if (params?.status) searchParams.set("status", params.status);
    const query = searchParams.toString();
    return request<AdminAd[]>(`/admin/ads${query ? `?${query}` : ""}`, {
      staleTime: ADMIN_STALE_TIME,
      cacheTime: ADMIN_CACHE_TIME,
      retry: 1,
    });
  },

  moderateAdminAdStatus: (id: string, payload: { status: "ACTIVE" | "ARCHIVED"; reason?: string }) =>
    request<AdminAd>(`/admin/ads/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }).then((response) => {
      clearAdminApiCache();
      return response;
    }),

  promoteAdminAd: (id: string, payload?: { durationDays?: number; priority?: number }) =>
    request<AdminAd>(`/admin/ads/${id}/promote`, {
      method: "PATCH",
      body: JSON.stringify(payload ?? {}),
    }).then((response) => {
      clearAdminApiCache();
      return response;
    }),

  unpromoteAdminAd: (id: string) =>
    request<AdminAd>(`/admin/ads/${id}/unpromote`, {
      method: "PATCH",
      body: JSON.stringify({}),
    }).then((response) => {
      clearAdminApiCache();
      return response;
    }),

  updateAdminAdPromotionPriority: (id: string, payload: { priority: number }) =>
    request<AdminAd>(`/admin/ads/${id}/promotion-priority`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }).then((response) => {
      clearAdminApiCache();
      return response;
    }),

  deleteAdminAd: (id: string, reason?: string) =>
    request<null>(`/admin/ads/${id}`, {
      method: "DELETE",
      body: JSON.stringify(reason ? { reason } : {}),
    }).then((response) => {
      clearAdminApiCache();
      return response;
    }),

  adminReviews: (params?: { page?: number; pageSize?: number; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
    if (params?.search) searchParams.set("search", params.search);
    const query = searchParams.toString();
    return request<AdminReview[]>(`/admin/reviews${query ? `?${query}` : ""}`, {
      staleTime: ADMIN_STALE_TIME,
      cacheTime: ADMIN_CACHE_TIME,
      retry: 1,
    });
  },

  deleteAdminReview: (id: string, reason: string) =>
    request<null>(`/admin/reviews/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ reason }),
    }).then((response) => {
      clearAdminApiCache();
      return response;
    }),

  adminReports: (params?: { page?: number; pageSize?: number; search?: string; status?: AdminReport["status"] }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
    if (params?.search) searchParams.set("search", params.search);
    if (params?.status) searchParams.set("status", params.status);
    const query = searchParams.toString();
    return request<AdminReport[]>(`/admin/reports${query ? `?${query}` : ""}`, {
      staleTime: ADMIN_STALE_TIME,
      cacheTime: ADMIN_CACHE_TIME,
      retry: 1,
    });
  },

  updateAdminReport: (id: string, payload: { status: AdminReport["status"]; note?: string; unlistAd?: boolean }) =>
    request<AdminReport>(`/admin/reports/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }).then((response) => {
      clearAdminApiCache();
      return response;
    }),

  adminVerifications: (params?: { page?: number; pageSize?: number; status?: string; search?: string; from?: string; to?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
    if (params?.status) searchParams.set("status", params.status);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.from) searchParams.set("from", params.from);
    if (params?.to) searchParams.set("to", params.to);
    const query = searchParams.toString();
    return request<VerificationApplication[]>(`/admin/verifications${query ? `?${query}` : ""}`, {
      staleTime: ADMIN_STALE_TIME,
      cacheTime: ADMIN_CACHE_TIME,
      retry: 1,
    });
  },

  updateAdminVerification: (id: string, payload: { status: "IN_REVIEW" | "APPROVED" | "REJECTED"; rejectionReason?: string; decisionNote?: string }) =>
    request<VerificationApplication>(`/admin/verifications/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }).then((response) => {
      clearAdminApiCache();
      return response;
    }),

  adminAuditLog: (params?: { page?: number; pageSize?: number; search?: string; action?: string; targetType?: string; from?: string; to?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
    if (params?.search) searchParams.set("search", params.search);
    if (params?.action) searchParams.set("action", params.action);
    if (params?.targetType) searchParams.set("targetType", params.targetType);
    if (params?.from) searchParams.set("from", params.from);
    if (params?.to) searchParams.set("to", params.to);
    const query = searchParams.toString();
    return request<AdminAuditLogEntry[]>(`/admin/audit-log${query ? `?${query}` : ""}`, {
      staleTime: ADMIN_AUDIT_STALE_TIME,
      cacheTime: ADMIN_AUDIT_CACHE_TIME,
      retry: 1,
    });
  },

  prefetchAdminPages: async () => {
    await Promise.allSettled([
      api.adminAnalytics(),
      api.adminUsers({ page: 1, pageSize: 20 }),
      api.adminAds({ page: 1, pageSize: 20 }),
      api.adminReports({ page: 1, pageSize: 20 }),
      api.adminReviews({ page: 1, pageSize: 20 }),
      api.adminVerifications({ page: 1, pageSize: 20 }),
      api.adminAuditLog({ page: 1, pageSize: 25 }),
    ]);
  },

  // ===== Admin Communications =====

  adminSendTestEmail: (payload: { subject: string; message: string }) =>
    request<{ recipient: string; sent: boolean; messageId?: string | null }>("/admin/communications/test-email", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  adminSendUserEmail: (payload: { userId: string; subject: string; message: string }) =>
    request<{ recipient: string; recipientUserId: string; sent: boolean; messageId?: string | null }>("/admin/communications/send-user-email", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  adminSendSelectedSellersEmail: (payload: { userIds: string[]; subject: string; message: string }) =>
    request<{ campaignId?: string; requestedCount: number; eligibleCount: number; sentCount: number; failedCount: number; skippedNonSellerCount: number }>("/admin/communications/send-selected-sellers-email", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  adminGetCampaigns: () =>
    request<any[]>("/admin/communications/campaigns", {
      staleTime: 30000,
      cacheTime: 60000,
      retry: 1,
    }),

  adminGetCampaignDetails: (id: string) =>
    request<any>(`/admin/communications/campaigns/${id}`, {
      staleTime: 30000,
      cacheTime: 60000,
      retry: 1,
    }),

  // ===== Offer Endpoints (Future) =====
  // TODO: createOffer - make offer on ad
  // createOffer: (payload: OfferCreatePayload) => request<Offer>("/offers", { method: "POST", body: JSON.stringify(payload) }),

  // TODO: getOffers - get offers for user's ads or user's offers
  // getOffers: (filter?: "received" | "sent") => request<Offer[]>(`/offers${filter ? `?filter=${filter}` : ""}`),

  // TODO: updateOfferStatus - accept/reject offer
  // updateOfferStatus: (id: string, status: "accepted" | "rejected") => request<Offer>(`/offers/${id}`, { method: "PATCH", body: JSON.stringify({ status }) })
};
