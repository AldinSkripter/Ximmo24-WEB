import Link from "next/link";
import { useRouter } from "next/router";
import { HiMiniSlash } from "react-icons/hi2";
import { useTranslation } from "../context/TranslationContext";
import { LuHeart, LuShare2 } from "react-icons/lu";

const NewBreadcrumb = ({
  items = [],
  title,
  subtitle = "",
  layout = "default",
  showLike = false,
  setIsShareModalOpen = () => { },
  handleInterested = () => { },
  handleNotInterested = () => { },
  interested = false,
}) => {
  const router = useRouter();
  const { lang } = router?.query;
  const t = useTranslation();
  const isActive = (item) => {
    const currentPath = router?.asPath;
    const itemPath = item.href.toString();
    return currentPath.includes(itemPath);
  };

  return (
    <div
      className={`flex w-full items-center justify-center bg-[#F5F5F4] ${layout === "default" ? "min-h-[98px]" : ""}`}
    >
      {/* Title Section */}
      {layout === "default" ? (
        <div className="container mx-auto px-4 md:px-6 xl:px-0 min-w-0">
          <div className="flex flex-col items-start justify-center md:flex-row md:items-center md:justify-between py-8 gap-2 min-w-0 w-full">
            <div className={title ? "flex flex-col items-start gap-2 min-w-0 flex-1 max-w-full" : ""}>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl sm:font-bold md:text-3xl truncate w-full" title={title}>
                {title}
              </h1>
              {subtitle && (
                <p className="leadColor text-sm font-medium md:text-base truncate w-full" title={subtitle}>
                  {subtitle}
                </p>
              )}
            </div>
            {/* Breadcrumb Navigation */}
            <nav className="min-w-0 max-w-full">
              <ul className="flex flex-wrap justify-start lg:justify-center text-xs sm:text-sm min-w-0 max-w-full">
                <li className="flex items-center flex-shrink-0">
                  <Link
                    href={`/?lang=${lang || "en"}`}
                    className="brandColor text-base font-medium transition-all duration-300 hover:opacity-80 text-nowrap"
                  >
                    {t("home")}
                  </Link>
                </li>
                {items.map((item, index) => (
                  <li key={index} className={`flex items-center ${index === items.length - 1 ? "min-w-0 flex-1 max-w-full" : "flex-shrink-0"}`}>
                    <HiMiniSlash className="mx-1 h-4 w-4 text-base font-medium flex-shrink-0" />
                    {index === items.length - 1 ? (
                      <span
                        title={item.label}
                        className={`text-base brandColor truncate block min-w-0 max-w-full ${isActive(item) ? "!primaryColor !font-bold" : ""}`}
                      >
                        {item.label}
                      </span>
                    ) : (
                      <Link
                        href={`${item.href}/?lang=${lang || "en"}`}
                        className="brandColor text-base font-medium transition-all duration-300 hover:opacity-80 text-nowrap flex-shrink-0"
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      ) : (
        <div className="container pb-6 pt-10 md:pt-12 min-w-0">
          <div className="flex items-center justify-between gap-3 sm:items-center min-w-0 w-full">
            {/* Breadcrumb Navigation */}
            <nav className="order-1 min-w-0 flex-1 max-w-full">
              <ul className="md:ml-2 flex items-center min-w-0 max-w-full">
                <li className="flex items-center flex-shrink-0">
                  <Link
                    href={`/?lang=${lang || "en"}`}
                    className="brandColor text-nowrap text-base transition-all duration-300 hover:opacity-80"
                  >
                    {t("home")}
                  </Link>
                </li>
                {items.map((item, index) => (
                  <li key={index} className={`flex items-center ${index === items.length - 1 ? "min-w-0 flex-1 max-w-full" : "flex-shrink-0"}`}>
                    <HiMiniSlash className="mx-1 h-4 w-4 flex-shrink-0" />
                    {index === items.length - 1 ? (
                      <span
                        title={item.label}
                        className={`font-medium text-base truncate block min-w-0 max-w-full ${isActive(item) ? "primaryColor !font-bold " : "brandColor"}`}
                      >
                        {item.label}
                      </span>
                    ) : item.disable ? (
                      <span className="brandColor text-nowrap text-base flex-shrink-0">
                        {item.label}
                      </span>
                    ) : (
                      <Link
                        href={`${item.href}/?lang=${lang || "en"}`}
                        className="brandColor transition-all duration-300 hover:opacity-80 text-nowrap flex-shrink-0"
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            <div className="order-2 flex items-center gap-3 flex-shrink-0">
              {showLike && (
                <div className="leadColor flex items-center gap-2 text-sm font-medium sm:text-base">
                  <div
                    className={`cardBorder hover:primaryBorderColor hover:primaryColor flex h-8 w-8 items-center justify-center rounded-lg border bg-white transition-all duration-300 hover:cursor-pointer ${interested ? "primaryBg primaryColor" : ""}`}
                    onClick={
                      interested ? handleNotInterested : handleInterested
                    }
                  >
                    <LuHeart
                      className={`${interested ? "h-5 w-5 fill-white" : ""} `}
                    />
                  </div>
                  <span className="hidden sm:block">{t("save")}</span>
                </div>
              )}
              {/* Share Button */}
              <div className="leadColor flex items-center gap-2 text-sm font-medium sm:text-base">
                <div
                  className="cardBorder hover:primaryBorderColor hover:primaryColor flex h-8 w-8 items-center justify-center rounded-lg border bg-white transition-all duration-300 hover:cursor-pointer"
                  onClick={() => setIsShareModalOpen(true)}
                >
                  <LuShare2 className="" />
                </div>
                <span className="hidden sm:block">{t("share")}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewBreadcrumb;
