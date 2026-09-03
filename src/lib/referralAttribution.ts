const REFERRAL_STORAGE_KEY = "qwik.referral-attribution";
const REFERRAL_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type StoredReferral = {
  code: string;
  expiresAt: number;
};

function getStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function captureReferralCode(search: string) {
  const code = new URLSearchParams(search).get("ref")?.trim().slice(0, 128);
  if (!code) return;

  const storage = getStorage();
  if (!storage) return;
  storage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify({ code, expiresAt: Date.now() + REFERRAL_TTL_MS } satisfies StoredReferral));
}

export function getStoredReferralCode() {
  const storage = getStorage();
  if (!storage) return undefined;

  try {
    const stored = JSON.parse(storage.getItem(REFERRAL_STORAGE_KEY) ?? "null") as StoredReferral | null;
    if (!stored || typeof stored.code !== "string" || typeof stored.expiresAt !== "number" || stored.expiresAt <= Date.now()) {
      storage.removeItem(REFERRAL_STORAGE_KEY);
      return undefined;
    }
    return stored.code;
  } catch {
    storage.removeItem(REFERRAL_STORAGE_KEY);
    return undefined;
  }
}

export function clearStoredReferralCode() {
  getStorage()?.removeItem(REFERRAL_STORAGE_KEY);
}
