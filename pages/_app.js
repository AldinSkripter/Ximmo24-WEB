"use client";
import { TranslationProvider } from "@/components/context/TranslationContext";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import FullScreenSpinLoader from "@/components/ui/loaders/FullScreenSpinLoader";
import { store } from "@/redux/store";
import "@/styles/globals.css";
import { Router, useRouter } from "next/router";
import Script from "next/script";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { Suspense, useEffect, useRef, useState } from "react";
import { Toaster } from "react-hot-toast";
import { Provider, useSelector } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "react-phone-input-2/lib/style.css";
import "leaflet/dist/leaflet.css";
import { Manrope } from "next/font/google";
import dynamic from "next/dynamic";
import { isGoogleMapsProvider } from "@/utils/mapProvider";
import { hasAdvertisingConsent, hasAnalyticsConsent } from "@/utils/cookieConsent";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import MicrosoftClarity from "@/components/analytics/MicrosoftClarity";
import { trackPageview, clearGACookies, clearClarityCookies } from "@/utils/analytics";

// Tracks the pathname of the page the user is currently on, updated via routeChangeComplete.
// window.location.pathname cannot be used in routeChangeStart for popstate (back/forward)
// because the browser changes the URL immediately before any JS fires, making
// window.location.pathname already point to the destination page.
let _trackedPathname = typeof window !== 'undefined' ? window.location.pathname : '/';

// NotificationProvider: Registers service worker and sets up global foreground listener.
// Loaded client-side only (SSR disabled) to avoid hydration issues.
const NotificationProvider = dynamic(
  () => import("@/providers/NotificationProvider"),
  { ssr: false }
);

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  weight: ["200", "300", "400", "500", "600", "700", "800"]
})

const MapProviderAssets = () => {
  const webSettings = useSelector((state) => state.WebSetting?.data);

  if (!webSettings || !isGoogleMapsProvider(webSettings)) {
    return null;
  }

  return (
    <Script
      id="google-maps-api"
      src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API}&libraries=places&loading=async`}
      strategy="afterInteractive"
    />
  );
};

export default function App({ Component, pageProps }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: parseInt(process.env.NEXT_PUBLIC_API_STALE_TIME) || 0,
        refetchOnWindowFocus: false,
        retry: 3,
      },
    }
  })) // 👈 stable client

  const [adConsentGranted, setAdConsentGranted] = useState(() =>
    typeof window !== 'undefined' ? hasAdvertisingConsent() : false
  );

  useEffect(() => {
    setAdConsentGranted(hasAdvertisingConsent());
    const onConsentChange = () => setAdConsentGranted(hasAdvertisingConsent());
    window.addEventListener('cookieConsentChanged', onConsentChange);
    return () => window.removeEventListener('cookieConsentChanged', onConsentChange);
  }, []);

  const [gaConsentGranted, setGaConsentGranted] = useState(() =>
    typeof window !== 'undefined' ? hasAnalyticsConsent() : false
  );
  const gaConsentRef = useRef(gaConsentGranted);

  useEffect(() => {
    setGaConsentGranted(hasAnalyticsConsent());
    const onGaConsentChange = () => {
      const granted = hasAnalyticsConsent();
      setGaConsentGranted(granted);
      if (!granted) {
        clearGACookies();
        clearClarityCookies();
      }
    };
    window.addEventListener('cookieConsentChanged', onGaConsentChange);
    return () => window.removeEventListener('cookieConsentChanged', onGaConsentChange);
  }, []);

  useEffect(() => {
    gaConsentRef.current = gaConsentGranted;
  }, [gaConsentGranted]);

  useEffect(() => {
    const onGaRouteChange = (url) => {
      if (gaConsentRef.current) trackPageview(url);
    };
    Router.events.on('routeChangeComplete', onGaRouteChange);
    return () => Router.events.off('routeChangeComplete', onGaRouteChange);
  }, []);

  // NProgress (SAFE)
  useEffect(() => {
    const start = () => NProgress.start()
    const done = () => NProgress.done()
    const saveScroll = () => {
      if (_trackedPathname === '/') {
        sessionStorage.setItem('__scroll_/', String(window.scrollY))
      }
    }
    const trackPath = (url) => {
      _trackedPathname = url.split('?')[0]
    }

    Router.events.on("routeChangeStart", saveScroll)
    Router.events.on("routeChangeStart", start)
    Router.events.on("routeChangeComplete", done)
    Router.events.on("routeChangeComplete", trackPath)
    Router.events.on("routeChangeError", done)

    return () => {
      Router.events.off("routeChangeStart", saveScroll)
      Router.events.off("routeChangeStart", start)
      Router.events.off("routeChangeComplete", done)
      Router.events.off("routeChangeComplete", trackPath)
      Router.events.off("routeChangeError", done)
    }
  }, [])

  // Chunk load error handler (SAFE)
  useEffect(() => {
    const onRouteError = (err) => {
      if (err?.message?.includes("Loading chunk")) {
        NProgress.done()
        window.location.reload()
      }
    }

    Router.events.on("routeChangeError", onRouteError)
    return () => Router.events.off("routeChangeError", onRouteError)
  }, [])

  // Font
  useEffect(() => {
    document.body.classList.add(manrope.className)
  }, [])

  const router = useRouter();
  const [needsPannellum, setNeedsPannellum] = useState(false);

  // Check if the current page needs Pannellum (property or project detail pages)
  useEffect(() => {
    const path = router.asPath;
    const isPannellumNeeded = path.includes('/property-details/') ||
      path.includes('/project-details/') ||
      path.includes('/my-property/') ||
      path.includes('/my-project/');

    setNeedsPannellum(isPannellumNeeded);
  }, [router.asPath]);

  return (
    <>
      {needsPannellum && (
        <>
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/pannellum@2.5.7/build/pannellum.css"
          />
          <Script
            src="https://cdn.jsdelivr.net/npm/pannellum@2.5.7/build/pannellum.js"
            strategy="afterInteractive"
          />
        </>
      )}
      {adConsentGranted && (
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5187122762138955"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      )}
      {gaConsentGranted && <GoogleAnalytics />}
      {gaConsentGranted && <MicrosoftClarity />}
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <Provider store={store}>
            <MapProviderAssets />
            <NotificationProvider />
            <TranslationProvider>
              <Suspense fallback={<FullScreenSpinLoader />}>
                <Component {...pageProps} />
              </Suspense>
              <Toaster />
            </TranslationProvider>
          </Provider>
        </QueryClientProvider>
      </ErrorBoundary>
    </>
  );
}
