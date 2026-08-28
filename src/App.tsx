import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ROUTES } from "./constants/routes";
import { AdminRoute } from "./components/auth/AdminRoute";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ScrollToTop } from "./components/ScrollToTop";
import { RouteAnalyticsTracker } from "./components/RouteAnalyticsTracker";
import { captureReferralCode } from "./lib/referralAttribution";

const SignInPage = lazy(() => import("./pages/SignInPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const CareerPage = lazy(() => import("./pages/CareerPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const FaqsPage = lazy(() => import("./pages/FaqsPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const WelcomePage = lazy(() => import("./pages/WelcomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const LoginPasswordPage = lazy(() => import("./pages/LoginPasswordPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const RecoverPasswordPage = lazy(() => import("./pages/RecoverPasswordPage"));
const CreatePasswordPage = lazy(() => import("./pages/CreatePasswordPage"));
const PromoteAdPage = lazy(() => import("./pages/PromoteAdPage"));
const NotificationPage = lazy(() => import("./pages/NotificationPage"));
const ProductDetailsPage = lazy(() => import("./pages/ProductDetailsPage"));
const MakeOfferPage = lazy(() => import("./pages/MakeOfferPage"));
const SearchResultsPage = lazy(() => import("./pages/SearchResultsPage"));
const SearchResultsListPage = lazy(() => import("./pages/SearchResultsListPage"));
const ProfileSettingsPage = lazy(() => import("./pages/ProfileSettingsPage"));
const PublicProfilePage = lazy(() => import("./pages/PublicProfilePage"));
const ChatSettingsPage = lazy(() => import("./pages/ChatSettingsPage"));
const AdsDashboardPage = lazy(() => import("./pages/AdsDashboardPage"));
const NotificationSettingsPage = lazy(() => import("./pages/NotificationSettingsPage"));
const EmailNotificationSettingsPage = lazy(() => import("./pages/EmailNotificationSettingsPage"));
const NotificationEmptyPage = lazy(() => import("./pages/NotificationEmptyPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const ReferralsPage = lazy(() => import("./pages/ReferralsPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const PostPage = lazy(() => import("./pages/PostPage"));
const PostDetailsPage = lazy(() => import("./pages/PostDetailsPage"));
const SavedPage = lazy(() => import("./pages/SavedPage"));
const NewAdvertDetailsPage = lazy(() => import("./pages/NewAdvertDetailsPage"));
const PlanPaymentPage = lazy(() => import("./pages/PlanPaymentPage"));
const PremiumPlanPaymentPage = lazy(() => import("./pages/PremiumPlanPaymentPage"));
const PaymentCallbackPage = lazy(() => import("./pages/PaymentCallbackPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const GetVerifiedPage = lazy(() => import("./pages/GetVerifiedPage"));
const GetVerifiedBusinessInfoPage = lazy(() => import("./pages/GetVerifiedBusinessInfoPage"));
const GetVerifiedDocumentUploadPage = lazy(() => import("./pages/GetVerifiedDocumentUploadPage"));
const GetVerifiedReviewPage = lazy(() => import("./pages/GetVerifiedReviewPage"));
const GetVerifiedPaymentPage = lazy(() => import("./pages/GetVerifiedPaymentPage"));
const GetVerifiedSuccessfulPage = lazy(() => import("./pages/GetVerifiedSuccessfulPage"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminAds = lazy(() => import("./pages/AdminAds"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const AdminReviews = lazy(() => import("./pages/AdminReviews"));
const AdminVerification = lazy(() => import("./pages/AdminVerification"));
const AdminAuditLog = lazy(() => import("./pages/AdminAuditLog"));
const AdminCommunications = lazy(() => import("./pages/AdminCommunications"));
function RouteFallback() {
  return <div aria-hidden="true" className="min-h-screen bg-page" />;
}

function lazyRoute(node: ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{node}</Suspense>;
}

function ReferralAttributionCapture() {
  const location = useLocation();

  useEffect(() => {
    captureReferralCode(location.search);
  }, [location.search]);

  return null;
}

export default function App() {
  return (
    <>
      <ReferralAttributionCapture />
      <RouteAnalyticsTracker />
      <ScrollToTop />
      <Routes>
        {/* Home & Welcome */}
        <Route path={ROUTES.HOME} element={lazyRoute(<HomePage />)} />
        <Route path={ROUTES.ABOUT} element={lazyRoute(<AboutPage />)} />
        <Route path={ROUTES.CAREER} element={lazyRoute(<CareerPage />)} />
        <Route path={ROUTES.TERMS} element={lazyRoute(<TermsPage />)} />
        <Route path={ROUTES.PRIVACY_POLICY} element={lazyRoute(<PrivacyPolicyPage />)} />
        <Route path={ROUTES.BLOG} element={lazyRoute(<BlogPage />)} />
        <Route path={ROUTES.SUPPORT} element={lazyRoute(<SupportPage />)} />
        <Route path={ROUTES.FAQS} element={lazyRoute(<FaqsPage />)} />
        <Route path={ROUTES.WELCOME} element={lazyRoute(<WelcomePage />)} />
        <Route path={ROUTES.VERIFY_EMAIL} element={lazyRoute(<VerifyEmailPage />)} />

        {/* Legacy Mobile WebView Entry Routes */}
        <Route path="/mob" element={<Navigate to={ROUTES.HOME} replace />} />
        <Route path="/mob/" element={<Navigate to={ROUTES.HOME} replace />} />
        <Route path="/mobile" element={<Navigate to={ROUTES.HOME} replace />} />
        <Route path="/mobile/" element={<Navigate to={ROUTES.HOME} replace />} />

        {/* Authentication & Access Control */}
        <Route path={ROUTES.SIGNIN} element={lazyRoute(<SignInPage />)} />
        <Route path={ROUTES.SIGNUP} element={lazyRoute(<SignUpPage />)} />
        <Route path={ROUTES.LOGIN} element={lazyRoute(<LoginPage />)} />
        <Route path={ROUTES.LOGIN_PASSWORD} element={lazyRoute(<LoginPasswordPage />)} />
        <Route path={ROUTES.RECOVER_PASSWORD} element={lazyRoute(<RecoverPasswordPage />)} />
        <Route path={ROUTES.CREATE_PASSWORD} element={lazyRoute(<CreatePasswordPage />)} />
        <Route path="/admin/login" element={lazyRoute(<AdminLogin />)} />

        {/* Products & Listings */}
        <Route path={ROUTES.PRODUCT_DETAILS} element={lazyRoute(<ProductDetailsPage />)} />
        <Route path={ROUTES.PRODUCT_DETAILS_WITH_ID} element={lazyRoute(<ProductDetailsPage />)} />
        <Route path={ROUTES.PRODUCTS_WITH_ID} element={lazyRoute(<ProductDetailsPage />)} />
        <Route path={ROUTES.PUBLIC_USER_PROFILE} element={lazyRoute(<PublicProfilePage />)} />
        <Route path="/profile/:id" element={lazyRoute(<PublicProfilePage />)} />
        <Route path={ROUTES.POST} element={lazyRoute(<ProtectedRoute requireVerifiedEmail><PostPage /></ProtectedRoute>)} />
        <Route path={ROUTES.POST_DETAILS} element={lazyRoute(<ProtectedRoute requireVerifiedEmail><PostDetailsPage /></ProtectedRoute>)} />
        <Route path={ROUTES.NEW_ADVERT_DETAILS} element={lazyRoute(<ProtectedRoute requireVerifiedEmail><NewAdvertDetailsPage /></ProtectedRoute>)} />
        <Route path={ROUTES.PROMOTE_AD} element={lazyRoute(<ProtectedRoute requireVerifiedEmail><PromoteAdPage /></ProtectedRoute>)} />
        <Route path={ROUTES.MAKE_OFFER} element={lazyRoute(<MakeOfferPage />)} />

        {/* Search & Discovery */}
        <Route path={ROUTES.SEARCH} element={lazyRoute(<SearchResultsListPage />)} />
        <Route path={ROUTES.SEARCH_RESULTS} element={lazyRoute(<SearchResultsPage />)} />
        <Route path={ROUTES.SEARCH_RESULTS_LIST} element={lazyRoute(<SearchResultsListPage />)} />

        {/* Dashboard & Ads Management */}
        <Route path={ROUTES.ADS_DASHBOARD} element={lazyRoute(<ProtectedRoute><AdsDashboardPage /></ProtectedRoute>)} />

        {/* Notifications */}
        <Route path={ROUTES.NOTIFICATIONS} element={lazyRoute(<ProtectedRoute><NotificationPage /></ProtectedRoute>)} />
        <Route path={ROUTES.NOTIFICATION_EMPTY} element={lazyRoute(<ProtectedRoute><NotificationEmptyPage /></ProtectedRoute>)} />
        <Route path={ROUTES.NOTIFICATION_SETTINGS} element={lazyRoute(<ProtectedRoute><NotificationSettingsPage /></ProtectedRoute>)} />
        <Route path={ROUTES.NOTIFICATION_SETTINGS_EMAIL} element={lazyRoute(<ProtectedRoute><EmailNotificationSettingsPage /></ProtectedRoute>)} />

        {/* Settings & Account Management */}
        <Route path={ROUTES.PROFILE_SETTINGS} element={lazyRoute(<ProtectedRoute><ProfileSettingsPage /></ProtectedRoute>)} />
        <Route path={ROUTES.CHAT_SETTINGS} element={lazyRoute(<ProtectedRoute><ChatSettingsPage /></ProtectedRoute>)} />
        <Route path={ROUTES.ACCOUNT} element={lazyRoute(<ProtectedRoute><AccountPage /></ProtectedRoute>)} />
        <Route path={ROUTES.REFERRALS} element={lazyRoute(<ProtectedRoute><ReferralsPage /></ProtectedRoute>)} />
        <Route path={ROUTES.GET_VERIFIED} element={lazyRoute(<ProtectedRoute><GetVerifiedPage /></ProtectedRoute>)} />
        <Route path={ROUTES.GET_VERIFIED_BUSINESS_INFO} element={lazyRoute(<ProtectedRoute><GetVerifiedBusinessInfoPage /></ProtectedRoute>)} />
        <Route path={ROUTES.GET_VERIFIED_DOCUMENT_UPLOAD} element={lazyRoute(<ProtectedRoute><GetVerifiedDocumentUploadPage /></ProtectedRoute>)} />
        <Route path={ROUTES.GET_VERIFIED_REVIEW} element={lazyRoute(<ProtectedRoute><GetVerifiedReviewPage /></ProtectedRoute>)} />
        <Route path={ROUTES.GET_VERIFIED_PAYMENT} element={lazyRoute(<ProtectedRoute><GetVerifiedPaymentPage /></ProtectedRoute>)} />
        <Route path={ROUTES.GET_VERIFIED_SUCCESSFUL} element={lazyRoute(<ProtectedRoute><GetVerifiedSuccessfulPage /></ProtectedRoute>)} />

        {/* Messages & Communication */}
        <Route path={ROUTES.MESSAGES} element={lazyRoute(<ProtectedRoute><MessagesPage /></ProtectedRoute>)} />

        {/* Collections & Saved Items */}
        <Route path={ROUTES.SAVED} element={lazyRoute(<ProtectedRoute><SavedPage /></ProtectedRoute>)} />

        {/* Payment & Subscriptions */}
        <Route path={ROUTES.PLAN_PAYMENT} element={lazyRoute(<ProtectedRoute><PlanPaymentPage /></ProtectedRoute>)} />
        <Route path={ROUTES.PREMIUM_PLAN_PAYMENT} element={lazyRoute(<ProtectedRoute><PremiumPlanPaymentPage /></ProtectedRoute>)} />
        <Route path={ROUTES.PAYMENT_CALLBACK} element={lazyRoute(<ProtectedRoute><PaymentCallbackPage /></ProtectedRoute>)} />

        {/* Admin Dashboard */}
        <Route path="/admin" element={lazyRoute(<AdminRoute><AdminDashboard /></AdminRoute>)} />
        <Route path="/admin/analytics" element={lazyRoute(<AdminRoute><AdminAnalytics /></AdminRoute>)} />
        <Route path="/admin/users" element={lazyRoute(<AdminRoute><AdminUsers /></AdminRoute>)} />
        <Route path="/admin/ads" element={lazyRoute(<AdminRoute><AdminAds /></AdminRoute>)} />
        <Route path="/admin/reports" element={lazyRoute(<AdminRoute><AdminReports /></AdminRoute>)} />
        <Route path="/admin/reviews" element={lazyRoute(<AdminRoute><AdminReviews /></AdminRoute>)} />
        <Route path={ROUTES.ADMIN_VERIFICATION} element={lazyRoute(<AdminRoute><AdminVerification /></AdminRoute>)} />
        <Route path="/admin/audit-log" element={lazyRoute(<AdminRoute><AdminAuditLog /></AdminRoute>)} />
        <Route path="/admin/communications" element={lazyRoute(<AdminRoute><AdminCommunications /></AdminRoute>)} />

        {/* Error Pages */}
        <Route path={ROUTES.NOT_FOUND} element={lazyRoute(<NotFoundPage />)} />
        <Route path="*" element={lazyRoute(<NotFoundPage />)} />
      </Routes>
    </>
  );
}
