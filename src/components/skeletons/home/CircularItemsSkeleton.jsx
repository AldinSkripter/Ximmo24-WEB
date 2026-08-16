import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Category card skeleton - matches CategoryCard layout
// Mobile: vertical centered layout | Desktop: horizontal layout
const CategoryCardSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-200 flex flex-col lg:flex-row justify-center items-center gap-4 lg:gap-6 min-h-[180px] lg:min-h-0">
      {/* Icon box skeleton - centered on mobile, left on desktop */}
      <Skeleton className="w-16 h-16 lg:w-[72px] lg:h-[72px] rounded-lg shrink-0" />

      {/* Text content - centered on mobile, left-aligned on desktop */}
      <div className="flex flex-col items-center lg:items-start gap-2 lg:gap-3 w-full">
        {/* Category name */}
        <Skeleton className="h-5 md:h-6 w-20 lg:w-32" />
        {/* Properties count */}
        <Skeleton className="h-4 md:h-5 w-24 lg:w-28" />
      </div>
    </div>
  );
};

// Skeleton for categories section - matches HomeNewSectionOne with CategoryCard
const CircularItemsSkeleton = () => {
  return (
    <div className="primaryBgLight h-[427px] md:h-[572px]">
      <div className="container mx-auto px-2 md:px-0 py-5 md:py-10 lg:py-[60px]">
        <div className="flex flex-col gap-6 md:gap-12 items-center">
          {/* Section Title skeleton - centered, multi-line on mobile */}
          <div className="flex flex-col items-center gap-2 px-4">
            <Skeleton className="h-6 md:h-8 w-64 md:w-[500px]" />
            <Skeleton className="h-6 md:h-8 w-56 md:w-80" />
            <Skeleton className="h-6 md:hidden w-32" />
          </div>

          {/* Mobile Carousel skeleton - 2 columns */}
          <div className="w-full block md:hidden">
            <div className="grid grid-cols-2 gap-3 px-2">
              {[1, 2, 3, 4].map((_, index) => (
                <CategoryCardSkeleton key={index} />
              ))}
            </div>
          </div>

          {/* Desktop Grid skeleton - 4x2 grid */}
          <div className="w-full hidden md:block">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((_, index) => (
                <CategoryCardSkeleton key={index} />
              ))}
            </div>
          </div>

          {/* View All Categories Button skeleton */}
          <Skeleton className="h-10 md:h-12 w-44 md:w-52 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export default CircularItemsSkeleton;
