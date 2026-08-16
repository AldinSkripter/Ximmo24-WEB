import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Property card skeleton component - matches PropertyVerticalCard layout
const PropertyCardSkeleton = () => {
    return (
        <div className="flex flex-col overflow-hidden w-full rounded-2xl border border-gray-200 bg-white">
            {/* Image section */}
            <div className="relative">
                <Skeleton className="h-[250px] w-full rounded-t-2xl" />

                {/* Featured badge skeleton - top left */}
                <div className="absolute left-3 top-3">
                    <Skeleton className="h-7 w-20 rounded-lg" />
                </div>

                {/* Heart icon skeleton - top right */}
                <div className="absolute right-3 top-3">
                    <Skeleton className="h-8 w-8 rounded-md" />
                </div>

                {/* Category badge skeleton - bottom left */}
                <div className="absolute bottom-3 left-3">
                    <Skeleton className="h-7 w-24 rounded-md" />
                </div>
            </div>

            {/* Content section */}
            <div className="flex flex-grow flex-col">
                {/* Title, location, and property type */}
                <div className="mb-2 flex items-start justify-between p-4">
                    <div className="flex-1 mr-2">
                        {/* Title */}
                        <Skeleton className="h-5 w-3/4 mb-1.5" />
                        {/* Location */}
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                    {/* Property type badge (Sell/Rent) */}
                    <Skeleton className="h-6 w-12 rounded-full shrink-0" />
                </div>

                {/* Parameters row (beds, baths, area, etc.) */}
                <div className="grid w-full grid-cols-4 divide-x divide-gray-200 border-b-2 border-t-2 border-gray-100 py-3">
                    {[1, 2, 3, 4].map((_, index) => (
                        <div key={index} className="flex items-center justify-center gap-1 px-2">
                            <Skeleton className="h-4 w-4 shrink-0" />
                            <Skeleton className="h-4 w-8" />
                        </div>
                    ))}
                </div>

                {/* Price and premium badge section */}
                <div className="mt-auto h-[70px] flex items-center justify-between p-4">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-8 w-20 rounded-full" />
                </div>
            </div>
        </div>
    );
};

// Skeleton for nearby properties section - matches HomeNewSectionOne layout
const NearbyPropertiesSkeleton = () => {
    return (
        <div className="bg-white h-auto md:h-[1274px]">
            <div className="container mx-auto px-2 md:px-0 py-5 md:py-10 lg:py-[60px]">
                <div className="flex flex-col gap-6 md:gap-12 items-center">
                    {/* Section Title skeleton */}
                    <div className="flex flex-col items-center gap-2">
                        <Skeleton className="h-7 md:h-9 w-64 md:w-96" />
                        <Skeleton className="h-7 md:h-9 w-48 md:w-72" />
                    </div>

                    {/* Mobile Carousel skeleton */}
                    <div className="w-full block md:hidden">
                        <div className="flex gap-4 overflow-hidden px-2">
                            <div className="shrink-0 w-[85%]">
                                <PropertyCardSkeleton />
                            </div>
                            <div className="shrink-0 w-[85%] opacity-50">
                                <PropertyCardSkeleton />
                            </div>
                        </div>
                        {/* Mobile navigation dots */}
                        <div className="flex justify-center gap-6 mt-6">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <div className="flex items-center gap-2">
                                <Skeleton className="w-2 h-2 rounded-full" />
                                <Skeleton className="w-3 h-3 rounded-full" />
                                <Skeleton className="w-2 h-2 rounded-full" />
                            </div>
                            <Skeleton className="w-10 h-10 rounded-full" />
                        </div>
                    </div>

                    {/* Desktop Grid skeleton - 4x2 grid */}
                    <div className="w-full hidden md:block">
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((_, index) => (
                                <PropertyCardSkeleton key={index} />
                            ))}
                        </div>
                    </div>

                    {/* Explore More Button skeleton */}
                    <Skeleton className="h-11 md:h-12 w-44 md:w-52 rounded-md" />
                </div>
            </div>
        </div>
    );
};

export default NearbyPropertiesSkeleton;
