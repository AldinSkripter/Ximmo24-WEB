import Cookies from 'js-cookie';

export const CONSENT_KEY = 'cookie-consent';
export const CONSENT_PREFERENCES_KEY = 'cookie-consent-preferences';
export const CONSENT_EXPIRY_DAYS = 365;

export const CONSENT = {
  ALL: 'all',
  NECESSARY: 'necessary',
  REJECTED: 'rejected',
  CUSTOM: 'custom',
};

export const getConsentLevel = () => Cookies.get(CONSENT_KEY) ?? null;

export const hasNecessaryConsent = () => {
  const level = getConsentLevel();
  return level === CONSENT.ALL || level === CONSENT.NECESSARY;
};

export const getConsentPreferences = () => {
  const level = getConsentLevel();
  if (level === CONSENT.ALL) return { analytics: true, advertising: true };
  if (level !== CONSENT.CUSTOM) return { analytics: false, advertising: false };

  try {
    return JSON.parse(Cookies.get(CONSENT_PREFERENCES_KEY) || '{}');
  } catch {
    return { analytics: false, advertising: false };
  }
};

export const hasAnalyticsConsent = () => Boolean(getConsentPreferences().analytics);

export const hasAdvertisingConsent = () => Boolean(getConsentPreferences().advertising);

export const setConsent = (level, expiryDays = CONSENT_EXPIRY_DAYS, preferences = null) => {
  const options = {
    expires: expiryDays,
    sameSite: 'Lax',
    secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
  };
  Cookies.set(CONSENT_KEY, level, options);
  if (preferences) Cookies.set(CONSENT_PREFERENCES_KEY, JSON.stringify(preferences), options);
  else Cookies.remove(CONSENT_PREFERENCES_KEY);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cookieConsentChanged', { detail: { level, preferences } }));
  }
};
