import Cookies from 'js-cookie';

export const CONSENT_KEY = 'cookie-consent';
export const CONSENT_EXPIRY_DAYS = 365;

export const CONSENT = {
  ALL: 'all',
  NECESSARY: 'necessary',
  REJECTED: 'rejected',
};

export const getConsentLevel = () => Cookies.get(CONSENT_KEY) ?? null;

export const hasNecessaryConsent = () => {
  const level = getConsentLevel();
  return level === CONSENT.ALL || level === CONSENT.NECESSARY;
};

export const hasAnalyticsConsent = () => getConsentLevel() === CONSENT.ALL;

export const hasAdvertisingConsent = () => getConsentLevel() === CONSENT.ALL;

export const setConsent = (level, expiryDays = CONSENT_EXPIRY_DAYS) => {
  Cookies.set(CONSENT_KEY, level, { expires: expiryDays });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cookieConsentChanged', { detail: { level } }));
  }
};
