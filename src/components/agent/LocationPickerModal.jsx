"use client";

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CustomLocationAutocomplete from '../location-search/CustomLocationAutocomplete';
import Map from '../google-maps/GoogleMap';
import { useTranslation } from '../context/TranslationContext';
import { extractAddressComponents } from '@/utils/helperFunction';
import toast from 'react-hot-toast';
import { AiOutlineClose } from "react-icons/ai";
import { MdOutlineMyLocation } from "react-icons/md";
import { getMapDetailsApi } from '@/api/apiRoutes';

const LocationPickerModal = ({ isOpen, onClose, onLocationSelect, initialLocation }) => {
    const t = useTranslation();
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState({
        location: initialLocation?.location || '',
        latitude: initialLocation?.latitude || null,
        longitude: initialLocation?.longitude || null,
        city: initialLocation?.city || '',
        state: initialLocation?.state || '',
        country: initialLocation?.country || ''
    });

    // Update state when initialLocation changes
    useEffect(() => {
        if (initialLocation) {
            setSelectedLocation({
                location: initialLocation.location || '',
                latitude: initialLocation.latitude || null,
                longitude: initialLocation.longitude || null,
                city: initialLocation.city || '',
                state: initialLocation.state || '',
                country: initialLocation.country || ''
            });
        }
    }, [initialLocation]);

    // Fetch address from coordinates using API
    const fetchAddressFromCoordinates = async (lat, lng) => {
        try {
            const response = await getMapDetailsApi({
                latitude: lat.toString(),
                longitude: lng.toString(),
                place_id: ""
            });

            if (response?.error === false && response?.data?.result) {
                const firstResult = response.data.result;
                const addressData = extractAddressComponents(firstResult);
                const formattedAddress = firstResult.formatted_address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

                setSelectedLocation({
                    location: formattedAddress,
                    city: addressData.city || '',
                    state: addressData.state || '',
                    country: addressData.country || '',
                    latitude: lat,
                    longitude: lng
                });

                return { address: formattedAddress, ...addressData };
            } else {
                const fallbackAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                setSelectedLocation({
                    location: fallbackAddress,
                    city: '',
                    state: '',
                    country: '',
                    latitude: lat,
                    longitude: lng
                });
                return { address: fallbackAddress };
            }
        } catch (error) {
            console.error("Error fetching address from coordinates:", error);
            const fallbackAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            setSelectedLocation({
                location: fallbackAddress,
                city: '',
                state: '',
                country: '',
                latitude: lat,
                longitude: lng
            });
            return { address: fallbackAddress };
        }
    };

    // Find my location handler
    const handleFindMyLocation = async () => {
        if (!("geolocation" in navigator)) {
            toast.error(t("geolocationNotSupported"));
            return;
        }

        setIsLoadingLocation(true);

        try {
            // Check permission explicitly
            if ("permissions" in navigator) {
                const status = await navigator.permissions.query({ name: "geolocation" });

                if (status.state === "denied") {
                    toast.error(t("locationAccessDenied"));
                    setIsLoadingLocation(false);
                    return;
                }
            }

            // Get position as Promise
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                });
            });

            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            // Update state and fetch address
            await fetchAddressFromCoordinates(lat, lng);

        } catch (error) {
            // Handle errors
            if (error?.code === 1) {
                toast.error(t("locationAccessDenied"));
            } else {
                console.warn("Temporary geolocation failure:", error);
                toast.error(t("locationUnavailable"));
            }
        } finally {
            setIsLoadingLocation(false);
        }
    };

    const handlePlaceSelect = (placeData) => {
        try {
            if (placeData) {
                const { city, state, country, formattedAddress } = extractAddressComponents(placeData);
                const lat = placeData.latitude;
                const lng = placeData.longitude;

                if (lat && lng) {
                    setSelectedLocation({
                        location: formattedAddress,
                        city: city,
                        state: state,
                        country: country,
                        latitude: lat,
                        longitude: lng
                    });
                }
            }
        } catch (error) {
            console.error("Error selecting place:", error);
            toast.error(t("locationError"));
        }
    };

    const handleMapLocationSelect = (locationData) => {
        try {
            setSelectedLocation({
                location: locationData.formattedAddress || selectedLocation.location,
                city: locationData.city || selectedLocation.city,
                state: locationData.state || selectedLocation.state,
                country: locationData.country || selectedLocation.country,
                latitude: locationData.lat,
                longitude: locationData.lng
            });
        } catch (error) {
            console.error("Error selecting map location:", error);
            toast.error(t("locationError"));
        }
    };

    const handleConfirm = () => {
        if (selectedLocation.latitude && selectedLocation.longitude) {
            onLocationSelect(selectedLocation);
            onClose();
        } else {
            toast.error(t("pleaseSelectLocation"));
        }
    };

    const handleCancel = () => {
        // Reset to initial location on cancel
        if (initialLocation) {
            setSelectedLocation({
                location: initialLocation.location || '',
                latitude: initialLocation.latitude || null,
                longitude: initialLocation.longitude || null,
                city: initialLocation.city || '',
                state: initialLocation.state || '',
                country: initialLocation.country || ''
            });
        }
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                onInteractOutside={(e) => e.preventDefault()}
                className="md:max-w-2xl p-0 rounded-xl max-h-full overflow-y-auto custom-scrollbar [&>button]:hidden"
            >
                <DialogHeader className="w-full">
                    <DialogTitle className="flex w-full items-center justify-between border-b p-3 sm:p-4 md:p-6">
                        <div className="truncate text-base font-semibold sm:text-xl md:text-2xl">
                            {t("selectLocation")}
                        </div>
                        <AiOutlineClose
                            className="primaryBackgroundBg leadColor font-bold rounded-xl h-6 w-6 flex-shrink-0 focus:outline-none focus:ring-0 p-1 md:p-2 hover:cursor-pointer sm:h-7 sm:w-7 md:h-10 md:w-10"
                            onClick={handleCancel}
                            aria-label="Close"
                            tabIndex="0"
                            onKeyDown={(e) => e.key === 'Enter' && handleCancel()}
                        />
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        {t("selectLocationDescription")}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 p-4 sm:p-6">
                    {/* Search Location */}
                    <div>
                        <label className="text-sm mb-2 block font-medium" htmlFor="locationSearch">{t("searchLocation")}</label>
                        <div className="flex justify-center primaryBackgroundBg items-center border newBorderColor rounded-lg p-1 relative">
                            <div className="w-full">
                                <CustomLocationAutocomplete
                                    value={selectedLocation.location}
                                    onChange={(e) => setSelectedLocation(prev => ({ ...prev, location: e.target.value }))}
                                    onPlaceSelect={handlePlaceSelect}
                                    placeholder={t("searchLocation")}
                                    className="w-full flex-grow rounded-l-lg primaryBackgroundBg px-2 py-2 focus:outline-none border-0"
                                    showFindMyLocation={false}
                                    debounceMs={1000}
                                    maxResults={10}
                                    inputProps={{
                                        name: "locationSearch",
                                        id: "locationSearch",
                                        autoComplete: "off"
                                    }}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleFindMyLocation}
                                disabled={isLoadingLocation}
                                className={`flex items-center text-nowrap justify-center px-2.5 py-2 primaryBg text-white rounded-md hover:opacity-80 gap-2 ${isLoadingLocation ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                aria-label={t("findMyLocation")}
                                tabIndex="0"
                            >
                                <MdOutlineMyLocation className={`fill-white ${isLoadingLocation ? 'animate-pulse' : ''
                                    }`} />
                                <span className="hidden sm:inline">{t("findMyLocation")}</span>
                            </button>
                        </div>
                    </div>

                    {/* Map */}
                    <div>
                        <label className="text-sm mb-2 block font-medium">{t("dragMarkerToSelectLocation")}</label>
                        <div className="rounded-lg overflow-hidden h-[13rem] md:h-[21rem]">
                            <Map
                                onSelectLocation={handleMapLocationSelect}
                                latitude={selectedLocation.latitude}
                                longitude={selectedLocation.longitude}
                                showLabel={false}
                                isDraggable={true}
                                showOnlyRadius={false}
                            />
                        </div>
                    </div>

                    {/* Selected Location Display
                    {selectedLocation.location && (
                        <div className="p-3 sm:p-4 primaryBackgroundBg rounded-lg border newBorderColor">
                            <p className="text-sm font-medium mb-1 leadColor">{t("selectedLocation")}:</p>
                            <p className="text-sm secondaryLeadColor">{selectedLocation.location}</p>
                        </div>
                    )} */}
                </div>

                <DialogFooter className="gap-2 sm:gap-0 p-4 sm:p-3 pt-0 border border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        className="h-10 sm:h-11 px-4 sm:px-6 border newBorderColor hover:bg-[#F0F0F0] transition-colors duration-200"
                    >
                        {t("cancel")}
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        className="h-10 sm:h-11 px-6 sm:px-8 primaryBg text-white hover:brandBg transition-colors duration-200"
                    >
                        {t("ok")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default LocationPickerModal;
