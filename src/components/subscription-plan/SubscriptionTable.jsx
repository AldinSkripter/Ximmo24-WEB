import React from "react";
import { useTranslation } from "../context/TranslationContext";
import { BiXCircle } from "react-icons/bi";
import { MdCheckCircleOutline } from "react-icons/md";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselDots,
    CarouselPrevious,
    CarouselNext,
} from "@/components/ui/carousel";

export const SubscriptionTable = ({ packages = [], features = [], currencySymbol = "" }) => {
    const t = useTranslation();

    const renderValue = (value) => {
        if (value === true) return <MdCheckCircleOutline className="mx-auto h-6 w-6 primaryColor" />;
        if (value === false) return <BiXCircle className="mx-auto h-6 w-6 text-[#DB3D26]" />;
        return <span className="break-all text-center text-sm font-medium leadColor">{value}</span>;
    };

    const getFeatureValue = (pkg, feature) => {
        const matchedFeature = pkg?.package_features?.find(
            (item) => item?.feature_id === feature?.id || item?.feature?.type === feature?.type,
        );

        if (!matchedFeature) {
            return false;
        }

        if (matchedFeature.limit_type === "unlimited") {
            return t("unlimited");
        }

        return matchedFeature.limit ?? t("limited");
    };

    const renderPrice = (pkg) => {
        if (pkg?.package_type === "free" || pkg?.price === null || pkg?.price === undefined) {
            return t("free");
        }

        return `${currencySymbol || ""}${pkg.price}`;
    };

    const renderDuration = (pkg) => {
        if (pkg?.package_type === "free") {
            return t("foreverFree");
        }

        const isPaidPlan = pkg?.package_type === "paid";
        const planDurationHours = Number(pkg?.duration) || 0;
        const isLongTermPlan = isPaidPlan && planDurationHours > 24 * 30;
        const planDurationDays = Math.ceil(planDurationHours / 24);
        const planDurationMonths = Math.max(1, Math.round(planDurationDays / 30));

        return isLongTermPlan
            ? `${planDurationMonths} ${t("months")}`
            : `${planDurationDays} ${t("days")}`;
    };

    const carouselOptions = {
        dragFree: true,
        loop: false,
        slidesToScroll: 1,
    };

    const activePackages = packages.filter(Boolean);
    const activeFeatures = features.filter(Boolean);

    if (!activePackages.length || !activeFeatures.length) {
        return null;
    }

    return (
        <div className="container mx-auto pt-12 pb-20">
            <div className="hidden overflow-x-auto brand-scrollbar rounded-xl border newBorderColor bg-white shadow-sm md:block" role="table" aria-label="Subscription Comparison Table">
                <div className="w-full pb-0">
                    <div className="w-full min-w-max">
                        <div className="flex min-w-full border-b newBorderColor" role="row">
                            <div className="sticky left-0 z-20 w-[200px] md:w-[240px] shrink-0 border-r newBorderColor bg-white p-3 md:p-6" role="columnheader" />
                            {activePackages.map((pkg, idx) => (
                                <div
                                    key={pkg?.id ?? idx}
                                    className={`flex-1 min-w-[150px] shrink-0 border-r newBorderColor p-3 text-center md:p-6 ${idx < activePackages.length - 1 ? "" : "border-r-0"}`}
                                    role="columnheader"
                                >
                                    <div className="mb-2 flex min-h-[36px] items-center justify-center sm:min-h-[40px]">
                                        <span className="text-[10px] font-bold uppercase tracking-wider brandColor sm:text-xs md:text-sm">
                                            {pkg?.name}
                                        </span>
                                    </div>
                                    <div className="mt-1 flex flex-col gap-0.5 text-center sm:gap-1">
                                        <span className="text-xl font-bold brandColor md:text-[28px]">{renderPrice(pkg)}</span>
                                        <span className="font-medium leadColor text-xs md:text-sm">
                                            {renderDuration(pkg)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col" role="rowgroup">
                            {activeFeatures.map((feature, featureIndex) => (
                                <div
                                    key={feature?.id ?? featureIndex}
                                    className={`group flex min-w-full transition-colors hover:bg-gray-50 ${featureIndex < activeFeatures.length - 1 ? "border-b newBorderColor" : ""}`}
                                    role="row"
                                >
                                    <div className="sticky left-0 z-10 flex w-[200px] md:w-[240px] shrink-0 items-center border-r newBorderColor bg-white group-hover:bg-gray-50 p-3 text-xs font-bold brandColor sm:text-sm md:p-6 md:text-base" role="rowheader">
                                        {feature?.translated_name || feature?.name}
                                    </div>
                                    {activePackages.map((pkg, packageIndex) => (
                                        <div
                                            key={`${pkg?.id ?? packageIndex}-${feature?.id ?? featureIndex}`}
                                            className={`flex flex-1 min-w-[150px] shrink-0 items-center justify-center border-r newBorderColor p-3 text-center md:p-6 ${packageIndex < activePackages.length - 1 ? "" : "border-r-0"}`}
                                            role="cell"
                                        >
                                            {renderValue(getFeatureValue(pkg, feature))}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="md:hidden">
                <Carousel opts={carouselOptions} className="relative w-full">
                    <CarouselContent className="">
                        {activePackages.map((pkg, index) => (
                            <CarouselItem key={pkg?.id ?? index} className="basis-[90%] sm:basis-[75%]">
                                <div className="flex h-full min-h-[385px] flex-col overflow-hidden rounded-[20px] border newBorderColor bg-white shadow-sm">
                                    <div className="border-b newBorderColor px-4 py-6 text-center">
                                        <div className="mb-2 flex min-h-[36px] max-w-full items-center justify-center">
                                            <span className="line-clamp-2 text-[10px] font-bold uppercase tracking-wider brandColor sm:text-xs">
                                                {pkg?.name}
                                            </span>
                                        </div>
                                        <div className="mt-1 flex flex-col gap-1">
                                            <span className="text-2xl font-bold brandColor">{renderPrice(pkg)}</span>
                                            <span className="text-sm font-medium leadColor">{renderDuration(pkg)}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-1 flex-col divide-y divide-[#e7e7e7]">
                                        {activeFeatures.map((feature) => (
                                            <div key={`${pkg?.id}-${feature?.id}`} className="flex min-h-[56px] items-center justify-between gap-4 px-4 py-3">
                                                <span className="truncate text-sm font-semibold brandColor">
                                                    {feature?.translated_name || feature?.name}
                                                </span>
                                                <span className="shrink-0 text-sm font-medium text-right leadColor">
                                                    {renderValue(getFeatureValue(pkg, feature))}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <div className="mt-4 flex items-center justify-center gap-3 px-2">
                        <CarouselPrevious className="static h-9 w-9 translate-x-0 translate-y-0 newBorder bg-white brandColor shadow-none flex-shrink-0" />
                        <CarouselDots className="p-3 [&_div]:flex-wrap" />
                        <CarouselNext className="static h-9 w-9 translate-x-0 translate-y-0 newBorder bg-white brandColor shadow-none flex-shrink-0" />
                    </div>
                </Carousel>
            </div>
        </div>
    );
};
