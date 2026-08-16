import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Agent profile card skeleton - matches AgentProfileCard layout
const AgentCardSkeleton = () => {
    return (
        <div className="w-full bg-white rounded-2xl border border-gray-200">
            {/* Image section */}
            <div className="relative px-4 pt-4 w-full h-[250px] overflow-hidden rounded-t-2xl">
                <Skeleton className="w-full h-full rounded-lg" />

                {/* Verified badge skeleton - top left */}
                <div className="absolute top-6 left-6">
                    <Skeleton className="h-7 w-20 rounded-md" />
                </div>
            </div>

            {/* Agent info section */}
            <div className="p-4 lg:p-3">
                {/* Name */}
                <Skeleton className="h-5 w-32 mb-2" />
                {/* Email */}
                <Skeleton className="h-4 w-40 mb-4" />

                {/* Properties and Projects stats box */}
                <div className="flex flex-col items-center justify-evenly gap-2 border border-gray-100 rounded-lg p-3 xl:p-2 bg-gray-50">
                    {/* Properties row */}
                    <div className="flex items-center justify-center gap-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-8" />
                    </div>
                    {/* Divider */}
                    <div className="w-full h-[0.5px] bg-gray-200" />
                    {/* Projects row */}
                    <div className="flex items-center justify-center gap-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-8" />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Skeleton for agents section - matches AgentSwiperSection layout
const AgentSectionSkeleton = () => {
    return (
        <div className="bg-white py-5 md:py-10 lg:py-[60px] h-[735px] md:h-[956px]">
            <div className="primaryBgLight px-4 container mx-auto rounded-2xl h-full">
                <div className="w-full gap-6 py-12 md:py-[60px] md:px-[55px] lg:px-[75px] flex flex-col md:gap-12 relative h-full">
                    {/* Title skeleton - centered, multi-line */}
                    <div className="flex flex-col items-center gap-2 mx-auto max-w-2xl">
                        <Skeleton className="h-6 md:h-9 w-72 md:w-[550px]" />
                        <Skeleton className="h-6 md:h-9 w-56 md:w-96" />
                    </div>

                    {/* Mobile Carousel skeleton - single card */}
                    <div className="w-full block md:hidden flex-1">
                        <div className="flex justify-center px-4">
                            <div className="w-full max-w-[300px]">
                                <AgentCardSkeleton />
                            </div>
                        </div>
                    </div>

                    {/* Desktop Carousel skeleton - 4 cards visible */}
                    <div className="w-full hidden md:block flex-1">
                        <div className="flex gap-4">
                            {[1, 2, 3, 4].map((_, index) => (
                                <div key={index} className="flex-1">
                                    <AgentCardSkeleton />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Find Your Agent Button skeleton - centered */}
                    <div className="flex justify-center">
                        <Skeleton className="h-12 w-44 rounded-md bg-gray-300" />
                    </div>

                    {/* Navigation arrows - left */}
                    <div className="absolute top-1/2 -translate-y-1/2 -left-2 md:left-0">
                        <Skeleton className="h-10 md:h-16 w-10 md:w-10 rounded-md" />
                    </div>

                    {/* Navigation arrows - right */}
                    <div className="absolute top-1/2 -translate-y-1/2 -right-2 md:right-0">
                        <Skeleton className="h-10 md:h-16 w-10 md:w-10 rounded-md" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentSectionSkeleton;
