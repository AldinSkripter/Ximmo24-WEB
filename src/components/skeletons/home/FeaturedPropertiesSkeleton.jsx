import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Featured property horizontal card skeleton - matches FeaturedPropertyHorizontalCard layout
const FeaturedCardSkeleton = () => {
    return (
        <div className="brandBg rounded-2xl overflow-hidden flex flex-col sm:flex-row p-3 sm:p-4 md:p-5 lg:p-4 xl:p-5 2xl:p-6 gap-4 sm:gap-5 md:gap-6 lg:gap-4 xl:gap-5 2xl:gap-6">
            {/* Image section - left side */}
            <div className="relative w-full sm:w-[200px] md:w-[260px] lg:w-[150px] xl:w-[220px] 2xl:w-[230px] shrink-0">
                <Skeleton className="w-full aspect-[340/279] rounded-2xl bg-gray-700" />
                {/* Category badge skeleton - bottom left */}
                <div className="absolute bottom-4 left-4">
                    <Skeleton className="h-8 w-24 rounded-lg bg-gray-600" />
                </div>
                {/* Heart icon skeleton - top right */}
                <div className="absolute top-3 right-3">
                    <Skeleton className="h-8 w-8 rounded-md bg-gray-600" />
                </div>
            </div>

            {/* Content section - right side */}
            <div className="p-2 sm:p-3 md:p-4 lg:p-2 xl:p-3 2xl:p-4 flex flex-col flex-grow">
                {/* Featured badge and property type */}
                <div className="flex justify-between items-center mb-3">
                    <Skeleton className="h-6 w-20 rounded-md bg-gray-600" />
                    <Skeleton className="h-6 w-12 rounded-full bg-gray-600" />
                </div>

                {/* Title */}
                <Skeleton className="h-6 w-3/4 mb-2 bg-gray-600" />

                {/* Location */}
                <Skeleton className="h-4 w-1/2 mb-4 bg-gray-700" />

                {/* Parameters - 4 items with circular icon backgrounds */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-y-2 gap-x-3 mb-5">
                    {[1, 2, 3, 4].map((_, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <Skeleton className="w-8 h-8 rounded-full bg-gray-600" />
                            <Skeleton className="h-4 w-8 bg-gray-700" />
                        </div>
                    ))}
                </div>

                {/* Price and arrow button */}
                <div className="flex items-center justify-between mt-auto pt-3 sm:pt-4">
                    <div className="space-y-1">
                        <Skeleton className="h-3 w-10 bg-gray-700" />
                        <Skeleton className="h-6 w-24 bg-gray-600" />
                    </div>
                    <Skeleton className="w-12 h-12 rounded-full bg-gray-700" />
                </div>
            </div>
        </div>
    );
};

// Skeleton for featured properties section - matches HomeNewSectionFour layout
const FeaturedPropertiesSkeleton = () => {
    return (
        <div className="bg-black text-white h-auto md:h-[2216px]">
            <div className="container mx-auto px-4 md:px-0 py-5 md:py-10 lg:py-[60px]">
                <div className="grid grid-cols-1 items-start gap-6 md:gap-12 lg:grid-cols-3">
                    {/* Left column - sticky header */}
                    <div className="flex items-start flex-col lg:sticky lg:top-[180px] lg:col-span-1">
                        {/* Icon circle skeleton */}
                        <Skeleton className="mb-4 h-16 w-16 rounded-full brandBg" />

                        {/* Title skeleton - 2 lines */}
                        <div className="mb-4 space-y-2">
                            <Skeleton className="h-7 md:h-9 w-56 md:w-72 bg-gray-700" />
                            <Skeleton className="h-7 md:h-9 w-48 md:w-64 bg-gray-700" />
                        </div>

                        {/* Button skeleton */}
                        <Skeleton className="h-11 md:h-12 w-48 md:w-56 rounded-lg bg-gray-600" />
                    </div>

                    {/* Right column - property cards */}
                    <div className="relative flex flex-col gap-12 lg:col-span-2">
                        {[1, 2, 3, 4].map((_, index) => (
                            <FeaturedCardSkeleton key={index} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeaturedPropertiesSkeleton;
