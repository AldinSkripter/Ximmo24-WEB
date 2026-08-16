'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import ImageWithPlaceholder from '../image-with-placeholder/ImageWithPlaceholder';
import mapIcon from '@/assets/mapIcon.svg';
import mapPreview from '@/assets/map.png';
import { useSelector } from 'react-redux';
import CustomLink from '../context/CustomLink';
import { MdArrowForward } from 'react-icons/md';
import { useTranslation } from '../context/TranslationContext';
import { isRTL } from '@/utils/helperFunction';

const PropertyOnMapView = dynamic(
    () => import('../google-maps/PropertyOnMapView'),
    { ssr: false }
);

const containerStyle = {
    width: '100%',
    height: '600px',
    borderRadius: '1rem'
};

const HomePropertiesOnMap = ({
    translated_title,
    title = "Find Homes, Apartments & More with Real-Time Listings on the Map",
    data = [],
    label = "exploreOnMap"
}) => {
    const t = useTranslation();
    const isRtl = isRTL();

    const [selectedProperty, setSelectedProperty] = useState(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [isMapInteractive, setIsMapInteractive] = useState(false);
    const [showMap, setShowMap] = useState(false);

    const location = useSelector(state => state.location);

    const webSettings = useSelector(state => {
        if (!state?.WebSetting) return null;
        return state.WebSetting.data;
    });

    const defaultCenter = useMemo(() => ({
        lat: Number(location?.latitude || webSettings?.latitude),
        lng: Number(location?.longitude || webSettings?.longitude),
    }), [
        location?.latitude,
        location?.longitude,
        webSettings?.latitude,
        webSettings?.longitude
    ]);

    const iconConfig = useMemo(() => ({
        url: mapIcon.src,
        width: 33,
        height: 48,
    }), []);

    const handleMarkerClick = useCallback((property) => {
        setSelectedProperty(property);
    }, []);

    const handleInfoWindowClose = useCallback(() => {
        setSelectedProperty(null);
    }, []);

    const onLoad = useCallback((loadedMap) => {
        setIsMapLoaded(true);
    }, []);

    const onUnmount = useCallback(() => {
        setIsMapLoaded(false);
    }, []);

    if (!data?.length) return null;

    return (
        <div className="relative bg-black text-white">
            <div className="container mx-auto px-4 py-6 sm:py-6 md:py-12 lg:py-[60px]">
                <div className="flex flex-col gap-6 md:gap-12">

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center h-full">
                        <div className="flex items-center justify-between w-full">
                            <h2 className="text-xl md:text-3xl font-bold max-w-xl mb-0">
                                {translated_title || title}
                            </h2>

                            <CustomLink
                                href="/properties-on-map"
                                className="hidden md:flex text-xl justify-center items-center gap-2 bg-white brandColor border brandBorder hover:bg-gray-50 rounded-lg px-3 py-2 md:px-4 md:py-3 font-normal transition-colors duration-300"
                            >
                                {t(label)}
                                <MdArrowForward className={isRtl ? "rotate-180" : ""} />
                            </CustomLink>
                        </div>
                    </div>

                    <div className="w-full min-h-[400px] md:h-[600px] rounded-2xl overflow-hidden relative shadow-lg"
                        onMouseLeave={() => {
                            handleInfoWindowClose();
                            // setIsMapInteractive(false);
                            // setShowMap(false);
                        }}>
                        {!showMap && (
                            <>
                                <ImageWithPlaceholder
                                    src={mapPreview}
                                    alt={t("clickToActivateMap")}
                                    width={1600}
                                    height={900}
                                    priority
                                    className="absolute inset-0 h-full w-full object-cover scale-105 blur-xl brightness-75"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-0 z-10 flex items-center justify-center bg-black/10 px-4 text-center"
                                    onClick={() => {
                                        setShowMap(true);
                                        setIsMapInteractive(true);
                                    }}
                                    aria-label={t("clickToActivateMap")}
                                >
                                    <span className="text-base p-4 brandBg text-white rounded-md">
                                        {t("clickToActivateMap")}
                                    </span>
                                </button>
                            </>
                        )}

                        {showMap && (
                            <PropertyOnMapView
                                containerStyle={containerStyle}
                                defaultCenter={defaultCenter}
                                onLoad={onLoad}
                                onUnmount={onUnmount}
                                isMapLoaded={isMapLoaded}
                                selectedProperty={selectedProperty}
                                handleMarkerClick={handleMarkerClick}
                                handleInfoWindowClose={handleInfoWindowClose}
                                iconConfig={iconConfig}
                                data={data}
                                isInteractive={isMapInteractive}
                            />
                        )}
                    </div>
                </div>

                <CustomLink
                    href="/properties-on-map"
                    className="flex mt-12 md:hidden w-fit mx-auto text-lg justify-center items-center gap-2 bg-white brandColor border brandBorder hover:bg-gray-50 rounded-lg px-4 py-3 font-normal transition-colors duration-300"
                >
                    {t(label)}
                    <MdArrowForward className={isRtl ? "rotate-180" : ""} />
                </CustomLink>
            </div>
        </div>
    );
};

export default HomePropertiesOnMap;
