import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Premium property card skeleton - matches PremiumPropertyCard layout
const PremiumCardSkeleton = ({ className = '' }) => {
    return (
        <div className={`relative rounded-2xl overflow-hidden h-full p-3 bg-white ${className}`}>
            {/* Main image area */}
            <div className="w-full h-full relative">
                <Skeleton className="w-full aspect-[355/270] rounded-2xl" />

                {/* Badges at top-left */}
                <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                    <Skeleton className="h-6 w-20 rounded-md" />
                    <Skeleton className="h-6 w-20 rounded-md" />
                </div>

                {/* Floating white panel at bottom */}
                <div className="absolute bottom-0 left-0 right-0 bg-white rounded-xl shadow-sm p-3 m-3 flex flex-col items-start lg:flex-row lg:items-end justify-between gap-2">
                    <div className="flex flex-col gap-1 flex-1">
                        {/* Category badge */}
                        <Skeleton className="h-6 w-24 rounded-md mb-2" />
                        {/* Title */}
                        <Skeleton className="h-4 w-40 mb-1" />
                        {/* Location */}
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-3.5 w-3.5 rounded-full shrink-0" />
                            <Skeleton className="h-3.5 w-28" />
                        </div>
                    </div>
                    {/* See Details button */}
                    <Skeleton className="h-8 w-24 rounded-md shrink-0" />
                </div>
            </div>
        </div>
    );
};

// Skeleton for premium properties section - matches PremiumPropertiesSection layout
const PremiumPropertiesSkeleton = () => {
    return (
        <div className="bg-white h-auto">
            <div className="container mx-auto px-4 md:px-0 py-6 md:py-10 lg:py-[60px]">
                <div className="flex flex-col gap-6 md:gap-12">
                    {/* Section Title - centered */}
                    <div className="flex justify-center">
                        <Skeleton className="h-6 md:h-9 w-64 md:w-80" />
                    </div>

                    {/* Mobile Carousel skeleton */}
                    <div className="lg:hidden relative">
                        <div className="flex justify-center">
                            <div className="w-full max-w-md">
                                <PremiumCardSkeleton />
                            </div>
                        </div>

                        {/* Mobile navigation */}
                        <div className="flex justify-center gap-6 mt-4">
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

                    {/* Desktop Grid Layout - simple responsive grid, up to 8 cards */}
                    <div className="hidden lg:grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <PremiumCardSkeleton key={index} />
                        ))}
                    </div>

                    {/* See All Button skeleton - desktop only */}
                    <div className="hidden md:flex justify-center">
                        <Skeleton className="h-12 w-56 rounded-md" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PremiumPropertiesSkeleton;
