import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Project card skeleton component - matches ProjectCardWithSwiper layout
const ProjectCardSkeleton = () => {
    return (
        <div className="flex w-full flex-col gap-4 overflow-hidden rounded-2xl">
            {/* Image section with aspect-[4/3] */}
            <div className="relative">
                <Skeleton className="aspect-[4/3] w-full rounded-2xl" />

                {/* Status badge skeleton - top left (Under Development) */}
                <div className="absolute left-4 top-4 z-5">
                    <Skeleton className="h-8 w-36 rounded" />
                </div>

                {/* Heart icon skeleton - top right */}
                <div className="absolute right-4 top-4">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                </div>
            </div>

            {/* Dark content section */}
            <div className="rounded-t-2xl bg-zinc-900 p-4">
                <div className="flex w-full flex-row gap-3 justify-between">
                    <div className="flex w-fit flex-col gap-6">
                        {/* Category badge skeleton */}
                        <Skeleton className="h-9 w-28 rounded-lg bg-zinc-700" />

                        <div className="flex flex-col gap-2">
                            {/* Title skeleton */}
                            <Skeleton className="h-6 w-44 bg-zinc-700" />
                            {/* Location skeleton */}
                            <Skeleton className="h-5 w-36 bg-zinc-700" />
                        </div>
                    </div>

                    {/* Premium badge skeleton */}
                    <Skeleton className="h-10 w-10 md:h-10 md:w-24 rounded-full bg-zinc-700 shrink-0" />
                </div>
            </div>
        </div>
    );
};

// Skeleton for projects section - matches HomeNewSectionTwo layout with projects_section type
const ProjectsSkeleton = () => {
    return (
        <div className="bg-white h-[850px] md:h-[720px]">
            <div className="container mx-auto px-4 md:px-0 py-5 sm:py-6 md:py-10 lg:pt-[60px] pb-3">
                <div className="flex flex-col gap-6 md:gap-12">
                    {/* Header section */}
                    <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-4 md:gap-12">
                        {/* Title skeleton - centered on mobile, left on desktop */}
                        <div className="flex flex-col items-center md:items-start gap-2">
                            <Skeleton className="h-6 md:h-9 w-72 md:w-[450px]" />
                            <Skeleton className="h-6 md:h-9 w-56 md:w-72" />
                        </div>
                        {/* Button skeleton - hidden on mobile */}
                        <Skeleton className="hidden md:block h-12 w-44 rounded-lg shrink-0" />
                    </div>

                    {/* Mobile Carousel skeleton - single card */}
                    <div className="w-full block md:hidden">
                        <div className="flex justify-center px-4">
                            <div className="w-[80%]">
                                <ProjectCardSkeleton />
                            </div>
                        </div>

                        {/* Mobile button skeleton */}
                        <div className="flex justify-center mt-4 mb-4">
                            <Skeleton className="h-10 w-40 rounded-lg" />
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

                    {/* Desktop Carousel skeleton - 3 cards visible (basis-1/3) */}
                    <div className="w-full hidden md:block">
                        <div className="flex gap-6">
                            {[1, 2, 3].map((_, index) => (
                                <div key={index} className="w-1/3">
                                    <ProjectCardSkeleton />
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

export default ProjectsSkeleton;
