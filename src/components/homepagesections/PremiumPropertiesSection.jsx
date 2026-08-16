'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { setLockedFilter } from '@/redux/slices/propertyListSlice';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from '../context/TranslationContext';
import PremiumPropertyCard from '../cards/PremiumPropertyCard';
import CustomLink from '../context/CustomLink';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselDots } from '../ui/carousel';
import { getBgColorConfig, getLocationLatLngFilter, isRTL } from '@/utils/helperFunction';
import { useIsMobile } from '@/hooks/use-mobile';
import Autoplay from 'embla-carousel-autoplay';

const PremiumPropertiesSection = ({
    translated_title,
    title,
    data = [],
    buttonText = "See All Premium Properties",
    buttonLink = "/properties/",
    type,
    passLocationFilter = false,
}) => {
    const t = useTranslation();
    const dispatch = useDispatch();

    const isMobile = useIsMobile();
    const isRtl = isRTL();

    const getSectionConfig = () => {
        switch (type) {
            case "featured_properties_section":
                return {
                    lock: "featured",
                    defaultLink: "/properties/",
                    filterQuery: "?filters=" + btoa(JSON.stringify({ flags: { promoted: 1 } })),
                    locationFilter: getLocationLatLngFilter("", "1")
                };
            case "premium_projects_section":
                return {
                    lock: "premium",
                    defaultLink: "/projects/",
                    filterQuery: "?filters=" + btoa(JSON.stringify({ flags: { get_all_premium_properties: 1 } })),
                    locationFilter: ""
                };
            case "featured_projects_section":
                return {
                    lock: "featured",
                    defaultLink: "/projects/",
                    filterQuery: "?filters=" + btoa(JSON.stringify({ flags: { promoted: 1 } })),
                    locationFilter: ""
                };
            case "premium_properties_section":
            default:
                return {
                    lock: "premium",
                    defaultLink: "/properties/",
                    filterQuery: "?filters=" + btoa(JSON.stringify({ flags: { get_all_premium_properties: 1 } })),
                    locationFilter: getLocationLatLngFilter("1", "")
                };
        }
    };

    const config = getSectionConfig();
    const finalLink = buttonLink && buttonLink.includes('?') 
        ? buttonLink 
        : ((buttonLink || config.defaultLink) + (passLocationFilter && config.locationFilter ? config.locationFilter : config.filterQuery));
    const autoplayPlugin = useRef(
        Autoplay({
            delay: 3000, // 3 seconds delay between slides
            stopOnInteraction: true, // Stop autoplay when user touches/swipes the carousel
            stopOnMouseEnter: false, // Continue autoplay on mouse enter (mobile doesn't have mouse)
            stopOnFocusIn: false, // Continue autoplay when carousel gains focus
            playOnInit: true, // Start autoplay immediately when carousel initializes
        })
    );


    // Only display up to 8 properties for this layout
    const displayData = data.slice(0, 8);
    // const bgColor = bgColorConfig[type] || "bg-white";
    const bgColor = getBgColorConfig(type);
    // If we don't have any properties, don't render the section
    if (!displayData.length) {
        return null;
    }



    return (
        <div className={`${bgColor}`}>
            <div className="container mx-auto px-4 md:px-0 py-6 md:py-10 lg:py-[60px]">
                <div className="flex flex-col gap-6 md:gap-12">
                    {/* Section Title */}
                    <h2 className="text-xl md:text-3xl font-bold text-center text-gray-800">{translated_title || title}</h2>
                    {/* Mobile Carousel (visible only up to md breakpoint) */}
                    <div className="lg:hidden relative">
                        <Carousel
                            className="w-full"
                            plugins={isMobile && displayData.length > 1 ? [autoplayPlugin.current] : []}
                            onMouseEnter={isMobile && displayData.length > 1 ? autoplayPlugin.current.stop : undefined}
                            onMouseLeave={isMobile && displayData.length > 1 ? autoplayPlugin.current.play : undefined}
                            onTouchStart={isMobile && displayData.length > 1 ? autoplayPlugin.current.stop : undefined}
                            onTouchEnd={isMobile && displayData.length > 1 ? () => setTimeout(() => autoplayPlugin.current.play, 3000) : undefined}
                            opts={{
                                direction: isRtl ? "rtl" : "ltr",
                                slidesToScroll: "auto",
                                ...(displayData.length > 1 ? { loop: true } : {}), // Enable loop only when data length > 1
                            }}
                        >
                            <CarouselContent>
                                {displayData.map((property, index) => (
                                    <CarouselItem key={property?.id || index} className="basis-full sm:basis-1/2">
                                        <div className="h-full">
                                            <PremiumPropertyCard property={property} type={type} />
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            {buttonText && buttonLink && data.length > displayData.length && (
                                <div className="mt-10 md:hidden text-center">
                                    <Link
                                        href={finalLink}
                                        onClick={() => {
                                            if (config.lock) {
                                                dispatch(setLockedFilter(config.lock));
                                            }
                                        }}
                                        className="inline-flex items-center gap-2 px-4 py-2 md:px-4 md:py-3 border border-black rounded-md text-black font-medium hover:brandBg hover:text-white transition-colors duration-200"
                                    >
                                        {t(buttonText)}
                                        <ArrowRight size={16} className={`${isRtl ? "rotate-180" : ""}`} />
                                    </Link>
                                </div>
                            )}
                            {data?.length > 1 && (
                                <div className="flex justify-center gap-6 mt-4">
                                    <CarouselPrevious className={`relative left-0 right-0 h-10 w-10 translate-y-0 border-none bg-white !shadow-none hover:bg-gray-100 hover:text-gray-900 ${isRtl ? "rotate-180" : ""}`} />
                                    <CarouselDots />
                                    <CarouselNext className={`relative left-0 right-0 h-10 w-10 translate-y-0 border-none bg-white !shadow-none hover:bg-gray-100 hover:text-gray-900 ${isRtl ? "rotate-180" : ""}`} />
                                </div>
                            )}
                        </Carousel>
                    </div>
                    {/* Desktop Grid Layout (hidden on mobile, visible from lg breakpoint) */}
                    <div className="hidden lg:grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {displayData.map((property, index) => (
                            <div key={property?.id || index} className="h-full">
                                <PremiumPropertyCard property={property} type={type} />
                            </div>
                        ))}
                    </div>
                    {/* Explore More Button */}
                    {buttonText && buttonLink && data?.length > displayData.length && (
                        <div className="hidden md:block text-center">
                            <Link
                                                                href={finalLink}
                                                                onClick={() => {
                                                                    if (config.lock) {
                                                                        dispatch(setLockedFilter(config.lock));
                                                                    }
                                                                }}
                                                                className="inline-flex items-center gap-2 px-4 py-2 md:px-4 md:py-3 border border-black rounded-md text-black font-medium hover:brandBg hover:text-white transition-colors duration-200"
                                                            >
                                {t(buttonText)}
                                <ArrowRight size={16} className={`${isRtl ? "rotate-180" : ""}`} />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PremiumPropertiesSection;