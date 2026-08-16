import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useTranslation } from '../context/TranslationContext';
import { buildPropertyApiParams, isRTL } from '@/utils/helperFunction';
import { MdArrowDownward, MdArrowForward } from 'react-icons/md';
import PropertyVerticalCard from '../cards/PropertyVerticalCard';
import { useInfiniteQuery } from '@tanstack/react-query';
import * as api from "@/api/apiRoutes";
import { useSelector } from 'react-redux';
import CustomLink from '../context/CustomLink';
import { Skeleton } from '@/components/ui/skeleton';

const AllPropertiesSection = () => {
    const t = useTranslation();
    const isRtl = isRTL();

    const userSelectedLocation = useSelector(state => state.location);
    const language = useSelector((state) => state.LanguageSettings?.active_language);
    const locationData = useSelector((state) => state.location);

    const limit = 15;

    const filters = {
        city: locationData?.city ? locationData.city : "",
        state: locationData?.state ? locationData.state : "",
        country: locationData?.country ? locationData.country : "",
        latitude: locationData?.latitude,
        longitude: locationData?.longitude,
        radius: (locationData?.radius ? parseInt(locationData.radius) : undefined),
    };

    // Use React Query's useInfiniteQuery for pagination
    const {
        data,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        error
    } = useInfiniteQuery({
        queryKey: [
            'allProperties',
            userSelectedLocation?.latitude,
            userSelectedLocation?.longitude,
            userSelectedLocation?.radius,
            language
        ],
        queryFn: async ({ pageParam = 0 }) => {

            const apiParams = buildPropertyApiParams(filters, {
                limit,
                offset: pageParam,
            });

            const response = await api.getPropertyListApi(apiParams);
            return {
                data: response?.data || [],
                total: response?.total || 0,
                nextOffset: pageParam + limit
            };
        },
        getNextPageParam: (lastPage, allPages) => {
            // Calculate total loaded items
            const totalLoaded = allPages.reduce((acc, page) => acc + page.data.length, 0);
            // Return next offset if there are more items, otherwise undefined
            return totalLoaded < lastPage.total ? lastPage.nextOffset : undefined;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    // Flatten all pages into a single properties array
    const properties = useMemo(() => {
        return data?.pages?.flatMap((page) => page.data) || [];
    }, [data]);

    // Get total items from the first page
    const totalItems = data?.pages?.[0]?.total || 0;

    const handleLoadMore = () => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    };
    // Show loading state during initial load
    if (isLoading) {
        return (
            <section className="bg-white min-h-[1756px]">
                <div className="container mx-auto px-4 md:px-0 py-5 sm:py-6 md:py-10 lg:pt-[60px] pb-3">
                    <div className="flex flex-col gap-6 md:gap-12">
                        <div className="flex items-center justify-center md:justify-between gap-4 md:gap-12">
                            <Skeleton className="h-8 w-48" />
                            <div className="hidden md:block">
                                <Skeleton className="h-12 w-48" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
                            {[...Array(limit)].map((_, i) => (
                                <div key={i} className="newBorderColor flex flex-col h-[452px] overflow-hidden rounded-2xl border bg-white">
                                    <Skeleton className="h-[250px] w-full rounded-t-2xl" />
                                    <div className="p-4">
                                        <Skeleton className="h-5 w-3/4 mb-2" />
                                        <Skeleton className="h-4 w-1/2 mb-3" />
                                    </div>
                                    <div className="flex-grow" />
                                    <div className="border-t-2 border-gray-100 py-3">
                                        <div className="grid grid-cols-4 gap-2 px-2">
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-full" />
                                        </div>
                                    </div>
                                    <div className="h-[70px] p-4 flex items-center justify-between">
                                        <Skeleton className="h-6 w-24" />
                                        <Skeleton className="h-8 w-20 rounded-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    // Show error state if needed
    if (error) {
        return (
            <section className={`bg-white`}>
                <div className="container mx-auto px-4 md:px-0 py-5 sm:py-6 md:py-10 lg:pt-[60px] pb-3">
                    <div className="text-center py-12">
                        <p className="text-red-500">{t("errorLoadingProperties")}</p>
                    </div>
                </div>
            </section>
        );
    }
    if (properties.length === 0) {
        return null; // Don't render the section if there are no properties
    }

    return (
        <section className={`bg-white`}>
            <div className="container mx-auto px-4 md:px-0 py-5 sm:py-6 md:py-10 lg:pt-[60px] pb-3">
                <div className="flex flex-col gap-6 md:gap-12">
                    <div className="flex items-center justify-center md:justify-between gap-4 md:gap-12">
                        <h2 className="max-w-2xl text-xl text-center md:text-start md:text-3xl font-bold">{t("allProperties")}</h2>
                        <CustomLink
                            href={"/properties"}
                            className="hidden brandColor brandBorder md:flex items-center justify-center gap-2 rounded-lg border bg-white px-4 py-3 text-xl font-normal transition-colors duration-300 hover:bg-gray-50"
                        >
                            {t("exploreAllProperties")}
                            <MdArrowForward className={`${isRtl ? "rotate-180" : ""}`} />
                        </CustomLink>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
                        {properties?.map((property, index) => (
                            <PropertyVerticalCard
                                key={`${property?.id}-${index}` || `property-${index}`}
                                property={property}
                            />
                        ))}
                    </div>

                    {/* Load More Button - only show if there are more items */}
                    {hasNextPage && properties.length > 0 && (
                        <button
                            className="text-base mt-4 w-fit mx-auto brandColor mb-4 brandBorder flex items-center justify-center gap-2 rounded-lg border bg-white px-3 py-2 md:px-4 md:py-3 md:text-xl text-nowrap font-normal transition-colors duration-300 hover:brandBg hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleLoadMore}
                            disabled={isFetchingNextPage}
                        >
                            {isFetchingNextPage ? t("loading") : `${t("loadMore")} ${t("properties")}`}
                            {!isFetchingNextPage && <MdArrowDownward />}
                        </button>
                    )}
                </div>
            </div>
        </section>
    )
}

export default AllPropertiesSection