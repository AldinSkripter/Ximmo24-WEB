import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import MapPropertyCard from '../cards/MapPropertyCard';
import { isOpenStreetMapProvider } from "@/utils/mapProvider";
import BwGoogleOverlay from "../maps/BwGoogleOverlay";
import { BW_BOUNDS, BW_RESTRICTION_BOUNDS, BW_MIN_ZOOM, BW_FIT_PADDING } from "@/utils/bwRegion";

const LeafletPropertyOnMapView = dynamic(
    () => import("../maps/LeafletPropertyOnMapView"),
    { ssr: false }
);

const PropertyOnMapView = ({
    containerStyle,
    defaultCenter,
    onLoad,
    onUnmount,
    onUnload,
    isMapLoaded,
    selectedProperty,
    handleMarkerClick,
    handleInfoWindowClose,
    iconConfig,
    data,
    isInteractive
}) => {
    const webSettings = useSelector((state) => state.WebSetting?.data);
    const useOpenStreetMaps = isOpenStreetMapProvider(webSettings);
    const [isGoogleReady, setIsGoogleReady] = useState(false);

    useEffect(() => {
        if (useOpenStreetMaps) return;

        const updateGoogleReady = () => {
            setIsGoogleReady(Boolean(window.google?.maps));
        };

        updateGoogleReady();
        const interval = setInterval(updateGoogleReady, 100);
        return () => clearInterval(interval);
    }, [useOpenStreetMaps]);

    const googleIconConfig = useMemo(() => {
        if (!iconConfig?.url || !isGoogleReady) return null;

        return {
            url: iconConfig.url,
            scaledSize: new window.google.maps.Size(iconConfig.width || 33, iconConfig.height || 48),
        };
    }, [iconConfig, isGoogleReady]);

    // Make sure data is valid
    const validProperties = Array.isArray(data) ? data.filter(property =>
        property.latitude && property.longitude
    ) : [];

    if (useOpenStreetMaps) {
        return (
            <LeafletPropertyOnMapView
                containerStyle={containerStyle}
                defaultCenter={defaultCenter}
                onLoad={onLoad}
                onUnmount={onUnmount || onUnload}
                selectedProperty={selectedProperty}
                handleMarkerClick={handleMarkerClick}
                handleInfoWindowClose={handleInfoWindowClose}
                iconConfig={iconConfig}
                data={data}
                isInteractive={isInteractive}
                bwOverlay
                fitToBw
                restrictToBw
            />
        );
    }

    if (!isGoogleReady) {
        return (
            <div style={containerStyle} className="flex items-center justify-center bg-gray-100 text-sm text-gray-500">
                Loading...
            </div>
        );
    }

    const handleGoogleLoad = (map) => {
        onLoad?.(map);
        try {
            map.fitBounds(BW_BOUNDS, BW_FIT_PADDING);
        } catch (e) {
            // ignore fitBounds errors
        }
    };

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={defaultCenter}
            zoom={4}
            onLoad={handleGoogleLoad}
            onUnmount={onUnmount}
            onClick={handleInfoWindowClose}
            options={{
                streetViewControl: false,
                mapTypeControl: false,
                gestureHandling: isInteractive ? 'auto' : 'none',
                zoomControl: isInteractive,
                scrollwheel: isInteractive,
                draggable: isInteractive,
                disableDoubleClickZoom: !isInteractive,
                fullscreenControl: true,
                minZoom: BW_MIN_ZOOM,
                restriction: {
                    latLngBounds: BW_RESTRICTION_BOUNDS,
                    strictBounds: true,
                },
                styles: [
                    {
                        featureType: "administrative",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#444444" }]
                    },
                    {
                        featureType: "landscape",
                        elementType: "all",
                        stylers: [{ color: "#f2f2f2" }]
                    },
                    {
                        featureType: "poi",
                        elementType: "all",
                        stylers: [{ visibility: "off" }]
                    }
                ]
            }}
        >
            <BwGoogleOverlay />
            {/* Render markers */}
            {isMapLoaded && validProperties.map((property) => {
                // Convert latitude and longitude to numbers
                const position = {
                    lat: parseFloat(property.latitude),
                    lng: parseFloat(property.longitude)
                };

                return (
                    <div className="relative" key={property?.id}>
                        <Marker
                            key={property.id}
                            position={position}
                            onClick={() => handleMarkerClick(property)}
                            icon={googleIconConfig}
                            zIndex={selectedProperty?.id === property.id ? 1000 : 1}
                            aria-label={`Marker for property ${property.title}`}
                            options={{
                                title: property.title,
                            }}
                        />
                        {/* Render InfoWindow if this property is selected */}
                        {selectedProperty?.id === property.id && (
                            <InfoWindow
                                position={position}
                                onCloseClick={handleInfoWindowClose}
                                options={{
                                    pixelOffset: isMapLoaded ? new window.google.maps.Size(0, -45) : undefined,
                                    maxWidth: 320,
                                    disableAutoPan: true,
                                    minHeight: 400,
                                    borderRadius: "16px",
                                }}
                            >
                                {/* InfoWindow content container */}
                                <div className="rounded-t-2xl p-0 m-0 gmaps-infowindow-content">
                                    <MapPropertyCard property={selectedProperty} />
                                </div>
                            </InfoWindow>
                        )
                        }
                    </div>
                );
            })}
        </GoogleMap>
    );
};

export default PropertyOnMapView;
