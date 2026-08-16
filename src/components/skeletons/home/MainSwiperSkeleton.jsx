import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Aspect ratios must match MainSwiper.jsx image className exactly to avoid CLS.
// Mobile: aspect-[1920/1080] (56.25%), lg+: aspect-[1920/700] (~36.5%)
const MainSwiperSkeleton = () => {
  return (
    <div className="relative w-full aspect-[1920/1080] lg:aspect-[1920/700]">
      <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
    </div>
  );
};

export default MainSwiperSkeleton;
