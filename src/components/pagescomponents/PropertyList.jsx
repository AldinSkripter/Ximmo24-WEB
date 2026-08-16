"use client";
import { useState, useEffect, useCallback } from "react";
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
import FilterTopBarSkeleton from "../skeletons/FilterTopBarSkeleton";
import FilterTopBar from "../reusable-components/FilterTopBar";
import { isRTL, generateBase64FilterUrl, getPostedSinceString, buildPropertyApiParams } from "@/utils/helperFunction";
import { useQuery } from "@tanstack/react-query";
import ImageWithPlaceholder from "../image-with-placeholder/ImageWithPlaceholder";
import StoriesRail from "../stories/StoriesRail";


const PropertyList = ({ isCategoryPage, isCityPage }) => {
  const t = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch();
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

  const citySlug = slug;
  const categorySlug = slug;
  // --- Local State for Data & UI ---
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [viewType, setViewType] = useState("grid");
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const limit = 9;
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [prevFilters, setPrevFilters] = useState(null); // Track previous filters to prevent duplicate fetches
  const [adBanners, setAdBanners] = useState([]);
  // null = not yet resolved (only relevant on category pages); "" = not applicable
  const [categoryId, setCategoryId] = useState(isCategoryPage ? null : "");

  // Resolve the numeric category id from the category slug for the stories rail.
  // StoriesRail is only rendered once this resolves, so it fires a single
  // get-stories call with the correct category_id instead of once with "" and
  // again once the id comes back.
  useEffect(() => {
    if (!isCategoryPage || !categorySlug) {
      setCategoryId("");
      return;
    }

    setCategoryId(null);

    const resolveCategoryId = async () => {
      try {
        const res = await getCategoriesApi({ slug_id: categorySlug });
        if (res && !res?.error) {
          setCategoryId(res?.data?.[0]?.id || "");
        }
      } catch (error) {
        console.error("Error resolving category id:", error);
      }
    };

    resolveCategoryId();
  }, [isCategoryPage, categorySlug]);

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
  // Sync filters with router.query changes
  useEffect(() => {
    if (router?.isReady) {
      const newFilters = initializeFiltersFromQuery();
      setFilters(newFilters);
      setOffset(0); // Reset offset when filters change from URL
    }
  }, [router?.isReady, initializeFiltersFromQuery]);

  // --- Breadcrumb Title State (Derived from props) ---
  const [breadcrumbTitle, setBreadcrumbTitle] = useState(() => {
    if (isCityPage)
      return `${t("propertiesIn")} ${citySlug?.charAt(0)?.toUpperCase() + citySlug?.slice(1)}`;
    if (isCategoryPage)
      return `${t("category")}: ${categorySlug?.charAt(0)?.toUpperCase() + categorySlug?.slice(1)}`;
    return t("allProperties");
  });

  // Update breadcrumb if props change after initial load
  useEffect(() => {
    if (isCityPage)
      setBreadcrumbTitle(
        `${t("propertiesIn")} ${citySlug?.charAt(0)?.toUpperCase() + citySlug?.slice(1)}`,
      );
    else if (isCategoryPage)
      setBreadcrumbTitle(
        `${categorySlug?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} ${t("properties")}`,
      );
    else setBreadcrumbTitle(t("allProperties"));
  }, [isCityPage, isCategoryPage, citySlug, categorySlug, t]);

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

    return true;
  };

  // Fetch data function
  const fetchData = useCallback(
    async (isLoadMore = false, isFilterChange = false) => {
      try {
        // Skip fetch if filters haven't changed and it's not a load more request
        if (!isLoadMore && !isFilterChange && areFiltersEqual(filters, prevFilters)) {
          return;
        }

        isLoadMore ? setLoadingMore(true) : setLoading(true);

        // If it's a filter change, reset the offset
        if (isFilterChange && !isLoadMore) {
          setOffset(0);
        }

        // Use the current offset value from state for API call
        const currentOffset = isLoadMore ? offset + limit : offset;

        /**
         * NEW API FORMAT - Structured object approach
         * {
         *   property_type: 0|1, // 0 = Sell, 1 = Rent
         *   category_id: number,
         *   category_slug_id: string,
         *   parameters: [{ id: number, value: string }],
         *   nearby_places: [{ id: number, value: number }],
         *   location: { country, state, city, place_id, latitude, longitude, range },
         *   price: { min_price: number, max_price: number },
         *   posted_since: 0|1|2|3|4,
         *   search: string,
         *   flags: { promoted: 0|1, get_all_premium_properties: 0|1, most_views: 0|1, most_liked: 0|1 }
         * }
         */

        const apiParams = buildPropertyApiParams(filters, {
          isCityPage,
          citySlug,
          isCategoryPage,
          categorySlug,
          sortBy,
          limit,
          offset: currentOffset,
        });

        const res = await getPropertyListApi(apiParams);

        if (!res?.error) {
          if (isLoadMore) {
            setFilteredProperties((prevProperties) => [
              ...prevProperties,
              ...res?.data,
            ]);
            // Only update offset after successful load more
            setOffset(currentOffset);
          } else {
            setFilteredProperties(res?.data || []);
            // When filter changes, reset offset
            if (isFilterChange) {
              setOffset(0);
            }
          }

          setTotalCount(res?.total || 0);
          setHasMore(res?.total > currentOffset + (res?.data?.length || 0));

          // Store current filters to prevent duplicate fetches
          setPrevFilters({ ...filters });
        } else {
          console.error("API returned an error:", res?.error);
        }
      } catch (error) {
        console.error("Error fetching property data:", error);
        // Set empty data to avoid UI issues when error occurs
        if (!isLoadMore) {
          setFilteredProperties([]);
          setTotalCount(0);
          setHasMore(false);
        }
      } finally {
        isLoadMore ? setLoadingMore(false) : setLoading(false);
      }
    },
    [filters, offset, categorySlug, citySlug, sortBy, limit, prevFilters],
  );

  useEffect(() => {
    if (router?.isReady) {
      // Only fetch data for initial load or filter changes, not for loadMore
      // The offset state is intentionally excluded from dependencies
      fetchData(false, true);
    }

  }, [filters, router?.isReady, sortBy]);



  // Helper function to check if filters have any active values (excluding context-based defaults)
  const hasActiveFiltersForUrl = (filters) => {
    return (
      filters.keywords !== "" ||
      filters.property_type !== "" ||
      filters.category_id !== "" ||
      filters.min_price !== "" ||
      filters.max_price !== "" ||
      filters.posted_since !== "" ||
      filters.promoted ||
      (filters.amenities && filters.amenities.length > 0) ||
      (filters.city && filters.city !== citySlug) ||
      filters.state !== "" ||
      filters.country !== "" ||
      filters.is_premium ||
      (filters.latitude !== undefined && filters.latitude !== locationData?.latitude) ||
      (filters.longitude !== undefined && filters.longitude !== locationData?.longitude) ||
      (filters.radius !== undefined && filters.radius !== (locationData?.radius ? parseInt(locationData.radius) : undefined))
    );
  };

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

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    fetchData(true);
  };

  const handleLoadMore = () => {
    loadMore();
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
    staleTime: 0,
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

      <div className="container mx-auto px-4 py-8">
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

        {(!isCategoryPage || categoryId !== null) && (
          <StoriesRail category_id={isCategoryPage ? categoryId : ""} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
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
          <div className="col-span-12 xl:col-span-9">
            {/* Filter Top Bar */}
            {loading ? (
              <FilterTopBarSkeleton />
            ) : (
              <FilterTopBar
                itemCount={filteredProperties.length}
                totalItems={totalCount}
                viewType={viewType}
                setViewType={handleSetViewType}
                sortBy={sortBy}
                setSortBy={setSortBy}
                onOpenFilters={() => setIsFilterSheetOpen(true)}
                showFilterButton={true}
                showSortBy={false}
              />
            )}

            {/* Property Listings */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {[...Array(9)].map((_, index) => (
                  <VerticlePropertyCardSkeleton key={index} />
                ))}
              </div>
            ) : (
              <PropertyListing
                properties={filteredProperties}
                setFilteredProperties={setFilteredProperties}
                totalCount={totalCount}
                onOpenFilters={() => setIsFilterSheetOpen(true)}
                hasActiveFilters={hasActiveFilters}
                viewType={viewType}
                setViewType={handleSetViewType}
              />
            )}

            {/* Load More Button */}
            {hasMore && !loading && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="brandColor brandBorder hover:border-transparent hover:primaryBg hover:text-white my-5 rounded-lg border bg-transparent px-4 py-3"
                >
                  {loadingMore ? t("loadingMore") : t("loadMore")}
                </button>
              </div>
            )}
          </div>
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
