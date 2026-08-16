import { hasAnalyticsConsent } from './cookieConsent';

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
export const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

export const trackEvent = (name, params = {}, opts = {}) => {
  if (typeof window === 'undefined') return;
  if (!hasAnalyticsConsent()) return;

  if (typeof window.gtag === 'function') {
    window.gtag('event', name, params);
  }
  if (opts.clarity && typeof window.clarity === 'function') {
    window.clarity('event', name);
  }
};

export const trackPageview = (url) => {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  if (!GA_MEASUREMENT_ID) return;
  window.gtag('config', GA_MEASUREMENT_ID, { page_path: url });
};

export const clearGACookies = () => {
  if (typeof document === 'undefined') return;

  const names = document.cookie
    .split(';')
    .map((c) => c.trim().split('=')[0])
    .filter((name) => name === '_ga' || name === '_gid' || /^_ga_/.test(name));

  names.forEach((name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });
};

export const clearClarityCookies = () => {
  if (typeof document === 'undefined') return;

  const names = document.cookie
    .split(';')
    .map((c) => c.trim().split('=')[0])
    .filter((name) => name === '_clck' || name === '_clsk');

  names.forEach((name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });
};
