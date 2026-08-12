import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getRoleFromToken, getToken } from "../../services/auth";
import SeoHead from "../seo/SeoHead";

export interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const token = getToken();
  const role = getRoleFromToken();

  if (!token || role !== "ADMIN") {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <>
      <SeoHead noindex />
      {children}
    </>
  );
}