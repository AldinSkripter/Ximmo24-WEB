import React, { useState, useEffect } from "react";
import ImageWithPlaceholder from "../image-with-placeholder/ImageWithPlaceholder";
import Ximmo24Brand from "@/components/brand/Ximmo24Brand";
import {
  MdClose,
  MdKeyboardArrowRight,
  MdOutlineVerifiedUser
} from "react-icons/md";
import { GiHamburgerMenu } from "react-icons/gi";
import { BiMapPin } from "react-icons/bi";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useSelector, useDispatch } from "react-redux";
import { setLockedFilter } from "@/redux/slices/propertyListSlice";
import { useRouter } from "next/router";
import { isRTL, showLoginSwal } from "@/utils/helperFunction";
import { useTranslation } from "../context/TranslationContext";
import LocationSearchWithRadius from "../location-search/LocationSearchWithRadius";
import { setLocationAction } from "@/redux/slices/locationSlice";
import toast from "react-hot-toast";

const MobileMenu = ({
  isMenuOpen,
  toggleMenu,
  menus,
  languages,
  isScrolled,
  handleLanguageChange,
  handleShowLogin,
  handleLogout,
  handleShowAreaConverter,
  darkHeader = false,
}) => {
  const t = useTranslation();
  const isRtl = isRTL();
  const router = useRouter();
  const dispatch = useDispatch();
  const [openSubMenu, setOpenSubMenu] = useState("");
  const [activeMenu, setActiveMenu] = useState(""); // Track the active menu
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);

  const defaultLang = useSelector(
    (state) => state.LanguageSettings?.default_language,
  );
  const activeLang = useSelector((state) => state.LanguageSettings?.active_language);
  const currentLang = activeLang || defaultLang;

  const userData = useSelector((state) => state.User?.data);

  const isAgent = userData?.is_agent;
  const isAgentVerificationNotApplied = userData?.become_agent_status === "not_applied";
  const isBecomeAgentRoute = router.asPath?.split("?")?.[0]?.startsWith("/become-agent");
  const isApprovedAgent = userData?.become_agent_status === "approved" && userData?.is_agent === true;
  const isAgentOwnListingDetailsPage =
    router?.pathname?.startsWith("/agent/my-property") ||
    router?.pathname?.startsWith("/agent/my-project");
  const logoHref = isApprovedAgent && isAgentOwnListingDetailsPage ? "/agent/dashboard" : "/";

  const handleLogoClick = () => {
    handleNavigation(logoHref);
    toggleMenu();
  };

  const userSelectedLocation = useSelector((state) => state.location);
  const webSettings = useSelector((state) => state.WebSetting?.data);

  // Location state management
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
      : [],
  );

  // Update location when Redux state changes
  useEffect(() => {
    if (isUserLocationSet) {
      setLocation([
        userSelectedLocation?.city,
        userSelectedLocation?.state,
        userSelectedLocation?.country,
      ]);
    }
  }, [userSelectedLocation]);

  const toggleSubMenu = (menuName) => {
    setOpenSubMenu((prev) => (prev === menuName ? "" : menuName));
  };

  const handleMenuClick = (menuName, path = "") => {
    setActiveMenu(menuName);
    handleNavigation(`${path}`);
    toggleMenu(); // Optionally close the menu on selection
  };

  const handleNavigation = (path) => {
    dispatch(setLockedFilter(null));
    router.push({
      pathname: path,
      query: { lang: router.query.lang || currentLang },
    });
  };

  const handleBecomeAgentClick = () => {
    if (userData) {
      handleNavigation(`/become-agent`);
    } else {
      showLoginSwal("oops", "plzLoginFirstToBecomeAgent", () => {
        handleShowLogin();
      }, t);
    }
    toggleMenu();
  };

  // Handle location selection
  const handleLocationClick = () => {
    setIsLocationDialogOpen(true);
    toggleMenu(); // Close mobile menu when opening location dialog
  };

  const handlePlaceSelected = (place) => {
    if (place && place.formatted_address) {
      const address = place.formatted_address;
      const latitude = place.geometry?.location?.lat();
      const longitude = place.geometry?.location?.lng();

      setLocation(address); // Update local state
      dispatch(
        setLocationAction({ formatted_address: address, latitude, longitude }),
      ); // Update Redux
      setIsLocationDialogOpen(false); // Close dialog
      toast.success(t("locationUpdated"));
    } else {
      console.error("Invalid place selected:", place);
      toast.error(t("invalidLocationSelected"));
    }
  };

  return (
    <>
      <Sheet open={isMenuOpen} onOpenChange={toggleMenu}>
        <SheetTrigger asChild>
          <button
            className={`xl:hidden flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${darkHeader ? "border-white/25 bg-white/10 text-white" : "border-gray-200 bg-white text-slate-900"}`}
            aria-label="MobileMenuToggler"
          >
            <GiHamburgerMenu
              size={25}
              className="text-current"
            />
          </button>
        </SheetTrigger>
        <SheetContent
          className="flex h-full flex-col justify-between overflow-y-auto border-l border-white/25 bg-[rgba(15,23,42,0.82)] p-0 text-white shadow-[-24px_0_70px_rgba(2,8,23,0.30)] backdrop-blur-[24px] backdrop-saturate-150 [&>button]:hidden"
          aria-describedby={"mobile-menu"}
          side={isRtl ? "left" : "right"}
        >
          <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
          <SheetDescription className="sr-only"></SheetDescription>
          <div>
            <div className="flex items-center justify-between border-b border-white/10 p-3 md:p-4">
              <div
                className="h-full max-w-[160px] w-full flex items-center cursor-pointer"
                onClick={handleLogoClick}
              >
                {webSettings?.web_logo ? (
                  <ImageWithPlaceholder
                    src={webSettings.web_logo}
                    alt="Ximmo24"
                    width={176}
                    height={56}
                    sizes="160px"
                    quality={95}
                    loading="eager"
                    className="h-auto w-full object-contain"
                  />
                ) : (
                  <Ximmo24Brand className="scale-90 origin-left" />
                )}
              </div>
              <MdClose
                size={30}
                className="cursor-pointer primaryBackgroundBg leadColor font-bold rounded-xl p-2 h-9 w-9 sm:h-11 sm:w-11"
                onClick={toggleMenu}
              />
            </div>
            <ul className="flex flex-col ">

              {/* Location Selection */}
              <li
                className="m-2 cursor-pointer rounded-xl border border-white/10 bg-white/[0.06] p-4 font-medium text-white transition-all hover:bg-white/[0.13]"
                onClick={handleLocationClick}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-white/10 p-2">
                    <BiMapPin size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1 text-white/80">
                      <span className="text-sm font-medium">{t("location")}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-white/65">
                      {location && location?.length > 0
                        ? location?.join(", ")
                        : t("selectLocation")}
                    </div>
                  </div>
                  <div>
                    <MdKeyboardArrowRight size={18} className="brandColor rtl:rotate-180" />
                  </div>
                </div>
              </li>

              <li
                className={`mx-2 cursor-pointer rounded-xl px-4 py-3 font-medium text-white transition-all ${activeMenu === "home" ? "bg-white/[0.14] ring-1 ring-inset ring-white/15" : ""} hover:bg-white/[0.10]`}
                onClick={() => handleMenuClick("home", `/`)}
              >
                {t("home")}
              </li>


              {menus.map((menu) => (
                <React.Fragment key={menu.name}>
                  <li
                    className={`mx-2 cursor-pointer rounded-xl px-4 py-3 font-medium text-white transition-all ${activeMenu === menu.name ? "bg-white/[0.14] ring-1 ring-inset ring-white/15" : ""} hover:bg-white/[0.10]`}
                    onClick={() => toggleSubMenu(menu.name)}
                  >
                    <div className="flex items-center justify-between">
                      {t(menu.name)}
                      <MdKeyboardArrowRight size={18}
                        className={`transition-transform duration-300 ltr:rotate-0 rtl:-rotate-180 ${openSubMenu === menu.name ? "!-rotate-90 primaryColor" : ""
                          }`}
                      />
                    </div>
                  </li>
                  <ul
                    className={`overflow-hidden transition-all duration-300 ${openSubMenu === menu.name
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                      }`}
                  >
                    {menu.links.map((link) => (
                      <li
                        key={link.name}
                        className={`mx-4 flex cursor-pointer items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium text-white/85 transition-all ${activeMenu === link.name ? "bg-white/[0.14] text-white" : ""} hover:bg-white/[0.10] hover:text-white`}
                        onClick={() => {
                          if (link.name === "areaConverter") {
                            handleShowAreaConverter();
                          } else {
                            handleMenuClick(link.name, link.route);
                          }
                        }}
                      >
                        {t(link.name)}
                        <MdKeyboardArrowRight size={18} className="brandColor rtl:rotate-180" />
                      </li>
                    ))}
                  </ul>
                </React.Fragment>
              ))}
              <li
                className={`font-medium`}
              >
                <div
                  className="mx-2 flex cursor-pointer items-center justify-between rounded-xl px-4 py-3 font-medium text-white transition-all hover:bg-white/[0.10]"
                  onClick={() => toggleSubMenu("language")}
                >
                  {t("language")}:{" "}
                  {languages &&
                    languages.find((lang) => lang.code === currentLang)?.name}
                  <MdKeyboardArrowRight size={18}
                    className={`transition-transform duration-300 ltr:rotate-0 rtl:-rotate-180 ${openSubMenu === "language" ? "!-rotate-90" : ""
                      }`}
                  />
                </div>
                <ul
                  className={`overflow-hidden transition-all duration-300 ${openSubMenu === "language"
                    ? "max-h-96 opacity-100"
                    : "max-h-0 opacity-0"
                    }`}
                >
                  {languages &&
                    languages.map((lang) => (
                      <li
                        key={lang.code}
                        className={`mx-4 flex cursor-pointer items-center justify-between rounded-xl px-4 py-2.5 text-sm text-white/85 transition-all ${currentLang === lang.code ? "bg-white/[0.14] font-semibold text-white ring-1 ring-inset ring-white/15" : ""} hover:bg-white/[0.10] hover:text-white`}
                        onClick={() => {
                          handleLanguageChange(lang.code);
                          toggleSubMenu("language");
                        }}
                      >
                        {lang.name}
                        <MdKeyboardArrowRight size={18} className="brandColor rtl:rotate-180" />
                      </li>
                    ))}
                </ul>
              </li>
              {userData && !isAgent && isAgentVerificationNotApplied && !isBecomeAgentRoute && (
                <button
                  className="m-2 flex px-4 py-2 border brandBorder rounded-lg justify-center hover:brandBg hover:text-white items-center gap-2 font-medium text-base brandColor max-h-14"
                  onClick={handleBecomeAgentClick}
                >
                  <MdOutlineVerifiedUser className="w-5 h-5" />
                  <span>{t("becomeAgent")}</span>
                </button>
              )}
            </ul>
          </div>
        </SheetContent>
      </Sheet>

      {/* Location Search Dialog */}
      <LocationSearchWithRadius
        isOpen={isLocationDialogOpen}
        onClose={() => setIsLocationDialogOpen(false)}
        onPlaceSelected={handlePlaceSelected}
      />
    </>
  );
};

export default MobileMenu;
