import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Skeleton for FAQs section - matches Faqs.jsx layout exactly
const FaqsSkeleton = () => {
    return (
        <section className="cardBg">
            <div className="container py-5 px-5 md:py-12 lg:py-[60px]">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column - Title, Description, Button */}
                    <div className="flex flex-col col-span-6 gap-8">
                        {/* Title skeleton - matches text-xl lg:text-2xl xl:text-[32px] */}
                        <Skeleton className="h-7 w-4/5 lg:h-8 xl:h-10" />

                        {/* Description skeleton - multiple lines for paragraph */}
                        <div className="flex flex-col gap-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>

                        {/* Button skeleton - matches px-4 py-3 styling */}
                        <Skeleton className="h-12 w-44 rounded-md" />
                    </div>

                    {/* Right Column - FAQ Accordion Items */}
                    <div className="col-span-6">
                        <div className="w-full flex flex-col gap-4">
                            {/* First item - expanded state with dark background */}
                            <div className="border rounded-lg overflow-hidden">
                                <div className="brandBg flex justify-between items-center w-full py-4 px-5 rounded-t-lg">
                                    <Skeleton className="h-5 w-4/5 bg-white/20" />
                                    <Skeleton className="h-6 w-6 rounded-full shrink-0 bg-white/20" />
                                </div>
                                {/* Expanded content area */}
                                <div className="py-2 px-5">
                                    <div className="flex flex-col gap-2 py-2">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-11/12" />
                                    </div>
                                </div>
                            </div>

                            {/* Collapsed FAQ items */}
                            {[1, 2, 3].map((_, index) => (
                                <div key={index} className="border rounded-lg">
                                    <div className="flex justify-between items-center w-full py-4 px-5">
                                        <Skeleton className="h-5 w-4/5" />
                                        <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FaqsSkeleton;
