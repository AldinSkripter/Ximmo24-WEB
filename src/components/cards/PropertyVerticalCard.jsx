import { useEffect, useState } from "react";
import ImageWithPlaceholder from "../image-with-placeholder/ImageWithPlaceholder";
import { useTranslation } from "../context/TranslationContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import CustomLink from "../context/CustomLink";
import { featuredIcon, premiumIcon } from "@/assets/svg";
import { formatPriceAbbreviated, getDisplayValueForOption, handlePackageCheck, isRTL } from "@/utils/helperFunction";
import toast from "react-hot-toast";
import { addFavouritePropertyApi } from "@/api/apiRoutes";
import { FaHeart } from "react-icons/fa";
import { FiHeart } from "react-icons/fi";
import Swal from "sweetalert2";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { useDispatch, useSelector } from "react-redux";
import { PackageTypes } from "@/utils/checkPackages/packageTypes";
import { useRouter } from "next/router";
import { ReactSVG } from "react-svg";
import { setRole } from "@/redux/slices/authSlice";
import { trackEvent } from "@/utils/analytics";

const PropertyVerticalCard = ({
  property,
  removeCard,
  handlePropertyLike = (propertyId, isLiked = false) => { },
}) => {
  const t = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch()
  const { lang } = router?.query;
  const isRtl = isRTL();

  const isUserLoggedIn = useAuthStatus();
  const userData = useSelector((state) => state.User?.data);
  const isUserProperty = property?.added_by == userData?.id;
  const validParameters = property?.parameters
    ?.filter((elem) => elem?.value !== "" && elem?.value !== "0")
    .slice(0, 3);

  const [isLiked, setIsLiked] = useState(Boolean(property?.is_favourite));
  const [isLoading, setIsLoading] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    if (!isUserLoggedIn) {
      Swal.fire({
        title: t("plzLogFirst"),
        icon: "warning",
        allowOutsideClick: true,
        showCancelButton: false,
        customClass: {
          confirmButton: "Swal-confirm-buttons",
          cancelButton: "Swal-cancel-buttons",
        },
        confirmButtonText: t("ok"),
      }).then((result) => {
        if (result.isConfirmed) {
          setShowLoginModal(true);
        }
      });
      return;
    }

    try {
      setIsLoading(true);
      setIsLiked(true);
      setIsDisliked(false);

      const res = await addFavouritePropertyApi({
        property_id: property?.id,
        type: "1",
      });

      if (res.error === false) {
        handlePropertyLike(property?.id, true);
        toast.success(t(res.message));
        trackEvent('add_to_wishlist', {
          item_id: property?.id,
          item_category: 'property',
        });
      } else {
        setIsLiked(false);
        toast.error(t(res.message));
      }
    } catch (error) {
      setIsLiked(false);
      console.error("Error adding to favorites:", error);
      toast.error(t(error?.message) || t("errorAddingToFavorites"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDislike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    try {
      setIsLoading(true);
      setIsLiked(false);
      setIsDisliked(true);

      const res = await addFavouritePropertyApi({
        property_id: property?.id,
        type: "0",
      });

      if (res.error === false) {
        handlePropertyLike(property?.id, true);
        toast.success(t(res.message));
        if (removeCard) {
          removeCard(property?.id);
        }
      } else {
        setIsLiked(true);
        setIsDisliked(false);
        toast.error(res.message);
      }
    } catch (error) {
      setIsLiked(true);
      setIsDisliked(false);
      console.error("Error removing from favorites:", error);
      toast.error(t(error?.message) || t("errorRemovingFromFavorites"));
    } finally {
      setIsLoading(false);
    }
  };

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
        router?.push(`/agent/properties?lang=${lang}`);
        return true;
      } else {
        return false;
      }
    })
  }

  useEffect(() => {
    setIsLiked(Boolean(property?.is_favourite));
    setIsDisliked(false);
  }, [property?.is_favourite]);

  const handlePropertyClick = async (e) => {
    // FIX: Prevent default link behavior AND stop the event from bubbling further.
    e.preventDefault();
    e.stopPropagation();

    // 1. Owner checks first — before any premium gate
    if (isUserProperty && property?.role_context === "agent") {
      // User is viewing their own agent-listed property — prompt to switch role
      await showAgentSwitchSwal();
    } else if (isUserProperty) {
      // User owns this property (user role) — take them to their listing directly
      router?.push(`/my-property/${property.slug_id}?lang=${lang}`);
    } else if (property?.is_premium) {
      // Non-owner visiting a premium property — run package check
      handlePackageCheck(e, PackageTypes.PREMIUM_PROPERTIES, router, property?.slug_id, property, false, false, t, true);
    } else {
      trackEvent('select_item', {
        item_id: property?.id,
        item_list_name: 'search_results',
      });
      router.push(`/property-details/${property.slug_id}?lang=${lang}`);
    }
  };

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="newBorderColor group flex flex-col overflow-hidden w-full md:max-w-full rounded-2xl border bg-white transition-all duration-300 hover:cursor-pointer hover:cardHoverShadow will-change-transform"
    // FIX: This is now the single source of truth for click events on the card.
    >
      {/* FIX: Removed onClick from this div to avoid multiple handlers */}
      <div className="relative" onClick={handlePropertyClick}>
        <CustomLink
          href={`${isUserProperty ? `/my-property/${property?.slug_id}` : `/property-details/${property?.slug_id}`}`}
          aria-label={property.title}
          // Make the link non-interactive to keyboard users to avoid confusion, as the parent div handles it.
          onClick={handlePropertyClick}
          tabIndex={-1}
        >
          <ImageWithPlaceholder
            src={property.title_image}
            alt={property.title}
            blurDataURL={property.low_quality_title_image}
            placeholder={property.low_quality_title_image ? "blur" : "empty"}
            width={357}
            height={197}
            className="rounded-t-2xl w-full h-full aspect-[357/197] object-cover"
            loading="lazy"
          />

          <div className="absolute inset-0 rounded-t-2xl bg-black opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-45"></div>
        </CustomLink>

        <div className="absolute left-3 right-3 top-3 flex items-start justify-between">
          {property.promoted && (
            <span className="flex items-center gap-1 rounded-[8px] bg-black bg-opacity-75 px-2 py-1 text-sm font-semibold text-white backdrop-blur-sm">
              <div className="h-4 w-4">{featuredIcon()}</div>
              {t("featured")}
            </span>
          )}
          {!property.promoted && <div></div>}

          <button
            onClick={isLiked ? handleDislike : handleLike}
            disabled={isLoading}
            aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
            className={`rounded-md bg-[#00000080] p-1.5 text-white backdrop-blur-sm transition-colors duration-200 hover:bg-[#00000090] ${isLoading ? "cursor-not-allowed opacity-50" : "hover:scale-110"}`}
          >
            {isLiked ? (
              <FaHeart className="text-lg text-white" />
            ) : (
              <FiHeart className="text-lg text-white" />
            )}
          </button>
        </div>

        <span className={`absolute bottom-3 flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-gray-800 shadow ${isRtl ? "right-3" : "left-3"}`}>
          <ReactSVG
            src={property?.category?.image}
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
            className="w-5 h-5 flex items-center justify-center object-contain shrink-0"
            alt={property?.category?.translated_name || property?.category?.name || 'category icon'}
          />
          <span className="line-clamp-1 text-sm font-bold leadColor max-w-[100px]">
            {property.category?.translated_name || property.category?.category || "N/A"}
          </span>
        </span>
      </div>

      <div className="flex flex-grow flex-col">
        <div className=" flex items-start justify-between p-2.5">
          <div className="mr-2 max-w-[calc(100%-6rem)] flex-1">
            <h3
              className="mb-0.5 truncate text-base font-bold text-gray-900"
              title={property?.translated_title || property?.title}
            >
              <CustomLink
                href={`${isUserProperty ? `/my-property/${property?.slug_id}` : `/property-details/${property?.slug_id}`}`}
                className="group-hover:primaryColor transition-colors"
                // Make the link non-interactive to avoid duplicate focus/click targets.
                onClick={handlePropertyClick}
                tabIndex={-1}
              >
                {/* FIX: Removed the inner onClick handler from the span */}
                <span className="truncate ">
                  {property?.translated_title || property?.title}
                </span>
              </CustomLink>
            </h3>
            <p className="truncate text-sm text-gray-500">
              {`${property.city || ""}${property.city && property.state ? ", " : ""}${property.state || ""}`}
            </p>
          </div>
          {property.property_type && (
            <span
              className={`mt-0.5 shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${property.property_type === "sell" ? "primarySellBg primarySellText" : "primaryRentBg primaryRentText"}`}
            >
              {t(property.property_type)}
            </span>
          )}
        </div>
        {validParameters && validParameters.length === 0 && (
          <div className="flex min-h-9 items-center justify-center"></div>
        )}
        {validParameters && validParameters.length > 0 && (
          <TooltipProvider delayDuration={100}>
            <div className="grid w-full grid-cols-3 divide-x divide-gray-200 border-b-2 border-t-2 border-gray-100 py-1.5 xl:py-2.5 text-xs text-gray-600">
              {validParameters.map((parameter, index) => (
                <Tooltip key={parameter.id || index}>
                  <TooltipTrigger asChild>
                    <div
                      className="flex cursor-default items-center justify-center gap-1 px-2"
                      aria-label={parameter?.translated_name || parameter?.name}
                    >
                      <ReactSVG
                        src={parameter.image}
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
                        className="w-4 h-4 flex items-center justify-center object-contain shrink-0"
                        alt={parameter.translated_name || parameter.name || 'parameter icon'}
                      />
                      <span className="truncate leadColor">
                        {getDisplayValueForOption(parameter)}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{parameter?.translated_name || parameter?.name}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        )}

        <div
          className={`mt-auto h-[60px] flex items-center justify-between px-2 py-1 md:py-1.5 xl:p-2 ${!property?.parameters?.length > 0 ? "border-t-2 border-gray-100" : ""}`}
        >
          <div className="flex flex-wrap items-center justify-center break-words gap-0.5">
            <span className="text-lg font-bold text-gray-900">
              {formatPriceAbbreviated(property.price)}
            </span>
            <span className="text-sm leading-none truncate font-normal">{property?.property_type === "rent" && property?.rentduration ? "/ " + t(property?.rentduration?.toLowerCase()) : ""}</span>
          </div>
          {property.is_premium ? (
            <span className="flex items-center gap-1 rounded-full premiumBgColor p-1 text-sm font-semibold capitalize">
              {premiumIcon()}
              {t("premium")}
            </span>
          ) : (
            <div className="h-9" />
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyVerticalCard;