"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setLockedFilter } from "@/redux/slices/propertyListSlice";
import Layout from "../layout/Layout";
import PropertySideFilter from "./PropertySideFilter";
import PropertyListing from "./PropertyListing";
import { useTranslation } from "@/components/context/TranslationContext";
import { getAdBannerApi, getCategoriesApi, getPropertyListApi } from "@/api/apiRoutes";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import NewBreadcrumb from "../breadcrumb/NewBreadCrumb";
import { useRouter } from "next/router";
import { VerticlePropertyCardSkeleton } from "../skeletons";
import FilterTopBar from "../reusable-components/FilterTopBar";
import { isRTL, generateBase64FilterUrl, getPostedSinceString, buildPropertyApiParams } from "@/utils/helperFunction";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import ImageWithPlaceholder from "../image-with-placeholder/ImageWithPlaceholder";
import StoriesRail from "../stories/StoriesRail";


const PropertyList = ({ isCategoryPage, isCityPage }) => {
  const t = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { lang, slug } = router?.query || {};
  const isRtl = isRTL();

  const lockedFilter = useSelector((state) => state.propertyListFilters?.lockedFilter);
  const determinedLock = lockedFilter || (isCityPage ? "location" : null);

  useEffect(() => {
    return () => {
      dispatch(setLockedFilter(null));
    };
  }, [dispatch]);

  // Get location data from Redux store
  const locationData = useSelector((state) => state.location);
  const userId = useSelector((state) => state.User?.data?.id);

  const citySlug = slug;
  const categorySlug = slug;
  // --- Local State for Data & UI ---
  const [viewType, setViewType] = useState("grid");
  const [sortBy, setSortBy] = useState("newest");
  const limit = 12;
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  // Resolve the category once; the stories rail waits for the correct ID.
  const { data: categoryId = null } = useQuery({
    queryKey: ["propertyListingCategory", categorySlug],
    enabled: Boolean(isCategoryPage && categorySlug),
    queryFn: async () => {
      const response = await getCategoriesApi({ slug_id: categorySlug });
      return response?.data?.[0]?.id || "";
    },
    staleTime: 10 * 60 * 1000,
  });

  // Helper function to decode base64 filter URL
  const decodeBase64FilterUrl = (string) => {
    const decodedString = atob(string);
    return JSON.parse(decodedString);
  }

  // Helper function to initialize filters from router.query (replacing searchParams)
  const initializeFiltersFromQuery = useCallback(() => {
    // Use router.query with fallbacks for when query params might be undefined
    const query = router?.query || {};
    const locked = lockedFilter || (isCityPage ? "location" : null);
    // Check if we have a base64 encoded filters parameter
    if (query.filters) {
      try {
        const decodedFilters = decodeBase64FilterUrl(decodeURIComponent(query.filters));
        // Convert the decoded API format back to internal filter format
        return {
          property_type: decodedFilters.property_type === 0 ? "Sell" : decodedFilters.property_type === 1 ? "Rent" : "",
          category_id: decodedFilters.category_id || "",
          category_slug_id: decodedFilters.category_slug_id || (isCategoryPage ? categorySlug || "" : ""),
          city: decodedFilters.location?.city || (isCityPage ? citySlug || "" : ""),
          state: isCityPage ? "" : (decodedFilters.location?.state || ""),
          country: isCityPage ? "" : (decodedFilters.location?.country || ""),
          min_price: decodedFilters.price?.min_price || "",
          max_price: decodedFilters.price?.max_price || "",
          posted_since: getPostedSinceString(decodedFilters.posted_since),
          promoted: decodedFilters.flags?.promoted === 1,
          keywords: decodedFilters.search || "",
          amenities: decodedFilters.parameters || [],
          nearby_places: decodedFilters.nearby_places || [],
          is_premium: decodedFilters.flags?.get_all_premium_properties === 1,
          latitude: isCityPage ? undefined : (decodedFilters.location?.latitude || undefined),
          longitude: isCityPage ? undefined : (decodedFilters.location?.longitude || undefined),
          radius: isCityPage ? undefined : (decodedFilters.location?.radius || undefined),
          most_viewed: decodedFilters.flags?.most_views === 1 ? "1" : "",
          most_liked: decodedFilters.flags?.most_liked === 1 ? "1" : "",
        };
      } catch (error) {
        console.error("Error decoding filters from URL:", error);
        // Fall back to default filters if decoding fails
      }
    }

    // Return default filters with context-based values
    return {
      property_type: "",
      category_id: "",
      category_slug_id: isCategoryPage ? categorySlug || "" : "",
      city: isCityPage ? (citySlug || "") : (locked === "location" && locationData?.city ? locationData.city : ""),
      state: isCityPage ? "" : (locked === "location" && locationData?.state ? locationData.state : ""),
      country: isCityPage ? "" : (locked === "location" && locationData?.country ? locationData.country : ""),
      min_price: "",
      max_price: "",
      posted_since: "",
      promoted: locked === "featured",
      keywords: "",
      amenities: [],
      nearby_places: [],
      is_premium: locked === "premium",
      latitude: (isCityPage || locked !== "location") ? undefined : locationData?.latitude,
      longitude: (isCityPage || locked !== "location") ? undefined : locationData?.longitude,
      radius: (isCityPage || locked !== "location") ? undefined : (locationData?.radius ? parseInt(locationData.radius) : undefined),
      most_viewed: locked === "most_viewed" ? "1" : "",
      most_liked: locked === "most_liked" ? "1" : "",
    };
  }, [router?.query, citySlug, categorySlug, isCityPage, isCategoryPage, locationData, lockedFilter]);

  const [filters, setFilters] = useState(initializeFiltersFromQuery);
  const [filtersReady, setFiltersReady] = useState(false);
  // Sync filters with router.query changes
  useEffect(() => {
    if (router?.isReady) {
      const newFilters = initializeFiltersFromQuery();
      // URL changes originate outside this component as well (back/forward and search).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFilters(newFilters);
      setFiltersReady(true);
    }
  }, [router?.isReady, initializeFiltersFromQuery]);

  const breadcrumbTitle = isCityPage
    ? `${t("propertiesIn")} ${citySlug?.charAt(0)?.toUpperCase() + citySlug?.slice(1)}`
    : isCategoryPage
      ? `${categorySlug?.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())} ${t("properties")}`
      : t("allProperties");

  // Check if filters are active (excluding context-based filters)
  const hasActiveFilters = (() => {
    return (
      filters.keywords !== "" ||
      filters.property_type !== "" ||
      filters.category_id !== "" ||
      filters.min_price !== "" ||
      filters.max_price !== "" ||
      filters.posted_since !== "" ||
      filters.promoted ||
      (filters.amenities && filters.amenities.length > 0) ||
      ((filters.nearbyPlaces || filters.nearby_places || []).length > 0) ||
      (filters.city && filters.city !== citySlug) ||
      filters.state !== "" ||
      filters.country !== "" ||
      filters.is_premium ||
      filters.most_viewed !== "" ||
      filters.most_liked !== "" ||
      (filters.latitude !== undefined && filters.latitude !== locationData?.latitude) ||
      (filters.longitude !== undefined && filters.longitude !== locationData?.longitude) ||
      (filters.radius !== undefined && filters.radius !== (locationData?.radius ? parseInt(locationData.radius) : undefined))
    );
  })();

  // Helper function to check if two filter objects are equivalent
  const areFiltersEqual = (filters1, filters2) => {
    if (!filters1 || !filters2) return false;

    // Compare basic properties
    const basicProps = [
      'property_type', 'category_id', 'category_slug_id', 'city',
      'state', 'country', 'min_price', 'max_price', 'posted_since',
      'promoted', 'keywords', 'is_premium', 'latitude', 'longitude', 'radius',
      'most_viewed', 'most_liked'
    ];

    for (const prop of basicProps) {
      if (filters1[prop] !== filters2[prop]) return false;
    }

    // Compare amenities arrays
    const amenities1 = filters1.amenities || [];
    const amenities2 = filters2.amenities || [];

    if (amenities1.length !== amenities2.length) return false;

    // Check if arrays contain the same elements (order doesn't matter)
    const sortedAmenities1 = [...amenities1].sort();
    const sortedAmenities2 = [...amenities2].sort();

    for (let i = 0; i < sortedAmenities1.length; i++) {
      if (sortedAmenities1[i] !== sortedAmenities2[i]) return false;
    }

    const nearby1 = filters1.nearbyPlaces || filters1.nearby_places || [];
    const nearby2 = filters2.nearbyPlaces || filters2.nearby_places || [];
    return JSON.stringify(nearby1) === JSON.stringify(nearby2);
  };

  // The API request itself is the cache key. Changing filters or the page context
  // switches to a separate result set; an old response cannot overwrite it.
  const requestParams = useMemo(() => buildPropertyApiParams(filters, {
    isCityPage,
    citySlug,
    isCategoryPage,
    categorySlug,
    sortBy,
    limit,
    offset: 0,
  }), [filters, isCityPage, citySlug, isCategoryPage, categorySlug, sortBy]);
  const propertyQueryKey = ["propertyListing", requestParams, lang, userId];
  const {
    data: propertyPages,
    isPending: loading,
    isFetchingNextPage: loadingMore,
    hasNextPage: hasMore,
    fetchNextPage,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: propertyQueryKey,
    enabled: Boolean(router?.isReady && filtersReady),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const response = await getPropertyListApi({ ...requestParams, offset: String(pageParam) });
      if (response?.error) throw new Error(response?.message || "Property request failed");
      return { items: response?.data || [], total: Number(response?.total) || 0, offset: pageParam };
    },
    getNextPageParam: (lastPage) =>
      lastPage.items.length > 0 && lastPage.offset + limit < lastPage.total
        ? lastPage.offset + limit
        : undefined,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
  const filteredProperties = useMemo(
    () => propertyPages?.pages.flatMap((page) => page.items) || [],
    [propertyPages],
  );
  const totalCount = propertyPages?.pages[0]?.total || 0;

  const handlePropertyLike = useCallback((propertyId, isLiked) => {
    queryClient.setQueryData(propertyQueryKey, (previous) => previous && ({
      ...previous,
      pages: previous.pages.map((page) => ({
        ...page,
        items: page.items.map((property) => property.id === propertyId
          ? { ...property, is_favourite: isLiked ? 1 : 0 }
          : property),
      })),
    }));
  }, [queryClient, propertyQueryKey]);

  // Handle filter apply
  const handleFilterApply = (newFilters) => {
    // If it's a city page, do not pass/preserve latitude, longitude, and range
    const updatedFilters = {
      ...newFilters,
      ...(isCityPage ? {
        latitude: undefined,
        longitude: undefined,
        radius: undefined,
      } : {})
    };

    // Set the filters state with the actual filter object
    setFilters(updatedFilters);

    if (isFilterSheetOpen) {
      setIsFilterSheetOpen(false);
    }

    const options = {
      isCityPage,
      citySlug,
      sortBy,
      isCategoryPage,
      categorySlug
    };
    const base64Filters = generateBase64FilterUrl(updatedFilters, options);

    // Update URL with new filters
    try {
      const query = { lang: lang || 'en' };

      if (base64Filters) {
        query.filters = base64Filters;
      }

      router?.push(
        {
          pathname: `/properties/`,
          query: query
        },
        `/properties/?${new URLSearchParams(query).toString()}`
      );
    } catch (error) {
      console.error("Error updating URL with filters:", error);
    }
  };

  const handleClearFilter = useCallback(() => {
    const locked = lockedFilter || (isCityPage ? "location" : null);

    // Reset filters to empty state but keep context filters and locked filters
    const clearedFilters = {
      property_type: "",
      category_id: "",
      category_slug_id: categorySlug || "",
      city: isCityPage ? (citySlug || "") : (locked === "location" ? (filters.city || citySlug || "") : (citySlug || "")),
      state: isCityPage ? "" : (locked === "location" ? (filters.state || "") : ""),
      country: isCityPage ? "" : (locked === "location" ? (filters.country || "") : ""),
      min_price: "",
      max_price: "",
      posted_since: "",
      promoted: locked === "featured" ? filters.promoted : false,
      keywords: "",
      amenities: [],
      nearby_places: [],
      nearbyPlaces: [],
      is_premium: locked === "premium" ? filters.is_premium : false,
      latitude: (isCityPage || locked !== "location") ? undefined : (filters.latitude || locationData?.latitude),
      longitude: (isCityPage || locked !== "location") ? undefined : (filters.longitude || locationData?.longitude),
      radius: (isCityPage || locked !== "location") ? undefined : (filters.radius || (locationData?.radius ? parseInt(locationData.radius) : undefined)),
      most_viewed: locked === "most_viewed" ? filters.most_viewed : "",
      most_liked: locked === "most_liked" ? filters.most_liked : "",
    };

    // Check if filters are already cleared to prevent unnecessary updates
    if (areFiltersEqual(filters, clearedFilters)) {
      return;
    }

    setFilters(clearedFilters);
    setIsFilterSheetOpen(false);

    // Navigate to clean URL but keep locked parameters and re-encoded filters
    try {
      const query = { lang: lang || 'en' };

      const base64Filters = generateBase64FilterUrl(clearedFilters, {
        isCityPage,
        citySlug,
        sortBy,
        isCategoryPage,
        categorySlug
      });

      if (base64Filters) {
        query.filters = base64Filters;
      }

      router?.push(
        {
          pathname: `/properties/`,
          query: query
        },
        `/properties/?${new URLSearchParams(query).toString()}`
      );
    } catch (error) {
      console.error("Error updating URL after clearing filters:", error);
    }
  }, [router, citySlug, categorySlug, filters, lang, isCityPage, isCategoryPage, generateBase64FilterUrl, sortBy, lockedFilter]);

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) fetchNextPage();
  };

  const handleSetViewType = (newViewType) => {
    setViewType(newViewType);
  };

  const fetchPropertyListAdBanners = async () => {
    try {
      const response = await getAdBannerApi({
        page: "property_listing",
        platform: "web"
      })
      return response?.data ?? [];
    } catch (error) {
      console.error("Error fetching Property List Ad Banners:", error);
    }
  }

  const adBannersQuery = useQuery({
    queryKey: ['propertyListAdBanners'],
    queryFn: fetchPropertyListAdBanners,
    staleTime: 5 * 60 * 1000,
  })

  const belowBreadcrumbAdBanner = adBannersQuery?.data?.find(banner => banner?.placement === 'below_breadcrumb');
  const aboveFooterAdBanner = adBannersQuery?.data?.find(banner => banner?.placement === 'above_footer');
  const belowSidebarFilterAdBanner = adBannersQuery?.data?.find(banner => banner?.placement === 'sidebar_below_filters');

  // --- JSX Return ---
  return (
    <Layout>
      <NewBreadcrumb
        title={breadcrumbTitle}
        items={[
          {
            href: `/${citySlug ? citySlug : router?.asPath?.split("/")[1] || ""}`,
            label: breadcrumbTitle,
          },
        ]}
      />

      <div className="container mx-auto px-4 pb-12 pt-6 md:pt-10">
        {belowBreadcrumbAdBanner && (
          <div
            onClick={() => {
              if (belowBreadcrumbAdBanner?.external_link_url) {
                window.open(belowBreadcrumbAdBanner?.external_link_url, '_blank');
              } else if (belowBreadcrumbAdBanner?.property?.slug_id) {
                router.push(`/property-details/${belowBreadcrumbAdBanner?.property?.slug_id}/?lang=${lang}`);
              }
            }}
          >
            <ImageWithPlaceholder
              src={belowBreadcrumbAdBanner?.image}
              alt="Ad Below Breadcrumb"
              width={1920}
              height={350}
              className={`w-full h-full aspect-[1920/350] object-cover rounded-lg md:rounded-2xl ${belowBreadcrumbAdBanner?.external_link_url || belowBreadcrumbAdBanner?.property?.slug_id ? 'cursor-pointer' : ''} `}
            />
          </div>
        )}
        {/* <NewBreadcrumb title={breadcrumbTitle} /> */}

        {(!isCategoryPage || (categorySlug && categoryId !== null)) && (
          <StoriesRail category_id={isCategoryPage ? categoryId : ""} />
        )}

        <div className="mb-7 mt-8 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-teal-50/60 px-5 py-6 shadow-sm md:px-8 md:py-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-4xl">{breadcrumbTitle}</h1>
              <p className="mt-2 text-sm text-slate-600" aria-live="polite">
                {loading ? t("loadingMore") : `${totalCount.toLocaleString()} ${t("results")}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsFilterSheetOpen(true)}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-teal-400 hover:shadow-md xl:hidden"
            >
              {t("filter")}{hasActiveFilters ? " · ●" : ""}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:gap-8">
          {/* Mobile Filter Button - Only visible on mobile */}
          <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
            <SheetContent
              side={isRtl ? "left" : "right"}
              className="flex h-full w-full flex-col !p-0 [&>button]:hidden"
            >
              <div className="overflow-y-auto no-scrollbar h-full p-2">
                <PropertySideFilter
                  showBorder={false}
                  onFilterApply={handleFilterApply}
                  handleClearFilter={handleClearFilter}
                  currentFilters={filters}
                  isMobileSheet={true}
                  setIsFilterSheetOpen={setIsFilterSheetOpen}
                  locked={determinedLock}
                  citySlug={isCityPage ? citySlug : null}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Side Filter - Hidden on mobile */}
          <div className="hidden xl:block xl:col-span-3">
            <div className="sticky top-32">
              <PropertySideFilter
                onFilterApply={handleFilterApply}
                handleClearFilter={handleClearFilter}
                currentFilters={filters}
                locked={determinedLock}
                citySlug={isCityPage ? citySlug : null}
              />
              {belowSidebarFilterAdBanner && (
                <div className="mt-6"
                  onClick={() => {
                    if (belowSidebarFilterAdBanner?.external_link_url) {
                      window.open(belowSidebarFilterAdBanner?.external_link_url, '_blank');
                    } else if (belowSidebarFilterAdBanner?.property?.slug_id) {
                      router.push(`/property-details/${belowSidebarFilterAdBanner?.property?.slug_id}/?lang=${lang}`);
                    }
                  }}
                >
                  <ImageWithPlaceholder
                    src={belowSidebarFilterAdBanner?.image}
                    alt="Ad Below Sidebar Filter"
                    width={387}
                    height={587}
                    className={`w-full h-full aspect-[387/587] object-cover rounded-2xl ${belowSidebarFilterAdBanner?.external_link_url || belowSidebarFilterAdBanner?.property?.slug_id ? 'cursor-pointer' : ''}`}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <main className="min-w-0 xl:col-span-9">
            {/* Filter Top Bar */}
              <FilterTopBar
                itemCount={filteredProperties.length}
                totalItems={totalCount}
                viewType={viewType}
                setViewType={handleSetViewType}
                sortBy={sortBy}
                setSortBy={setSortBy}
                onOpenFilters={() => setIsFilterSheetOpen(true)}
                showSortBy={false}
                showFilterButton={false}
                isLoading={loading}
              />

            {isError && filteredProperties.length === 0 && (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center">
                <p className="text-sm text-rose-800">{t("propertyLoadError")}</p>
                <button type="button" onClick={() => refetch()} className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm">{t("tryAgain")}</button>
              </div>
            )}

            {/* Property Listings */}
            {loading ? (
              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, index) => (
                  <VerticlePropertyCardSkeleton key={index} />
                ))}
              </div>
            ) : !isError || filteredProperties.length > 0 ? (
              <PropertyListing
                properties={filteredProperties}
                onPropertyLike={handlePropertyLike}
                totalCount={totalCount}
                onOpenFilters={() => setIsFilterSheetOpen(true)}
                hasActiveFilters={hasActiveFilters}
                viewType={viewType}
                setViewType={handleSetViewType}
              />
            ) : null}

            {/* Load More Button */}
            {hasMore && !loading && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="brandColor brandBorder my-5 rounded-xl border bg-white px-8 py-3 font-semibold shadow-sm transition hover:border-transparent hover:primaryBg hover:text-white disabled:opacity-60"
                >
                  {loadingMore ? t("loadingMore") : t("loadMore")}
                </button>
              </div>
            )}
          </main>
        </div>
        {aboveFooterAdBanner && (
          <div className="col-span-12 my-3 lg:mt-3 lg:mb-4"
            onClick={() => {
              if (aboveFooterAdBanner?.external_link_url) {
                window.open(aboveFooterAdBanner?.external_link_url, '_blank');
              } else if (aboveFooterAdBanner?.property?.slug_id) {
                router.push(`/property-details/${aboveFooterAdBanner?.property?.slug_id}/?lang=${lang}`);
              }
            }}
          >
            <ImageWithPlaceholder
              src={aboveFooterAdBanner?.image}
              alt="Ad Above Footer"
              width={1920}
              height={350}
              className={`w-full h-full aspect-[1920/350] object-cover rounded-lg lg:rounded-2xl ${aboveFooterAdBanner?.external_link_url || aboveFooterAdBanner?.property?.slug_id ? 'cursor-pointer' : ''}`}
            />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PropertyList;
