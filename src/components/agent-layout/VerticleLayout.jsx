"use client";
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "../context/TranslationContext";
import { useRouter } from "next/router";
import AgentHeader from "./AgentHeader";
import AgentFooter from "./AgentFooter";
import AgentSidebar from "./AgentSidebar";
import { getWebSetting, getLanguageData, updateNotificationLanguageApi, getUserProfileApi } from "@/api/apiRoutes";
import { setWebSettings } from "@/redux/slices/webSettingSlice";
import { logout, setRole, updateUserProfile } from "@/redux/slices/authSlice";
import {
    setActiveLanguage,
    setCurrentLanguage,
    setIsFetched,
    setIsLanguageLoaded,
} from "@/redux/slices/languageSlice";
import FirebaseData from "@/utils/Firebase";
import Swal from "sweetalert2";
import withAuth from "../HOC/withAuth";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import toast from "react-hot-toast";

const VerticleLayout = ({ children }) => {
    const { signOut } = FirebaseData();
    const t = useTranslation();
    const router = useRouter();
    const dispatch = useDispatch();
    const currentRole = useSelector((state) => state.User?.role);
    const userData = useSelector((state) => state.User?.data);

    // Track previous role to detect intentional role switches
    const prevRoleRef = useRef(currentRole);

    const webSettings = useSelector((state) => state.WebSetting?.data);
    const {
        current_language: currentLang,
        languages: availableLanguages,
        default_language: defaultLanguage,
        active_language: activeLanguage,
        isLanguageLoaded,
    } = useSelector((state) => state.LanguageSettings);

    const [isMobile, setIsMobile] = useState(false);
    const [isUserDataRefreshing, setIsUserDataRefreshing] = useState(false);
    const [hasRefreshedUserData, setHasRefreshedUserData] = useState(false);

    const getCurrentPath = () => {
        const path = router.asPath?.split("?")?.[0] || "";
        return path.length > 1 ? path.replace(/\/$/, "") : path;
    };

    const shouldRestoreAgentRoleOnRefresh = () => {
        if (typeof window === "undefined") return false;

        const navigationEntry = window.performance?.getEntriesByType?.("navigation")?.[0];
        const isReload = navigationEntry?.type === "reload" || window.performance?.navigation?.type === 1;

        return isReload && getCurrentPath() === "/agent/dashboard";
    };

    // Apply language settings to HTML
    const applyLanguageToHtml = (langCode, isRtl) => {
        if (typeof document === "undefined") return;

        document.documentElement.lang = langCode || "en";
        document.documentElement.dir = isRtl ? "rtl" : "ltr";
    };

    const changeNotificationLanguage = async (language_code) => {
        try {
            const res = await updateNotificationLanguageApi({ language_code });
            return res?.data;
        } catch (error) {
            console.error('Failed to update notification language:', error);
            return null;
        }
    }

    // Fetch and apply language data
    const handleLanguageChange = async (localeCode) => {
        if (!localeCode || localeCode === activeLanguage) return;

        try {
            const response = await getLanguageData({
                language_code: localeCode,
                web_language_file: 1,
            });

            const isRtl = response?.data?.rtl === 1;
            applyLanguageToHtml(localeCode, isRtl);
            await changeNotificationLanguage(localeCode);
            dispatch(setActiveLanguage({ data: localeCode }));
            dispatch(setCurrentLanguage({ data: response.data }));
            dispatch(setIsFetched({ data: true }));
            dispatch(setIsLanguageLoaded({ data: true }));
        } catch (error) {
            console.error(`Language fetch failed for ${localeCode}:`, error);
        }
    };

    // Handle account deactivation
    const handleAccountDeactivation = async () => {
        if (webSettings?.is_active !== false) return;

        const result = await Swal.fire({
            title: t("opps"),
            text: t("yourAccountDeactivated"),
            icon: "warning",
            allowOutsideClick: false,
            confirmButtonText: t("logout"),
            customClass: { confirmButton: "Swal-confirm-buttons" },
        });

        if (result.isConfirmed) {
            dispatch(logout());
            signOut();
        }
    };

    // Fetch web settings and apply theme
    const fetchWebSettings = async () => {
        try {
            const res = await getWebSetting();
            if (res?.error) return;

            dispatch(setWebSettings({ data: res.data }));

            // Apply CSS custom properties
            const root = document.documentElement;
            root.style.setProperty("--primary-color", res.data?.system_color);
            root.style.setProperty("--primary-category-background", res.data?.category_background);
        } catch (error) {
            console.error("Failed to fetch web settings:", error);
        }
    };

    // Fetch User Data
    const fetchUserData = async () => {
        try {
            const res = await getUserProfileApi();
            if (res.data) {
                const fetchedUserData = res?.data;
                // Update Redux store with the fetched user data
                dispatch(updateUserProfile({
                    data: fetchedUserData
                }));

                if (
                    fetchedUserData?.is_agent === true &&
                    fetchedUserData?.become_agent_status === "approved" &&
                    shouldRestoreAgentRoleOnRefresh()
                ) {
                    dispatch(setRole({ data: "agent" }));
                }

                return fetchedUserData;
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }

        return null;
    };

    // Handle URL language parameter
    useEffect(() => {
        if (!router.isReady || !availableLanguages?.length) return;

        const { lang } = router.query;
        const isValidLang = availableLanguages.some((l) => l.code === lang);
        const langToUse = isValidLang ? lang : (defaultLanguage || "en");
        applyLanguageToHtml(langToUse, currentLang?.rtl === 1);

        if (langToUse !== lang) {
            router.replace(
                { pathname: router.pathname, query: { ...router.query, lang: langToUse } },
                undefined,
                { shallow: true }
            );
        }

        handleLanguageChange(langToUse);
    }, [router.isReady, router.query.lang, availableLanguages, defaultLanguage, currentLang?.rtl]);

    // Handle responsive design
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Handle account deactivation effect
    useEffect(() => {
        handleAccountDeactivation();
    }, [webSettings?.is_active]);

    // Fetch settings when language is loaded
    useEffect(() => {
        if (!isLanguageLoaded) return;

        let isMounted = true;

        const fetchInitialData = async () => {
            setIsUserDataRefreshing(true);

            try {
                await Promise.all([
                    fetchWebSettings(),
                    fetchUserData(),
                ]);
            } finally {
                if (isMounted) {
                    setHasRefreshedUserData(true);
                    setIsUserDataRefreshing(false);
                }
            }
        };

        fetchInitialData();

        return () => {
            isMounted = false;
        };
    }, [isLanguageLoaded]);

    // Guard agent routes after the server-backed user data refresh completes
    useEffect(() => {
        if (!router.isReady || isUserDataRefreshing || !hasRefreshedUserData) return;

        // Detect if role just changed (intentional switch)
        const roleJustChanged = prevRoleRef.current !== currentRole;
        prevRoleRef.current = currentRole;

        // Skip guard check during role transition to prevent race condition error
        if (roleJustChanged) {
            return;
        }

        const isAgentFormPending = userData?.is_agent === false && userData?.become_agent_status === "pending";
        const isApprovedAgent = userData?.is_agent === true && userData?.become_agent_status === "approved";
        const currentPath = getCurrentPath();
        const allowedPendingRoutes = ["/agent/dashboard", "/agent/packages", "/agent/subscription"];
        const isAllowedPendingRoute = allowedPendingRoutes.includes(currentPath);

        if (isAgentFormPending && !isAllowedPendingRoute) {
            toast.error(t("yourAgentFormIsPending"));
            const selectedLang = router.query?.lang || activeLanguage || "en";
            router.replace(`/agent/dashboard?lang=${selectedLang}`);
            return;
        }

        // if (!isAgentFormPending && !isApprovedAgent) {
        //     toast.error(t("pleaseSwitchToAgent"));
        //     router.replace("/");
        //     return;
        // }

        if (isApprovedAgent && currentRole !== "agent") {
            toast.error(t("pleaseSwitchToAgent"));
            router.replace("/");
        }
    }, [
        router.isReady,
        router.asPath,
        router.query?.lang,
        userData?.is_agent,
        userData?.become_agent_status,
        currentRole,
        activeLanguage,
        isUserDataRefreshing,
        hasRefreshedUserData,
    ]);

    return (
        <SidebarProvider>
            <div className="flex h-screen overflow-hidden">
                <Sidebar
                    side={currentLang?.rtl === 1 ? "right" : "left"}
                    variant="sidebar"
                    collapsible="icon"
                    className="border-r border-gray-200 bg-white flex-shrink-0"
                >
                    <AgentSidebar isMobile={isMobile} />
                </Sidebar>

                <SidebarInset className="flex flex-col flex-1 min-w-0 overflow-hidden">
                    <header className="flex-shrink-0 border-b">
                        <AgentHeader isMobile={isMobile} />
                    </header>

                    <main className="flex-1 overflow-y-auto primaryBackgroundBg relative">
                        <div className="w-full max-w-full p-2 md:p-4 lg:p-6">
                            {children}
                        </div>
                    </main>

                    <footer className="flex-shrink-0 border-t">
                        <AgentFooter isMobile={isMobile} />
                    </footer>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
};

export default withAuth(VerticleLayout);
