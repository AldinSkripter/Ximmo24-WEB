import * as api from "@/api/apiRoutes";
import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setWebSettings } from "@/redux/slices/webSettingSlice";
import {
  setActiveLanguage,
  setCurrentLanguage,
  setDefaultLanguage,
  setIsFetched,
  setLanguages, setIsLanguageLoaded
} from "@/redux/slices/languageSlice";
import { useRouter } from "next/router";
import { setCategories, setInitialLoadComplete } from "@/redux/slices/cacheSlice";
import withAuth from "../HOC/withAuth";
import Header from "./Header";
import Footer from "./Footer";
// Service worker registration and global foreground listener are handled by
// NotificationProvider in pages/_app.js. No push notification wrapper needed here.

import { useTranslation } from "../context/TranslationContext";
import CookieComponent from "../cookie/Cookie";
import PWAInstallButton from "../PWAInstallButton";
import UnderMaintenance from "../under-maintenance/UnderMaintenance";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { updateUserProfile } from "@/redux/slices/authSlice";

const Layout = ({ children }) => {
  const router = useRouter();
  const t = useTranslation()
  const dispatch = useDispatch();
  const isLoadCompleted = useSelector((state) => state.cacheData.initialLoadComplete); // Track if initial load finished

  // Get language settings from Redux
  const defaultLanguage = useSelector((state) => state.LanguageSettings?.default_language);
  const activeLanguage = useSelector((state) => state.LanguageSettings?.active_language);
  const isLanguageLoaded = useSelector((state) => state.LanguageSettings?.isLanguageLoaded);
  const currentLanguage = useSelector((state) => state.LanguageSettings?.current_language);
  const availableLanguages = useSelector((state) => state.LanguageSettings?.languages);
  const webSettings = useSelector((state) => state.WebSetting?.data);
  const userData = useSelector((state) => state.User?.data);
  const currentRole = useSelector((state) => state?.User)?.role
  const underMaintenance = webSettings?.web_maintenance_mode === "1";
  const allowCookies = webSettings?.allow_cookies;

  // Get locale from router query params
  const urlLocale = router.query?.lang;

  const isUserListingPages = router?.asPath?.startsWith("/user/")

  // Memoized API calls to prevent unnecessary re-renders
  const fetchWebSettings = useCallback(async () => {
    try {
      const response = await api.getWebSetting();
      const { data } = response;
      document.documentElement.lang = currentLanguage?.code;
      document.documentElement.style.setProperty(
        "--primary-color",
        data?.system_color
      );
      document.documentElement.style.setProperty(
        "--primary-category-background",
        data?.category_background
      );
      document.documentElement.style.setProperty(
        "--primary-sell",
        data?.sell_web_color
      );
      document.documentElement.style.setProperty(
        "--primary-rent",
        data?.rent_web_color
      );
      document.documentElement.style.setProperty(
        "--primary-sell-bg",
        data?.sell_web_background_color
      );
      document.documentElement.style.setProperty(
        "--primary-rent-bg",
        data?.rent_web_background_color
      );
      try {
        window.localStorage.setItem("ximmo24-theme", JSON.stringify({
          primary: data?.system_color,
          category: data?.category_background,
          sell: data?.sell_web_color,
          rent: data?.rent_web_color,
          sellBg: data?.sell_web_background_color,
          rentBg: data?.rent_web_background_color,
        }));
      } catch {
        // Storage can be unavailable in privacy mode; live settings still apply.
      }
      document.querySelectorAll("link[rel='icon']").forEach((link) => {
        link.href = data?.web_favicon;
      });

      dispatch(setWebSettings({ data }));
      const supportedLanguages = (data?.languages || []).filter(
        (language) => language?.code === "de" || language?.code === "en"
      );
      dispatch(setLanguages({ data: supportedLanguages }));
      dispatch(setDefaultLanguage({
        data: data?.default_language === "en" ? "en" : "de",
      }));
      document.dir = currentLanguage?.rtl === 1 ? "rtl" : "ltr";

      return true;
    } catch (error) {
      console.error("Failed to fetch web settings:", error);
      return false;
    }
  }, [dispatch, currentLanguage]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.getCategoriesApi({ limit: "12", offset: "0" });
      dispatch(setCategories({ data: response.data }));
      return true;
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      return false;
    }
  }, [dispatch]);

  const fetchLanguageData = useCallback(
    async (localeCode) => {
      if (!localeCode) return false;
      const requestedLocale = Array.isArray(localeCode) ? localeCode[0] : localeCode;
      const safeLocale = requestedLocale === "en" ? "en" : "de";

      // Ximmo24 intentionally exposes only German and English on the web.
      if (safeLocale === activeLanguage && isLanguageLoaded) {
        return true;
      }

      try {
        const response = await api.getLanguageData({
          language_code: safeLocale,
          web_language_file: 1,
        });
        if (response?.data?.rtl === 1) {
          document.dir = "rtl";
        } else {
          document.dir = "ltr";
        }

        document.documentElement.lang = safeLocale;

        // Make translations available immediately. Secondary synchronization must
        // never block the first visible render of a public page.
        dispatch(setActiveLanguage({ data: safeLocale }));
        dispatch(setCurrentLanguage({ data: response.data }));
        dispatch(setIsFetched({ data: true }));
        dispatch(setIsLanguageLoaded({ data: true }));

        void fetchCategories();
        if (userData) {
          void changeNotificationLanguage(safeLocale);
        }

        return true;
      } catch (error) {
        console.error(
          `Failed to fetch language data for ${safeLocale}:`,
          error,
        );
        return false;
      }
    },
    [dispatch, activeLanguage, isLanguageLoaded, fetchCategories, userData],
  );

  // Fetch web settings using React Query for caching and stale time
  useQuery({
    queryKey: ['webSettings'],
    queryFn: fetchWebSettings,
    // keepPreviousData: true,
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  })


  // Fetch User Data
  const fetchUserData = async () => {
    try {
      const res = await api.getUserProfileApi();
      if (res.data) {
        // Update Redux store with the fetched user data
        dispatch(
          updateUserProfile({
            data: res?.data,
          }),
        );
        return res?.data;
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useQuery({
    queryKey: ['userProfile'],
    queryFn: fetchUserData,
    enabled: !!userData?.id, // Only fetch if user ID is available
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  })

  const changeNotificationLanguage = async (language_code) => {
    try {
      const res = await api.updateNotificationLanguageApi({ language_code });
      return res?.data;
    } catch (error) {
      console.error('Failed to update notification language:', error);
      return null;
    }
  }



  useEffect(() => {
    if (userData?.id) {
      changeNotificationLanguage(currentLanguage?.code ?? activeLanguage);
    }

    // Allow agents to view their own property/project detail pages via Layout
    const isAgentDetailRoute =
      router?.pathname?.startsWith('/agent/my-property') ||
      router?.pathname?.startsWith('/agent/my-project');

    if (currentRole === "agent" && !isAgentDetailRoute) {
      toast.error(t("pleaseSwitchToUser"))
      router?.replace(`/agent/dashboard?lang=${activeLanguage}`)
    }
  }, [userData?.id])

  // Handle language query parameter initialization and validation
  useEffect(() => {
    const handleLanguageFromUrl = async () => {
      // Don't update language during fallback or if router is not ready
      if (!router.isReady || router.isFallback) return;

      // Wait for languages to be available
      if (!availableLanguages || availableLanguages.length === 0) return;

      const { lang } = router.query;

      try {
        let shouldUpdateUrl = false;
        let langToUse = currentLanguage?.code || defaultLanguage || "en";

        // Case 1: No lang parameter in URL
        if (!lang) {
          shouldUpdateUrl = true;
        }
        // Case 2: Invalid/unsupported lang code in URL
        else if (!availableLanguages.some((l) => l.code === lang)) {
          shouldUpdateUrl = true;
        }
        // Case 3: Valid lang in URL but different from current - need to load it
        else if (lang !== activeLanguage) {
          langToUse = lang;
          // Don't update URL, just load the language data
          shouldUpdateUrl = false;
        }

        // Update URL with language parameter if needed
        if (shouldUpdateUrl) {
          const currentQuery = { ...router.query };
          currentQuery.lang = langToUse;
          // Replace URL without adding a new history entry
          router.replace(
            {
              pathname: router.pathname,
              query: currentQuery,
            },
            undefined,
            { shallow: true }
          );
        }
      } catch (error) {
        console.error("Error handling language parameters:", error);
      }
    };

    handleLanguageFromUrl();
  }, [
    router,
    router.isReady,
    currentLanguage?.code,
    defaultLanguage,
    availableLanguages,
    activeLanguage,
  ]);

  // Fetch language data on initial load, manual change or language inactive conflict
  useEffect(() => {
    const loadLanguageData = async () => {
      // Skip if no language code available yet
      if (!urlLocale) return;

      try {
        await fetchLanguageData(urlLocale);
      } catch (error) {
        console.error("Error loading language data:", error);
      } finally {
        dispatch(setInitialLoadComplete(true));
      }
    };

    loadLanguageData();

    return () => { };
  }, [urlLocale, isLoadCompleted]);


  return (
    <>
      <Header />
      <main className={`h-full ${isUserListingPages ? "" : "min-h-screen"} w-full`}>{children}</main>
      <Footer />
      {allowCookies && <CookieComponent />}
      {process.env.NEXT_PUBLIC_PWA_ENABLED === "true" && (
        <PWAInstallButton />
      )}
    </>
  );
};

export default withAuth(Layout);
