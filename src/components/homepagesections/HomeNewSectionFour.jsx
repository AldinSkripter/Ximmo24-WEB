"use client";
import { useRef } from "react";
import { ArrowRight } from "lucide-react"; // Zap icon for the title
import { useTranslation } from "../context/TranslationContext";
import { featuredIcon } from "@/assets/svg";
import AnimatedFeaturedCard from "../cards/AnimatedFeaturedCard"; // Import the new component
import FeaturedPropertyHorizontalCard from "../cards/FeaturedPropertyHorizontalCard";
import { getLocationLatLngFilter, isRTL } from "@/utils/helperFunction";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { setLockedFilter } from "@/redux/slices/propertyListSlice";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselDots,
} from "../ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const HomeNewSectionFour = ({
  translated_title,
  title,
  data = [],
  buttonText = "See Featured Properties",
  passLocationFilter = false,
  buttonLink = "/properties/featured-properties",
}) => {
  const t = useTranslation();
  const dispatch = useDispatch();
  const isRtl = isRTL();

  const autoplayPlugin = useRef(
    Autoplay({
      delay: 3000, // 3 seconds delay between slides
      stopOnInteraction: true, // Stop autoplay when user touches/swipes the carousel
      stopOnMouseEnter: false, // Continue autoplay on mouse enter (mobile doesn't have mouse)
      stopOnFocusIn: false, // Continue autoplay when carousel gains focus
      playOnInit: true, // Start autoplay immediately when carousel initializes
    })
  );

  const cards = data.slice(0, 4);
  const rows = [];
  for (let i = 0; i < cards.length; i += 2) {
    rows.push(cards.slice(i, i + 2));
  }

  return (
    <div className="bg-black text-white">
      <div className="container mx-auto px-4 md:px-0 py-5 md:py-10 lg:py-[60px]">
        {/* Header: stacked/centered on mobile, row + justified-between from md up */}
        <div className="flex flex-col items-center text-center gap-4 md:flex-row md:items-center md:justify-between md:text-left mb-8 md:mb-12">
          <div className="flex flex-col items-center gap-3 text-center md:flex-row md:items-center md:gap-4 md:text-left">
            <div className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full brandBg p-1 text-white shadow-[0_4.2px_10.8px_2.4px_rgba(255,255,255,0.2)]">
              {featuredIcon()}
            </div>
            <h2 className="text-xl md:text-3xl font-bold">{translated_title || title}</h2>
          </div>
          <Link
            href={buttonLink + (passLocationFilter ? getLocationLatLngFilter("", "1") : "")}
            onClick={() => dispatch(setLockedFilter("featured"))}
            className="inline-flex items-center justify-center gap-2 w-full md:w-auto shrink-0 bg-white brandColor rounded-lg border border-white/30 py-2 px-4 md:px-4 md:py-3 text-base font-medium transition-colors duration-200 hover:bg-white/80"
            aria-label={t(buttonText)}
          >
            {t(buttonText)}
            <ArrowRight size={16} className={`${isRtl ? "rotate-180" : ""}`} aria-hidden="true" />
          </Link>
        </div>

        {/* Mobile: swiper with indicators */}
        <div className="sm:hidden relative">
          <Carousel
            className="w-full"
            plugins={cards.length > 1 ? [autoplayPlugin.current] : []}
            opts={{
              direction: isRtl ? "rtl" : "ltr",
              slidesToScroll: "auto",
              ...(cards.length > 1 ? { loop: true } : {}),
            }}
            onMouseEnter={cards.length > 1 ? autoplayPlugin.current.stop : undefined}
            onMouseLeave={cards.length > 1 ? autoplayPlugin.current.play : undefined}
            onTouchStart={cards.length > 1 ? autoplayPlugin.current.stop : undefined}
            onTouchEnd={cards.length > 1 ? () => setTimeout(() => autoplayPlugin.current.play, 3000) : undefined}
          >
            <CarouselContent>
              {cards.map((property) => (
                <CarouselItem key={property?.id} className="basis-full">
                  <FeaturedPropertyHorizontalCard property={property} />
                </CarouselItem>
              ))}
            </CarouselContent>
            {cards.length > 1 && (
              <div className="flex justify-center items-center gap-6 mt-6">
                <CarouselPrevious
                  className={`relative left-0 right-0 h-10 w-10 translate-y-0 border-none bg-white/20 text-white !shadow-none  ${isRtl ? "rotate-180" : ""}`}
                />
                <CarouselDots className="z-30 !overflow-x-visible [&>button]:after:!ring-white" />
                <CarouselNext
                  className={`relative left-0 right-0 h-10 w-10 translate-y-0 border-none bg-white/20 text-white !shadow-none  ${isRtl ? "rotate-180" : ""}`}
                />
              </div>
            )}
          </Carousel>
        </div>

        {/* Tablet/Desktop: rows of 2, 2x2 grid from 2xl */}
        <div className="hidden sm:flex sm:flex-col md:gap-6">
          {rows.map((rowProperties) => (
            <AnimatedFeaturedCard
              key={rowProperties.map((property) => property?.id).join("-")}
              properties={rowProperties}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeNewSectionFour;
