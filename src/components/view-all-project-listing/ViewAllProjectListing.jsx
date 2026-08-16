"use client";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "../context/TranslationContext";
import { getAllProjectsApi } from "@/api/apiRoutes";
import ProjectCardWithSwiper from "../cards/ProjectCardWithSwiper";
import NewBreadcrumb from "../breadcrumb/NewBreadCrumb";
import { NewBreadcrumbSkeleton, ProjectCardSkeleton } from "../skeletons";
import NoDataFound from "../no-data-found/NoDataFound";
import { useSelector, useDispatch } from "react-redux";
import { setLockedFilter } from "@/redux/slices/propertyListSlice";
import { decodeBase64FilterUrl, getCamelCaseSlug, isRTL, buildProjectFilters, getPostedSinceString } from "@/utils/helperFunction";
import ProjectSideFilter from "../pagescomponents/ProjectSideFilter";
import PropertySideFilterSkeleton from "../skeletons/PropertySideFilterSkeleton";
import { Sheet, SheetContent } from "../ui/sheet";
import FilterTopBarSkeleton from "../skeletons/FilterTopBarSkeleton";
import FilterTopBar from "../reusable-components/FilterTopBar";

const ViewAllProjectListing = () => {
  const router = useRouter();
  const t = useTranslation();
  const dispatch = useDispatch();
  const { lang } = router?.query || {};
  const isRtl = isRTL();

  const slug = router?.query?.slug;

  const reduxLocked = useSelector((state) => state.propertyListFilters?.lockedFilter);
  let locked = reduxLocked;
  if (!locked) {
    if (slug === "featured-projects") locked = "featured";
    else if (slug === "most-viewed-projects") locked = "most_viewed";
    else if (slug === "most-favourite-projects") locked = "most_liked";
    else if (slug === "projects-nearby-city") locked = "location";
  }

  useEffect(() => {
    return () => {
      dispatch(setLockedFilter(null));
    };
  }, [dispatch]);

  const initializeFiltersFromQuery = useCallback(() => {
    const query = router?.query || {};
    if (query.filters) {
      try {
        const decodedFilters = decodeBase64FilterUrl(decodeURIComponent(query.filters));
        return {
          keywords: decodedFilters.search || "",
          category_id: decodedFilters.category_id || "",
          city: decodedFilters.location?.city || "",
          state: decodedFilters.location?.state || "",
          country: decodedFilters.location?.country || "",
          posted_since: getPostedSinceString(decodedFilters.posted_since),
          latitude: decodedFilters.location?.latitude || "",
          longitude: decodedFilters.location?.longitude || "",
          radius: decodedFilters.location?.radius || "",
          promoted: decodedFilters.flags?.promoted || 0,
          is_premium: decodedFilters.flags?.get_all_premium_properties || 0,
          most_viewed: decodedFilters.flags?.most_views || 0,
          most_liked: decodedFilters.flags?.most_liked || 0,
          project_type: decodedFilters.project_type !== undefined ? decodedFilters.project_type : "",
        };
      } catch (error) {
        console.error("Error decoding filters from URL:", error);
      }
    }

    return {
      keywords: "",
      category_id: "",
      city: "",
      state: "",
      country: "",
      posted_since: "",
      latitude: "",
      longitude: "",
      radius: "",
      promoted: locked === "featured" ? 1 : 0,
      is_premium: locked === "premium" ? 1 : 0,
      most_viewed: locked === "most_viewed" ? 1 : 0,
      most_liked: locked === "most_liked" ? 1 : 0,
      project_type: "",
    };
  }, [router?.query, locked]);

  const [projectData, setProjectData] = useState([]);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filters, setFilters] = useState(initializeFiltersFromQuery());
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const language = useSelector((state) => state?.LanguageSettings?.current_language);
  const userData = useSelector((state)=> state.User?.data);
  const hasInitialFetched = useRef(false);
  const prevFiltersRef = useRef();
  const prevSlugRef = useRef();
  const isFetchingRef = useRef(false);

  const limit = 12;

  // Get slug-specific flags
  const getSlugFlags = (currentSlug) => {
    switch (currentSlug) {
      case "featured-projects":
        return { promoted: 1, most_viewed: 0, most_liked: 0 };
      case "most-viewed-projects":
        return { promoted: 0, most_viewed: 1, most_liked: 0 };
      case "most-favourite-projects":
        return { promoted: 0, most_viewed: 0, most_liked: 1 };
      default:
        return { promoted: 0, most_viewed: 0, most_liked: 0 };
    }
  };

  // Handle slug changes — only reset data/state, don't set filters here
  // Filters are set exclusively by the "Initialize filters" useEffect below
  useEffect(() => {
    if (!slug) return;
    if (prevSlugRef.current === slug) return;

    setProjectData([]);
    setOffset(0);
    setHasMoreData(false);
    setTotalItems(0);
    setInitialLoading(true);

    hasInitialFetched.current = false;
    isFetchingRef.current = false;

    prevSlugRef.current = slug;
  }, [slug]);

  // Handle pagination (load more)
  useEffect(() => {
    if (offset > 0 && slug) {
      handleFetchData(filters, offset);
    }
  }, [offset]);

  const handleLoadMore = () => {
    if (hasMoreData) {
      setOffset((prev) => prev + limit);
    }
  };

  const handleFetchData = async (params, currentOffset) => {
    if (isFetchingRef.current && currentOffset === 0) {
      return;
    }

    try {
      isFetchingRef.current = true;
      setIsLoading(true);

      // Always enforce slug-specific flags
      const slugFlags = getSlugFlags(slug);

      // Build structured API params matching property API format
      const { encodedFilters } = buildProjectFilters(params, {
        latitude: params?.latitude,
        longitude: params?.longitude,
        radius: params?.radius,
        slugFlags
      });

      const apiParams = {
        limit: limit.toString(),
        offset: currentOffset.toString(),
      };

      if (encodedFilters) {
        apiParams.filters = encodedFilters;
      }

      const res = await getAllProjectsApi(apiParams);
      if (!res?.error) {
        if (currentOffset === 0) {
          setProjectData(res?.data || []);
        } else {
          setProjectData((prev) => [...prev, ...(res?.data || [])]);
        }
        evaluateMoreData(
          res?.total || 0,
          currentOffset,
          res?.data?.length || 0,
        );
      }
      setIsLoading(false);
      setInitialLoading(false);
      isFetchingRef.current = false;
    } catch (err) {
      console.error("Error fetching project data:", err);
      setIsLoading(false);
      setInitialLoading(false);
      setHasMoreData(false);
      isFetchingRef.current = false;
    }
  };

  const evaluateMoreData = (total, currentOffset, loadedItems) => {
    setTotalItems(total);
    const hasMore = currentOffset + loadedItems < total;
    setHasMoreData(hasMore);
    return hasMore;
  };

  // Single effect: compute filters from URL + slug, update state, and fetch
  useEffect(() => {
    if (!router.isReady || !slug) return;

    const initialFilters = initializeFiltersFromQuery();
    const slugFlags = getSlugFlags(slug);
    // most_viewed/most_liked: exclusively controlled by slug
    // promoted: controlled by slug on featured-projects, otherwise from URL/side filter
    const newFilters = {
      ...initialFilters,
      most_viewed: slugFlags.most_viewed,
      most_liked: slugFlags.most_liked,
      promoted: slug === "featured-projects" ? 1 : (initialFilters.promoted || 0),
    };

    const filtersChanged = prevFiltersRef.current &&
      JSON.stringify(prevFiltersRef.current) !== JSON.stringify(newFilters);

    // Update filter state for the side filter UI
    setFilters(newFilters);
    prevFiltersRef.current = newFilters;

    if (!hasInitialFetched.current || filtersChanged) {
      hasInitialFetched.current = true;

      if (filtersChanged) {
        setProjectData([]);
        setOffset(0);
        setHasMoreData(false);
        setTotalItems(0);
      }

      // Fetch directly with computed filters — no stale state
      handleFetchData(newFilters, 0);
    }
  }, [router.isReady, slug, language, initializeFiltersFromQuery,userData?.id]);

  // Handle filter apply from side filter
  const handleFilterApply = (newFilters) => {
    // Reset state for fresh fetch
    setProjectData([]);
    setOffset(0);
    setHasMoreData(false);
    setTotalItems(0);
    hasInitialFetched.current = false;
    isFetchingRef.current = false;

    if (isFilterSheetOpen) {
      setIsFilterSheetOpen(false);
    }

    // Build URL filters — the URL change will trigger initializeFiltersFromQuery → setFilters → fetch
    const slugFlags = getSlugFlags(slug);
    const { encodedUrlFilters } = buildProjectFilters(newFilters, {
      latitude: filters.latitude,
      longitude: filters.longitude,
      radius: filters.radius,
      slugFlags
    });

    try {
      const queryObj = { lang: lang };
      if (encodedUrlFilters) queryObj.filters = encodedUrlFilters;

      router?.push(
        {
          pathname: `/projects/${slug}`,
          query: queryObj,
        },
        `/projects/${slug}?${new URLSearchParams(queryObj).toString()}`
      );
    } catch (error) {
      console.error("Error updating URL with filters:", error);
    }
  };

  // Handle clear filter
  const handleClearFilter = () => {
    setProjectData([]);
    setOffset(0);
    setHasMoreData(false);
    setTotalItems(0);
    hasInitialFetched.current = false;
    isFetchingRef.current = false;

    if (isFilterSheetOpen) {
      setIsFilterSheetOpen(false);
    }

    // Preserve locked values
    const clearedFilters = {
      keywords: "",
      category_id: "",
      city: locked === "location" ? (filters.city || "") : "",
      state: locked === "location" ? (filters.state || "") : "",
      country: locked === "location" ? (filters.country || "") : "",
      posted_since: "",
      latitude: locked === "location" ? filters.latitude : "",
      longitude: locked === "location" ? filters.longitude : "",
      radius: locked === "location" ? filters.radius : "",
      promoted: locked === "featured" ? filters.promoted : (slug === "featured-projects" ? 1 : 0),
      is_premium: locked === "premium" ? filters.is_premium : 0,
      most_viewed: locked === "most_viewed" ? filters.most_viewed : (slug === "most-viewed-projects" ? 1 : 0),
      most_liked: locked === "most_liked" ? filters.most_liked : (slug === "most-favourite-projects" ? 1 : 0),
      project_type: "",
    };

    setFilters(clearedFilters);

    // Build URL filters
    const slugFlags = getSlugFlags(slug);
    const { encodedUrlFilters } = buildProjectFilters(clearedFilters, {
      latitude: clearedFilters.latitude,
      longitude: clearedFilters.longitude,
      radius: clearedFilters.radius,
      slugFlags
    });

    const queryObj = { lang: lang };
    if (encodedUrlFilters) queryObj.filters = encodedUrlFilters;

    router?.push(
      {
        pathname: `/projects/${slug}`,
        query: queryObj,
      },
      `/projects/${slug}?${new URLSearchParams(queryObj).toString()}`
    );
  };

  return (
    <main>
      {initialLoading ? (
        <NewBreadcrumbSkeleton />
      ) : (
        <NewBreadcrumb title={t(getCamelCaseSlug(slug))} items={[{ label: t(getCamelCaseSlug(slug)), href: `/projects/${slug}` }]} />
      )}

      <div className="container mx-auto py-10 md:py-[60px] px-4 md:px-2">
        <div className="grid grid-cols-12 gap-4">
          {/* Mobile Filter Sheet */}
          <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
            <SheetContent
              side={isRtl ? "left" : "right"}
              className="flex h-full w-full flex-col place-content-center !p-0 [&>button]:hidden"
            >
              <div className="overflow-y-auto no-scrollbar h-full p-2">
                <ProjectSideFilter
                  showBorder={false}
                  onFilterApply={handleFilterApply}
                  handleClearFilter={handleClearFilter}
                  setIsFilterSheetOpen={setIsFilterSheetOpen}
                  isMobileSheet={true}
                  currentFilters={filters}
                  hideFilter={true}
                  hideFilterType={slug}
                  locked={locked}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop Side Filter */}
          <div className="col-span-12 xl:col-span-3 sticky xl:top-[15vh] xl:self-start">
            <div className="hidden xl:block">
              {initialLoading ? (
                <PropertySideFilterSkeleton />
              ) : (
                <ProjectSideFilter
                  onFilterApply={handleFilterApply}
                  handleClearFilter={handleClearFilter}
                  currentFilters={filters}
                  hideFilter={true}
                  hideFilterType={slug}
                  locked={locked}
                />
              )}
            </div>
          </div>

          {/* Project Listing */}
          <div className="col-span-12 h-fit xl:col-span-9">
            {/* Filter Top Bar */}
            {initialLoading ? (
              <FilterTopBarSkeleton />
            ) : (
              <FilterTopBar
                itemCount={projectData.length}
                totalItems={totalItems}
                onOpenFilters={() => setIsFilterSheetOpen(true)}
                showFilterButton={true}
                showItemCount={true}
                showSortBy={false}
                showViewToggle={false}
              />
            )}

            {/* Project Cards Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Loading skeletons for initial load */}
              {isLoading && projectData.length === 0 && (
                <>
                  {[...Array(12)].map((_, index) => (
                    <ProjectCardSkeleton key={`skeleton-${index}`} />
                  ))}
                </>
              )}

              {/* No Data Found */}
              {!isLoading && projectData.length === 0 && (
                <div className="col-span-full flex items-center justify-center">
                  <NoDataFound title={t("noDataFound")} />
                </div>
              )}

              {/* Project Cards */}
              {(!isLoading || projectData.length > 0) && projectData.length > 0 && (
                projectData.map((project) => (
                  <ProjectCardWithSwiper key={project.id} data={project} />
                ))
              )}

              {/* Load more skeletons */}
              {isLoading && projectData.length > 0 && (
                <>
                  {[...Array(3)].map((_, index) => (
                    <ProjectCardSkeleton key={`load-more-skeleton-${index}`} />
                  ))}
                </>
              )}
            </div>

            {isLoading === false && hasMoreData ? (
              <div className="mt-5 flex w-full items-center justify-center text-center">
                <button
                  className="brandText brandBorder hover:border-transparent hover:primaryBg hover:text-white my-5 rounded-lg border bg-transparent px-4 py-3"
                  onClick={handleLoadMore}
                >
                  {t("loadMore")}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
};

export default ViewAllProjectListing;
