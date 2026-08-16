import { useRouter } from "next/router";
import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "../context/TranslationContext";
import PropertyVerticalCard from "../cards/PropertyVerticalCard";
import { getAgentPropertiesApi, getStoriesApi } from "@/api/apiRoutes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PropertyCardSkeleton from "../skeletons/PropertyCardSkeleton";
import ProjectCardSkeleton from "../skeletons/ProjectCardSkeleton";
import AgentHorizontalCardSkeleton from "../skeletons/AgentHorizontalCardSkeleton";
import UnlockPremiumPropertyCardSkeleton from "../skeletons/UnlockPremiumPropertyCardSkeleton";
import AboutAgentSkeleton from "../skeletons/AboutAgentSkeleton";
import ProjectCardWithSwiper from "../cards/ProjectCardWithSwiper";
import AgentHorizontalCard from "../cards/AgentHorizontalCard";
import UnlockPremiumPropertyCard from "../cards/UnlockPremiumPropertyCard";
import ShareDialog from "../reusable-components/ShareDialog";
import AgentStats from "./AgentStats";
import { useSelector, useDispatch } from "react-redux";
import { setStoriesData } from "@/redux/slices/storiesSlice";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileBottomSheet from "../mobile-bottom-sheet/MobileBottomSheet";
import NewBreadcrumb from "../breadcrumb/NewBreadCrumb";
import { AppointmentScheduleModal } from "../appointment-modal";
import { isRTL, showLoginSwal, generateBase64FilterUrl, decodeBase64FilterUrl, buildProjectFilters, getPostedSinceString } from "@/utils/helperFunction";
import LoginModal from "../modal/LoginModal";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import PropertySideFilter from "../pagescomponents/PropertySideFilter";
import ProjectSideFilter from "../pagescomponents/ProjectSideFilter";
import { IoFilterSharp } from "react-icons/io5";
import AgentBannerAlt from "@/assets/AgentBannerAlt.svg";
import ImageWithPlaceholder from "../image-with-placeholder/ImageWithPlaceholder";
import { trackEvent } from "@/utils/analytics";

const AgentDetails = () => {
  const t = useTranslation();
  const router = useRouter();
  const { slug, lang } = router?.query;

  const isRtl = isRTL()

  // Tab state management - default to about agent
  const [selectedTab, setSelectedTab] = useState(
    router?.query?.is_admin === "true" ? "properties" : "about",
  );
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [propertyFilters, setPropertyFilters] = useState({});
  const [projectFilters, setProjectFilters] = useState({});
  const userData = useSelector((state) => state?.User?.data);
  const language = useSelector((state) => state.LanguageSettings?.active_language);
  const dispatch = useDispatch();

  // Agent data state
  const [agentDetails, setAgentDetails] = useState(null);
  const [isAgentLoading, setIsAgentLoading] = useState(true);
  const [error, setError] = useState(null);

  // Properties state
  const [properties, setProperties] = useState([]);
  const [isPropertiesLoading, setIsPropertiesLoading] = useState(false);
  const [propertiesOffset, setPropertiesOffset] = useState(0);
  const [propertiesTotal, setPropertiesTotal] = useState(0);
  const [loadingMoreProperties, setLoadingMoreProperties] = useState(false);

  // Projects state
  const [projects, setProjects] = useState([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(false);
  const [projectsOffset, setProjectsOffset] = useState(0);
  const [projectsTotal, setProjectsTotal] = useState(0);
  const [loadingMoreProjects, setLoadingMoreProjects] = useState(false);

  const [isFeatureAvailable, setIsFeatureAvailable] = useState(false);
  const [premiumPropertiesCount, setPremiumPropertiesCount] = useState(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Configuration - Separate limits for properties and projects
  const propertiesLimit = 8; // Limit for properties tab
  const projectsLimit = 6;   // Limit for projects tab
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAppointmentModule, setShowAppointmentModule] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const trackedAgentIdRef = useRef(null);

  const isBookingFromProperty = false;

  const currentUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/agent-details/${agentDetails?.slug_id}${router?.query?.is_admin === "true" ? `?is_admin=true&share=true&lang=${lang}` : `?share=true&lang=${lang}`}`;


  const isMobile = useIsMobile();
  const isShare = router?.query?.share === "true";
  // Fetch agent basic data on component mount
  const fetchAgentBasicData = async () => {
    try {
      if (!slug) return;

      setIsAgentLoading(true);
      const res = await getAgentPropertiesApi({
        slug_id: slug,
        is_projects: "",
        is_admin: router?.query?.is_admin === "true" ? "1" : "",
        limit: propertiesLimit.toString(),
        offset: "0",
      });

      if (!res.error && res.data?.customer_data) {
        let agent = { ...res.data.customer_data, is_admin: router?.query?.is_admin === "true" };
        setAgentDetails(agent);
        setIsFeatureAvailable(res.data.feature_available);
        setPremiumPropertiesCount(res.data.premium_properties_count);
        if (agent.id) {
          fetchAgentStories(agent.id);
          if (trackedAgentIdRef.current !== agent.id) {
            trackedAgentIdRef.current = agent.id;
            trackEvent('view_item', {
              item_id: agent.id,
              item_category: 'agent',
            });
          }
        }
      } else {
        setError(res.message || "Failed to load agent data");
      }
    } catch (error) {
      console.error("Error fetching agent basic data:", error);
      setError("Failed to load agent data");
    } finally {
      setIsAgentLoading(false);
    }
  };

  // Fetch this agent's stories so the profile photo can show the story ring
  const fetchAgentStories = async (agentId) => {
    try {
      const res = await getStoriesApi({ agent_id: agentId });
      if (!res.error) {
        dispatch(setStoriesData(res.data));
      }
    } catch (error) {
      console.error("Error fetching agent stories:", error);
    }
  };

  // Fetch properties data
  const fetchPropertiesData = async (
    isLoadMore = false,
    offsetOverride = null,
    filtersOverride = null,
  ) => {
    try {
      if (!slug) return;

      if (!isLoadMore) {
        setIsPropertiesLoading(true);
        if (offsetOverride === null) setPropertiesOffset(0);
      } else {
        setLoadingMoreProperties(true);
      }

      // Use offsetOverride if provided, otherwise use current offset logic
      const currentOffset =
        offsetOverride !== null
          ? offsetOverride
          : isLoadMore
            ? propertiesOffset
            : 0;

      const activeFilters = filtersOverride !== null ? filtersOverride : propertyFilters;
      const base64Filters = generateBase64FilterUrl(activeFilters, {});

      const apiParams = {
        slug_id: slug,
        is_projects: "",
        is_admin: router?.query?.is_admin === "true" ? "1" : "",
        limit: propertiesLimit.toString(),
        offset: currentOffset.toString(),
      };

      if (base64Filters) {
        apiParams.filters = base64Filters;
      }

      const res = await getAgentPropertiesApi(apiParams);

      if (!res.error) {
        const newProperties = res.data?.properties_data || [];

        if (isLoadMore) {
          setProperties((prev) => [...prev, ...newProperties]);
        } else {
          setProperties(newProperties);
        }

        setPropertiesTotal(res.total || 0);

        // Update agent details if not already loaded
        if (!agentDetails && res.data?.customer_data) {
          let agent = { ...res.data.customer_data, is_admin: router?.query?.is_admin === "true" };
          setAgentDetails(agent);
        }
      } else {
        setError(res.message || "Failed to load properties");
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
      setError("Failed to load properties");
    } finally {
      setIsPropertiesLoading(false);
      setLoadingMoreProperties(false);
    }
  };

  // Fetch projects data
  const fetchProjectsData = async (
    isLoadMore = false,
    offsetOverride = null,
    filtersOverride = null,
  ) => {
    try {
      if (!slug) return;

      if (!isLoadMore) {
        setIsProjectsLoading(true);
        if (offsetOverride === null) setProjectsOffset(0);
      } else {
        setLoadingMoreProjects(true);
      }

      // Use offsetOverride if provided, otherwise use current offset logic
      const currentOffset =
        offsetOverride !== null
          ? offsetOverride
          : isLoadMore
            ? projectsOffset
            : 0;

      const activeFilters = filtersOverride !== null ? filtersOverride : projectFilters;
      const { encodedFilters } = buildProjectFilters(activeFilters);

      const apiParams = {
        slug_id: slug,
        is_projects: "1",
        limit: projectsLimit.toString(),
        is_admin: router?.query?.is_admin === "true" ? "1" : "",
        offset: currentOffset.toString(),
      };

      if (encodedFilters) {
        apiParams.filters = encodedFilters;
      }

      const res = await getAgentPropertiesApi(apiParams);

      if (!res.error) {
        const newProjects = res.data?.projects_data || [];

        if (isLoadMore) {
          setProjects((prev) => [...prev, ...newProjects]);
        } else {
          setProjects(newProjects);
        }

        setProjectsTotal(res.total || 0);

        // Update agent details if not already loaded
        if (!agentDetails && res.data?.customer_data) {
          let agent = { ...res.data.customer_data, is_admin: router?.query?.is_admin === "true" };
          setAgentDetails(agent);
        }
      } else {
        setError(res.message || "Failed to load projects");
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setError("Failed to load projects");
    } finally {
      setIsProjectsLoading(false);
      setLoadingMoreProjects(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (router?.query?.is_admin === "true") {
      fetchAgentBasicData();
      fetchPropertiesData();
      return;
    }
    if (slug) {
      fetchAgentBasicData();
    }
    return () => {
      fetchPropertiesData();
      fetchProjectsData();
    };
  }, [slug, userData, language]);

  // Handle tab change with data fetching
  const handleTabChange = (value) => {
    setSelectedTab(value);

    if (value === "properties" && properties.length === 0) {
      fetchPropertiesData();
    } else if (value === "projects" && projects.length === 0) {
      fetchProjectsData();
    }
  };

  const initializePropertyFiltersFromQuery = useCallback(() => {
    const query = router?.query || {};
    if (query.filters) {
      try {
        const decoded = decodeBase64FilterUrl(decodeURIComponent(query.filters));
        return {
          property_type: decoded.property_type === 0 ? "Sell" : decoded.property_type === 1 ? "Rent" : "All",
          category_id: decoded.category_id || "",
          city: decoded.location?.city || "",
          state: decoded.location?.state || "",
          country: decoded.location?.country || "",
          min_price: decoded.price?.min_price || "",
          max_price: decoded.price?.max_price || "",
          posted_since: getPostedSinceString(decoded.posted_since) || "anytime",
          promoted: decoded.flags?.promoted === 1,
          keywords: decoded.search || "",
          amenities: decoded.parameters || [],
          nearbyPlaces: decoded.nearby_places || [],
          is_premium: decoded.flags?.get_all_premium_properties === 1,
        };
      } catch (error) {
        console.error("Error decoding property filters:", error);
      }
    }
    return {
      property_type: "",
      category_id: "",
      city: "",
      state: "",
      country: "",
      min_price: "",
      max_price: "",
      posted_since: "anytime",
      promoted: false,
      keywords: "",
      amenities: [],
      nearbyPlaces: [],
      is_premium: false,
    };
  }, [router?.query]);

  const initializeProjectFiltersFromQuery = useCallback(() => {
    const query = router?.query || {};
    if (query.filters) {
      try {
        const decoded = decodeBase64FilterUrl(decodeURIComponent(query.filters));
        return {
          keywords: decoded?.search || "",
          category_id: decoded?.category_id || "",
          city: decoded?.location?.city || "",
          state: decoded?.location?.state || "",
          country: decoded?.location?.country || "",
          posted_since: getPostedSinceString(decoded?.posted_since) || "anytime",
          promoted: decoded?.flags?.promoted === 1,
          is_premium: decoded?.flags?.get_all_premium_properties === 1,
          most_viewed: decoded?.flags?.most_views === 1,
          most_liked: decoded?.flags?.most_liked === 1,
          project_type: decoded?.project_type === 0 ? "upcoming" : decoded?.project_type === 1 ? "under_construction" : "All",
        };
      } catch (error) {
        console.error("Error decoding project filters:", error);
      }
    }
    return {
      keywords: "",
      category_id: "",
      city: "",
      state: "",
      country: "",
      posted_since: "anytime",
      promoted: false,
      is_premium: false,
      most_viewed: false,
      most_liked: false,
      project_type: "All",
    };
  }, [router?.query]);

  // Sync property filters from query
  useEffect(() => {
    if (router?.isReady && selectedTab === "properties") {
      const newFilters = initializePropertyFiltersFromQuery();
      setPropertyFilters(newFilters);
      setPropertiesOffset(0);
      fetchPropertiesData(false, 0, newFilters);
    }
  }, [router?.isReady, router?.query?.filters, selectedTab]);

  // Sync project filters from query
  useEffect(() => {
    if (router?.isReady && selectedTab === "projects") {
      const newFilters = initializeProjectFiltersFromQuery();
      setProjectFilters(newFilters);
      setProjectsOffset(0);
      fetchProjectsData(false, 0, newFilters);
    }
  }, [router?.isReady, router?.query?.filters, selectedTab]);

  const handlePropertyFilterApply = (newFilters) => {
    if (isFilterSheetOpen) {
      setIsFilterSheetOpen(false);
    }

    const base64Filters = generateBase64FilterUrl(newFilters, {});

    try {
      if (base64Filters) {
        const encodedFilters = encodeURIComponent(base64Filters);
        router?.push(
          {
            pathname: `/agent-details/${slug}`,
            query: { ...router.query, filters: encodedFilters }
          },
          `/agent-details/${slug}/?filters=${encodedFilters}&lang=${lang}`
        );
      } else {
        const cleanQuery = { ...router.query };
        delete cleanQuery.filters;
        router?.push(
          {
            pathname: `/agent-details/${slug}`,
            query: cleanQuery
          },
          `/agent-details/${slug}/?lang=${lang}`
        );
      }
    } catch (error) {
      console.error("Error updating URL with property filters:", error);
    }
  };

  const handleClearPropertyFilter = () => {
    if (isFilterSheetOpen) {
      setIsFilterSheetOpen(false);
    }

    try {
      const cleanQuery = { ...router.query };
      delete cleanQuery.filters;
      router?.push(
        {
          pathname: `/agent-details/${slug}`,
          query: cleanQuery
        },
        `/agent-details/${slug}/?lang=${lang}`
      );
    } catch (error) {
      console.error("Error clearing property filters from URL:", error);
    }
  };

  const handleProjectFilterApply = (newFilters) => {
    if (isFilterSheetOpen) {
      setIsFilterSheetOpen(false);
    }

    const { encodedUrlFilters } = buildProjectFilters(newFilters);

    try {
      if (encodedUrlFilters) {
        router?.push(
          {
            pathname: `/agent-details/${slug}`,
            query: { ...router.query, filters: encodedUrlFilters }
          },
          `/agent-details/${slug}/?filters=${encodedUrlFilters}&lang=${lang}`
        );
      } else {
        const cleanQuery = { ...router.query };
        delete cleanQuery.filters;
        router?.push(
          {
            pathname: `/agent-details/${slug}`,
            query: cleanQuery
          },
          `/agent-details/${slug}/?lang=${lang}`
        );
      }
    } catch (error) {
      console.error("Error updating URL with project filters:", error);
    }
  };

  const handleClearProjectFilter = () => {
    if (isFilterSheetOpen) {
      setIsFilterSheetOpen(false);
    }

    try {
      const cleanQuery = { ...router.query };
      delete cleanQuery.filters;
      router?.push(
        {
          pathname: `/agent-details/${slug}`,
          query: cleanQuery
        },
        `/agent-details/${slug}/?lang=${lang}`
      );
    } catch (error) {
      console.error("Error clearing project filters from URL:", error);
    }
  };

  // Handle load more for properties
  const handleLoadMoreProperties = () => {
    const newOffset = propertiesOffset + propertiesLimit;
    fetchPropertiesData(true, newOffset);
    setPropertiesOffset(newOffset);
  };

  // Handle load more for projects
  const handleLoadMoreProjects = () => {
    const newOffset = projectsOffset + projectsLimit;
    fetchProjectsData(true, newOffset);
    setProjectsOffset(newOffset);
  };

  // Calculate if more data is available
  const hasMoreProperties = properties.length < propertiesTotal;
  const hasMoreProjects = projects.length < projectsTotal;
  const PropertiesSoldCount = agentDetails?.properties_sold_count;
  const PropertiesRentCount = agentDetails?.properties_rented_count;


  const handleNextStep = (selectedProperty = null) => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleOpenAppointmentModal = () => {
    if (!userData?.id) {
      return showLoginSwal(
        "oops",
        "plzLogFirsttoAccess",
        () => {
          setShowLoginModal(true);
        },
        t
      )
    }
    setCurrentStep(1); // Reset to step 1 to show property selection
    setShowAppointmentModule(true);
  };

  const handleCloseAppointmentModal = () => {
    setShowAppointmentModule(false);
    setCurrentStep(1); // Reset step when closing
  };

  const handleBookingStep = (step) => {
    setCurrentStep(step);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="primaryBackgroundBg">
        <div className="container mx-auto">
          <NewBreadcrumb
            title={t("agentDetails")}
            items={[
              { label: t("allAgents"), href: `/all/agents` },
              { label: t("agentDetails"), href: `/agent-details/${slug}` },
            ]}
            showLike={false}
            setIsShareModalOpen={setIsShareModalOpen}
          />
        </div>

        {/* Banner container - occupy the whole screen */}
        <div className="relative w-full">
          <div className="w-full aspect-[1920/400] h-full overflow-hidden">
            <ImageWithPlaceholder
              src={agentDetails?.agent_profile?.agent_banner ?? AgentBannerAlt}
              alt={`${agentDetails?.agent_profile?.agent_name} - Real Estate Agent`}
              height={400}
              width={1920}
              className="h-full w-full aspect-[1920/400]"
              loading="lazy"
            />
          </div>

          {/* Card overlay - centered inside container mx-auto, overlapping the banner */}
          <div className="relative z-10 -mt-8 md:-mt-20 lg:-mt-24 xl:-mt-[100px] px-4 pb-6">
            <div className="container mx-auto space-y-6">
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-12 mx-auto w-full">
                  {isAgentLoading ? (
                    <AgentHorizontalCardSkeleton />
                  ) : agentDetails ? (
                    <AgentHorizontalCard
                      agentDetails={agentDetails}
                      setShowAppointmentModule={handleOpenAppointmentModal}
                      isFeatureAvailable={isFeatureAvailable}
                      setIsShareModalOpen={setIsShareModalOpen}
                    />
                  ) : (
                    <div className="rounded-lg border bg-white p-6 text-center">
                      <p className="text-gray-500">{t("agentNotFound")}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Agent Overview Stats & Unlock Premium Properties Card */}
              <div className="grid grid-cols-12 gap-6 items-stretch">
                <div className={`col-span-12 ${premiumPropertiesCount > 0 && !isFeatureAvailable ? "lg:col-span-9" : "lg:col-span-12"}`}>
                  {agentDetails && (
                    <AgentStats
                      agentDetails={agentDetails}
                      projectsCount={projectsTotal}
                      propertiesCount={propertiesTotal || agentDetails?.property_count || 0}
                    />
                  )}
                </div>

                {premiumPropertiesCount > 0 && !isFeatureAvailable && (
                  <div className="col-span-12 lg:col-span-3">
                    {isAgentLoading ? (
                      <UnlockPremiumPropertyCardSkeleton />
                    ) : (
                      <UnlockPremiumPropertyCard count={premiumPropertiesCount} />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-3 py-5 sm:px-4 sm:py-8">
        <div className="grid grid-cols-12 gap-6 items-start">
          <div className="col-span-12">
            {/* Main Content - Tabs */}
            <Tabs
              value={selectedTab}
              onValueChange={handleTabChange}
              className="w-full"
              dir={isRtl ? "rtl" : "ltr"}
            >
              {/* Tab Header */}
              <div className="mb-6 flex flex-col md:flex-row h-fit items-center gap-3 justify-between rounded-lg border bg-white p-2 md:p-4 xl:items-center">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full justify-between">
                  <TabsList className="grid h-full grid-cols-2 items-center rounded-lg bg-muted/50 bg-white xl:flex xl:w-auto">
                    {router?.query?.is_admin !== "true" && (
                      <TabsTrigger
                        value="about"
                        className="data-[state=active]:brandBg data-[state=active]:primaryTextColor bg-white p-3 text-base text-wrap font-medium transition-all duration-200 hover:text-foreground xl:flex-none"
                      >
                        {t("about")} {t("agent")}
                      </TabsTrigger>
                    )}
                    <TabsTrigger
                      value="properties"
                      className="data-[state=active]:brandBg data-[state=active]:primaryTextColor bg-white p-3 text-base text-wrap font-medium transition-all duration-200 hover:text-foreground xl:flex-none"
                    >
                      {t("properties")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="projects"
                      className="data-[state=active]:brandBg data-[state=active]:primaryTextColor bg-white p-3 text-base text-wrap font-medium col-span-2 transition-all duration-200 hover:text-foreground xl:flex-none"
                    >
                      {t("projects")}
                    </TabsTrigger>
                  </TabsList>

                  {(selectedTab === "properties" || selectedTab === "projects") && (
                    <button
                      onClick={() => setIsFilterSheetOpen(true)}
                      className="brandColor brandBorder hover:primaryBg hover:primaryTextColor hover:text-white hover:border-transparent flex items-center justify-center gap-2 rounded-lg border bg-white px-5 py-3 text-base font-medium transition-all duration-200 focus:outline-none"
                    >
                      <IoFilterSharp size={18} />
                      {t("filter")}
                    </button>
                  )}
                </div>

                {(PropertiesSoldCount > 0 || PropertiesRentCount > 0) && (
                  <div className="primaryBackgroundBg secondryTextColor flex flex-wrap md:flex-nowrap text-sm items-center justify-center gap-2 text-justify font-semibold sm:text-base xl:text-right px-3 py-2 md:px-3 md:py-2 lg:px-4 lg:py-3 rounded-lg">
                    {PropertiesSoldCount > 0 && (
                      <span className=" text-nowrap font-medium text-sm md:text-base leadColor">
                        {t("propertySold")} : <span className="font-bold brandColor">{PropertiesSoldCount}</span>
                      </span>
                    )}
                    {PropertiesRentCount > 0 && (
                      <span className="h-6 w-[1.5px] rounded-full newBorder xl:block" />
                    )}
                    {PropertiesRentCount > 0 && (
                      <span className=" text-nowrap font-medium text-sm md:text-base leadColor">
                        {t("propertyRented")} : <span className="font-bold brandColor">{PropertiesRentCount}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
              {/* About Agent Tab Content */}
              {router?.query?.is_admin !== "true" && (
                <TabsContent value="about" className="mt-0 space-y-6">
                  {isAgentLoading ? (
                    <AboutAgentSkeleton />
                  ) : agentDetails?.agent_profile?.about_me ? (
                    <div className="cardBorder rounded-lg border bg-white md:rounded-2xl">
                      <div className="brandColor border-b p-3 text-base md:text-xl font-bold sm:p-6">
                        {t("about")} {t("agent")}
                      </div>
                      <div className="p-4 sm:p-6">
                        <div className="leadColor text-sm font-medium md:text-base">
                          {agentDetails?.agent_profile?.about_me}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border bg-white py-12 text-center shadow-sm sm:py-16">
                      <div className="mx-auto max-w-md">
                        <p className="mb-2 text-base text-muted-foreground sm:text-lg">
                          {t("noAboutInfoAvailable")}
                        </p>
                        <p className="text-sm text-muted-foreground/80">
                          {t("contactVerifiedAgentForMoreInfo")}
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>
              )}

              {/* Properties Tab Content */}
              <TabsContent value="properties" className="mt-0 space-y-6">
                {isPropertiesLoading ? (
                  <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {[...Array(6)].map((_, index) => (
                      <PropertyCardSkeleton key={index} />
                    ))}
                  </div>
                ) : properties && properties.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 place-items-center gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-4">
                      {properties.map((property) => (
                        <PropertyVerticalCard
                          key={property.id}
                          property={property}
                        />
                      ))}
                    </div>

                    {/* Load More Properties */}
                    {hasMoreProperties && (
                      <div className="flex justify-center pt-4">
                        {loadingMoreProperties ? (
                          <div className="custom-loader"></div>
                        ) : (
                          <button
                            onClick={handleLoadMoreProperties}
                            className="brandColor brandBorder hover:primaryBg hover:primaryTextColor hover:text-white hover:border-transparent rounded-lg border bg-transparent px-6 py-3 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-base"
                          >
                            {t("loadMore")} {t("listing")}
                          </button>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-lg border bg-white py-12 text-center shadow-sm sm:py-16">
                    <div className="mx-auto max-w-md">
                      <p className="mb-2 text-base text-muted-foreground sm:text-lg">
                        {t("noPropertiesFound")}
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Proects Tab Cojntent */}
              <TabsContent value="projects" className="mt-0 space-y-6">
                {isProjectsLoading ? (
                  <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {[...Array(6)].map((_, index) => (
                      <ProjectCardSkeleton key={index} />
                    ))}
                  </div>
                ) : projects && projects.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                      {projects.map((project) => (
                        <ProjectCardWithSwiper
                          key={project.id}
                          data={project}
                        />
                      ))}
                    </div>

                    {/* Load More Projects */}
                    {hasMoreProjects && (
                      <div className="flex justify-center pt-4">
                        {loadingMoreProjects ? (
                          <div className="custom-loader"></div>
                        ) : (
                          <button
                            onClick={handleLoadMoreProjects}
                            className="primaryColor primaryBorderColor hover:primaryBg hover:primaryTextColor rounded-lg border bg-transparent px-6 py-3 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-base"
                          >
                            {t("loadMore")} {t("projects")}
                          </button>
                        )}
                      </div>
                    )}
                  </>
                ) : !isProjectsLoading && projectsTotal > 0 && !isFeatureAvailable ? (
                  <div className="rounded-lg border bg-white py-12 text-center shadow-sm sm:py-16">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="brandColor text-2xl font-bold">
                        {t("unlockPremiumProjects")}
                      </div>
                      <div className="leadColor text-base font-medium">
                        {t("thisAgentHas")} {projectsTotal}{" "}
                        {t("exclusivePremiumListingsAvailable")}
                      </div>
                      <div>
                        <button className="brandBg primaryTextColor rounded-lg border bg-transparent px-6 py-3 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-base"
                          onClick={() => router.push(`/subscription-plan?lang=${lang}`)}
                        >
                          {t("subscribeNow")}
                        </button>
                      </div>
                    </div>
                  </div>
                ) :
                  (
                    <div className="rounded-lg border bg-white py-12 text-center shadow-sm sm:py-16">
                      <div className="mx-auto max-w-md">
                        <p className="mb-2 text-base text-muted-foreground sm:text-lg">
                          {t("noProjectsFound")}
                        </p>
                      </div>
                    </div>
                  )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      {isShareModalOpen && (
        <ShareDialog
          open={isShareModalOpen}
          onOpenChange={setIsShareModalOpen}
          title={t("shareAgentDetails")}
          subtitle={t("shareAgentDetailsSubtitle")}
          pageUrl={currentUrl}
        />
      )}
      {isMobile && isShare && <MobileBottomSheet isShare={true} />}
      {showAppointmentModule && (
        <AppointmentScheduleModal
          properties={properties}
          isOpen={showAppointmentModule}
          onClose={handleCloseAppointmentModal}
          onContinue={handleNextStep}
          handlePrev={handlePrevStep}
          totalSteps={3}
          isBookingFromProperty={isBookingFromProperty}
          currentStep={currentStep}
          agentDetails={agentDetails}
          handleBookingStep={handleBookingStep}
        />
      )}
      {showLoginModal && (
        <LoginModal setShowLogin={setShowLoginModal} showLogin={showLoginModal} />
      )}

      {/* Sidebar Filter Sheet */}
      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent
          side={isRtl ? "left" : "right"}
          className="flex h-full w-full flex-col place-content-center !p-0 [&>button]:hidden"
        >
          <div className="overflow-y-auto no-scrollbar h-full p-2">
            {selectedTab === "properties" ? (
              <PropertySideFilter
                showBorder={false}
                onFilterApply={handlePropertyFilterApply}
                handleClearFilter={handleClearPropertyFilter}
                currentFilters={propertyFilters}
                isMobileSheet={isFilterSheetOpen}
                setIsFilterSheetOpen={setIsFilterSheetOpen}
              />
            ) : selectedTab === "projects" ? (
              <ProjectSideFilter
                showBorder={false}
                onFilterApply={handleProjectFilterApply}
                handleClearFilter={handleClearProjectFilter}
                currentFilters={projectFilters}
                isMobileSheet={isFilterSheetOpen}
                setIsFilterSheetOpen={setIsFilterSheetOpen}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AgentDetails;
