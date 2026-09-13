import React, { useState } from "react";
import ImageWithPlaceholder from "../image-with-placeholder/ImageWithPlaceholder";
import Ximmo24Brand from "@/components/brand/Ximmo24Brand";
import {
  MdClose,
  MdKeyboardArrowRight,
  MdOutlineVerifiedUser
} from "react-icons/md";
import { GiHamburgerMenu } from "react-icons/gi";
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

  const webSettings = useSelector((state) => state.WebSetting?.data);

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
          className="flex h-[100dvh] flex-col justify-between overflow-y-auto overscroll-contain border-l border-white/30 bg-[rgba(15,23,42,0.36)] p-0 pb-[max(1rem,env(safe-area-inset-bottom))] text-white shadow-[-24px_0_70px_rgba(2,8,23,0.24)] backdrop-blur-[28px] backdrop-saturate-150 [&>button]:hidden"
          overlayClassName="bg-slate-950/30 backdrop-blur-[2px]"
          aria-describedby={"mobile-menu"}
          side={isRtl ? "left" : "right"}
        >
          <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
          <SheetDescription className="sr-only"></SheetDescription>
          <div>
            <div className="flex items-center justify-between border-b border-white/10 p-3 md:p-4">
              <div
                className="flex h-full min-w-0 max-w-[155px] cursor-pointer items-center"
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
                    className="h-auto w-full object-contain drop-shadow-[0_1px_4px_rgba(255,255,255,0.45)]"
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
                    className={`transition-all duration-300 ${openSubMenu === menu.name ? "max-h-[60dvh] overflow-y-auto overscroll-contain pb-2 opacity-100 [scrollbar-width:thin]" : "max-h-0 overflow-hidden opacity-0"}`}
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
                  className={`transition-all duration-300 ${openSubMenu === "language" ? "max-h-[50dvh] overflow-y-auto overscroll-contain pb-2 opacity-100 [scrollbar-width:thin]" : "max-h-0 overflow-hidden opacity-0"}`}
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

    </>
  );
};

export default MobileMenu;
