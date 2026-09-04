"use client";
import { useRouter } from "next/router";
import { useState, useCallback } from "react";
import {
  BiTachometer,
  BiUserCircle,
  BiTrashAlt, BiCog,
  BiUserPlus,
  BiNews,
  BiMessageSquareDetail,
  BiBell,
  BiCreditCard,
  BiDollarCircle, BiHeart,
  BiBuildingHouse,
  BiCalendar, BiExpand, BiCollapse,
  BiChevronRight, BiImages, BiImport
} from "react-icons/bi";
import { RiAdvertisementLine } from "react-icons/ri";
import { FaGlobe, FaSignOutAlt } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import CustomLink from "../context/CustomLink";
import ImageWithPlaceholder from "../image-with-placeholder/ImageWithPlaceholder";
import { useTranslation } from "../context/TranslationContext";
import Swal from "sweetalert2";
import { getAuth, deleteUser } from "firebase/auth";
import FirebaseData from "@/utils/Firebase";
import toast from "react-hot-toast";
import { logout, setRole } from "@/redux/slices/authSlice";
import { isDemoMode, showSwal } from "@/utils/helperFunction";
import { beforeLogoutApi, deleteUserAccountApi } from "@/api/apiRoutes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { IoHomeOutline } from "react-icons/io5";
import { setIsLanguageLoaded } from "@/redux/slices/languageSlice";
import {
  SidebarContent, SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar
} from "@/components/ui/sidebar";
import { LuPackage } from "react-icons/lu";
import { MdOutlineBrandingWatermark } from "react-icons/md";

/**
 * AgentSidebar Component
 * 
 * A modern, responsive sidebar navigation component for user dashboard
 * Features:
 * - Hierarchical navigation with grouped sections
 * - Pixel-perfect design matching Figma specifications
 * - Responsive design (mobile/desktop)
 * - Accessibility features (ARIA labels, keyboard navigation)
 * - Smooth animations and transitions
 * - Active state indicators
 * - Custom scrollbar styling
 * - RTL support
 * - Collapsible functionality with tooltips for icons
 * 
 * @param {boolean} isMobile - Whether the sidebar is in mobile mode
 * @param {boolean} open - Whether the sidebar is open/visible
 * @param {function} toggleDrawer - Function to toggle sidebar visibility
 * @param {boolean} collapsed - Whether the sidebar is collapsed (desktop only)
 */

const AgentSidebar = ({ isMobile = false }) => {
  const router = useRouter();
  const pathname = router?.asPath;
  const dispatch = useDispatch();
  const settingData = useSelector((state) => state.WebSetting?.data);
  const userData = useSelector((state) => state.User?.data);
  const logo = settingData?.web_footer_logo;
  const t = useTranslation();
  const { signOut } = FirebaseData();
  const FcmToken = useSelector((state) => state.WebSetting?.fcmToken);
  const { lang } = router?.query;

  // Get sidebar state from shadcn sidebar context
  const { state: sidebarState, isMobile: sidebarIsMobile, toggleSidebar } = useSidebar();

  // Redux state for language management
  const languages = useSelector((state) => state.LanguageSettings?.languages);
  const activeLang = useSelector((state) => state.LanguageSettings?.active_language);
  const currentLang = activeLang;
  const langFile = useSelector((state) => state.LanguageSettings?.current_language);

  const isAgent = userData?.is_agent === true && userData?.become_agent_status === "approved";

  // State for language submenu
  const [isLanguageSubmenuOpen, setIsLanguageSubmenuOpen] = useState(false);

  // Language change handler - only updates URL, VerticleLayout handles the fetch
  const handleLanguageChange = useCallback(
    async (newLang) => {
      try {
        // Skip if already the current language
        if (newLang === activeLang) {
          setIsLanguageSubmenuOpen(false);
          return;
        }

        // Validate language exists in available languages
        const isValidLanguage = languages?.some((l) => l.code === newLang);
        if (!isValidLanguage) {
          console.error(`Invalid language code: ${newLang}`);
          toast.error(t("invalidLanguage"));
          return;
        }

        // Close submenu after selection
        setIsLanguageSubmenuOpen(false);

        // Mark language as not loaded to trigger fetch in VerticleLayout
        dispatch(setIsLanguageLoaded({ data: false }));

        // Update URL with new language query parameter
        // This will trigger the useEffect in VerticleLayout to fetch language data
        const currentQuery = { ...router.query };
        currentQuery.lang = newLang;

        // Use router.push to update the language query param
        await router.push(
          {
            pathname: router.pathname,
            query: currentQuery,
          },
          undefined,
          { shallow: true }
        );
      } catch (error) {
        console.error("Failed to change language:", error);
        toast.error(t("languageChangeError"));
      }
    },
    [activeLang, languages, router, dispatch, t]
  );

  // Handle logout functionality
  const handleLogout = async () => {
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
              dispatch(setRole({ data: "user" }))
              signOut();
              toast.success(t("logoutSuccess"));
              router.push("/");
            }
          } else {
            dispatch(logout());
            dispatch(setRole({ data: "user" }))
            signOut();
            toast.success(t("logoutSuccess"));
            router.push("/");
          }
        } catch (error) {
          console.error("Error logging out:", error);
        }
      }
    });
  };

  // Handle delete account functionality
  const handleDeleteAcc = async () => {
    if (isDemoMode() && userData?.is_demo_user) {
      Swal.fire({
        title: t("opps"),
        text: t("notAllowdDemo"),
        icon: "warning",
        showCancelButton: false,
        customClass: {
          confirmButton: "Swal-confirm-buttons",
          cancelButton: "Swal-cancel-buttons",
        },
        confirmButtonText: t("ok"),
        cancelButtonText: t("cancel"),
      });
      return; // Stop further execution
    }

    // Initialize Firebase Authentication
    const auth = getAuth();

    // Get the currently signed-in user
    const user = auth?.currentUser;

    Swal.fire({
      title: t("areYouSure"),
      text: t("youNotAbelToRevertThis"),
      icon: "warning",
      showCancelButton: true,
      customClass: {
        confirmButton: "Swal-confirm-buttons",
        cancelButton: "Swal-cancel-buttons",
      },
      cancelButtonColor: "#d33",
      confirmButtonText: t("yes"),
      cancelButtonText: t("cancel"),
    }).then(async (result) => {
      if (result.isConfirmed) {
        // Delete the user
        if (user) {
          try {
            // Firebase deleteUser returns undefined on success
            await deleteUser(user);

            // After successful Firebase deletion, call the API
            const response = await deleteUserAccountApi();

            // Handle success
            router.push("/");
            toast.success(t("accountDeletedSuccessfully"));
            dispatch(logout());
            signOut();
          } catch (error) {
            console.error("Error deleting user:", error.message);
            if (error.code === "auth/requires-recent-login") {
              router.push("/");
              toast.error(error.message);
              dispatch(logout());
              signOut();
            }
          }
        } else {
          try {
            const response = await deleteUserAccountApi();
            router.push("/");
            toast.success(t("accountDeletedSuccessfully"));
            dispatch(logout());
            signOut();
          } catch (err) {
            console.error(err);
          }
        }
      } else {
        console.error("delete account process canceled ");
      }
    });
  };

  const handleNavigation = (fullUrl, item) => {
    const isAgentFormPendingOrRejected = userData?.is_agent === false && (userData?.become_agent_status === "pending" || userData?.become_agent_status === "rejected");

    if (item.onClick) {
      return item.onClick();
    }

    if (isAgentFormPendingOrRejected) {
      if (item.url === "/agent/dashboard") {
        return router.push(`/agent/dashboard?lang=${lang}`);
      }

      if (item.url === "/agent/subscription" || item.url === "/agent/packages") {
        return router.push(fullUrl);
      }

      return showSwal({
        icon: "warning",
        title: t("oops"),
        text: t("youNeedToBecomeAgentToAccess"),
        isPremiumCheck: false,
        onConfirm: () => {
          if (router?.asPath?.includes("/agent/dashboard")) return;
          router?.push(`/agent/dashboard?lang=${lang}`);
        },
        t,
      });
    }

    if (userData?.active_role === "user" && userData?.become_agent_status === "") {
      return showSwal({
        icon: "warning",
        title: t("oops"),
        text: t("youNeedToBecomeAgentToAccess"),
        isPremiumCheck: false,
        onConfirm: () => {
          router?.push(`/agent/packages?lang=${lang}`);
        },
        t,
      });
    }

    router?.push(fullUrl);
  };

  // Sidebar navigation structure based on Figma design
  const sidebarSections = [
    {
      title: t("main"),
      items: [
        {
          title: t("myDashboard"),
          icon: BiTachometer,
          url: "/agent/dashboard",
        },
        {
          title: t("myProfile"),
          icon: BiUserCircle,
          url: "/agent/profile",
        },
        {
          title: t("myStories"),
          icon: BiImages,
          url: "/agent/stories",
        },
        {
          title: t("watermarkSettings"),
          icon: MdOutlineBrandingWatermark,
          url: "/agent/watermark-settings",
        }
      ].filter(Boolean)
    },
    {
      title: t("listings"),
      items: [
        {
          title: t("myProperties"),
          icon: IoHomeOutline,
          url: "/agent/properties",
        },
        {
          title: t("myProjects"),
          icon: BiBuildingHouse,
          url: "/agent/projects",
        },
        {
          title: t("openImmoImport") === "openImmoImport"
            ? (activeLang?.toLowerCase().startsWith("de") ? "Import & Schnittstellen" : "Import & Integrations")
            : t("openImmoImport"),
          icon: BiImport,
          url: "/agent/import-schnittstellen",
        },
        {
          title: t("myAdvertisement"),
          icon: RiAdvertisementLine,
          url: "/agent/advertisement/?tab=property",
        },
        // {
        //   title: t("favourites"),
        //   icon: BiHeart,
        //   url: "/agent/favourites",
        // },
      ]
    },
    {
      title: t("appointments"),
      items: [
        {
          title: t("bookings"),
          icon: BiCalendar,
          url: "/agent/bookings",
        },
        isAgent && {
          title: t("appointmentSettings"),
          icon: BiCog,
          url: "/agent/appointment-settings",
        },
      ].filter(Boolean)
    },
    {
      title: t("communication"),
      items: [
        {
          title: t("messages"),
          icon: BiMessageSquareDetail,
          url: "/agent/chat",
        },
        {
          title: t("agentNotification"),
          icon: BiBell,
          url: "/agent/notifications",
        },
        // {
        //   title: t("personalizeFeed"),
        //   icon: BiNews,
        //   url: "/agent/personalize-feed",
        // },
      ]
    },
    {
      title: t("accountAndBilling"),
      items: [
        {
          title: t("packages"),
          icon: LuPackage,
          url: "/agent/packages",
        },
        {
          title: t("mySubscriptions"),
          icon: BiCreditCard,
          url: "/agent/subscription",
        },
        {
          title: t("transactionHistory"),
          icon: BiDollarCircle,
          url: "/agent/transaction-history",
        },
        // {
        //   title: t("deleteAccount"),
        //   icon: BiTrashAlt,
        //   onClick: handleDeleteAcc,
        // },
      ].filter(Boolean)
    }
  ].filter(Boolean);


  const handleBackToHome = () => {
    dispatch(setRole({ data: "user" }));
  }

  return (
    <>
      {/* Header Section */}
      <SidebarHeader className="relative border-b" >
        <div className={`flex items-center justify-between !bg-white transition-all duration-300 ${sidebarState === "collapsed" ? "px-2 py-7" : "p-5"}`}>
          {/* Logo and Collapse button - Show when expanded */}
          {sidebarState === "expanded" && (
            <div className="flex items-center justify-between w-full">
              <CustomLink href="/" className="w-44 flex-shrink-0" onClick={handleBackToHome}>
                <ImageWithPlaceholder
                  src={settingData?.web_logo || logo}
                  alt="eBroker Logo"
                  className="h-14 w-full object-cover"
                  loading="lazy"
                />
              </CustomLink>
            </div>
          )}

          {/* Expand button - Show when collapsed (replaces logo) */}
          {sidebarState === "collapsed" && !sidebarIsMobile && (
            <button
              onClick={toggleSidebar}
              className="text-lg rounded-full h-10 w-10 flex items-center justify-center font-semibold primaryBgLight12 hover:bg-gray-100 transition-colors"
              aria-label="Expand Sidebar"
            >
              <BiExpand className="primaryColor h-5 w-5 shrink-0" aria-hidden="true" />
            </button>
          )}

          {/* Mobile close button */}
          {sidebarIsMobile && (
            <button
              onClick={toggleSidebar}
              className="flex-shrink-0 text-lg rounded-full h-12 w-12 flex items-center justify-center font-semibold primaryBgLight12"
              aria-label="Close Sidebar Menu"
            >
              <div className="block md:hidden">
                <BiCollapse className="primaryColor h-5 w-5 shrink-0" aria-hidden="true" />
              </div>
              <div className="hidden md:block">
                <BiExpand className="primaryColor h-5 w-5 shrink-0" aria-hidden="true" />
              </div>
            </button>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation Content */}
      <SidebarContent className="flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <TooltipProvider>
          {sidebarSections.map((section, sectionIndex) => (
            <SidebarGroup key={section.title}>
              {/* Section Header */}
              <SidebarGroupLabel className="text-sm font-semibold leadColor uppercase px-3 py-2 my-2.5 text-left w-full">
                {section.title}
              </SidebarGroupLabel>

              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item, itemIndex) => {
                    const pathSegment = pathname?.split("/")[2];
                    const itemSegment = item?.url?.split("/")[2];
                    const isActive = pathSegment === itemSegment;
                    const IconComponent = item.icon;
                    const hasQueryParams = item.url && item.url.includes("?");
                    const baseUrl = hasQueryParams ? item.url.split("?")[0] : item.url;
                    const queryParams = hasQueryParams ? item.url.split("?")[1] : "";
                    const fullUrl = queryParams ? `${baseUrl}?${queryParams}&lang=${currentLang}` : `${baseUrl}?lang=${currentLang}`;

                    // Handle submenu items
                    if (item.hasSubmenu) {
                      return (
                        <SidebarMenuItem key={`${sectionIndex}-${itemIndex}`}>
                          <SidebarMenuButton
                            onClick={(e) => {
                              // e.preventDefault();
                              handleNavigation(fullUrl, item);
                              if (item.onToggleSubmenu) {
                                item.onToggleSubmenu();
                              }
                            }}
                            isActive={isActive}
                            className={`
                              ${isActive
                                ? "primaryColor primaryBgLight08 font-bold"
                                : "brandColor hover:bg-black/5 font-medium"
                              }
                            `}
                            tooltip={sidebarState === "collapsed" ? item.title : undefined}
                          >
                            {/* Icon */}
                            <span
                              className={`flex-shrink-0 w-5 h-5 transition-colors ${isActive ? "primaryColor" : "brandText"
                                }`}
                            >
                              <IconComponent size={20} aria-hidden="true" />
                            </span>

                            {/* Text - Hidden when collapsed */}
                            {(!sidebarState === "collapsed" || isMobile) && (
                              <>
                                <span className="flex-1 truncate text-left">
                                  {item.title}
                                </span>
                                <BiChevronRight
                                  size={16}
                                  className={`transition-transform duration-200 ${item.isSubmenuOpen ? 'rotate-90' : ''}`}
                                />
                              </>
                            )}
                          </SidebarMenuButton>

                          {/* Submenu */}
                          {item.isSubmenuOpen && item.submenuItems && (
                            <SidebarMenuSub>
                              {item.submenuItems.map((subItem, subIndex) => (
                                <SidebarMenuSubItem key={subIndex}>
                                  <SidebarMenuSubButton
                                    onClick={(e) => {
                                      // e.preventDefault();
                                      handleNavigation(fullUrl, subItem);
                                      if (subItem.onClick) {
                                        subItem.onClick();
                                      }
                                    }}
                                    isActive={subItem.isActive}
                                    className={`
                                      ${subItem.isActive
                                        ? "primaryColor primaryBgLight08 font-medium"
                                        : "text-gray-600 hover:bg-gray-100"
                                      }
                                    `}
                                  >
                                    {subItem.title}
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          )}
                        </SidebarMenuItem>
                      );
                    }


                    // Regular menu items
                    return (
                      <SidebarMenuItem key={`${sectionIndex}-${itemIndex}`}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className={`
                            ${isActive
                              ? "primaryColor primaryBgLight08 font-bold"
                              : "brandColor hover:bg-black/5 font-medium"
                            }
                          `}
                          tooltip={sidebarState === "collapsed" ? item.title : undefined}
                        >
                          <button
                            onClick={(e) => {
                              handleNavigation(fullUrl, item)
                              if (item.onClick) {
                                e.preventDefault();
                                item.onClick();
                              }
                              if (sidebarIsMobile) {
                                toggleSidebar();
                              }
                            }}
                          >
                            <IconComponent size={sidebarState === "collapsed" ? 24 : 20} aria-hidden="true" />
                            {sidebarState === "expanded" &&
                              <span>{item.title}</span>
                            }
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}

          {/* Mobile-only Settings Section */}
          <SidebarGroup className="block md:hidden">
            <SidebarGroupLabel className="text-sm font-semibold leadColor uppercase px-3 py-2 text-start w-full">
              {t("settings")}
            </SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu>
                {/* Language Selection */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={(e) => {
                      e.preventDefault();
                      setIsLanguageSubmenuOpen(!isLanguageSubmenuOpen);
                    }}
                    isActive={isLanguageSubmenuOpen}
                    className={`
                      ${isLanguageSubmenuOpen
                        ? "primaryColor primaryBgLight08 font-bold"
                        : "brandColor hover:bg-black/5 font-medium"
                      }
                    `}
                    tooltip={sidebarState === "collapsed" ? t("language") : undefined}
                  >
                    <FaGlobe size={sidebarState === "collapsed" ? 24 : 20} aria-hidden="true" />
                    <span>{t("language")}</span>
                    <BiChevronRight
                      size={sidebarState === "collapsed" ? 18 : 16}
                      className={`transition-transform duration-200 ${isLanguageSubmenuOpen ? 'rotate-90' : ''}`}
                    />
                  </SidebarMenuButton>

                  {/* Language Submenu */}
                  {isLanguageSubmenuOpen && (
                    <SidebarMenuSub>
                      {languages?.map((lang, langIndex) => (
                        <SidebarMenuSubItem key={langIndex}>
                          <SidebarMenuSubButton
                            onClick={(e) => {
                              e.preventDefault();
                              handleLanguageChange(lang.code);
                            }}
                            isActive={lang.code === currentLang}
                            className={`
                              ${lang.code === currentLang
                                ? "primaryColor primaryBgLight08 font-medium"
                                : "text-gray-600 hover:bg-gray-100"
                              }
                            `}
                          >
                            {lang.name}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>

                {/* Logout Button */}
                {/* <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={(e) => {
                      e.preventDefault();
                      handleLogout();
                      if (sidebarIsMobile) {
                        toggleSidebar();
                      }
                    }}
                    className="brandColor hover:bg-red-50 hover:text-red-600 font-medium"
                    tooltip={sidebarState === "collapsed" ? t("logout") : undefined}
                  >
                    <FaSignOutAlt size={sidebarState === "collapsed" ? 24 : 20} aria-hidden="true" className="text-red-500" />
                    <span>{t("logout")}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem> */}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </TooltipProvider>
      </SidebarContent>
    </>
  );
};

export default AgentSidebar;
