"use client";
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '../context/TranslationContext';
import { getAllProjectsApi } from '@/api/apiRoutes';
import NoDataFound from '../no-data-found/NoDataFound';
import NewBreadcrumb from '../breadcrumb/NewBreadCrumb';
import ProjectCardWithSwiper from '../cards/ProjectCardWithSwiper';
import ProjectCardSkeleton from '../skeletons/ProjectCardSkeleton';
import { useSelector, useDispatch } from 'react-redux';
import { setLockedFilter } from '@/redux/slices/propertyListSlice';
import { useRouter } from 'next/router';
import { decodeBase64FilterUrl, getPostedSince, isRTL, buildProjectFilters, getPostedSinceString } from '@/utils/helperFunction';
import ProjectSideFilter from '../pagescomponents/ProjectSideFilter';
import PropertySideFilterSkeleton from '../skeletons/PropertySideFilterSkeleton';
import { Sheet, SheetContent } from '../ui/sheet';
import FilterTopBarSkeleton from '../skeletons/FilterTopBarSkeleton';
import FilterTopBar from '../reusable-components/FilterTopBar';
import StoriesRail from '../stories/StoriesRail';

const ProjectListing = () => {
    const t = useTranslation();
    const isRtl = isRTL();

    const router = useRouter();
    const dispatch = useDispatch();
    const query = router?.query || {};
    const lang = query?.lang || 'en';
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [error, setError] = useState(null);
    const [offset, setOffset] = useState(0);
    const limit = 9;
    const [hasMore, setHasMore] = useState(true);
    const [totalItems, setTotalItems] = useState(0);
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
    const language = useSelector((state) => state.LanguageSettings?.active_language);
    const userData = useSelector((state) => state.User?.data);
    const locationData = useSelector((state) => state.location);
    const lockedFilter = useSelector((state) => state.propertyListFilters?.lockedFilter);

    useEffect(() => {
        return () => {
            dispatch(setLockedFilter(null));
        };
    }, [dispatch]);

    // Decode filters from base64 encoded URL param
    const getDecodedFilters = useCallback(() => {
        if (query.filters) {
            try {
                return decodeBase64FilterUrl(decodeURIComponent(query.filters));
            } catch (error) {
                console.error("Error decoding project filters:", error);
            }
        }
        return {};
    }, [query.filters]);

    const decodedFilters = getDecodedFilters();
    const latitude = decodedFilters?.location?.latitude || (lockedFilter === "location" ? locationData?.latitude : "") || "";
    const longitude = decodedFilters?.location?.longitude || (lockedFilter === "location" ? locationData?.longitude : "") || "";
    const radius = decodedFilters?.location?.radius || (lockedFilter === "location" ? locationData?.radius : "") || "";

    // Build filter state from URL
    const [filters, setFilters] = useState({
        keywords: "",
        category_id: "",
        city: "",
        state: "",
        country: "",
        posted_since: "",
        promoted: "",
        is_premium: "",
        most_viewed: "",
        most_liked: "",
        project_type: "",
    });

    // Initialize filters from URL
    useEffect(() => {
        if (router.isReady) {
            const decoded = getDecodedFilters();
            const locked = lockedFilter;

            // On back/forward navigation the unmount cleanup clears lockedFilter, but the
            // URL still carries the location. Re-derive the lock so city/state/country and
            // the lock indicator are restored correctly.
            const hasUrlLocation = !!(decoded?.location?.latitude && decoded?.location?.longitude);
            if (hasUrlLocation && !locked) {
                dispatch(setLockedFilter("location"));
                return; // re-runs once lockedFilter updates to "location"
            }

            setFilters({
                keywords: decoded?.search || "",
                category_id: decoded?.category_id || "",
                city: decoded?.location?.city || (locked === "location" && locationData?.city ? locationData.city : ""),
                state: decoded?.location?.state || (locked === "location" && locationData?.state ? locationData.state : ""),
                country: decoded?.location?.country || (locked === "location" && locationData?.country ? locationData.country : ""),
                posted_since: getPostedSinceString(decoded?.posted_since),
                promoted: decoded?.flags?.promoted ? "1" : (locked === "featured" ? "1" : ""),
                is_premium: decoded?.flags?.get_all_premium_properties ? "1" : (locked === "premium" ? "1" : ""),
                most_viewed: decoded?.flags?.most_views ? "1" : (locked === "most_viewed" ? "1" : ""),
                most_liked: decoded?.flags?.most_liked ? "1" : (locked === "most_liked" ? "1" : ""),
                project_type: decoded?.project_type !== undefined ? decoded.project_type : "",
            });
        }
    }, [router.isReady, query.filters, lockedFilter, locationData]);

    const fetchProjects = async (currentOffset = 0) => {
        setLoading(true);
        try {
            const { encodedFilters } = buildProjectFilters(filters, {
                latitude,
                longitude,
                radius
            });

            const apiParams = {
                limit: limit.toString(),
                offset: currentOffset.toString(),
            };

            if (encodedFilters) {
                apiParams.filters = encodedFilters;
            }

            const response = await getAllProjectsApi(apiParams);
            if (response && response.data) {
                if (currentOffset === 0) {
                    setProjects(response?.data);
                } else {
                    setProjects(prevProjects => [...prevProjects, ...response.data]);
                }
                setTotalItems(response.total || 0);
                setHasMore(response.data.length + currentOffset < response.total);
            } else {
                setHasMore(false);
                setIsInitialLoading(false);
                setLoading(false);
            }
        } catch (error) {
            setError(error);
            console.error(error);
        } finally {
            setLoading(false);
            setIsInitialLoading(false);
        }
    };

    const handleLoadMore = () => {
        const newOffset = offset + limit;
        setOffset(newOffset);
        fetchProjects(newOffset);
    };


    useEffect(() => {
        setOffset(0);
        fetchProjects(0);
    }, [language, latitude, longitude, radius, filters, userData?.id]);

    // Handle filter apply from side filter
    const handleFilterApply = (newFilters) => {
        setProjects([]);
        setOffset(0);
        setHasMore(false);
        setTotalItems(0);

        const mergedFilters = {
            ...newFilters,
            latitude,
            longitude,
            radius,
        };
        setFilters(mergedFilters);

        if (isFilterSheetOpen) {
            setIsFilterSheetOpen(false);
        }

        // Update URL with base64 encoded filters
        const { encodedUrlFilters } = buildProjectFilters(mergedFilters, {
            latitude,
            longitude,
            radius
        });

        try {
            const queryObj = { lang: lang };
            if (encodedUrlFilters) queryObj.filters = encodedUrlFilters;

            router?.push(
                {
                    pathname: `/projects`,
                    query: queryObj,
                },
                `/projects?${new URLSearchParams(queryObj).toString()}`
            );
        } catch (error) {
            console.error("Error updating URL with filters:", error);
        }
    };

    // Handle clear filter
    const handleClearFilter = () => {
        const locked = lockedFilter;
        setProjects([]);
        setOffset(0);
        setHasMore(false);
        setTotalItems(0);

        const clearedFilters = {
            keywords: "",
            category_id: "",
            city: locked === "location" ? (filters.city || "") : "",
            state: locked === "location" ? (filters.state || "") : "",
            country: locked === "location" ? (filters.country || "") : "",
            posted_since: "",
            promoted: locked === "featured" ? filters.promoted : "",
            is_premium: locked === "premium" ? filters.is_premium : "",
            most_viewed: locked === "most_viewed" ? filters.most_viewed : "",
            most_liked: locked === "most_liked" ? filters.most_liked : "",
            project_type: "",
        };

        if (isFilterSheetOpen) {
            setIsFilterSheetOpen(false);
        }
        setFilters(clearedFilters);

        const { encodedUrlFilters } = buildProjectFilters(clearedFilters, {
            latitude: locked === "location" ? filters.latitude : "",
            longitude: locked === "location" ? filters.longitude : "",
            radius: locked === "location" ? filters.radius : ""
        });

        const queryObj = { lang: lang };
        if (encodedUrlFilters) queryObj.filters = encodedUrlFilters;

        router?.push(
            {
                pathname: `/projects`,
                query: queryObj,
            },
            `/projects?${new URLSearchParams(queryObj).toString()}`
        );
    };

    return (
        <div>
            <NewBreadcrumb title={t("allProjects")} items={[{ href: "/projects", label: t("allProjects") }]} />
            <div className='container mx-auto py-10 px-4 md:px-2'>
                <StoriesRail />
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
                                    locked={lockedFilter}
                                />
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Desktop Side Filter */}
                    <div className="col-span-12 xl:col-span-3 sticky xl:top-[15vh] xl:self-start">
                        <div className="hidden xl:block">
                            {isInitialLoading ? (
                                <PropertySideFilterSkeleton />
                            ) : (
                                <ProjectSideFilter
                                    onFilterApply={handleFilterApply}
                                    handleClearFilter={handleClearFilter}
                                    currentFilters={filters}
                                    locked={lockedFilter}
                                />
                            )}
                        </div>
                    </div>

                    {/* Project Listing */}
                    <div className="col-span-12 h-fit xl:col-span-9">
                        {/* Filter Top Bar */}
                        {isInitialLoading ? (
                            <FilterTopBarSkeleton />
                        ) : (
                            <FilterTopBar
                                itemCount={projects.length}
                                totalItems={totalItems}
                                onOpenFilters={() => setIsFilterSheetOpen(true)}
                                showFilterButton={true}
                                showItemCount={true}
                                showSortBy={false}
                                showViewToggle={false}
                            />
                        )}

                        {/* Project Cards Grid */}
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                            {/* Loading skeletons */}
                            {loading && projects.length === 0 && (
                                [...Array(limit)].map((_, index) => (
                                    <ProjectCardSkeleton key={index} />
                                ))
                            )}

                            {/* No Data */}
                            {!loading && projects.length === 0 && (
                                <div className="col-span-full flex items-center justify-center">
                                    <NoDataFound />
                                </div>
                            )}

                            {/* Project Cards */}
                            {projects.map((project) => (
                                <ProjectCardWithSwiper key={project.id} data={project} />
                            ))}

                            {/* Load more skeletons */}
                            {loading && projects.length > 0 && (
                                [...Array(3)].map((_, index) => (
                                    <ProjectCardSkeleton key={`load-more-${index}`} />
                                ))
                            )}
                        </div>

                        {!loading && hasMore && (
                            <div className="mt-5 flex w-full items-center justify-center text-center">
                                <button
                                    className="brandColor hover:primaryBg brandBorder my-5 rounded-lg border hover:border-transparent hover:text-white px-4 py-2"
                                    onClick={handleLoadMore}
                                >
                                    {t("loadMore")}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectListing;