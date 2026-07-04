import { resolveSafeNextPath } from "./emailVerification";

function isAdminPath(path: string) {
  return path === "/admin" || path.startsWith("/admin/");
}

export function resolveUserLoginRedirectFromSearch(search: string, fallback = "/welcome") {
  const nextParam = new URLSearchParams(search).get("next");
  const safeNext = resolveSafeNextPath(nextParam, fallback);
  if (isAdminPath(safeNext)) return fallback;
  return safeNext;
}

export function buildRouteWithUserSafeNext(baseRoute: string, search: string) {
  const nextParam = new URLSearchParams(search).get("next");
  const safeNext = resolveSafeNextPath(nextParam, "");

  if (!safeNext || isAdminPath(safeNext)) return baseRoute;

  const params = new URLSearchParams({ next: safeNext });
  return `${baseRoute}?${params.toString()}`;
}
