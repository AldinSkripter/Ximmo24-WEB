import ApiImage from "@/components/image-with-placeholder/ApiImage";
import { useTranslation } from "../context/TranslationContext";
import ImageWithPlaceholder from "../image-with-placeholder/ImageWithPlaceholder";
import premiumIcon from "@/assets/premium.svg";
import { featuredIcon } from "@/assets/svg";
import { capitalizeFirstLetter } from "@/utils/helperFunction";
import { ReactSVG } from "react-svg";

const ProjectInfoBanner = ({ projectDetails }) => {
  const t = useTranslation();

  if (!projectDetails) return null;

  const getProjectTypeLabel = (type) => {
    switch (type) {
      case "upcoming":
        return t("upcoming");
      case "under_construction":
        return t("underConstruction");
      default:
        return type;
    }
  };

  const projectTitle = capitalizeFirstLetter(projectDetails?.translated_title || projectDetails?.title);
  const locationText = projectDetails?.location ? projectDetails?.location :
    [
      projectDetails.city,
      projectDetails.state,
      projectDetails.country,
    ]
      .filter(Boolean)
      .join(", ");

  return (
    <div className="brandBg relative mb-4 overflow-hidden rounded-2xl text-white md:mb-7">
      {/* <div className="absolute inset-0 bg-black/20"></div> */}
      <div className="relative flex min-h-[180px] flex-col gap-4 justify-between p-4 md:p-6">
        {/* Top Section */}
        <span className="block md:hidden text-sm text-white font-medium">
          {t("projectId")} : {projectDetails?.id}
        </span>
        <div className="flex items-start justify-between gap-3">

          {/* Category Badge */}
          {projectDetails.category && (
            <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-1 flex-shrink-0">
              {projectDetails.category?.image && (
                <div className="h-4 w-4 flex-shrink-0">
                  <ApiImage
                    src={projectDetails.category.image}
                    beforeInjection={(svg) => {
                      svg.setAttribute(
                        "style",
                        `height: 100%; width: 100%;`,
                      );
                      svg.querySelectorAll("path").forEach((path) => {
                        path.setAttribute(
                          "style",
                          `fill: var(--facilities-icon-color);`,
                        );
                      });
                    }}
                    className="h-full w-full object-contain"
                    alt={projectDetails.category.translated_name || projectDetails.category.name || 'category icon'}
                  />
                </div>
              )}
              <span className="leadColor text-xs font-bold md:text-base">
                {projectDetails.category?.translated_name || projectDetails.category?.category}
              </span>
            </div>
          )}

          {/* Project Type Badge */}
          {projectDetails.type && (
            <div
              className={`primaryBg primaryTextColor rounded-lg px-3 py-1 text-xs font-bold md:text-base flex-shrink-0`}
            >
              {getProjectTypeLabel(projectDetails.type)}
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <div className="flex items-end justify-between gap-4 min-w-0 w-full">
          {/* Left - Project Info */}
          <div className="flex flex-col gap-2 min-w-0 flex-1 max-w-full">
            {/* Project Title */}
            <h1 className="text-lg font-bold text-white md:text-xl truncate w-full" title={projectTitle}>
              {projectTitle}
              {/* {t("in")}
              {projectDetails?.category?.category} */}
            </h1>

            {/* Location */}
            <div className="flex items-center gap-2 min-w-0 w-full">
              <span className="text-sm text-white/60 md:text-sm truncate block min-w-0 w-full" title={locationText}>
                {locationText}
              </span>
            </div>
          </div>

          {/* Right - Premium Badge */}
          <div className="flex justify-center items-center gap-2 sm:gap-4 flex-shrink-0">
            <span className="hidden md:block text-sm text-white font-medium">{t("projectId")} : {projectDetails?.id}</span>

            {projectDetails?.is_premium ?
              <div className="premiumBgColor brandColor flex items-center gap-1 rounded-full p-1.5 sm:px-3 sm:py-2 text-xs font-medium md:text-sm flex-shrink-0">
                <ImageWithPlaceholder
                  src={premiumIcon}
                  alt={"Premium Icon"}
                  className="h-5 w-5 shrink-0"
                />
                <span className="hidden sm:block">{t("premium")}</span>
              </div> : null}

            {projectDetails?.is_promoted && (
              <span className="flex items-center gap-1 rounded-full primaryBg bg-opacity-75 p-1.5 md:px-3 md:py-2 text-sm font-medium text-white flex-shrink-0">
                <div className="h-5 w-5">{featuredIcon()}</div>
                <span className="hidden sm:block">{t("featured")}</span>
              </span>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectInfoBanner;
