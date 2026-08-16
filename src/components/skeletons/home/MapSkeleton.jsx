import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Skeleton for properties on map section - matches HomePropertiesOnMap layout
const MapSkeleton = () => {
    return (
        <div className="relative bg-black text-white h-[878px] md:h-[844px]">
            <div className="container mx-auto px-4 py-6 sm:py-6 md:py-12 lg:py-[60px]">
                {/* Header section */}
                <div className="flex flex-col gap-6 md:gap-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center h-full">
                        <div className="flex items-center justify-between w-full">
                            {/* Title skeleton - matches "Find Homes, Apartments & More..." */}
                            <div className="flex flex-col gap-2 max-w-xl">
                                <Skeleton className="h-6 md:h-8 w-72 md:w-96 bg-white/10" />
                                <Skeleton className="h-6 md:h-8 w-64 md:w-80 bg-white/10" />
                            </div>
                            {/* Explore on Map button skeleton - hidden on mobile */}
                            <Skeleton className="hidden md:block h-12 w-40 rounded-lg bg-white/20" />
                        </div>
                    </div>

                    {/* Map container skeleton */}
                    <div className="w-full min-h-[400px] md:h-[600px] rounded-2xl overflow-hidden relative">
                        <Skeleton className="w-full h-full bg-gray-700/50" />

                        {/* Fake map pin markers for visual effect */}
                        <div className="absolute inset-0 pointer-events-none">
                            {/* Pin 1 - top left area */}
                            <div className="absolute top-[25%] left-[15%]">
                                <div className="w-8 h-10 bg-black/60 rounded-full rounded-br-none rotate-45" />
                            </div>
                            {/* Pin 2 - top center */}
                            <div className="absolute top-[15%] left-[45%]">
                                <div className="w-8 h-10 bg-black/60 rounded-full rounded-br-none rotate-45" />
                            </div>
                            {/* Pin 3 - top right */}
                            <div className="absolute top-[20%] right-[20%]">
                                <div className="w-8 h-10 bg-black/60 rounded-full rounded-br-none rotate-45" />
                            </div>
                            {/* Pin 4 - center */}
                            <div className="absolute top-[50%] left-[35%]">
                                <div className="w-8 h-10 bg-black/60 rounded-full rounded-br-none rotate-45" />
                            </div>
                            {/* Pin 5 - bottom left */}
                            <div className="absolute bottom-[20%] left-[12%]">
                                <div className="w-8 h-10 bg-black/60 rounded-full rounded-br-none rotate-45" />
                            </div>
                            {/* Pin 6 - bottom right */}
                            <div className="absolute bottom-[25%] right-[15%]">
                                <div className="w-8 h-10 bg-black/60 rounded-full rounded-br-none rotate-45" />
                            </div>
                        </div>

                        {/* Center overlay hint skeleton */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Skeleton className="h-12 w-48 rounded-md bg-white/10" />
                        </div>
                    </div>
                </div>

                {/* Mobile button skeleton - shown below map on mobile */}
                <div className="flex md:hidden mt-12 justify-center">
                    <Skeleton className="h-12 w-40 rounded-lg bg-white/20" />
                </div>
            </div>
        </div>
    );
};

export default MapSkeleton;
