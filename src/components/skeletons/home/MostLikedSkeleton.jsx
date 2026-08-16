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

// Skeleton for most liked properties section - matches HomeNewSectionTwo layout
const MostLikedSkeleton = () => {
    return (
        <div className="bg-white h-[787px] md:h-[787px]">
            <div className="container mx-auto px-4 md:px-0 py-5 sm:py-6 md:py-10 lg:pt-[60px] pb-3">
                <div className="flex flex-col gap-6 md:gap-12">
                    {/* Header section */}
                    <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-4 md:gap-12">
                        {/* Title skeleton - centered on mobile, left on desktop */}
                        <div className="flex flex-col items-center md:items-start gap-2">
                            <Skeleton className="h-6 md:h-9 w-72 md:w-[500px]" />
                            <Skeleton className="h-6 md:h-9 w-56 md:w-80" />
                        </div>
                        {/* Button skeleton - hidden on mobile */}
                        <Skeleton className="hidden md:block h-12 w-48 rounded-lg shrink-0" />
                    </div>

                    {/* Mobile Carousel skeleton - single card */}
                    <div className="w-full block md:hidden">
                        <div className="flex justify-center px-4">
                            <div className="w-[80%]">
                                <PropertyCardSkeleton />
                            </div>
                        </div>

                        {/* Mobile button skeleton */}
                        <div className="flex justify-center mt-4 mb-4">
                            <Skeleton className="h-10 w-44 rounded-lg" />
                        </div>

                        {/* Mobile navigation dots and arrows */}
                        <div className="flex justify-center mt-6 mb-10 gap-4">
                            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                            <div className="flex items-center gap-2">
                                <Skeleton className="w-2 h-2 rounded-full" />
                                <Skeleton className="w-3 h-3 rounded-full" />
                                <Skeleton className="w-2 h-2 rounded-full" />
                                <Skeleton className="w-2 h-2 rounded-full" />
                            </div>
                            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                        </div>
                    </div>

                    {/* Desktop Carousel skeleton - 4 cards visible */}
                    <div className="w-full hidden md:block">
                        <div className="flex gap-6">
                            {[1, 2, 3, 4].map((_, index) => (
                                <div key={index} className="w-1/4">
                                    <PropertyCardSkeleton />
                                </div>
                            ))}
                        </div>

                        {/* Desktop navigation dots and arrows */}
                        <div className="flex justify-center mt-12 gap-6">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <div className="flex items-center gap-2">
                                <Skeleton className="w-2 h-2 rounded-full" />
                                <Skeleton className="w-3 h-3 rounded-full" />
                                <Skeleton className="w-2 h-2 rounded-full" />
                                <Skeleton className="w-2 h-2 rounded-full" />
                            </div>
                            <Skeleton className="w-10 h-10 rounded-full" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MostLikedSkeleton;
