"use client";
import dynamic from "next/dynamic";
import { beforeLogoutApi, getCustomPagesApi } from "@/api/apiRoutes";
import Ximmo24Brand from "@/components/brand/Ximmo24Brand";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { logout } from "@/redux/slices/authSlice";
import { setLockedFilter } from "@/redux/slices/propertyListSlice";
import { setFCMToken } from "@/redux/slices/webSettingSlice";
import { setIsLanguageLoaded } from "@/redux/slices/languageSlice";
import {
  registerServiceWorker,
  generateFCMToken,
  requestNotificationPermission,
} from "@/firebase/messaging";
import FirebaseData from "@/utils/Firebase";
import { showLoginSwal, truncate } from "@/utils/helperFunction";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AiFillInstagram } from "react-icons/ai";
import { BiMapPin } from "react-icons/bi";
import { FaChevronDown, FaExclamation, FaFacebookF, FaRegClock, FaRegUserCircle, FaYoutube } from "react-icons/fa";
import { FaPhone, FaXTwitter } from "react-icons/fa6";
import { MdEmail, MdOutlineVerifiedUser } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import { useTranslation } from "../context/TranslationContext";
import ImageWithPlaceholder from "../image-with-placeholder/ImageWithPlaceholder";
import LocationSearchWithRadius from "../location-search/LocationSearchWithRadius";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { setCustomPages } from "@/redux/slices/cacheSlice";
import UserDropDown from "../reusable-components/UserDropDown";
import { IoCaretDownSharp } from "react-icons/io5";

const LoginModal = dynamic(() => import("../modal/LoginModal"), { ssr: false });
const AreaConverter = dynamic(() => import("../area-converter/AreaConverter"), { ssr: false });
const MobileMenu = dynamic(() => import("./MobileMenu"), { ssr: false });
const SCROLL_THRESHOLD = 50;

const Header = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const router = useRouter();
  const t = useTranslation();
  const { lang } = router?.query;

  const userSelectedLocation = useSelector((state) => state.location);

  const isUserLoggedIn = useAuthStatus();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAreaConverter, setShowAreaConverter] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const isUserLocationSet =
    userSelectedLocation?.city !== "" &&
    userSelectedLocation?.state !== "" &&
    userSelectedLocation?.country !== "";
  const [location, setLocation] = useState(
    isUserLocationSet
      ? [
        userSelectedLocation?.city,
        userSelectedLocation?.state,
        userSelectedLocation?.country,
      ]
      : [userSelectedLocation?.formatted_address],
  );
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const lastScrollY = useRef(0);

  const languages = useSelector((state) => state.LanguageSettings?.languages);
  const defaultLang = useSelector((state) => state.LanguageSettings?.default_language);
  const activeLang = useSelector((state) => state.LanguageSettings?.active_language);
  const currentLang = activeLang || defaultLang;
  const userData = useSelector((state) => state.User?.data);
  const FcmToken = useSelector((state) => state.WebSetting?.fcmToken);
  const webSettings = useSelector((state) => state.WebSetting?.data);

  const isAgent = userData?.become_agent_status === "approved" && userData?.is_agent === true;
  const isAgentRequestRejected = userData?.become_agent_status === "rejected";
  const isAgentRequestPending = userData?.become_agent_status === "pending";
  const isAgentNotApplied = userData?.become_agent_status === "not_applied";
  const isBecomeAgentPage = router?.pathname === "/become-agent";
  const isHomePage = router?.pathname === "/";
  const useHeroHeader = isHomePage && !isScrolled;
  const isAgentOwnListingDetailsPage =
    router?.pathname?.startsWith("/agent/my-property") ||
    router?.pathname?.startsWith("/agent/my-project");
  const logoHref =
    isAgent && isAgentOwnListingDetailsPage
      ? `/agent/dashboard?lang=${lang || "de"}`
      : `/?lang=${lang || "de"}`;
  const { signOut } = FirebaseData();
  const agentStatusButtonClass =
    `hidden xl:flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold max-h-14 justify-center transition-all duration-200 ${useHeroHeader ? "border-white/70 bg-white text-slate-900 hover:bg-white/90" : "border-white/25 bg-white/10 text-white hover:bg-white hover:text-slate-900"}`;
  const handleBecomeAgentClick = () => {
    if (userData) {
      router.push(`/become-agent?lang=${currentLang}`);
    } else {
      showLoginSwal("oops", "plzLoginFirstToBecomeAgent", () => {
        handleShowLogin()
      }, t)
    }
  }

  const agentStatusButton =
    (!userData || isAgentNotApplied) && !isBecomeAgentPage
      ? {
        icon: <MdOutlineVerifiedUser className="size-4" />,
        label: t("becomeAgent"),
        onClick: handleBecomeAgentClick,
        disabled: false,
      }
      : isAgentRequestPending && !isBecomeAgentPage
        ? {
          icon: <FaRegClock className="size-4" />,
          label: t("requestPending"),
          onClick: undefined,
          disabled: true,
        }
        : isAgentRequestRejected && !isBecomeAgentPage
          ? {
            icon: <FaExclamation className="size-4" />,
            label: t("requestRejected"),
            onClick: () => router?.push(`/become-agent?lang=${currentLang}`),
            disabled: false,
          }
          : null;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY.current;
      const hasPassedThreshold = currentScrollY > SCROLL_THRESHOLD;

      setIsScrolled(hasPassedThreshold);
      setIsHeaderVisible(!(scrollingDown && hasPassedThreshold));
      lastScrollY.current = currentScrollY;
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close navigation menus and language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is outside any dropdown menu
      const isInsideDropdown = event.target.closest('.dropdown-menu') ||
        event.target.closest('.dropdown-trigger');

      // Check if the click is outside the language dropdown
      const isInsideLangDropdown = event.target.closest('.language-dropdown');

      if (!isInsideDropdown && openMenu) {
        setOpenMenu(null);
      }

      if (!isInsideLangDropdown && showLangDropdown) {
        setShowLangDropdown(false);
      }
    };

    if (openMenu || showLangDropdown) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openMenu, showLangDropdown]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      const shouldRefreshToken = Notification.permission === "granted" && !FcmToken;

      if (Notification.permission === "default") {
        const permission = await requestNotificationPermission();
        if (permission === "granted") {
          const registration = await registerServiceWorker({ maxRetries: 3 });
          if (!registration) return;
          const token = await generateFCMToken(registration);
          if (token) setFCMToken(token);
        }
        return;
      }

      if (shouldRefreshToken) {
        const registration = await registerServiceWorker({ maxRetries: 3 });
        if (!registration) return;
        const token = await generateFCMToken(registration);
        if (token) setFCMToken(token);
      }
    }, 2000); // Delay to avoid prompting immediately on page load

    return () => window.clearTimeout(timeoutId);
  }, [FcmToken]);

  const handleShowLogin = () => {
    setShowLogin(true);
    setIsMenuOpen(false);
  };
  const handleShowAreaConverter = () => {
    setShowAreaConverter(true);
    setIsMenuOpen(false);
  };
  useEffect(() => {
    if (isUserLocationSet) {
      setLocation([
        userSelectedLocation?.city,
        userSelectedLocation?.state,
        userSelectedLocation?.country,
      ]);
    } else {
      // Location was cleared - reset to empty so placeholder shows
      setLocation([]);
    }
  }, [userSelectedLocation]);

  const getCustomPages = async ({ limit, offset }) => {
    try {
      const response = await getCustomPagesApi({ limit, offset });
      dispatch(setCustomPages(response.data))
      return response.data;
    } catch (error) {
      console.error("Failed to fetch custom pages:", error);
      return null;
    }
  };
  const customPages = useQuery({
    queryKey: ["customPages", lang],
    queryFn: () => getCustomPages({ limit: "10", offset: "0" }),
    enabled: !!lang,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const menus = [
    {
      name: "properties",
      links: [
        {
          name: "allProperties",
          route: `/properties`,
        },
        {
          name: "featuredProperties",
          route: `/properties/featured-properties`,
        },
        {
          name: "mostViewedProperties",
          route: `/properties/most-viewed-properties`,
        },
        {
          name: "mostFavouriteProperties",
          route: `/properties/most-favourite-properties`,
        },
        {
          name: "propertiesByCities",
          route: `/properties/properties-nearby-city`,
        },
      ],
    },
    {
      name: "projects",
      links: [
        {
          name: "allProjects",
          route: `/projects`,
        },
        {
          name: "featuredProjects",
          route: `/projects/featured-projects`,
          filters: { flags: { promoted: 1 } },
        },
        {
          name: "mostViewedProjects",
          route: `/projects/most-viewed-projects`,
          filters: { flags: { most_views: 1 } },
        },
        {
          name: "mostFavouriteProjects",
          route: `/projects/most-favourite-projects`,
          filters: { flags: { most_liked: 1 } },
        },
        // {
        //   name: "projectsNearbyCity",
        //   route: `/projects/projects-nearby-city`,
        // },
      ],
    },
    {
      name: "pages",
      links: [
        {
          name: "subscriptionPlan",
          route: `/subscription-plan`,
        },
        {
          name: "articles",
          route: `/all/articles`,
        },
        { name: "faqs", route: `/faqs` },
        ...(!router?.asPath?.includes("/agent/") ? [{
          name: "areaConverter",
          route: `/area-converter`,
        }] : []),
        {
          name: "termsAndConditions",
          route: `/terms-and-conditions`,
        },
        {
          name: "privacyPolicy",
          route: `/privacy-policy`,
        },
        {
          name: "aboutUs",
          route: `/about-us`,
        },
        {
          name: "contactUs",
          route: `/contact-us`,
        },
        ...(customPages?.data?.map((page) => ({
          name: page?.translated_title,
          route: `/more-pages/${page?.slug_id}`,
        })) || [])
      ],
    }
  ];

  const handleLanguageChange = async (newLang) => {
    try {
      // Skip if already the current language
      if (newLang === currentLang) return;

      // Fetch language data for the new language
      dispatch(setIsLanguageLoaded({ data: false }));
      // Update URL with new language query parameter
      const currentQuery = { ...router.query };
      currentQuery.lang = newLang;

      // Use router.push to update the language query param
      router.push(
        {
          pathname: router.pathname,
          query: currentQuery,
        },
        undefined,
        { shallow: true }
      );

      if (isMenuOpen) {
        toggleMenu();
      }
    } catch (error) {
      console.error("Failed to change language:", error);
      toast.error(t("languageChangeError"));
    }
  };

  const handleNavigateLinks = (e, link) => {
    e.preventDefault();
    dispatch(setLockedFilter(null));
    const query = { lang: router.query.lang || currentLang };
    if (link.filters) {
      query.filters = encodeURIComponent(btoa(JSON.stringify(link.filters)));
    }
    router.push({
      pathname: link.route,
      query,
    });
  };

  const handleLogout = async () => {
    setIsMenuOpen(false);
    Swal.fire({
      title: t("areYouSure"),
      text: t("youNotAbelToRevertThis"),
      icon: "warning",
      showCancelButton: true,
      customClass: {
        confirmButton: "Swal-confirm-buttons",
        cancelButton: "Swal-cancel-buttons",
      },
      confirmButtonText: t("yesLogout"),
      cancelButtonText: t("cancel"),
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          if (FcmToken) {
            const res = await beforeLogoutApi({ fcm_id: FcmToken });
            if (!res.error) {
              dispatch(logout());
              signOut();
              toast.success(t("logoutSuccess"));
            }
          } else {
            dispatch(logout());
            signOut();
            toast.success(t("logoutSuccess"));
          }
        } catch (error) {
          error;
        }
      }
    });
  };

  const handleMenuToggle = (menuName) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };


  const handleShowLanguageDropdown = () => {
    if (languages?.length <= 1) {
      return;
    }
    setShowLangDropdown(!showLangDropdown);
  };



  return (
    <>
      <div
        className={`w-full z-50 transform transition-all duration-500 ${isHomePage ? "absolute left-0 top-0 h-20" : "relative h-20 md:h-32"} ${isScrolled ? "fixed left-0 top-0 h-20 shadow-xl" : ""} ${!isHeaderVisible ? "-translate-y-full" : "translate-y-0"}`}
      >
        <div className={`${isHomePage ? "hidden" : "primaryBg hidden md:block"} h-12 py-2 text-white`}>
          <div className="container h-8 px-3 md:px-2 lg:px-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 lg:gap-4">
                {webSettings?.company_email && (
                  <Link
                    href={`mailto:${webSettings?.company_email}`}
                    className="flex items-center gap-1.5 lg:gap-2 text-xs lg:text-sm"
                  >
                    <MdEmail
                      className="rounded-full bg-[#FFFFFF3D] p-0.5 lg:p-1 text-white w-5 h-5 lg:w-[26px] lg:h-[26px]"
                    />
                    {webSettings?.company_email}
                  </Link>
                )}
                {webSettings?.company_tel1 && (
                  <Link
                    href={`tel:${webSettings?.company_tel1}`}
                    className="flex items-center gap-1.5 lg:gap-2 text-xs lg:text-sm"
                  >
                    <FaPhone
                      className="rounded-full bg-[#FFFFFF3D] p-0.5 lg:p-1 text-white w-5 h-5 lg:w-[26px] lg:h-[26px]"
                    />
                    <span className="ltr-number">{webSettings?.company_tel1}</span>
                  </Link>
                )}
                {webSettings?.company_tel2 && (
                  <Link
                    href={`tel:${webSettings?.company_tel2}`}
                    className="flex items-center gap-1.5 lg:gap-2 text-xs lg:text-sm"
                  >
                    <FaPhone
                      className="rounded-full bg-[#FFFFFF3D] p-0.5 lg:p-1 text-white w-5 h-5 lg:w-[26px] lg:h-[26px]"
                    />
                    <span className="ltr-number">{webSettings?.company_tel2}</span>
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div
                  className="relative language-dropdown hidden lg:block"
                  onClick={handleShowLanguageDropdown}
                >
                  <button className="flex items-center gap-1 text-sm font-medium rounded-full bg-[#FFFFFF3D] px-2 py-1 text-white focus:outline-none">
                    {languages?.find((lang) => lang.code === currentLang)
                      ?.name || t("language")}
                    {languages?.length > 1 && <FaChevronDown size={10} />}
                  </button>

                  {showLangDropdown && (
                    <div
                      className="absolute right-0 top-3 z-[9999] mt-2 w-[110px] rounded-md border border-gray-100 bg-white shadow-lg"
                    >
                      {(languages || []).map((lang) => (
                        <div
                          key={lang.code}
                          className="hover:primaryColor hover:primaryBorderColor group block cursor-pointer border-b-2 border-dashed px-3 py-2 text-black transition-all duration-150 last:border-b-0"
                          onClick={() => {
                            handleLanguageChange(lang.code);
                            setShowLangDropdown(false);
                            setOpenMenu(null); // Close any open navigation menus
                          }}
                        >
                          <span className="transition-all duration-150 group-hover:ml-2">
                            {lang.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {(webSettings?.facebook_id || webSettings?.twitter_id || webSettings?.instagram_id || webSettings?.youtube_id) && (
                  <>
                    <div className="h-4 border-r border-white/30 hidden lg:block"></div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs lg:text-sm font-medium">{t("followUs")}</span>
                      <div className="ml-2 flex items-center gap-1">
                        {webSettings?.facebook_id && (
                          <Link
                            href={webSettings.facebook_id}
                            target="_blank"
                            className="flex items-center justify-center w-6 h-6 lg:w-8 lg:h-8 rounded-full hover:bg-white/20 text-white hover:text-gray-200 transition-colors"
                            aria-label="FacebookSocialIcon"
                          >
                            <FaFacebookF className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                          </Link>
                        )}
                        {webSettings?.twitter_id && (
                          <Link
                            href={webSettings.twitter_id}
                            target="_blank"
                            className="flex items-center justify-center w-6 h-6 lg:w-8 lg:h-8 rounded-full hover:bg-white/20 text-white hover:text-gray-200 transition-colors"
                            aria-label="TwitterSocialIcon"
                          >
                            <FaXTwitter className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                          </Link>
                        )}
                        {webSettings?.instagram_id && (
                          <Link
                            href={webSettings.instagram_id}
                            target="_blank"
                            className="flex items-center justify-center w-6 h-6 lg:w-8 lg:h-8 rounded-full hover:bg-white/20 text-white hover:text-gray-200 transition-colors"
                            aria-label="InstagramSocialIcon"
                          >
                            <AiFillInstagram className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                          </Link>
                        )}
                        {webSettings?.youtube_id && (
                          <Link
                            href={webSettings.youtube_id}
                            target="_blank"
                            className="flex items-center justify-center w-6 h-6 lg:w-8 lg:h-8 rounded-full hover:bg-white/20 text-white hover:text-gray-200 transition-colors"
                            aria-label="YouTubeSocialIcon"
                          >
                            <FaYoutube className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <header className={`relative z-50 w-full h-20 transition-all duration-500 ${useHeroHeader ? "bg-gradient-to-b from-slate-950/75 via-slate-950/35 to-transparent" : "bg-[#07111f] shadow-[0_10px_35px_rgba(2,8,23,0.18)]"}`}>
          <div className="container h-full px-3 md:px-4 lg:px-5 2xl:px-0">
            <div className="flex h-full items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3 lg:gap-5">
                <Link
                  href={logoHref}
                  title="Home"
                  className="flex shrink-0 items-center rounded-xl bg-white/95 px-2.5 py-1.5 shadow-lg ring-1 ring-white/30 transition-transform hover:scale-[1.02]"
                  onClick={() => dispatch(setLockedFilter(null))}
                >
                  {webSettings?.web_logo ? (
                    <ImageWithPlaceholder
                      src={webSettings.web_logo}
                      alt="Ximmo24"
                      width={176}
                      height={56}
                      className="h-9 w-28 object-contain md:h-10 md:w-32 xl:w-36"
                      priority={true}
                    />
                  ) : (
                    <Ximmo24Brand className="scale-90 origin-left md:scale-100" />
                  )}
                </Link>
                <div className="relative hidden min-w-0 max-w-[170px] lg:block xl:hidden 2xl:block 2xl:max-w-[230px]">
                  <div
                    className="relative cursor-pointer rounded-xl border border-white/20 bg-slate-950/25 px-3 py-2 text-white backdrop-blur-md transition-all hover:bg-white/15"
                    role="button"
                    tabIndex={0}
                    onClick={() => setIsLocationDialogOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setIsLocationDialogOpen(true);
                      }
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="shrink-0 rounded-lg bg-white/15 p-1.5">
                        <BiMapPin size={22} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 text-white/75">
                          <span className="text-xs">{t("location")}</span>
                          <FaChevronDown size={10} className="mb-0.5" />
                        </div>
                        <div
                          className="mt-0.5 truncate text-sm font-semibold text-white"
                          title={location?.filter(Boolean)?.join(", ") || t("selectLocation")}
                        >
                          {location && location?.filter(Boolean)?.length > 0
                            ? location?.filter(Boolean)?.join(", ")
                            : t("selectLocation")}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 xl:gap-3">
                <div className="xl:hidden">
                  {userData ?
                    (
                      <div
                        className="flex items-center gap-2 relative cursor-pointer xl:hidden dropdown-trigger dropdown-menu"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMenuToggle("user");
                        }}
                      > {userData?.profile ? (
                        <ImageWithPlaceholder
                          src={userData?.profile}
                          alt={userData?.name}
                          width={44}
                          height={44}
                          sizes="44px"
                          quality={95}
                          unoptimized
                          className="rounded-full aspect-[44/44] h-11 w-11 border newBorderColor p-0.5 object-cover"
                        />
                      ) : (
                        <div className="rounded-full aspect-[44/44] h-11 w-11 flex items-center justify-center primaryBg text-white text-xl font-bold uppercase border newBorderColor">
                          {(userData?.name)?.charAt(0) || t("user")}
                        </div>
                      )}
                        <IoCaretDownSharp className={`size-4 transition-transform duration-200 ${openMenu === "user" ? "rotate-180" : ""}`} />
                        {openMenu === "user" && (
                          <div className="absolute right-0 top-full z-20 mt-2">
                            <UserDropDown user={userData} handleLogout={handleLogout} handleLanguageChange={handleLanguageChange} onClose={() => handleMenuToggle(null)} />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2" >
                        <button
                          onClick={handleShowLogin}
                          className="rounded-full h-10 w-10 flex items-center justify-center primaryBg text-white border shrink-0 hover:brandBg"
                          aria-label="userLoginIcon"
                        >
                          <FaRegUserCircle size={24} />
                        </button>
                      </div>
                    )}
                </div>
                <MobileMenu
                  isScrolled={isScrolled}
                  isMenuOpen={isMenuOpen}
                  toggleMenu={toggleMenu}
                  languages={languages}
                  menus={menus}
                  handleLanguageChange={handleLanguageChange}
                  handleShowLogin={handleShowLogin}
                  handleLogout={handleLogout}
                  handleShowAreaConverter={handleShowAreaConverter}
                  darkHeader
                />

                <ul className="hidden items-center gap-4 xl:flex 2xl:gap-6">
                  <li className="font-semibold text-white/90 transition-colors hover:text-white">
                    <Link href={`/`} className="flex flex-col items-center" onClick={() => dispatch(setLockedFilter(null))}>
                      <span className={router.pathname === '/' ? 'text-white font-bold' : ''}>
                        {t("home")}
                      </span>
                    </Link>
                  </li>
                  {menus.map((menu) => (
                    <li key={menu.name} className="relative dropdown-menu flex flex-col items-center">
                      <button
                        className="dropdown-trigger flex items-center gap-1 bg-transparent p-0 text-sm font-semibold text-white/90 transition-all hover:text-white 2xl:text-base"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMenuToggle(menu.name);
                        }}
                      >
                        <span className={menu?.links?.some(link => {
                          return router.pathname.includes(link.route) && link.route !== '/';
                        }) ? 'text-white font-bold' : ''}>
                          {t(menu.name)}
                        </span>
                        <FaChevronDown
                          size={10}
                          className={`transition-transform duration-200 ${openMenu === menu.name ? 'rotate-180' : ''} ${menu?.links?.some(link => {
                            return router.pathname.includes(link.route) && link.route !== '/';
                          }) ? 'text-white' : ''
                            }`}
                        />
                      </button>

                      {openMenu === menu.name && (
                        <div className="dropdown-content absolute left-0 top-full z-20 mt-2 w-[250px] rounded-md cardBg shadow-lg newBorder">
                          <ul className="py-1 [&>li:last-child>button]:border-b-0">
                            {menu?.links?.map((link) => (
                              <li key={link.name}>
                                <button
                                  className="hover:primaryColor hover:primaryBorderColor group block w-full cursor-pointer border-b-2 border-dashed px-3 py-2 text-left transition-all duration-150"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (link.name === "areaConverter") {
                                      setShowAreaConverter(true);
                                    } else {
                                      handleNavigateLinks(e, link);
                                    }
                                    setOpenMenu(null);
                                  }}
                                >
                                  <span className="transition-all duration-150 group-hover:ml-2">
                                    {truncate(t(link.name), 26)}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>

                <div className="language-dropdown relative hidden xl:block">
                  <button
                    type="button"
                    onClick={handleShowLanguageDropdown}
                    className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                  >
                    <span className="2xl:hidden">{String(currentLang || "de").toUpperCase()}</span>
                    <span className="hidden 2xl:inline">
                      {(languages || []).find((item) => item.code === currentLang)?.name || t("language")}
                    </span>
                    {languages?.length > 1 && <FaChevronDown size={10} />}
                  </button>
                  {showLangDropdown && (
                    <div className="absolute right-0 top-full z-[9999] mt-2 w-32 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-slate-900 shadow-2xl">
                      {(languages || []).map((item) => (
                        <button
                          type="button"
                          key={item.code}
                          className="block w-full px-4 py-2 text-left text-sm font-medium transition-colors hover:bg-slate-100"
                          onClick={() => {
                            handleLanguageChange(item.code);
                            setShowLangDropdown(false);
                            setOpenMenu(null);
                          }}
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {agentStatusButton && (
                  <button
                    onClick={agentStatusButton.onClick}
                    disabled={agentStatusButton.disabled}
                    className={agentStatusButtonClass}
                  >
                    {agentStatusButton.icon}
                    <span className="text-nowrap">{agentStatusButton.label}</span>
                  </button>
                )}

                <div className="hidden items-center gap-3 font-medium xl:flex">
                  {userData === null ? (
                    <button
                      className="flex items-center gap-2 rounded-xl border border-white/55 bg-transparent px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white hover:text-slate-900"
                      onClick={handleShowLogin}
                    >
                      <FaRegUserCircle size={16} />
                      {t("login")}/{t("register")}
                    </button>
                  ) : (userData && userData?.name) ||
                    userData?.email ||
                    userData?.mobile ? (
                    <div className="relative dropdown-menu">
                      <button
                        className="dropdown-trigger flex w-max items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-2.5 py-1.5 text-sm font-semibold text-white transition-all hover:bg-white/20"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMenuToggle("user");
                        }}
                      >
                        {userData?.profile ? (
                          <ImageWithPlaceholder
                            src={userData?.profile}
                            alt={userData?.name}
                            width={44}
                            height={44}
                            sizes="44px"
                            quality={95}
                            unoptimized
                            className="rounded-full aspect-[44/44] h-11 w-11 border newBorderColor p-0.5 object-cover"
                          />
                        ) : (
                          <div className="rounded-full aspect-[44/44] h-11 w-11 flex items-center justify-center primaryBg text-white text-xl font-bold uppercase border newBorderColor">
                            {(userData?.name)?.charAt(0) || t("user")}
                          </div>
                        )}
                        {userData?.name
                          ? truncate(userData?.name, 15)
                          : t("welcomeUser")}
                        <FaChevronDown
                          size={10}
                          className={`transition-transform duration-200 ${openMenu === "user" ? 'rotate-180' : ''
                            }`}
                        />
                      </button>

                      {openMenu === "user" && (
                        <UserDropDown user={userData} handleLogout={handleLogout} handleLanguageChange={handleLanguageChange} onClose={() => handleMenuToggle(null)} />
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </header>
      </div>

      <LoginModal showLogin={showLogin} setShowLogin={setShowLogin} />
      {showAreaConverter && (
        <AreaConverter
          isOpen={showAreaConverter}
          onClose={() => setShowAreaConverter(false)}
        />
      )}
      <LocationSearchWithRadius
        isOpen={isLocationDialogOpen}
        onClose={() => setIsLocationDialogOpen(false)}
      />
    </>
  );
};

export default Header;
