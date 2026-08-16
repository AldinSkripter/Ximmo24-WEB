import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import * as api from "@/api/apiRoutes";
import { checkPackageAvailable } from "@/utils/checkPackages/checkPackage";
import { PackageTypes } from "@/utils/checkPackages/packageTypes";
import OwnerDetailsCard from "../owner-details-card/OwnerDetailsCard";
import PropertyGallery from "./PropertyGallery";
import AboutProperty from "./AboutProperty";
import MortgageLoanCalculator from "./MortgageLoanCalculator";
import PropertyAddress from "./PropertyAddress";
import FeaturesAmenities from "./FeatureAmenities";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import { useTranslation } from "../context/TranslationContext";
import FileAttachments from "../project-details/FileAttachments";
import { setCacheChat } from "@/redux/slices/cacheSlice";
import toast from "react-hot-toast";
import ReportModal from "./ReportModal";
import LoginModal from "../modal/LoginModal";
import NewBreadcrumb from "../breadcrumb/NewBreadCrumb";
import PropertyInfoBanner from "./PropertyInfoBanner";
import ShareDialog from "../reusable-components/ShareDialog";
import { BiSolidErrorAlt } from "react-icons/bi";
import SimilarPropertySlider from "./SimilarPropertySlider";
import { PropertyDetailSkeleton } from "../skeletons/property-skeletons";
import { isSupported } from "firebase/messaging";
import { capitalizeFirstLetter, showLoginSwal } from "@/utils/helperFunction";
import LightBox from "./LightBox";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileBottomSheet from "../mobile-bottom-sheet/MobileBottomSheet";
import { AppointmentScheduleModal } from "../appointment-modal";
import NoDataFound from "../no-data-found/NoDataFound";
import { useQuery } from "@tanstack/react-query";
import ImageWithPlaceholder from "../image-with-placeholder/ImageWithPlaceholder";
import { trackEvent } from "@/utils/analytics";

const PropertyDetails = () => {
  const t = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch();
  const query = router.query;
  const { lang } = router.query;
  const [isMessagingSupported, setIsMessagingSupported] = useState(false);
  const [notificationPermissionGranted, setNotificationPermissionGranted] =
    useState(false);

  const currentUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/property-details/${query.slug}?share=true&lang=${lang}`;
  const slug = query?.slug;

  const isShare = query?.share === "true";
  const isMobile = useIsMobile();
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [similarProperties, setSimilarProperties] = useState([]);
  const [imageURL, setImageURL] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [isReportModal, setIsReportModal] = useState(false);
  const [interested, setInterested] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);
  const [isReported, setIsReported] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showReport, setShowReport] = useState(true);
  // Lightbox states
  const [viewerIsOpen, setViewerIsOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [chatData, setChatData] = useState({
    property_id: "",
    title: "",
    title_image: "",
    user_id: "",
    name: "",
    profile: "",
  });

  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(2);
  const [isPropertyFound, setIsPropertyFound] = useState(true);
  const trackedPropertyIdRef = useRef(null);

  const webSettings = useSelector((state) => state.WebSetting?.data);
  const userData = useSelector((state) => state.User?.data);
  const language = useSelector((state) => state.LanguageSettings?.active_language);
  const DistanceSymbol = webSettings?.distance_option;
  const [isPremiumUser, setIsPremiumUser] = useState(null);
  const isPremiumProperty = propertyDetails && propertyDetails?.is_premium;
  const PlaceHolderImg = webSettings?.web_placeholder_logo;
  const userCurrentId = userData?.id;

  const showExactLocation = webSettings?.show_exact_location === "1";
  const userCompleteData = [
    "name",
    "email",
    "mobile",
    "profile",
    "address",
  ].every((key) => userData?.[key]);

  // Function to open lightbox
  const openLightbox = (index) => {
    setCurrentImage(index);
    setViewerIsOpen(true);
  };

  const handleReportModal = () => {
    setIsReportModal(!isReportModal);
  };

  useEffect(() => {
    const checkMessagingSupport = async () => {
      try {
        const supported = await isSupported();
        setIsMessagingSupported(supported);

        if (supported) {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            setNotificationPermissionGranted(true);
          }
        }
      } catch (error) {
        console.error("Error checking messaging support:", error);
      }
    };

    checkMessagingSupport();
  }, [notificationPermissionGranted, isMessagingSupported]);

  useEffect(() => {
    if (query.slug && query.slug !== "") {
      getProperDetailsBySlug();
    }
  }, [query, language]);

  const getProperDetailsBySlug = async () => {
    try {
      setIsLoading(true); // Set loading to true when starting API call
      const response = await api.getPropertyDetails({ slug_id: query.slug });
      if (response?.data?.length === 0) {
        setIsLoading(false);
        setIsPropertyFound(false);
        return;
      }
      const property = response?.data?.[0];
      setIsReported(property?.is_reported);
      setPropertyDetails(property);
      setImageURL(property?.three_d_image);
      setSimilarProperties(response?.similar_properties);
      setInterested(property?.is_interested);
      setIsFavourite(Boolean(property?.is_favourite));

      if (property?.id && trackedPropertyIdRef.current !== property.id) {
        trackedPropertyIdRef.current = property.id;
        trackEvent('view_item', {
          item_id: property.id,
          item_category: 'property',
          item_variant: property?.property_type,
          price: property?.price,
          city: property?.city,
        });
      }
    } catch (error) {
      console.error("error", error);
    } finally {
      setIsLoading(false); // Always set loading to false when done
    }
  };

  // Property Address Details Section
  const details = [
    { label: t("address"), value: propertyDetails?.address },
    { label: t("country"), value: propertyDetails?.country },
    { label: t("city"), value: propertyDetails?.city },
    { label: t("zipCode"), value: propertyDetails?.zip_code },
    { label: t("state"), value: propertyDetails?.state },
  ];

  useEffect(() => {
    if (propertyDetails && propertyDetails?.three_d_image) {
      setImageURL(propertyDetails?.three_d_image); // Set Panorama Image
    }
  }, [propertyDetails]);

  useEffect(() => {
    if (imageURL) {
      const initializePanorama = () => {
        const panoramaElement = document.getElementById("panorama");
        if (panoramaElement) {
          pannellum.viewer("panorama", {
            type: "equirectangular",
            panorama: imageURL,
            autoLoad: true,
          });
        } else {
          console.error("Panorama element not found");
        }
      };

      setTimeout(initializePanorama, 3000); // Slight delay to ensure the element is rendered
    }
  }, [imageURL]);

  const handleShowMap = () => {
    if (isPremiumProperty) {
      if (!userCurrentId) {
        showLoginSwal("oops", "plzLoginFirstToViewMap", () => {
          setShowLoginModal(true);
        }, t);
        return;
      }
      if (isPremiumUser) {
        setShowMap(true);
      } else {
        Swal.fire({
          title: t("opps"),
          text: t("itsPrivatePrperty"),
          icon: "warning",
          allowOutsideClick: true,
          showCancelButton: false,
          customClass: {
            confirmButton: "Swal-confirm-buttons",
            cancelButton: "Swal-cancel-buttons",
          },
        }).then((result) => {
          if (result.isConfirmed) {
            router.push(`/subscription-plan?lang=${lang}`);
          }
        });
      }
    } else {
      setShowMap(true);
    }
  };

  const handleOpenGoogleMap = () => {

    if (isPremiumProperty) {
      if (!userCurrentId) {
        showLoginSwal("oops", "plzLoginFirstToViewMap", () => {
          setShowLoginModal(true);
        }, t);
        return;
      }
      if (isPremiumUser) {
        router.push(
          `https://www.google.com/maps?q=${propertyDetails?.latitude},${propertyDetails?.longitude}`,
        );
      } else {
        Swal.fire({
          title: t("opps"),
          text: t("itsPrivatePrperty"),
          icon: "warning",
          allowOutsideClick: true,
          showCancelButton: false,
          customClass: {
            confirmButton: "Swal-confirm-buttons",
            cancelButton: "Swal-cancel-buttons",
          },
        }).then((result) => {
          if (result.isConfirmed) {
            router.push(`/subscription-plan?lang=${lang}`);
          }
        });
      }
    } else {
      router.push(
        `https://www.google.com/maps?q=${propertyDetails?.latitude},${propertyDetails?.longitude}`,
      );
    }
  };

  const videoLink = propertyDetails && propertyDetails.video_link;

  const videoId = videoLink
    ? videoLink.includes("youtu.be")
      ? videoLink.split("/").pop().split("?")[0]
      : (videoLink.split("v=")[1]?.split("&")[0] ?? null)
    : null;

  const backgroundImageUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/sddefault.jpg`
    : PlaceHolderImg;

  const handleNotInterested = async (e) => {
    e.preventDefault();
    try {
      const res = await api.interestedPropertyApi({
        property_id: propertyDetails?.id,
        type: "0",
      });
      if (!res?.error) {
        setInterested(false);
        toast.success(t(res?.message));
      }
    } catch (error) {
      toast.error(t(error?.message));
      console.error("Error while toggling interested property:", error);
    }
  };

  const handleInterested = async (e) => {
    e.preventDefault();
    if (userCurrentId) {
      try {
        const res = await api.interestedPropertyApi({
          property_id: propertyDetails?.id,
          type: "1",
        });
        if (!res?.error) {
          setInterested(true);
          toast.success(t(res?.message));
          trackEvent(
            'generate_lead',
            { lead_source: 'interested', item_id: propertyDetails?.id },
            { clarity: true }
          );
        }
      } catch (error) {
        toast.error(t(error?.message));
        console.error("Error while toggling interested property:", error);
      }
    } else {
      Swal.fire({
        title: t("plzLogFirstIntrest"),
        icon: "warning",
        allowOutsideClick: false,
        showCancelButton: false,
        allowOutsideClick: true,
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
    }
  };

  const handleRemoveFavourite = async (e) => {
    e.preventDefault();
    if (!userCurrentId) return;

    try {
      const res = await api.addFavouritePropertyApi({
        property_id: propertyDetails?.id,
        type: "0",
      });
      if (!res?.error) {
        setIsFavourite(false);
        toast.success(t(res?.message));
      } else {
        toast.error(t(res?.message));
      }
    } catch (error) {
      toast.error(t(error?.message));
      console.error("Error while removing favourite property:", error);
    }
  };

  const handleAddFavourite = async (e) => {
    e.preventDefault();
    if (userCurrentId) {
      try {
        const res = await api.addFavouritePropertyApi({
          property_id: propertyDetails?.id,
          type: "1",
        });
        if (!res?.error) {
          setIsFavourite(true);
          toast.success(t(res?.message));
        } else {
          toast.error(t(res?.message));
        }
      } catch (error) {
        toast.error(t(error?.message));
        console.error("Error while adding favourite property:", error);
      }
    } else {
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
    }
  };

  const handleReportProperty = (e) => {
    e.preventDefault();
    if (userCurrentId) {
      setIsReportModal(true);
    } else {
      Swal.fire({
        title: t("plzLogFirsttoAccess"),
        icon: "warning",
        allowOutsideClick: false,
        showCancelButton: false,
        allowOutsideClick: true,
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
    }
  };

  const handleChat = (e) => {
    e.preventDefault();
    if (userCurrentId) {
      const searchParams = new URLSearchParams();
      searchParams.set("propertyId", propertyDetails?.id);
      searchParams.set("userId", propertyDetails?.added_by);
      const data = {
        property_id: propertyDetails?.id,
        user_id: propertyDetails?.added_by,
        title: propertyDetails?.title,
        title_image: propertyDetails?.title_image,
        name: propertyDetails?.customer_name,
        profile: propertyDetails?.profile,
        is_blocked_by_me: propertyDetails?.is_blocked_by_me,
        is_blocked_by_user: propertyDetails?.is_blocked_by_user,
        date: new Date().toISOString(),
      };
      dispatch(setCacheChat(data));
      router.push(`/user/chat?${searchParams.toString()}&lang=${lang}`);
    } else {
      Swal.fire({
        title: t("plzLogFirsttoAccess"),
        icon: "warning",
        allowOutsideClick: false,
        showCancelButton: false,
        allowOutsideClick: true,
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
      setShowChat(true);
    }
  };

  const handleCheckPremiumUserAgent = (e) => {
    e.preventDefault();
    router.push(
      `/agent-details/${propertyDetails?.customer_slug_id}?lang=${lang}`,
    );
  };

  const galleryPhotos = propertyDetails?.gallery;

  const checkPremiumProperty = () => {
    if (isPremiumProperty && isPremiumUser === false) {
      Swal.fire({
        title: t("oops"),
        text: t("premiumPropertiesLimitOrPackageNotAvailable"),
        icon: "warning",
        allowOutsideClick: false,
        showCancelButton: false,
        customClass: {
          confirmButton: "Swal-confirm-buttons",
          cancelButton: "Swal-cancel-buttons",
        },
      }).then((result) => {
        if (result.isConfirmed) {
          router.push(`/subscription-plan?lang=${lang}`);
        }
      });
    }
  };

  useEffect(() => {
    if (!isPremiumProperty) return; // only check for premium properties

    const runPremiumCheck = async () => {
      const hasAccess = await checkPackageAvailable(PackageTypes.PREMIUM_PROPERTIES);
      setIsPremiumUser(hasAccess);
    };

    runPremiumCheck();
  }, [isPremiumProperty]);

  useEffect(() => {
    // Only fire once the API has responded (isPremiumUser is no longer null)
    if (isPremiumProperty && isPremiumUser !== null) {
      checkPremiumProperty();
    }
  }, [isPremiumProperty, isPremiumUser]);


  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };
  const handleBookStepPrev = () => {
    if (currentStep >= 2) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBookingStep = (step) => {
    if (step === 1) {
      return;
    } else {
      setCurrentStep(step);
    }
  }

  // Function to fetch Ad Banners for Property Detail Page
  const fetchPropertyDetailAdBanners = async () => {
    try {
      const response = await api.getAdBannerApi({
        page: "property_detail",
        platform: "web",
      })
      return response?.data || [];
    } catch (error) {
      console.error("Error fetching ad banners in property detail:", error);
      return [];
    }
  }

  const detailsAdBanner = useQuery({
    queryKey: ['propertyDetailAdBanners'],
    queryFn: fetchPropertyDetailAdBanners,
    staleTime: 0,
  })


  const aboveBreadcrumbAdBanner = detailsAdBanner?.data?.find(banner => banner?.placement === 'above_breadcrumb');
  const belowMortgageAdBanner = detailsAdBanner?.data?.find(banner => banner?.placement === 'sidebar_below_mortgage_loan_calculator');
  const aboveSimilarPropertiesAdBanner = detailsAdBanner?.data?.find(banner => banner?.placement === 'above_footer');

  // Show skeleton while loading
  if (isLoading) {
    return <PropertyDetailSkeleton />;
  }

  if (!isLoading && !isPropertyFound) {
    return (<NoDataFound title={t("propertyNotFound")} description={t("propertyNotFoundDescription")} />);
  }

  return (
    <section className={`${isPremiumProperty && !isPremiumUser ? "blur-md" : ""}`}>
      <div className="primaryBackgroundBg">
        <div className="container mx-auto px-3 pb-8">
          {aboveBreadcrumbAdBanner && (
            <div className="pt-12"
              onClick={() => {
                if (aboveBreadcrumbAdBanner?.external_link_url) {
                  window.open(aboveBreadcrumbAdBanner?.external_link_url, '_blank');
                } else if (aboveBreadcrumbAdBanner?.property?.slug_id) {
                  router.push(`/property-details/${aboveBreadcrumbAdBanner?.property?.slug_id}/?lang=${lang}`);
                }
              }}
            >
              <ImageWithPlaceholder
                src={aboveBreadcrumbAdBanner?.image}
                alt="Ad Banner"
                width={1920}
                height={350}
                className={`w-full aspect-[1920/350] object-cover rounded-lg lg:rounded-2xl ${aboveBreadcrumbAdBanner?.external_link_url || aboveBreadcrumbAdBanner?.property?.slug_id ? 'cursor-pointer' : ''}`}
              />
            </div>
          )}
          {/* Main Content */}
          <NewBreadcrumb
            items={[
              {
                label: t("propertyDetails"),
                href: `/property-details/${propertyDetails?.slug_id}`,
                disable: true
              },
              {
                label: capitalizeFirstLetter(propertyDetails?.title),
                href: `/property-details/${propertyDetails?.slug_id}`,
              },
            ]}
            layout="reverse"
            showLike={true}
            setIsShareModalOpen={setIsShareModalOpen}
            handleInterested={handleAddFavourite}
            handleNotInterested={handleRemoveFavourite}
            interested={isFavourite}
          />
          <div className="grid grid-cols-12 items-center justify-center gap-3">
            <div className="col-span-12">
              {/* Property Gallery */}
              {galleryPhotos && (
                <PropertyGallery
                  galleryPhotos={galleryPhotos}
                  titleImage={propertyDetails?.title_image}
                  blurDataURL={propertyDetails?.low_quality_title_image}
                  PlaceholderImage={PlaceHolderImg}
                  onImageClick={openLightbox}
                  videoLink={propertyDetails?.video_link}
                  videoType={propertyDetails?.video_type}
                />
              )}
            </div>
          </div>

          {/* Property Info Banner */}
          {propertyDetails && <PropertyInfoBanner property={propertyDetails} />}
        </div>
      </div>
      <div className="bg-white">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-12 gap-3">
            {/* Property Gallery */}
            <div className="col-span-12 h-full w-full rounded-lg xl:col-span-9">
              {/* About Property */}
              {propertyDetails && propertyDetails?.description && (
                <AboutProperty description={propertyDetails?.translated_description || propertyDetails?.description} />
              )}

              {/* Features & Amenities */}
              <FeaturesAmenities
                data={propertyDetails}
                DistanceSymbol={DistanceSymbol}
                themeEnabled={webSettings?.svg_clr === "1"}
              />

              {/* Property Address */}
              {propertyDetails &&
                propertyDetails?.latitude &&
                propertyDetails?.longitude && (
                  <PropertyAddress
                    latitude={propertyDetails?.latitude}
                    longitude={propertyDetails?.longitude}
                    handleShowMap={handleShowMap}
                    handleOpenGoogleMap={handleOpenGoogleMap}
                    isPremiumProperty={isPremiumProperty}
                    isPremiumUser={isPremiumUser}
                    details={details}
                    showMap={showMap}
                    showExactLocation={showExactLocation}
                  />
                )}

              {/* 360degree Virtual Tour */}
              {imageURL ? (
                <div className="cardBg newBorder mb-5 flex flex-col rounded-2xl">
                  <div className="blackTextColor border-b p-5 text-base font-bold md:text-xl">
                    {t("virtualTour")}
                  </div>
                  <div className="flex h-[500px] justify-center rounded p-5">
                    <div id="panorama"></div>
                  </div>
                </div>
              ) : null}

              {/* Video */}
              {/* {propertyDetails && propertyDetails?.video_link && (
                <Video
                  bgImageUrl={backgroundImageUrl}
                  videoLink={propertyDetails?.video_link}
                />
              )} */}

              {propertyDetails &&
                propertyDetails?.documents &&
                propertyDetails.documents.length > 0 && (
                  <FileAttachments
                    files={propertyDetails.documents}
                    projectCategory={propertyDetails.category?.category}
                    isProperty={true}
                  />
                )}
            </div>

            {/* Sidebar */}
            <div className="col-span-12 h-full w-full xl:col-span-3">
              {/* Property Owner */}
              {propertyDetails && (
                <OwnerDetailsCard
                  ownerData={propertyDetails}
                  showChat={showChat}
                  userCurrentId={userCurrentId}
                  interested={interested}
                  isReported={isReported}
                  handleInterested={handleInterested}
                  handleNotInterested={handleNotInterested}
                  isMessagingSupported={isMessagingSupported}
                  notificationPermissionGranted={notificationPermissionGranted}
                  handleChat={handleChat}
                  handleReportProperty={handleReportModal}
                  placeholderImage={PlaceHolderImg}
                  handleCheckPremiumUserAgent={handleCheckPremiumUserAgent}
                  setShowAppointmentModal={setShowAppointmentModal}
                />
              )}

              {handleReportProperty &&
                userCurrentId !== propertyDetails?.added_by &&
                !isReported && showReport && (
                  <div className="newBorder mb-7 flex flex-col justify-between gap-2  p-3 md:flex-row rounded-2xl">
                    <button
                      className="flex items-center gap-2 py-2 text-sm font-medium text-red-500"
                      onClick={handleReportProperty}
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 p-2">
                        <BiSolidErrorAlt className="h-7 w-7 text-red-500" />
                      </div>
                      <span className="brandColor text-start text-sm font-medium">
                        {t("reportPropertyPlaceholder")}
                      </span>
                    </button>
                    <div className="flex items-center gap-2">
                      <div
                        className="border brandBorder hover:brandBg flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium hover:text-white hover:cursor-pointer"
                        onClick={handleReportProperty}
                      >
                        {t("yes")}
                      </div>
                      <button className="brandColor flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium"
                        onClick={() => setShowReport(false)}>
                        {t("no")}
                      </button>
                    </div>
                  </div>
                )}

              {/* Mortgage Loan Calculator */}
              {propertyDetails?.property_type === "sell" && (
                <MortgageLoanCalculator propertyDetails={propertyDetails}
                  showLoginModal={showLoginModal} setShowLoginModal={setShowLoginModal} />
              )}
              {belowMortgageAdBanner && (
                <div className="mt-6"
                  onClick={() => {
                    if (belowMortgageAdBanner?.external_link_url) {
                      window.open(belowMortgageAdBanner?.external_link_url, '_blank');
                    } else if (belowMortgageAdBanner?.property?.slug_id) {
                      router.push(`/property-details/${belowMortgageAdBanner?.property?.slug_id}/?lang=${lang}`);
                    }
                  }}
                >

                  <ImageWithPlaceholder
                    src={belowMortgageAdBanner?.image}
                    alt="Ad Banner"
                    width={387}
                    height={587}
                    className={`w-full aspect-[387/587] object-cover rounded-2xl ${belowMortgageAdBanner?.external_link_url || belowMortgageAdBanner?.property?.slug_id ? 'cursor-pointer' : ''}`}
                  />
                </div>
              )}
            </div>
          </div>
          {aboveSimilarPropertiesAdBanner && (
            <div className="mt-10 mb-4 lg:mb-8"
              onClick={() => {
                if (aboveSimilarPropertiesAdBanner?.external_link_url) {
                  window.open(aboveSimilarPropertiesAdBanner?.external_link_url, '_blank');
                } else if (aboveSimilarPropertiesAdBanner?.property?.slug_id) {
                  router.push(`/property-details/${aboveSimilarPropertiesAdBanner?.property?.slug_id}/?lang=${lang}`);
                }
              }}
            >
              <ImageWithPlaceholder
                src={aboveSimilarPropertiesAdBanner?.image}
                alt="Ad Below Breadcrumb"
                width={1920}
                height={350}
                className={`w-full aspect-[1920/350] object-cover rounded-lg lg:rounded-2xl ${aboveSimilarPropertiesAdBanner?.external_link_url || aboveSimilarPropertiesAdBanner?.property?.slug_id ? 'cursor-pointer' : ''}`}
              />
            </div>
          )}
        </div>
      </div>
      <div className="primaryBackgroundBg">
        <div className="container mx-auto px-3 py-8">

          {/* Similar Properties Section */}
          <SimilarPropertySlider
            data={similarProperties}
            isLoading={false}
            isUserProperty={false}
            currentPropertyId={propertyDetails?.id}
          />
        </div>
      </div>
      {isMobile && isShare && <MobileBottomSheet isShare={true} />}
      {isReportModal && (
        <ReportModal
          open={isReportModal}
          handleReportModal={handleReportModal}
          propertyId={propertyDetails?.id}
          setIsReported={setIsReported}
        />
      )}
      {showLoginModal && (
        <LoginModal
          showLogin={showLoginModal}
          setShowLogin={setShowLoginModal}
        />
      )}
      {/* Share Modal */}
      {isShareModalOpen && (
        <ShareDialog
          title={t("sharePropertyTitle")}
          pageUrl={currentUrl}
          open={isShareModalOpen}
          onOpenChange={setIsShareModalOpen}
          subtitle={t("sharePropertySubtitle")}
          slug={slug}
        />
      )}

      {/* LightBox Component */}
      <LightBox
        photos={propertyDetails?.gallery || []}
        viewerIsOpen={viewerIsOpen}
        currentImage={currentImage}
        onClose={() => setViewerIsOpen(false)}
        title_image={propertyDetails?.title_image}
        setCurrentImage={setCurrentImage}
      />

      {showAppointmentModal && (
        <AppointmentScheduleModal
          isOpen={showAppointmentModal}
          handlePrev={handleBookStepPrev}
          onClose={() => setShowAppointmentModal(false)}
          selectedProperty={propertyDetails}
          userData={userData}
          currentStep={currentStep}
          totalSteps={3}
          onContinue={handleNextStep}
          handleBookingStep={handleBookingStep}
          isBookingFromProperty={true}
        />
      )}
    </section>
  );
};

export default PropertyDetails;
