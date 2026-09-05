import ApiImage from "@/components/image-with-placeholder/ApiImage";
import { useState, useEffect, useRef } from "react";
import ImageWithPlaceholder from "../image-with-placeholder/ImageWithPlaceholder";
import { useTranslation } from "../context/TranslationContext";
import { useRouter } from "next/router";
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
} from "@/components/ui/carousel";
import { useDispatch, useSelector } from "react-redux";
import { PackageTypes } from "@/utils/checkPackages/packageTypes";
import { handlePackageCheck, isRTL } from "@/utils/helperFunction";
import { ReactSVG } from "react-svg";
import Swal from "sweetalert2";
import { setRole } from "@/redux/slices/authSlice";
import { featuredIcon, premiumIcon } from "@/assets/svg";
import { FiArrowUpRight } from "react-icons/fi";
import { IoLocationOutline } from "react-icons/io5";

// ProjectCardWithSwiper component definition
// Displays a project inside a white bordered card with an image carousel,
// category, title and location. Premium/featured status is shown as icons
// on the top-right of the image (no favourite button for projects).
const ProjectCardWithSwiper = ({ data }) => {
  const t = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch();
  const { lang } = router.query;
  const isRtl = isRTL();

  const userData = useSelector((state) => state?.User?.data);

  // State for the carousel API and current slide
  const [api, setApi] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const autoplayRef = useRef(null);
  const isUserProject = !!userData?.id && data?.added_by == userData?.id;

  // Extract images for the carousel: primary image and up to 4 gallery images
  const galleryImages = data?.gallary_images
    ? data?.gallary_images.map((image) => image.name)
    : [];
  const images = [data.image, ...galleryImages]?.slice(0, 5);

  // Effect to set up drag detection on the carousel
  useEffect(() => {
    if (!api) {
      return;
    }

    const handleDragStart = () => {
      setIsDragging(true);
    };

    const handleDragEnd = () => {
      setTimeout(() => {
        setIsDragging(false);
      }, 100); // Small delay to prevent immediate click after drag
    };

    api.on("pointerDown", handleDragStart);
    api.on("pointerUp", handleDragEnd);

    return () => {
      api.off("pointerDown", handleDragStart);
      api.off("pointerUp", handleDragEnd);
    };
  }, [api, images]);

  // Autoplay the carousel while the card is hovered
  useEffect(() => {
    if (!api || images?.length <= 1) return;

    if (isHovered) {
      autoplayRef.current = setInterval(() => {
        if (api.canScrollNext()) {
          api.scrollNext();
        } else {
          api.scrollTo(0);
        }
      }, 1500);
    } else {
      clearInterval(autoplayRef.current);
      api.scrollTo(0);
    }

    return () => clearInterval(autoplayRef.current);
  }, [isHovered, api]);

  const showAgentSwitchSwal = async () => {
    return Swal.fire({
      title: t("agentSwitchSwalTitle"),
      text: t("agentSwitchSwalText"),
      icon: "warning",
      showCancelButton: true,
      customClass: {
        confirmButton: "Swal-confirm-buttons",
        cancelButton: "Swal-cancel-buttons",
      },
      confirmButtonText: t("yes_switch"),
      cancelButtonText: t("no"),
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(setRole({ data: "agent" }));
        router?.push(`/agent/projects?lang=${lang}`);
        return true;
      } else {
        return false;
      }
    });
  };

  // Handler for card click, navigates to project details page
  const handleCardClick = async (e) => {
    // 1. Owner checks first — before any premium gate
    if (!isDragging && isUserProject && data.role_context === "agent") {
      // User is viewing their own agent-listed project — prompt to switch role
      await showAgentSwitchSwal();
    } else if (!isDragging && isUserProject) {
      // User owns this project — take them to their listing directly
      router?.push(`/my-project/${data.slug_id}?lang=${router.query?.lang}`);
    } else if (!isDragging && data.is_premium) {
      // Non-owner visiting a premium project — run package check
      handlePackageCheck(
        e,
        PackageTypes.PREMIUM_PROJECTS,
        router,
        data?.slug_id,
        data,
        false,
        false,
        t,
        true
      );
    } else if (!isDragging) {
      router?.push(`/project-details/${data.slug_id}?lang=${router.query?.lang}`);
    }
  };

  // Handler for keydown events on the card for accessibility
  const handleCardKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      handleCardClick();
    }
  };

  // Prevent event propagation to parent carousel
  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  const renderCarousel = () => {
    if (images?.length > 1) {
      return (
        <div
          className="w-full"
          onPointerDown={stopPropagation}
          onMouseDown={stopPropagation}
          onTouchStart={stopPropagation}
          onTouchMove={stopPropagation}
          onTouchEnd={stopPropagation}
        >
          <Carousel
            setApi={setApi}
            className="w-full [&>div]:!py-0"
            opts={{
              watchDrag: (enabled, event) => {
                // This ensures the parent carousel doesn't react to this carousel's drag events
                event?.stopPropagation();
                return enabled;
              },
              direction: isRTL() ? "rtl" : "ltr",
            }}
          >
            <CarouselContent>
              {images?.map((image, index) => (
                <CarouselItem key={index} className="!pl-2">
                  <ImageWithPlaceholder
                    src={image}
                    width={355}
                    height={270}
                    alt={`Image ${index + 1}`}
                    className="aspect-[355/270] w-full h-full rounded-2xl object-cover"
                    loading="lazy"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            {/* Pagination Dots */}
            <div
              className="absolute bottom-2 left-1/2 z-30 flex h-4 -translate-x-1/2 items-center justify-center space-x-2"
              onClick={stopPropagation}
            >
              <CarouselDots className="[&>button]:!w-2 [&>button]:after:brandBg [&>button]:!h-2 z-30 !overflow-x-visible [&>button]:after:!ring-white" />
            </div>
          </Carousel>
        </div>
      );
    } else {
      return (
        <ImageWithPlaceholder
          src={images[0]}
          width={355}
          height={280}
          alt={data?.title}
          className="aspect-[355/280] w-full h-full rounded-2xl object-cover"
          loading="lazy"
        />
      );
    }
  };

  const title = data?.translated_title || data?.title;
  const location = [data?.city, data?.state, data?.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      className="group mx-auto flex w-full cursor-pointer flex-col gap-4 rounded-3xl border newBorderColor bg-white p-3 md:p-4 hover:cardHoverShadow transition-all duration-300 will-change-transform"
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
      role="button"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Image Carousel */}
      <div className="relative w-full overflow-hidden rounded-2xl">
        {renderCarousel()}

        {/* Project Type Badge + Premium / Featured icons — no favourite button for projects */}
        <div className="absolute left-3 right-3 top-3 md:left-2 md:right-2 md:top-2 xl:left-4 xl:right-4 xl:top-4 z-[5] flex items-center justify-between gap-2">
          <div className="primaryBg min-w-0 max-w-full truncate rounded-2xl p-1.5 text-xs lg:text-sm font-bold text-white md:p-2">
            {t(data?.type)}
          </div>

          {(data?.is_premium || data?.is_promoted) && (
            <div className="flex shrink-0 items-center gap-2">
              {data?.is_premium && premiumIcon()}
              {data?.is_promoted && (
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full brandBg bg-opacity-75"
                  aria-label={t("featured")}
                  title={t("featured")}
                >
                  <span className="h-4 w-4">{featuredIcon()}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex w-full flex-col gap-3">
        {/* Category */}
        <div className="flex items-center gap-2">
          <ApiImage
            src={data?.category?.image}
            beforeInjection={(svg) => {
              svg.setAttribute("style", `height: 100%; width: 100%;`);
              svg.querySelectorAll("path").forEach((path) => {
                path.setAttribute(
                  "style",
                  `fill: var(--primary-color);`,
                );
              });
            }}
            className="flex h-5 w-5 shrink-0 items-center justify-center object-contain"
            alt={
              data?.category?.translated_name ||
              data?.category?.name ||
              "category icon"
            }
          />
          <span className="line-clamp-1 text-sm font-bold brandColor">
            {data?.category?.translated_name || data?.category?.category}
          </span>
        </div>

        <div className="flex w-full items-end justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h3 className="primaryColor truncate text-lg md:text-xl font-bold">
              {title}
            </h3>
            <p className="leadColor flex items-center gap-1 truncate text-sm font-medium md:text-base">
              <IoLocationOutline className="h-3 md:h-5 w-3 md:w-5 shrink-0" />
              <span className="truncate">{location}</span>
            </p>
          </div>
          <button
            className="flex h-12 w-12 md:w-8 md:h-8 xl:h-12 xl:w-12 shrink-0 items-center justify-center rounded-full primaryBackgroundBg leadColor group-hover:text-white transition-all duration-300 group-hover:brandBg"
            aria-label={`View ${title}`}
            tabIndex={-1}
          >
            <FiArrowUpRight
              className={`shrink-0  ${isRtl ? "-rotate-90" : ""}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCardWithSwiper;
