import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Skeleton for PropertyHorizontalCard used in desktop grid
const PropertyHorizontalCardSkeleton = () => {
    return (
        <div className="group">
            <article className="cardBg lg:h-[250px] transition-all duration-500 cardBorder mx-auto grid grid-cols-1 overflow-hidden rounded-2xl lg:grid-cols-12">
                {/* Image Section */}
                <figure className="relative col-span-5">
                    <Skeleton className="h-[250px] w-full" />
                    {/* Favorite button */}
                    <Skeleton className="p-2 rounded-lg absolute top-2 right-2 h-8 w-8" />
                    {/* Featured tag */}
                    <Skeleton className="absolute left-3 top-3 h-7 w-20 rounded-md" />
                </figure>

                {/* Content Section */}
                <div className="md:col-span-7 w-full flex flex-col gap-2 cardBg">
                    {/* Header Section */}
                    <header className="mx-2 p-2 flex-grow">
                        <div className="flex justify-between items-center">
                            {/* Category */}
                            <Skeleton className="h-9 w-28 rounded-lg" />
                            {/* Property type (sell/rent) */}
                            <Skeleton className="h-7 w-14 rounded-[100px]" />
                        </div>

                        {/* Title */}
                        <Skeleton className="mt-2 h-6 w-4/5" />
                        {/* Location */}
                        <Skeleton className="mt-2 h-4 w-3/5" />
                    </header>

                    {/* Parameters Section */}
                    <div>
                        <Skeleton className="h-[1px] w-full" /> {/* Divider */}
                        <div className="flex items-center gap-6 px-4 py-3">
                            {[1, 2, 3, 4].map((i) => (
                                <React.Fragment key={i}>
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex h-8 w-8 items-center justify-center">
                                            <Skeleton className="absolute inset-0 rounded-full" />
                                        </div>
                                        <Skeleton className="h-4 w-8" />
                                    </div>
                                    {i < 4 && <Skeleton className="h-6 w-[2px]" />}
                                </React.Fragment>
                            ))}
                        </div>
                        <Skeleton className="h-[1px] w-full" /> {/* Divider */}
                    </div>

                    {/* Footer Section */}
                    <footer className="mx-2 flex items-center justify-between p-2">
                        {/* Price */}
                        <Skeleton className="h-6 w-24" />
                        {/* Premium badge */}
                        <Skeleton className="h-10 w-28 rounded-[100px]" />
                    </footer>
                </div>
            </article>
        </div>
    );
};

// Skeleton for PropertyVerticalCard used in mobile carousel
const PropertyVerticalCardSkeleton = () => {
    return (
        <div className="cardBorder cardBg flex flex-col gap-4 overflow-hidden rounded-xl w-full max-w-[300px]">
            {/* Image Section */}
            <div className="relative">
                <Skeleton className="h-48 w-full" />
                {/* Premium & Featured Tags */}
                <div className="flex items-center gap-2 absolute top-3 left-3">
                    <Skeleton className="h-7 w-7 rounded" />
                    <Skeleton className="h-8 w-20 rounded" />
                </div>
                {/* Heart Button */}
                <Skeleton className="absolute right-5 top-4 h-8 w-8 rounded-full" />
            </div>

            {/* Property Details Section */}
            <div className="flex flex-grow flex-col gap-4 pb-4">
                {/* Header Section */}
                <div className="px-4 space-y-2">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-5 rounded" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>

                <Skeleton className="mx-4 h-[1px]" />

                {/* Features Grid */}
                <div className="grid grid-cols-3 items-center justify-center gap-2 px-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-2">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-4 w-10" />
                        </div>
                    ))}
                </div>

                <Skeleton className="mx-4 h-[1px]" />

                {/* Footer */}
                <div className="flex items-center justify-between px-4">
                    <Skeleton className="h-6 w-16 rounded-md" />
                    <Skeleton className="h-6 w-24" />
                </div>
            </div>
        </div>
    );
};

// Main skeleton for user recommendations section
const UserRecommendationSkeleton = () => {
    return (
        <div className="primaryBgLight">
            <div className="container mx-auto px-2 md:px-0 py-5 md:py-10 lg:py-[60px]">
                <div className="flex flex-col gap-6 md:gap-12 items-center">
                    {/* Section Title Skeleton */}
                    <Skeleton className="h-7 md:h-8 lg:h-9 w-72 md:w-[450px] lg:w-[550px] mx-auto" />

                    {/* Mobile Carousel View */}
                    <div className="w-full block md:hidden">
                        <div className="relative">
                            <div className="flex gap-4 overflow-hidden justify-center">
                                <PropertyVerticalCardSkeleton />
                            </div>
                            {/* Carousel Controls */}
                            <div className="flex justify-center gap-6 mt-6">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4].map((i) => (
                                        <Skeleton key={i} className="h-2 w-2 rounded-full" />
                                    ))}
                                </div>
                                <Skeleton className="h-10 w-10 rounded-full" />
                            </div>
                        </div>
                    </div>

                    {/* Desktop Grid View - 2x2 grid */}
                    <div className="w-full hidden md:block">
                        <div className="grid grid-cols-2 gap-6 justify-center mx-auto">
                            {[1, 2, 3, 4].map((i) => (
                                <PropertyHorizontalCardSkeleton key={i} />
                            ))}
                        </div>
                    </div>

                    {/* Button Skeleton - shown when more than 4 items */}
                    <Skeleton className="h-10 md:h-12 w-44 md:w-52 rounded-md" />
                </div>
            </div>
        </div>
    );
};

export default UserRecommendationSkeleton;
