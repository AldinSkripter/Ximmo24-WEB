'use client';

import { useRef, useState } from 'react';
import { MapPin, ArrowRight } from 'lucide-react';
import ImageWithPlaceholder from '../image-with-placeholder/ImageWithPlaceholder';
import { featuredIcon, premiumIcon } from '@/assets/svg';
import { useTranslation } from '../context/TranslationContext';
import { useSelector } from 'react-redux';
import { ReactSVG } from 'react-svg';
import { handlePackageCheck, isRTL, showLoginSwal } from '@/utils/helperFunction';
import { PackageTypes } from '@/utils/checkPackages/packageTypes';
import { useRouter } from 'next/router';

const PremiumPropertyCard = ({ property, type = "" }) => {
    const [isHovered, setIsHovered] = useState(false);
    const cardRef = useRef(null);
    const router = useRouter();
    const t = useTranslation();
    const userId = useSelector((state) => state.User?.data?.id);
    const isUserProperty = userId && property?.added_by === userId;
    const webSettings = useSelector((state) => state.WebSetting?.data);
    const isRtl = isRTL();
    const imageUrl = property?.title_image || property?.image || webSettings?.web_placeholder_image;

    const handleClick = (e) => {
        e?.preventDefault();
        if (!userId) {
            setIsHovered(false);
            if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
            return showLoginSwal(
                "oops",
                "plzLogFirsttoAccess",
                () => {
                    // The pointer never leaves the card while SweetAlert is open,
                    // so onMouseEnter will not fire again once it closes.
                    requestAnimationFrame(() => {
                        setIsHovered(cardRef.current?.matches(':hover') ?? false);
                        if (cardRef.current) {
                            cardRef.current.scrollTop = 0;
                        }
                    });
                },
                t
            );
        }
        if (type === "featured_projects_section") {
            router.push(`/project-details/${property?.slug_id}?lang=${router.query?.lang}`);
        } else if (type === "premium_projects_section") {
            handlePackageCheck(e, PackageTypes.PREMIUM_PROJECTS, router, property?.slug_id, property, isUserProperty, false, t, true);
        } else {
            handlePackageCheck(e, PackageTypes.PREMIUM_PROPERTIES, router, property?.slug_id, property, isUserProperty, false, t, true);
        }
    };

    const showPremiumBadge = property?.is_premium;
    const showFeaturedBadge = property?.promoted || property?.is_promoted;

    return (
        <div
            ref={cardRef}
            className="group relative h-full cursor-pointer overflow-hidden rounded-2xl bg-white p-3"
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onScroll={(e) => {
                e.currentTarget.scrollTop = 0;
            }}
        >
            {/* Main image with outside rounded corners */}
            {/* <div className="w-full h-full"> */}
            <div className={`relative w-full aspect-[355/270] overflow-hidden rounded-br-2xl rounded-bl-2xl ${isRtl
                ? "rounded-tl-2xl rounded-tr-[0px]"
                : "rounded-tl-[0px] rounded-tr-2xl"
                }`}
            >
                <ImageWithPlaceholder
                    src={imageUrl}
                    alt={property?.title || 'Property'}
                    loading='lazy'
                    blurDataURL={property?.low_quality_title_image}
                    className="h-full w-full object-cover"
                />

                {/* Badge container with custom corner cut */}
                {(showPremiumBadge || showFeaturedBadge) && (
                    <div className={`absolute top-0 z-10 flex items-center gap-2 bg-white py-2 px-2 ${isRtl
                        ? "right-0 rounded-bl-[10px]"
                        : "left-0 rounded-br-[10px]"
                        }`}
                    >
                        {/* Badges container */}
                        <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                            {showPremiumBadge ? (
                                <span className="text-xs font-semibold p-1 rounded-md bg-[#F9EDD7] flex items-center gap-1 capitalize">
                                    {premiumIcon()}
                                    {t('premium')}
                                </span>
                            ) : null}
                            {showFeaturedBadge && (
                                <span className="bg-black text-white text-xs font-semibold p-1 rounded-md flex items-center gap-1">
                                    <span className="w-5 h-5">{featuredIcon()}</span>
                                    {t('featured')}
                                </span>
                            )}
                        </div>

                        {/* Concave corners using box-shadow overlays */}
                        {!isRtl ? (
                            <>
                                <div className="absolute top-full left-0 w-[20px] h-[20px] rounded-full bg-transparent shadow-[-10px_-10px_0_0_#fff] pointer-events-none" />
                                <div className="absolute top-0 left-full w-[20px] h-[20px] rounded-full bg-transparent shadow-[-10px_-10px_0_0_#fff] pointer-events-none" />
                            </>
                        ) : (
                            <>
                                <div className="absolute top-full right-0 w-[20px] h-[20px] rounded-full bg-transparent shadow-[10px_-10px_0_0_#fff] pointer-events-none" />
                                <div className="absolute top-0 right-full w-[20px] h-[20px] rounded-full bg-transparent shadow-[10px_-10px_0_0_#fff] pointer-events-none" />
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Details rise from the bottom of the image on hover. */}
            <div className={`absolute inset-x-3 bottom-3 z-20 flex justify-between gap-3 bg-white p-3 transition-all duration-500 ease-out flex-row items-end ${isHovered
                ? 'translate-y-0 opacity-100'
                : 'translate-y-[calc(85%+0.75rem)] opacity-0 lg:translate-y-[calc(100%+0.75rem)]'
                }`}>
                <div className='flex flex-col gap-1 min-w-0'>
                    <div className="flex items-center gap-1.5 bg-[#F5F5F4] rounded-md py-1 px-1.5 mb-2 w-fit">
                        <ReactSVG
                            src={property?.category?.image}
                            beforeInjection={(svg) => {
                                svg.setAttribute(
                                    "style",
                                    `height: 100%; width: 100%;`,
                                );
                                svg.querySelectorAll("path").forEach((path) => {
                                    path.setAttribute(
                                        "style",
                                        `fill: var(--facilities-icon-color);`,
                                    );
                                });
                            }}
                            className="w-4 h-4 flex items-center justify-center object-contain shrink-0"
                            alt={property?.category?.translated_name || property?.category?.name || 'category icon'}
                        />
                        <span className="line-clamp-1 text-xs font-bold leadColor">{property?.category?.translated_name || property?.category?.category || 'N/A'}</span>
                    </div>

                    <h3 className="text-sm font-semibold line-clamp-1" title={property?.translated_title || property?.title}>
                        {property?.translated_title || property?.title}
                    </h3>

                    <div className="flex items-center gap-1.5 text-gray-500 min-w-0">
                        <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                        <p className="text-xs text-gray-500 truncate">
                            {`${property?.city || ''}${property?.city && property?.state ? ', ' : ''}${property?.state || ''}`}
                        </p>
                    </div>
                </div>
                <div className="flex justify-end shrink-0">
                    <button
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors text-xs font-medium whitespace-nowrap"
                    >
                        {t('seeDetails')}
                        <ArrowRight size={14} className={`flex-shrink-0 ${isRtl ? "rotate-180" : ""}`} />
                    </button>
                </div>
            </div>
            {/* </div> */}
        </div>
    );
};

export default PremiumPropertyCard;
