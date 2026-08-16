import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from "framer-motion";
import { CheckCircle2, XCircle, Calendar, Megaphone, Store } from "lucide-react";
import Swal from 'sweetalert2';

const UserSubscriptionCard = ({
    subscriptionData,
    index,
    totalCards,
    allFeatures,
    t,
    isRtl,
    CurrencySymbol,
    formatDuration,
    formatDate,
    calculateRemainingTime,
    getFeatureLimit,
    isUserLoggedIn,
    systemSettings,
    user,
    setPriceData,
    hasActiveOnlinePayment,
    bankTransferActive,
    setShowPaymentSelection,
    handleOnlinePayment,
    router,
    lang
}) => {
    const cardRef = useRef(null);

    // For individual card scroll tracking
    const { scrollYProgress } = useScroll({
        target: cardRef,
        offset: ["start end", "end start"],
    });

    const propertyListFeature = allFeatures?.find(f => f.id === 1);
    const projectListFeature = allFeatures?.find(f => f.id === 3);
    const propertyFeatureListFeature = allFeatures?.find(f => f.id === 2);
    const projectFeatureListFeature = allFeatures?.find(f => f.id === 4);

    const propertyList = getFeatureLimit(subscriptionData.features, 1);
    const projectList = getFeatureLimit(subscriptionData.features, 3);
    const propertyFeatureList = getFeatureLimit(subscriptionData.features, 2);
    const projectFeatureList = getFeatureLimit(subscriptionData.features, 4);

    const propertyListLimit = propertyList?.limit || 0;
    const projectListLimit = projectList?.limit || 0;
    const propertyFeatureListLimit = propertyFeatureList?.limit || 0;
    const projectFeatureListLimit = projectFeatureList?.limit || 0;

    const usedPropertyListLimit = propertyList?.usedLimit || 0;
    const usedProjectListLimit = projectList?.usedLimit || 0;
    const usedPropertyFeatureListLimit = propertyFeatureList?.usedLimit || 0;
    const usedProjectFeatureListLimit = projectFeatureList?.usedLimit || 0;

    const checkLimitReached = () => {
        if (!subscriptionData.is_renew_allowed) return null;
        const limits = [];
        if (propertyList?.included && propertyList?.type !== "unlimited" && usedPropertyListLimit >= propertyListLimit) {
            limits.push({ feature: propertyListFeature?.translated_name || propertyListFeature?.name || t("property"), type: "listing" });
        }
        if (projectList?.included && projectList?.type !== "unlimited" && usedProjectListLimit >= projectListLimit) {
            limits.push({ feature: projectListFeature?.translated_name || projectListFeature?.name || t("project"), type: "listing" });
        }
        if (propertyFeatureList?.included && propertyFeatureList?.type !== "unlimited" && usedPropertyFeatureListLimit >= propertyFeatureListLimit) {
            limits.push({ feature: propertyFeatureListFeature?.translated_name || propertyFeatureListFeature?.name, type: "featured" });
        }
        if (projectFeatureList?.included && projectFeatureList?.type !== "unlimited" && usedProjectFeatureListLimit >= projectFeatureListLimit) {
            limits.push({ feature: projectFeatureListFeature?.translated_name || projectFeatureListFeature?.name, type: "featured" });
        }
        return limits.length > 0 ? limits : null;
    };

    const limitReached = checkLimitReached();

    const handleRenew = (e) => {
        e.preventDefault();
        if (!isUserLoggedIn) {
            Swal.fire({
                title: t("oops"),
                text: "You need to login!",
                icon: "warning",
                allowOutsideClick: false,
                showCancelButton: false,
                customClass: { confirmButton: "Swal-confirm-buttons", cancelButton: "Swal-cancel-buttons" },
                confirmButtonText: t("ok"),
            });
            return false;
        }
        if (systemSettings.demo_mode && user?.is_demo_user) {
            Swal.fire({
                title: t("oops"),
                text: t("notAllowdDemo"),
                icon: "warning",
                showCancelButton: false,
                customClass: { confirmButton: "Swal-confirm-buttons", cancelButton: "Swal-cancel-buttons" },
                confirmButtonText: t("ok"),
            });
            return false;
        }
        setPriceData(subscriptionData);
        Swal.fire({
            title: t("areYouSure"),
            text: t("areYouSureToRenewThisPackage"),
            icon: "warning",
            showCancelButton: true,
            customClass: { confirmButton: "Swal-confirm-buttons", cancelButton: "Swal-cancel-buttons" },
            cancelButtonColor: "#d33",
            confirmButtonText: t("yes"),
            cancelButtonText: t("no"),
        }).then((result) => {
            if (result.isConfirmed) {
                handleRenewalPayment();
            }
        });
    };

    const handleRenewalPayment = () => {
        const hasOnlinePayment = hasActiveOnlinePayment();
        if (hasOnlinePayment && bankTransferActive) {
            setShowPaymentSelection(true);
        } else if (hasOnlinePayment) {
            handleOnlinePayment();
        } else if (bankTransferActive) {
            setShowPaymentSelection(true);
        } else {
            Swal.fire({
                title: t("oops"),
                text: t("noPaymentActive") || "No payment method is active",
                icon: "warning",
                showCancelButton: false,
                customClass: { confirmButton: "Swal-confirm-buttons", cancelButton: "Swal-cancel-buttons" },
                confirmButtonText: t("ok"),
            }).then(() => {
                router.push(`/contact-us/?lang=${lang}`);
            });
        }
    };

    const renderProgressBar = (used, total, type, isIncluded) => {
        if (!isIncluded) return null;
        let percentage = type === 'unlimited' ? 100 : total > 0 ? (used / total) * 100 : 0;
        if (percentage > 100) percentage = 100;

        return (
            <div className="flex gap-2.5 items-center w-full mt-2">
                <span className="font-bold text-sm">{used}</span>
                <div className="flex-1 primaryBgLight08 h-[5px] rounded-full overflow-hidden">
                    <div className="primaryBg h-full rounded-full transition-all" style={{ width: `${percentage}%` }} />
                </div>
                <span className="font-bold text-sm">
                    {type === 'unlimited' ? t("unlimited") : total}
                </span>
            </div>
        );
    };

    return (
        <motion.div ref={cardRef}>
            <div className="border border-[#e7e7e7] border-solid flex flex-col gap-4 items-start justify-center overflow-clip p-4 relative rounded-2xl w-full bg-white">
                <div className="bg-white flex flex-col gap-4 w-full relative">

                    {/* Header */}
                    <div className="brandBg flex items-center justify-between overflow-clip pl-4 pr-16 md:pr-24 py-4 rounded-lg relative w-full">
                        <p className="font-bold text-base text-white truncate max-w-[50%]">
                            {subscriptionData.translated_name || subscriptionData.name}
                        </p>
                        <div className="flex items-center gap-2 md:gap-3">
                            <p className="font-bold text-lg md:text-xl text-white">
                                {subscriptionData.price ? `${CurrencySymbol}${subscriptionData.price}` : t("free")}
                            </p>
                            <div className="h-4 w-px bg-white/20 mx-1"></div>
                            <p className="font-bold text-base text-white/75">
                                {formatDuration(subscriptionData.duration)}
                            </p>
                        </div>

                        {/* Active Ribbon */}
                        <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center -mr-2">
                            <div className="rotate-45 translate-x-4 -translate-y-2">
                                <div className="primaryBg flex items-center justify-center px-10 py-1.5 shadow-md">
                                    <p className="font-bold text-sm text-white text-center">
                                        {subscriptionData?.is_renewed ? t("renewed") : t("active")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Listings & Features */}
                    <div className="flex flex-col lg:flex-row gap-4 w-full">
                        {/* Listings Box */}
                        <div className="bg-[#f5f5f4] flex-1 flex flex-col gap-4 p-4 rounded-lg">
                            <div className="flex gap-2 items-center w-full">
                                <Store className="w-5 h-5 text-black" />
                                <p className="font-bold text-base text-black">{t("listing")}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 w-full">
                                <div className="bg-white flex-1 p-3 rounded-lg flex flex-col justify-between">
                                    <p className="font-medium text-sm text-[#595f65]">{propertyListFeature?.translated_name || propertyListFeature?.name || t("property")}</p>
                                    {renderProgressBar(usedPropertyListLimit, propertyListLimit, propertyList?.type, propertyList?.included)}
                                    {!propertyList?.included && <span className="text-sm font-bold mt-2">{t("notIncluded")}</span>}
                                </div>
                                <div className="bg-white flex-1 p-3 rounded-lg flex flex-col justify-between">
                                    <p className="font-medium text-sm text-[#595f65]">{projectListFeature?.translated_name || projectListFeature?.name || t("project")}</p>
                                    {renderProgressBar(usedProjectListLimit, projectListLimit, projectList?.type, projectList?.included)}
                                    {!projectList?.included && <span className="text-sm font-bold mt-2">{t("notIncluded")}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Featured Ad Box */}
                        <div className="bg-[#f5f5f4] flex-1 flex flex-col gap-4 p-4 rounded-lg">
                            <div className="flex gap-2 items-center w-full">
                                <Megaphone className="w-5 h-5 text-black" />
                                <p className="font-bold text-base text-black">{t("featuredAd")}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 w-full">
                                <div className="bg-white flex-1 p-3 rounded-lg flex flex-col justify-between">
                                    <p className="font-medium text-sm text-[#595f65]">{propertyFeatureListFeature?.translated_name || propertyFeatureListFeature?.name || t("property")}</p>
                                    {renderProgressBar(usedPropertyFeatureListLimit, propertyFeatureListLimit, propertyFeatureList?.type, propertyFeatureList?.included)}
                                    {!propertyFeatureList?.included && <span className="text-sm font-bold mt-2">{t("notIncluded")}</span>}
                                </div>
                                <div className="bg-white flex-1 p-3 rounded-lg flex flex-col justify-between">
                                    <p className="font-medium text-sm text-[#595f65]">{projectFeatureListFeature?.translated_name || projectFeatureListFeature?.name || t("project")}</p>
                                    {renderProgressBar(usedProjectFeatureListLimit, projectFeatureListLimit, projectFeatureList?.type, projectFeatureList?.included)}
                                    {!projectFeatureList?.included && <span className="text-sm font-bold mt-2">{t("notIncluded")}</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="primaryBgLight08 flex flex-col gap-4 p-3 md:p-4 rounded-lg w-full relative">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex-1 flex flex-col items-start gap-1">
                                <p className="font-medium text-sm text-[#595f65]">{t("startedOn")}</p>
                                <p className="font-bold text-sm md:text-base text-[#181818]">{formatDate(subscriptionData.start_date)}</p>
                            </div>
                            <div className="flex-1 flex flex-col items-end gap-1 text-right">
                                <p className="font-medium text-sm text-[#595f65]">{t("endsOn")}</p>
                                <p className="font-bold text-sm md:text-base text-[#181818]">{formatDate(subscriptionData.end_date)}</p>
                            </div>
                        </div>

                        {/* Connecting Line Tracker visually */}
                        <div className="border-t-2 border-dashed border-[var(--primary-color)]/40 relative my-2 w-full">
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 rounded-full border border-[var(--primary-color)]/20 flex items-center justify-center z-10 py-1">
                                <span className="font-medium text-sm text-[#181818] inline-flex items-center gap-1.5 whitespace-nowrap">
                                    <Calendar className="w-3.5 h-3.5 primaryColor" />
                                    {calculateRemainingTime(subscriptionData.end_date, subscriptionData.duration)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Included Benefits Row */}
                <div className="flex flex-col gap-2 rounded-lg mt-2 w-full">
                    <p className="font-bold text-base text-[#595f65] mb-1">{t("includedBenefits")}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 bg-[#f5f5f4] p-4 rounded-lg">
                        {allFeatures && allFeatures.length > 0 ? (
                            allFeatures.filter(feature => feature.id >= 5).map((benefit) => {
                                const isIncluded = subscriptionData.features?.some(f => f.id === benefit.id);
                                return (
                                    <div key={benefit.id} className="flex gap-2 items-start py-1">
                                        {isIncluded ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                                        )}
                                        <div className="flex flex-col">
                                            <p className="font-medium text-[15px] text-[#1a1517] leading-snug">
                                                {benefit.translated_name || benefit.name}
                                            </p>
                                            <p className="font-bold text-sm text-[#181818] mt-0.5">
                                                {isIncluded ? t("included") : t("notIncluded")}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-sm font-medium text-[#595f65] col-span-full">{t("noAdditionalBenefits")}</p>
                        )}
                    </div>
                </div>

                {/* Package Renewal Warning */}
                {!subscriptionData?.is_renewed && limitReached && limitReached?.length > 0 && (
                    <div className="primaryBgLight08 flex flex-col md:flex-row gap-4 items-center justify-between p-4 md:p-6 rounded-lg w-full mt-2">
                        <div className="flex flex-col gap-1 items-start">
                            <p className="font-bold text-base text-[#181818]">
                                {limitReached.map((limit, idx) => (
                                    <React.Fragment key={idx}>
                                        {limit.feature} {limit.type === "listing" ? t("listing") : ""} {t("limitReached")}
                                        {idx < limitReached.length - 1 && ", "}
                                    </React.Fragment>
                                ))}. {t("renewToContinue")}.
                            </p>
                            <p className="font-medium text-sm text-[#595f65]">
                                {t("renewingAssignsSamePackageAgain")}
                            </p>
                        </div>
                        <button onClick={handleRenew} className="primaryBg text-white font-bold text-base px-6 py-2.5 rounded-lg flex-shrink-0 whitespace-nowrap hover:opacity-90 transition-opacity">
                            {t("renew")}
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default UserSubscriptionCard;
