import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Skeleton for properties by cities section - matches HomeNewSectionTwo with CityCard layout
const CitiesSkeleton = () => {
    // Show 6 cards on desktop, matching the carousel view
    const cityCards = [1, 2, 3, 4, 5, 6];

    return (
        <div className="bg-gray-50 h-auto md:h-[560px]">
            <div className="container mx-auto px-4 md:px-0 py-5 sm:py-6 md:py-10 lg:pt-[60px] pb-3">
                <div className="flex flex-col gap-6 md:gap-12">
                    {/* Header section */}
                    <div className="flex items-center justify-center md:justify-between gap-4 md:gap-12">
                        {/* Title skeleton */}
                        <Skeleton className="h-7 md:h-9 w-56 md:w-72" />
                        {/* Button skeleton - hidden on mobile */}
                        <Skeleton className="hidden md:block h-12 w-40 rounded-lg" />
                    </div>

                    {/* Carousel content */}
                    <div className="relative">
                        <div className="flex gap-4 overflow-hidden">
                            {cityCards.map((_, index) => (
                                <div
                                    key={index}
                                    className="shrink-0 w-[200px] sm:w-[220px] md:w-[250px] h-[200px] sm:h-[220px] md:h-[250px] rounded-2xl border border-gray-200 bg-white p-4 flex flex-col justify-between"
                                >
                                    {/* Icon circle skeleton */}
                                    <Skeleton className="w-12 h-12 md:w-14 md:h-14 rounded-full" />

                                    {/* City info skeleton */}
                                    <div className="flex flex-col items-start gap-3">
                                        {/* City name */}
                                        <Skeleton className="h-5 md:h-6 w-24 md:w-32" />
                                        {/* Properties count */}
                                        <Skeleton className="h-4 md:h-5 w-20 md:w-24" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Mobile button skeleton */}
                        <div className="flex md:hidden justify-center mt-4 mb-4">
                            <Skeleton className="h-10 w-36 rounded-lg" />
                        </div>

                        {/* Navigation dots and arrows skeleton */}
                        <div className="flex justify-center mt-6 md:mt-12 mb-6 md:mb-0 gap-4 md:gap-6">
                            {/* Previous arrow */}
                            <Skeleton className="w-10 h-10 rounded-full" />
                            {/* Dots */}
                            <div className="flex items-center gap-2">
                                <Skeleton className="w-2 h-2 rounded-full" />
                                <Skeleton className="w-2 h-2 rounded-full" />
                                <Skeleton className="w-3 h-3 rounded-full" />
                                <Skeleton className="w-2 h-2 rounded-full" />
                            </div>
                            {/* Next arrow */}
                            <Skeleton className="w-10 h-10 rounded-full" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CitiesSkeleton;
