/**
 * Shared TypeScript interfaces for Qwik frontend
 * These types define the shape of data expected from the API and used throughout the application
 */

/**
 * User & Authentication Types
 */
export interface User {
  id: string;
  email?: string;
  fullName: string;
  phone?: string;
  location?: string;
  locationState?: string;
  locationArea?: string;
  role?: "USER" | "ADMIN";
  status?: "ACTIVE" | "BANNED";
  emailVerifiedAt?: string | null;
  bannedAt?: string | null;
  banReason?: string | null;
  termsAcceptedAt?: string | null;
  privacyAcceptedAt?: string | null;
  termsVersion?: string | null;
  privacyVersion?: string | null;
  profile?: UserProfile;
  verification?: VerificationSummary;
  verificationApplications?: VerificationSummary[];
  sellerVerified?: boolean;
  stats?: UserStats;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserStats {
  adverts: number;
  followers: number;
  following: number;
}

export interface PublicUserProfile extends User {
  ads: Ad[];
  isFollowing?: boolean;
}

export interface FollowStatus {
  isFollowing: boolean;
  followersCount: number;
}

export interface ReferralSummary {
  code: string | null;
  totalReferrals: number;
  referralsByStatus: { PENDING_VERIFICATION: number; ACTIVE: number; REVOKED: number };
  earnings: { pending: number; settled: number; paid: number; reversed: number };
}

export interface ReferralListItem {
  id: string;
  status: "PENDING_VERIFICATION" | "ACTIVE" | "REVOKED";
  createdAt: string;
  activatedAt: string | null;
  referredUser: { id: string; fullName: string; email: string };
  totalRewardAmount: number;
}

export interface PayoutAccount {
  accountName: string;
  accountNumberMasked: string;
  bankName: string;
  updatedAt: string;
}

export interface AdminReferralUser {
  id: string;
  fullName: string;
  email: string;
  status?: "ACTIVE" | "BANNED";
}

export interface AdminReferral {
  id: string;
  code: string;
  status: "PENDING_VERIFICATION" | "ACTIVE" | "REVOKED";
  signupIp: string | null;
  signupUserAgent: string | null;
  createdAt: string;
  activatedAt: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  referrer: AdminReferralUser;
  referredUser: AdminReferralUser;
  rewards: { id: string; rewardAmount: number; status: "PENDING" | "SETTLED" | "PAID" | "REVERSED" }[];
}

export interface AdminReferralPayout {
  id: string;
  cycleId: string;
  referrerId: string;
  totalAmount: number;
  status: "PENDING" | "PAID" | "FAILED";
  paidAt: string | null;
  paidByAdminId: string | null;
  payoutReference: string | null;
  notes: string | null;
  referrer: AdminReferralUser;
  paidByAdmin: AdminReferralUser | null;
}

export interface AdminReferralCycle {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: "OPEN" | "PROCESSING" | "CLOSED";
  payouts: AdminReferralPayout[];
}

export interface FollowingSeller {
  id: string;
  fullName: string;
  location?: string;
  profile?: UserProfile;
  verification?: VerificationSummary | null;
  stats?: UserStats;
  followersCount: number;
  followedAt: string;
}

export interface FollowerSeller {
  id: string;
  fullName: string;
  location?: string;
  profile?: UserProfile;
  verification?: VerificationSummary | null;
  stats?: UserStats;
  followedAt: string;
}

export type VerificationStatus = "DRAFT" | "SUBMITTED" | "IN_REVIEW" | "APPROVED" | "REJECTED";
export type VerificationPaymentStatus = "UNPAID" | "PENDING" | "PAID" | "FAILED";

export interface VerificationSummary {
  id: string | null;
  status: VerificationStatus | null;
  paymentStatus: VerificationPaymentStatus | null;
  approved?: boolean;
}

export interface VerificationDocument {
  id?: string;
  url: string;
  name?: string;
  type?: string;
  size?: number;
  purpose: string;
  createdAt?: string;
}

export interface VerificationApplication {
  id: string;
  userId: string;
  type: "BUSINESS";
  status: VerificationStatus;
  businessInfo?: Record<string, string> | null;
  documents: VerificationDocument[];
  user?: User;
  payments?: Array<PaymentCheckoutResponse & { id?: string; createdAt?: string }>;
  paymentStatus: VerificationPaymentStatus;
  rejectionReason?: string | null;
  decisionNote?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewerId?: string | null;
  reviewer?: {
    id: string;
    fullName: string;
    email?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentCheckoutResponse {
  paymentId: string;
  reference?: string | null;
  purpose?: "VERIFICATION" | "AD_PROMOTION" | null;
  adId?: string | null;
  verificationId?: string | null;
  checkoutUrl: string | null;
  authorization_url?: string | null;
  amount: number;
  currency: string;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED";
  providerReady?: boolean;
}

export interface AdminStats {
  totalUsers: number;
  bannedUsers?: number;
  totalAds: number;
  totalReports: number;
  pendingReports: number;
  pendingVerifications?: number;
}

export interface CountByLabel {
  count: number;
}

export interface AdminAnalyticsCountByStatus extends CountByLabel {
  status: string;
}

export interface AdminAnalyticsCountByPurpose extends CountByLabel {
  purpose: string;
}

export interface AdminAnalyticsCountByType extends CountByLabel {
  type: string;
}

export interface AdminAnalyticsCategoryDistribution extends CountByLabel {
  categoryId: string;
  categoryName: string;
}

export interface AdminAnalyticsLocationDistribution extends CountByLabel {
  locationState: string;
}

export interface AdminAnalyticsLandingPage extends CountByLabel {
  path: string;
}

export interface AdminAnalyticsPageTitleView extends CountByLabel {
  title: string;
}

export interface AdminAnalyticsTraffic {
  totalVisits: number;
  activeUsers: number;
  uniqueVisitors: number;
  topLandingPages: AdminAnalyticsLandingPage[];
  pageTitleViews: AdminAnalyticsPageTitleView[];
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  sourceSummary: {
    direct: number;
    googleSearch: number;
    facebook: number;
    instagram: number;
    tiktok: number;
    whatsapp: number;
    other: number;
  };
}

export interface AdminAnalytics {
  users: {
    total: number;
    newToday: number;
    newLast7Days: number;
  };
  ads: {
    total: number;
    active: number;
    promoted: number;
    activePromoted: number;
    newToday: number;
    newLast7Days: number;
  };
  marketplace: {
    totalConversations: number;
    totalMessages: number;
  };
  moderation: {
    reportsCount: number;
    pendingReports: number;
    reviewsCount: number;
  };
  notifications: {
    total: number;
    unread: number;
    byType: AdminAnalyticsCountByType[];
  };
  payments: {
    byStatus: AdminAnalyticsCountByStatus[];
    byPurpose: AdminAnalyticsCountByPurpose[];
  };
  distribution: {
    adsByCategory: AdminAnalyticsCategoryDistribution[];
    adsByLocationState: AdminAnalyticsLocationDistribution[];
    usersByLocationState: AdminAnalyticsLocationDistribution[];
  };
  traffic?: AdminAnalyticsTraffic;
  generatedAt: string;
}

export interface AdminReport {
  id: string;
  reason: string;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  createdAt: string;
  ad: {
    id: string;
    title: string;
    user?: {
      id: string;
      fullName: string;
      email?: string;
    };
  };
  user: {
    id: string;
    fullName: string;
    email?: string;
  };
}

export interface AdminAd extends Ad {
  user: User & {
    email?: string;
    status?: "ACTIVE" | "BANNED";
  };
  _count: {
    images: number;
    reviews: number;
    reports: number;
  };
}

export interface AdminAuditLogEntry {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  admin: {
    id: string;
    fullName: string;
    email?: string;
  };
}

export interface AdminReview {
  id: string;
  rating: number;
  text: string;
  createdAt: string;
  adId: string;
  userId: string;
  ad: {
    id: string;
    title: string;
    status?: "ACTIVE" | "SOLD" | "DRAFT" | "ARCHIVED";
    user: {
      id: string;
      fullName: string;
      email?: string;
    };
  };
  user: {
    id: string;
    fullName: string;
    email?: string;
  };
}

export interface UserProfile {
  bio?: string;
  avatarUrl?: string;
  verified?: boolean;
  verificationStatus?: "pending" | "verified" | "rejected";
  rating?: number;
  reviewCount?: number;
}

export interface AuthResponse {
  token: string;
  user: User & { role: 'USER' | 'ADMIN' };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  location?: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  termsVersion: string;
  privacyVersion: string;
  referralCode?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

/**
 * Category Types
 */
export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  parentId?: string;
  children?: Category[];
}

/**
 * Ad/Listing Types
 */
export interface AdImage {
  id: string;
  url: string;
  order?: number;
}

export interface AdReview {
  id: string;
  adId: string;
  userId: string;
  rating: number;
  text: string;
  createdAt: string;
  updatedAt?: string;
  user: {
    id: string;
    fullName: string;
  };
}

export interface Ad {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  locationState?: string;
  locationArea?: string;
  userId?: string;
  categoryId?: string;
  brand?: string;
  model?: string;
  condition?: string;
  specifications?: Record<string, unknown>;
  category: Category;
  user: User;
  images: AdImage[];
  status?: "ACTIVE" | "SOLD" | "DRAFT" | "ARCHIVED";
  isPromoted?: boolean;
  promotedAt?: string;
  promotedUntil?: string;
  promotionPriority?: number;
  featured?: boolean;
  viewCount?: number;
  savedCount?: number;
  createdAt?: string;
  updatedAt?: string;
  isSaved?: boolean;
}

export interface AdCreatePayload {
  categoryId: string;
  subcategoryId?: string;
  title: string;
  description: string;
  price: number;
  location: string;
  locationState?: string;
  locationArea?: string;
  imageUrls: string[];
  brand?: string;
  model?: string;
  condition?: string;
  specifications?: Record<string, unknown>;
}

export interface AdUpdatePayload extends Partial<AdCreatePayload> {
  status?: "ACTIVE" | "SOLD" | "DRAFT" | "ARCHIVED";
}

/**
 * Saved Ads Types
 */
export interface SavedAd {
  id: string;
  adId: string;
  ad: Ad;
  userId: string;
  savedAt: string;
}

/**
 * Message & Conversation Types
 */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: User;
  text: string;
  messageType?: "text" | "offer";
  offerAmount?: number | null;
  offerStatus?: "pending" | "accepted" | "rejected" | null;
  readAt?: string | null;
  createdAt: string;
  clientId?: string;
  deliveryStatus?: "pending" | "sent" | "failed";
}

export interface Conversation {
  id: string;
  ad?: {
    id: string;
    title: string;
    images: Array<{ id?: string; url: string }>;
  };
  participants: User[];
  lastMessage?: Message;
  lastMessageAt?: string;
  unreadCount?: number;
  messages?: Message[];
}

export interface ConversationCreatePayload {
  recipientId: string;
  message: string;
  adId?: string;
  clientId?: string;
  messageType?: "text" | "offer";
  offerAmount?: number;
}

export interface MessageSendPayload {
  conversationId: string;
  text: string;
  clientId?: string;
  messageType?: "text" | "offer";
  offerAmount?: number;
}

/**
 * Notification Types
 */
export interface Notification {
  id: string;
  userId: string;
  type: "message" | "offer" | "system" | "ad_sold" | "price_drop" | string;
  title: string;
  body: string;
  read: boolean;
  actionUrl?: string;
  data?: Record<string, any>;
  createdAt: string;
}

export interface NotificationSettings {
  id?: string;
  userId?: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  messageNotifications: boolean;
  offerNotifications: boolean;
  systemNotifications: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Request State Types
 */
export interface RequestState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string>;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, any>;
}

/**
 * Search & Filter Types
 */
export interface SearchFilters {
  query?: string;
  category?: string;
  location?: string;
  priceMin?: number;
  priceMax?: number;
  page?: number;
  pageSize?: number;
  sortBy?: "recent" | "price_asc" | "price_desc" | "featured";
}

export interface SearchResults {
  ads: Ad[];
  total: number;
  page: number;
  pageSize: number;
  filters: SearchFilters;
}

/**
 * Upload Types
 */
export interface UploadAsset {
  url: string;
  id: string;
  name?: string;
  size: number;
  type: string;
}

export interface UploadResponse {
  urls: string[];
  assets: UploadAsset[];
}

/**
 * Offer Types (for future use)
 */
export interface Offer {
  id: string;
  adId: string;
  buyerId: string;
  buyer?: User;
  amount: number;
  message?: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  createdAt: string;
  updatedAt?: string;
}

export interface OfferCreatePayload {
  adId: string;
  amount: number;
  message?: string;
}
