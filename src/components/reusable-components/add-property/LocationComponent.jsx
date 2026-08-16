import { useTranslation } from '@/components/context/TranslationContext'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import Map from '@/components/google-maps/GoogleMap'
import CustomLocationAutocomplete from '@/components/location-search/CustomLocationAutocomplete'
import toast from 'react-hot-toast'
import { isWithinBW, BW_OUTSIDE_KEY, BW_OUTSIDE_TEXT_DE } from '@/utils/bwRegion'
import { useEffect, useState } from 'react'

// We only operate in Baden-Württemberg, so the state/Bundesland is fixed.
const BW_STATE = 'Baden-Württemberg'
// ...and the country/Land is always Germany.
const BW_COUNTRY = 'Deutschland'

const LocationComponent = ({
    selectedLocationAddress,
    setSelectedLocationAddress,
    handleLocationSelect,
    handleCheckRequiredFields,
    isEditing = false,
    isProperty = true
}) => {
    const t = useTranslation();

    // Whether the currently selected coordinates fall inside Baden-Württemberg.
    // The Next/Save button stays disabled until this is true.
    const [isCityInBW, setIsCityInBW] = useState(false);

    const bwMessage = () => {
        const m = t(BW_OUTSIDE_KEY);
        return m && m !== BW_OUTSIDE_KEY ? m : BW_OUTSIDE_TEXT_DE;
    };

    // Force the state + country fields to their fixed values on mount (covers edit mode too).
    useEffect(() => {
        setSelectedLocationAddress(prev => {
            if (prev?.state === BW_STATE && prev?.country === BW_COUNTRY) return prev;
            return { ...prev, state: BW_STATE, country: BW_COUNTRY };
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Re-validate whenever coordinates change (autocomplete selection or map marker).
    useEffect(() => {
        let active = true;
        const lat = selectedLocationAddress?.latitude ?? selectedLocationAddress?.lat;
        const lng = selectedLocationAddress?.longitude ?? selectedLocationAddress?.lng;
        if (
            lat == null || lng == null ||
            Number(lat) === 0 || Number(lng) === 0 ||
            isNaN(Number(lat)) || isNaN(Number(lng))
        ) {
            setIsCityInBW(false);
            return;
        }
        isWithinBW(Number(lat), Number(lng)).then((inside) => {
            if (active) setIsCityInBW(!!inside);
        });
        return () => { active = false; };
    }, [
        selectedLocationAddress?.latitude,
        selectedLocationAddress?.longitude,
        selectedLocationAddress?.lat,
        selectedLocationAddress?.lng,
    ]);

    // Handle place selection from CustomLocationAutocomplete
    const handleCustomLocationSelect = async (placeData, placeDetails) => {
        try {
            if (!placeData) return;

            // Region gate: only allow addresses inside Baden-Württemberg.
            const inside = await isWithinBW(placeData.latitude, placeData.longitude);
            if (!inside) {
                toast.error(bwMessage());
                setIsCityInBW(false);
                return; // block selection of out-of-BW addresses
            }

            // placeData.address_components is already the correct array from the API.
            const components = placeData.address_components || [];

            const getComponent = (...types) => {
                for (const type of types) {
                    const found = components.find(c => c.types?.includes(type));
                    if (found) return found.long_name || "";
                }
                return "";
            };

            const city = getComponent("locality", "administrative_area_level_3", "administrative_area_level_2");
            const formattedAddress = placeData.formatted_address || placeDetails?.formatted_address || "";

            const updatedLocationData = {
                city,
                state: BW_STATE, // always Baden-Württemberg
                country: BW_COUNTRY, // always Deutschland
                formattedAddress,
                latitude: placeData.latitude,
                longitude: placeData.longitude,
                lat: placeData.latitude,
                lng: placeData.longitude,
            };

            setSelectedLocationAddress(prev => ({
                ...prev,
                ...updatedLocationData,
            }));
            setIsCityInBW(true);

            if (handleLocationSelect) {
                handleLocationSelect(updatedLocationData);
            }
        } catch (error) {
            console.error("Error processing custom location data:", error);
        }
    };

    // Handle input change for city field
    const handleCityInputChange = (e) => {
        const value = e.target.value;
        // Create a new object to avoid mutating the original data
        setSelectedLocationAddress(prev => ({
            ...prev,
            city: value
        }));
    };

    // Guard the step navigation: never allow proceeding with an out-of-BW location.
    const handleNext = () => {
        if (!isCityInBW) {
            toast.error(bwMessage());
            return;
        }
        handleCheckRequiredFields("location", isProperty ? "seoSettings" : "floorDetails");
    };

    return (
        <div className="flex flex-col gap-8">
            <div className='font-medium text-gray-800'>{isProperty ? t("selectPropertyLocationNote") : t("selectProjectLocationNote")}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    {/* City */}
                    <div className='flex w-full gap-3'>
                        <div className="w-1/2">
                            <Label htmlFor="city" className="font-medium text-gray-800">
                                {t("city")} <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative" data-testid="property-city-autocomplete">
                                <CustomLocationAutocomplete
                                    value={selectedLocationAddress.city || ''}
                                    onChange={handleCityInputChange}
                                    onPlaceSelect={handleCustomLocationSelect}
                                    placeholder={t("searchCity")}
                                    className="w-full px-3 py-2 primaryBackgroundBg rounded-md focus:outline-none focus:border-none focus:border-transparent pr-10"
                                    debounceMs={1000}
                                    maxResults={10}
                                    isPropertyOrProjectOperation={true}
                                />
                            </div>
                        </div>
                        <div className="w-1/2">
                            <Label htmlFor="state" className="font-medium text-gray-800">
                                {t("state")} <span className="text-red-500">*</span>
                            </Label>
                            {/* Fixed to Baden-Württemberg — we only operate in this region. */}
                            <Input
                                type="text"
                                id="state"
                                value={BW_STATE}
                                readOnly
                                disabled
                                data-testid="property-state-input"
                                aria-readonly="true"
                                title={BW_STATE}
                                className="w-full px-3 py-2 primaryBackgroundBg rounded-md focus:outline-none focus:border-none focus:border-transparent cursor-not-allowed opacity-90"
                            />
                        </div>
                    </div>

                    {/* Country — fixed to Deutschland, we only operate in Germany (BW). */}
                    <div>
                        <Label htmlFor="country" className="font-medium text-gray-800">
                            {t("country")} <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            type="text"
                            id="country"
                            value={BW_COUNTRY}
                            readOnly
                            disabled
                            data-testid="property-country-input"
                            aria-readonly="true"
                            title={BW_COUNTRY}
                            className="w-full px-3 py-2 primaryBackgroundBg rounded-md focus:outline-none focus:border-none focus:border-transparent cursor-not-allowed opacity-90"
                        />
                    </div>

                    {/* Address */}
                    <div>
                        <Label htmlFor="address" className="font-medium text-gray-800">
                            {t("address")} <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <Textarea
                                id="address"
                                value={selectedLocationAddress.formattedAddress || ''}
                                onChange={(e) => setSelectedLocationAddress(prev => ({ ...prev, formattedAddress: e.target.value }))}
                                placeholder={t("enterFullAddress")}
                                className="w-full px-3 py-2 primaryBackgroundBg rounded-md focus:outline-none focus:border-none focus:border-transparent resize-none h-24"
                            />
                        </div>
                    </div>
                </div>

                <div className="w-full h-[350px] rounded-lg overflow-hidden">
                    <Map
                        latitude={selectedLocationAddress.latitude || 0}
                        longitude={selectedLocationAddress.longitude || 0}
                        showLabel={true}
                        onSelectLocation={handleLocationSelect}
                    />
                </div>
            </div>

            {/* BW gate hint + Next Button */}
            <div className="flex flex-col items-end gap-2">
                {!isCityInBW && (
                    <p className="text-sm text-red-500" data-testid="bw-restriction-hint">
                        {bwMessage()}
                    </p>
                )}
                <Button
                    onClick={handleNext}
                    disabled={!isCityInBW}
                    data-testid="location-next-button"
                    className="px-10 py-5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isEditing ? t("save") : t("next")}
                </Button>
            </div>
        </div>
    );
};

export default LocationComponent
