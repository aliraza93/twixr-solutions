export const CONSENT_VERSION = 1;
export const CONSENT_STORAGE_KEY = "twixr-consent";
export const CONSENT_COOKIE = "twixr_consent";
export const CONSENT_OPEN_EVENT = "twixr:consent-open";
export const CONSENT_CHANGE_EVENT = "twixr:consent-change";

export type ConsentChoice = {
  version: number;
  essential: true;
  functional: boolean;
  updatedAt: string;
};

export type ConsentCategory = {
  id: "essential" | "functional";
  locked?: boolean;
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function defaultConsent(functional = false): ConsentChoice {
  return {
    version: CONSENT_VERSION,
    essential: true,
    functional,
    updatedAt: new Date().toISOString(),
  };
}

export function readConsent(): ConsentChoice | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentChoice>;
    if (parsed.version !== CONSENT_VERSION) return null;
    if (parsed.essential !== true || typeof parsed.functional !== "boolean") {
      return null;
    }
    return {
      version: CONSENT_VERSION,
      essential: true,
      functional: parsed.functional,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function writeCookie(choice: ConsentChoice) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${CONSENT_COOKIE}=${choice.version}:${choice.functional ? "1" : "0"}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function writeConsent(choice: ConsentChoice) {
  if (!isBrowser()) return;
  const next = { ...choice, version: CONSENT_VERSION, essential: true as const };
  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(next));
  writeCookie(next);
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: next }));
}

export function openCookiePreferences() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}

export function acceptAllConsent() {
  writeConsent(defaultConsent(true));
}

export function rejectOptionalConsent() {
  writeConsent(defaultConsent(false));
}
