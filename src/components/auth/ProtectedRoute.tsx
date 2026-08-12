import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { hasValidToken } from "../../services/auth";
import { ROUTES } from "../../constants/routes";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { buildVerifyEmailRoute } from "../../lib/emailVerification";
import SeoHead from "../seo/SeoHead";

export interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  requireVerifiedEmail?: boolean;
}

function buildLoginRouteWithNext(redirectTo: string, nextPath: string) {
  if (!nextPath || nextPath === "/") return redirectTo;
  const params = new URLSearchParams({ next: nextPath });
  return `${redirectTo}?${params.toString()}`;
}

/**
 * ProtectedRoute component - wraps a route to require authentication
 * 
 * If user is not authenticated (no valid token), redirects to login page.
 * If authenticated, renders the protected component.
 * 
 * Usage:
 * <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
 */
export function ProtectedRoute({ children, redirectTo = ROUTES.LOGIN, requireVerifiedEmail = false }: ProtectedRouteProps) {
  const location = useLocation();
  const isAuthenticated = hasValidToken();
  const { user, loading } = useCurrentUser();
  const nextPath = `${location.pathname}${location.search}`;

  if (!isAuthenticated) {
    return <Navigate to={buildLoginRouteWithNext(redirectTo, nextPath)} replace />;
  }

  if (requireVerifiedEmail) {
    if (loading) return null;
    if (!user) {
      return <Navigate to={buildLoginRouteWithNext(redirectTo, nextPath)} replace />;
    }
    if (!user.emailVerifiedAt) {
      return <Navigate to={buildVerifyEmailRoute(nextPath)} replace />;
    }
  }

  return (
    <>
      <SeoHead noindex />
      {children}
    </>
  );
}
