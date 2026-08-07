import type { User } from "../types";

export type ProfileCompletionFields = Pick<User, "phone" | "locationState" | "locationArea">;

/**
 * Checks if a user's profile is complete for marketplace actions.
 * Required fields: phone, locationState, locationArea (non-empty, non-whitespace strings)
 */
export function isProfileComplete(user: ProfileCompletionFields | null | undefined): boolean {
  if (!user) return false;
  return (
    isFieldFilled(user.phone) &&
    isFieldFilled(user.locationState) &&
    isFieldFilled(user.locationArea)
  );
}

/**
 * Returns array of missing required fields for profile completion.
 */
export function getProfileCompletionGaps(user: ProfileCompletionFields | null | undefined): string[] {
  if (!user) return ["phone", "locationState", "locationArea"];
  
  const gaps: string[] = [];
  if (!isFieldFilled(user.phone)) gaps.push("phone");
  if (!isFieldFilled(user.locationState)) gaps.push("locationState");
  if (!isFieldFilled(user.locationArea)) gaps.push("locationArea");
  
  return gaps;
}

/**
 * Generates a safe profile completion redirect URL.
 * Prevents redirecting to admin routes or other sensitive paths.
 */
export function getProfileCompletionRedirect(currentPath?: string): string {
  const safeCurrentPath = currentPath
    ? sanitizeRedirectPath(currentPath)
    : undefined;
  
  const params = new URLSearchParams({ required: "true" });
  if (safeCurrentPath) {
    params.append("redirect", safeCurrentPath);
  }
  
  return `/profile-settings?${params.toString()}`;
}

/**
 * Returns a safe redirect path or null when the path should not be used.
 */
export function getSafeProfileCompletionRedirectPath(path?: string | null): string | null {
  if (!path) return null;
  return sanitizeRedirectPath(path);
}

/**
 * Helper: check if a string field is filled (not null/undefined/empty/whitespace-only)
 */
function isFieldFilled(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Helper: sanitize redirect path to prevent redirects to admin or sensitive routes
 */
function sanitizeRedirectPath(path: string): string | null {
  if (!path || typeof path !== "string") return null;
  
  const normalized = path.trim().toLowerCase();
  
  // Block admin and sensitive routes
  if (
    normalized.startsWith("/admin") ||
    normalized.startsWith("/login") ||
    normalized.startsWith("/signup") ||
    normalized.startsWith("/auth")
  ) {
    return null;
  }
  
  // Allow safe marketplace routes
  if (
    normalized === "/post" ||
    normalized === "/post-details" ||
    normalized === "/new-advert-details" ||
    normalized.startsWith("/") && !normalized.includes("//")
  ) {
    return path;
  }
  
  return null;
}
