import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Skeleton for articles section matching ArticlesSection layout exactly
const ArticleSectionSkeleton = () => {
  return (
    <div className="bg-white">
      <div className="container mx-auto px-2 md:px-0 py-5 md:py-10 lg:py-[60px]">
        <div className="flex flex-col gap-6 md:gap-12 items-center">
          {/* Section Title Skeleton */}
          <Skeleton className="h-7 md:h-8 lg:h-9 w-64 md:w-96 lg:w-[500px] mx-auto" />

          {/* Articles Grid - matches ArticlesSection layout */}
          <div className="w-full grid grid-cols-12 gap-4">
            {/* Left: Featured Article Skeleton */}
            <div className="relative col-span-12 md:col-span-6 rounded-2xl overflow-hidden shadow-lg max-h-[424px] md:h-[440px]">
              <Skeleton className="w-full h-[300px] md:h-full rounded-2xl" />
              {/* Content overlay skeleton */}
              <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 flex flex-col gap-2">
                {/* Category Badge */}
                <Skeleton className="h-8 w-28 rounded" />
                {/* Title */}
                <Skeleton className="h-6 md:h-7 w-full max-w-md" />
                <Skeleton className="h-6 md:h-7 w-3/4 max-w-sm" />
                {/* Author Meta */}
                <div className="flex items-center gap-2 mt-1">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            </div>

            {/* Right: Two Small Articles Skeleton */}
            <div className="col-span-12 md:col-span-6 flex flex-col gap-4">
              {[1, 2].map((_, idx) => (
                <div
                  key={idx}
                  className="flex flex-col md:flex-row md:gap-6 bg-white"
                >
                  {/* Article Image Skeleton */}
                  <Skeleton className="w-full md:w-[200px] h-[200px] min-w-[200px] min-h-[200px] rounded-2xl shrink-0" />
                  {/* Content Skeleton */}
                  <div className="mt-6 md:mt-0 flex-1 flex flex-col justify-center gap-4">
                    {/* Category Badge */}
                    <Skeleton className="h-9 w-24 rounded-lg" />
                    {/* Title */}
                    <div className="space-y-2 px-1">
                      <Skeleton className="h-4 md:h-5 w-full" />
                      <Skeleton className="h-4 md:h-5 w-3/4" />
                    </div>
                    {/* Author Meta */}
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Button Skeleton */}
          <Skeleton className="h-10 md:h-12 w-40 md:w-48 rounded-md" />
        </div>
      </div>
    </div>
  );
};

export default ArticleSectionSkeleton;
