import React, { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic';
import { Circle, GoogleMap, Marker } from '@react-google-maps/api';
import { extractAddressComponents } from '@/utils/helperFunction';
import { useSelector } from 'react-redux';
import { useTranslation } from '@/components/context/TranslationContext';
import { getMapDetailsApi } from '@/api/apiRoutes';
import { isOpenStreetMapProvider } from '@/utils/mapProvider';
import BwGoogleOverlay from '../maps/BwGoogleOverlay';
import { BW_RESTRICTION_BOUNDS, BW_MIN_ZOOM } from '@/utils/bwRegion';

const LeafletMapView = dynamic(() => import('../maps/LeafletMapView'), { ssr: false });

const Map = ({ onSelectLocation, latitude, longitude, showLabel = false, isDraggable = true, showOnlyRadius = false }) => {
    const t = useTranslation()
    const webSettings = useSelector(state => state.WebSetting?.data)
    const useOpenStreetMaps = isOpenStreetMapProvider(webSettings);
    const [isGoogleReady, setIsGoogleReady] = useState(false);
    const [location, setLocation] = useState({
        lat: latitude ? parseFloat(latitude) : parseFloat(webSettings?.latitude),
        lng: longitude ? parseFloat(longitude) : parseFloat(webSettings?.longitude),
        radius: 1
    });

    const [mapType, setMapType] = useState("roadmap");
    const mapRef = useRef(null);
    const [mapError, setMapError] = useState(null);
    const [selectedLocationAddress, setSelectedLocationAddress] = useState({
        city: "",
        state: "",
        country: "",
        formattedAddress: "",
        lat: latitude ? parseFloat(latitude) : parseFloat(webSettings?.latitude),
        lng: longitude ? parseFloat(longitude) : parseFloat(webSettings?.longitude),
    });

    useEffect(() => {
        // Update the location state when latitude or longitude changes
        // Use !== null and !== undefined to allow 0 coordinates
        if (latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined) {
            const newLat = parseFloat(latitude);
            const newLng = parseFloat(longitude);

            // Only update if the coordinates are valid numbers
            if (!isNaN(newLat) && !isNaN(newLng)) {
                setLocation(prev => {
                    return {
                        ...prev,
                        lat: newLat,
                        lng: newLng
                    }
                });
            }
        }
    }, [latitude, longitude]);

    const containerStyle = {
        width: "100%",
        height: "400px",
    };

    useEffect(() => {
        if (useOpenStreetMaps) return;

        const updateGoogleReady = () => {
            setIsGoogleReady(Boolean(window.google?.maps));
        };

        updateGoogleReady();
        const interval = setInterval(updateGoogleReady, 100);
        return () => clearInterval(interval);
    }, [useOpenStreetMaps]);

    const handleMarkerDragEnd = async (e) => {
        const { lat, lng } = e.latLng;
        const newLat = lat();
        const newLng = lng();

        // Always update the location coordinates first
        const updatedLocation = {
            ...location,
            lat: newLat,
            lng: newLng,
        };
        setLocation(updatedLocation);

        // Try to get reverse geocoding data
        const reverseGeocodedData = await performReverseGeocoding(newLat, newLng);
        if (reverseGeocodedData) {
            const { city, country, state, formattedAddress } = reverseGeocodedData;
            const fullLocationData = {
                ...updatedLocation,
                city: city,
                country: country,
                state: state,
                formattedAddress,
            };

            // Update local state
            setSelectedLocationAddress({
                ...selectedLocationAddress,
                city: city,
                country: country,
                state: state,
                formattedAddress,
                lat: newLat,
                lng: newLng,
            });

            // Notify parent component
            onSelectLocation(fullLocationData);
        } else {
            // If reverse geocoding fails, still update coordinates
            console.warn("Reverse geocoding failed, updating coordinates only");
            const fallbackLocationData = {
                ...updatedLocation,
                city: "",
                country: "",
                state: "",
            };

            // Update local state
            setSelectedLocationAddress({
                ...selectedLocationAddress,
                lat: newLat,
                lng: newLng,
            });

            // Notify parent component
            onSelectLocation(fallbackLocationData);
        }
    };

    const performReverseGeocoding = async (lat, lng) => {
        try {
            // Use the API instead of Google Geocoder
            const response = await getMapDetailsApi({
                latitude: lat.toString(),
                longitude: lng.toString(),
                place_id: ""
            });
            if (response?.error === false && response?.data) {
                const placeDetails = response.data?.result;

                if (placeDetails) {
                    // Extract address components from the API response
                    const addressData = extractAddressComponents(placeDetails);

                    return {
                        city: addressData.city || "",
                        country: addressData.country || "",
                        state: addressData.state || "",
                        formattedAddress: addressData.formattedAddress || placeDetails.formatted_address || ""
                    };
                } else {
                    console.error("No place details in API response");
                    return null;
                }
            } else {
                console.error("API Error:", response?.message);
                return null;
            }
        } catch (error) {
            console.error("Error performing reverse geocoding via API:", error);
            return null;
        }
    };

    return (
        <div>
            {mapError ?
                <div>{mapError}</div>
                :
                <div className="relative">
                    {showLabel && (
                        <p className="secondaryTextColor font-medium">
                            {t("map")} <span className="text-red-500">*</span>
                        </p>
                    )}
                    {useOpenStreetMaps ? (
                        <LeafletMapView
                            containerStyle={containerStyle}
                            center={location}
                            zoom={14}
                            radiusKm={location?.radius}
                            circleColor={webSettings?.system_color}
                            markerDraggable={isDraggable}
                            showMarker={!showOnlyRadius}
                            onMarkerDragEnd={handleMarkerDragEnd}
                            bwOverlay
                            restrictToBw
                        />
                    ) : !isGoogleReady ? (
                        <div style={containerStyle} className="flex items-center justify-center bg-gray-100 text-sm text-gray-500">
                            {t("loading")}
                        </div>
                    ) : (
                        <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={location}
                        zoom={14}
                        options={{
                            fullscreenControl: true,
                            streetViewControl: false,
                            cameraControl: false,
                            minZoom: BW_MIN_ZOOM,
                            restriction: {
                                latLngBounds: BW_RESTRICTION_BOUNDS,
                                strictBounds: true,
                            },
                        }}
                        onLoad={(map) => {
                            mapRef.current = map;
                            setMapType(map.getMapTypeId()); // initial type
                        }}
                        onMapTypeIdChanged={() => {
                            if (mapRef.current) {
                                setMapType(mapRef.current.getMapTypeId());
                            }
                        }}>
                        <BwGoogleOverlay />
                        <Circle
                            center={{ lat: location.lat, lng: location.lng }}
                            radius={location?.radius * 1000}
                            options={{
                                strokeColor: mapType === "hybrid" || mapType === "satellite" ? "#ffffff" : webSettings?.system_color,
                                fillColor: mapType === "hybrid" || mapType === "satellite" ? "#ffffff" : webSettings?.system_color,
                                strokeOpacity: 0.8,
                                strokeWeight: 2,
                                fillOpacity: 0.2,
                            }} />
                        {!showOnlyRadius && (
                            <Marker position={location} draggable={isDraggable} onDragEnd={handleMarkerDragEnd} />
                        )}
                    </GoogleMap>
                    )}
                </div>
            }
        </div>
    )
}

export default Map
