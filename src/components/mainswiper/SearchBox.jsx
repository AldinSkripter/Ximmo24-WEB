import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Drawer,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { useTranslation } from '../context/TranslationContext';
import { getAdvancedFilterDataApi, getCategoriesApi } from '@/api/apiRoutes';
import CustomLocationAutocomplete from '../location-search/CustomLocationAutocomplete';
import { extractAddressComponents } from '@/utils/helperFunction';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { HiMagnifyingGlass, HiOutlineAdjustmentsHorizontal, HiOutlineSparkles } from 'react-icons/hi2';
import { parseSmartPropertySearch } from '@/utils/smartPropertySearch';

const SearchBox = ({
    // Props for external state management - using flat structure (new)
    propertyType = 'All',
    selectedCategory = '',
    keywords = '',
    city = '',
    zipCode = '',
    state = '',
    country = '',
    minPrice = '',
    maxPrice = '',
    postedSince = 'anytime',
    amenities = [],
    nearbyPlaces = [],
    showAdvancedFilters = false,

    // Handler functions for flat structure (new)
    onPropertyTypeChange,
    onCategoryChange,
    onKeywordsChange,
    onCityChange,
    onStateChange,
    onCountryChange,
    onMinPriceChange,
    onMaxPriceChange,
    onPostedSinceChange,
    onAmenitiesChange,
    onNearbyPlacesChange,
    onShowAdvancedFiltersChange,
    onApplyFilters,
    onSmartSearch,
    onClearFilters,

    // Legacy props for backward compatibility (old nested structure)
    locationInput = '',
    locationData = { formatted_address: '', city: '', state: '', country: '' },
    filters = { min_price: '', max_price: '', posted_since: 'anytime', amenities: [], nearbyPlaces: [] },
    onLocationInputChange,
    onLocationDataChange,
    onFiltersChange,

    // Optional props for customization
    showSearchButton = true,
    showFiltersButton = true,
    className = ''
}) => {
    const t = useTranslation();
    const limit = 100;

    // --- State for categories and facilities ---
    const [categories, setCategories] = useState([]);
    const [facilities, setFacilities] = useState([]);
    const [nearByPlaces, setNearByPlaces] = useState([]);
    const [offset, setOffset] = useState(0);
    const [hasMoreCategories, setHasMoreCategories] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isMobileView, setIsMobileView] = useState(false);
    const [smartQuery, setSmartQuery] = useState(keywords || '');

    // Track data loading state
    const [isCategoriesLoaded, setIsCategoriesLoaded] = useState(false);
    const [isFacilitiesLoaded, setIsFacilitiesLoaded] = useState(false);
    const dataFetchedRef = useRef(false);

    // Google Maps integration - removed, using custom autocomplete
    // const [mapsLoaded, setMapsLoaded] = useState(false);
    // const [mapsLoadError, setMapsLoadError] = useState(null);
    // const [loadingMaps, setLoadingMaps] = useState(true);
    // const autocompleteRef = useRef(null);

    const language = useSelector((state) => state.LanguageSettings?.active_language);

    // Get web settings for distance symbol
    const webSettings = useSelector((state) => state.WebSetting?.data);
    const distanceSymbol = webSettings?.distance_option;
    const distanceSymbolMap = {
        km: t('enterDistanceInKm'),
        m: t('enterDistanceInMeters'),
        mi: t('enterDistanceInMiles'),
        yd: t('enterDistanceInYards')
    };
    const distancePlaceholder = distanceSymbolMap[distanceSymbol] || t('enterDistanceInkm');

    // Resolve values with backward compatibility - new flat structure takes precedence
    const resolvedCity = city || locationData?.city || '';
    const resolvedState = state || locationData?.state || '';
    const resolvedCountry = country || locationData?.country || '';
    const resolvedMinPrice = minPrice || filters?.min_price || '';
    const resolvedMaxPrice = maxPrice || filters?.max_price || '';
    const resolvedPostedSince = postedSince || filters?.posted_since || 'anytime';
    const resolvedAmenities = amenities?.length > 0 ? amenities : (filters?.amenities || []);
    const resolvedNearbyPlaces = nearbyPlaces?.length > 0 ? nearbyPlaces : (filters?.nearbyPlaces || []);
    const resolvedLocationInput = locationInput || '';

    // Resolve handlers with backward compatibility
    const resolvedOnCityChange = onCityChange || ((value) => onLocationDataChange?.({ ...locationData, city: value }));
    const resolvedOnStateChange = onStateChange || ((value) => onLocationDataChange?.({ ...locationData, state: value }));
    const resolvedOnCountryChange = onCountryChange || ((value) => onLocationDataChange?.({ ...locationData, country: value }));
    const resolvedOnMinPriceChange = onMinPriceChange || ((value) => onFiltersChange?.({ ...filters, min_price: value }));
    const resolvedOnMaxPriceChange = onMaxPriceChange || ((value) => onFiltersChange?.({ ...filters, max_price: value }));
    const resolvedOnPostedSinceChange = onPostedSinceChange || ((value) => onFiltersChange?.({ ...filters, posted_since: value }));
    const resolvedOnAmenitiesChange = onAmenitiesChange || ((value) => onFiltersChange?.({ ...filters, amenities: value }));
    const resolvedOnNearbyPlacesChange = onNearbyPlacesChange || ((value) => onFiltersChange?.({ ...filters, nearbyPlaces: value }));
    const resolvedOnLocationInputChange = onLocationInputChange || (() => { });


    // Fetch categories function with pagination logic
    const fetchCategories = useCallback(async (currentOffset) => {
        // Skip if already loaded and not loading more
        if (isCategoriesLoaded && currentOffset === 0) return;

        if (currentOffset > 0) setIsLoadingMore(true);

        try {
            const response = await getCategoriesApi({
                limit: limit,
                offset: currentOffset
            });

            const newCategories = response?.data || [];
            const totalFromServer = response?.total;

            // Update categories state and calculate next state length simultaneously
            let nextCategoriesLength = 0;
            if (currentOffset > 0) {
                setCategories(prev => {
                    const updated = [...prev, ...newCategories];
                    nextCategoriesLength = updated.length;
                    return updated;
                });
            } else {
                setCategories(newCategories);
                nextCategoriesLength = newCategories.length;
                setIsCategoriesLoaded(true);
            }

            // Check if there are likely more categories based on total count
            if (typeof totalFromServer === 'number') {
                setHasMoreCategories(nextCategoriesLength < totalFromServer);
            } else {
                setHasMoreCategories(newCategories.length === limit);
            }

        } catch (error) {
            console.error("Error fetching categories:", error);
            setHasMoreCategories(false);
        } finally {
            if (currentOffset > 0) setIsLoadingMore(false);
        }
    }, [isCategoriesLoaded, limit]);

    const fetchAdvancedData = useCallback(async () => {
        // Skip if already loaded
        if (isFacilitiesLoaded) return;

        try {
            const response = await getAdvancedFilterDataApi();
            if (response?.data && !response?.error) {
                const facilities = response?.data?.parameters || [];
                const nearbyPlaces = response?.data?.nearby_facilities || [];

                setFacilities(facilities);
                setNearByPlaces(nearbyPlaces);
                setIsFacilitiesLoaded(true);
            }
        } catch (error) {
            console.error("Error fetching advanced filter data:", error);
        }
    }, [isFacilitiesLoaded]);

    // Initial fetch on component mount
    useEffect(() => {
        // Prevent duplicate API calls
        if (dataFetchedRef.current) return;
        dataFetchedRef.current = true;

        setOffset(0);
        fetchCategories(0);
        fetchAdvancedData();
    }, [fetchCategories, fetchAdvancedData, language]);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 767px)');
        const handleMediaChange = (event) => setIsMobileView(event.matches);

        setIsMobileView(mediaQuery.matches);
        mediaQuery.addEventListener('change', handleMediaChange);

        return () => mediaQuery.removeEventListener('change', handleMediaChange);
    }, []);

    // Handler for the 'Load More' button
    const handleLoadMoreCategories = async (event) => {
        // Prevent the select dropdown from closing when clicking the button
        event.stopPropagation();
        event.preventDefault();

        if (isLoadingMore || !hasMoreCategories) return;

        const nextOffset = offset + limit;
        setOffset(nextOffset);
        await fetchCategories(nextOffset);
    };

    // Handle place selection from custom autocomplete
    const handlePlaceSelect = (placeData, placeDetails) => {
        if (placeData) {
            const address = extractAddressComponents(placeData);
            // Call the external handlers with flat structure
            resolvedOnCityChange(address.city);
            resolvedOnStateChange(address.state);
            resolvedOnCountryChange(address.country);
            // Also call legacy handler for backward compatibility
            resolvedOnLocationInputChange(address.formattedAddress);
        }
    };

    // --- Options --- 
    const propertyTypeOptions = ['All', 'Sell', 'Rent'];
    const postedSinceOptions = ['anytime', 'yesterday', 'lastWeek', 'lastMonth', 'last3Months', 'last6Months'];

    // --- Handlers --- 
    const handleAmenityChange = (amenityId) => {
        const facility = facilities.find(f => f.id === amenityId);

        if (!facility) return; // safeguard if not found

        const facilityObj = {
            id: amenityId,
            value: facility.translated_name || facility.name,
        };

        const currentAmenities = resolvedAmenities || [];
        const exists = currentAmenities.some(item => {
            // Handle both object format {id, value} and simple ID format for backward compatibility
            return typeof item === 'object' ? item.id === amenityId : item === amenityId;
        });

        let newAmenities;
        if (exists) {
            // Remove if already exists
            newAmenities = currentAmenities.filter(item => {
                return typeof item === 'object' ? item.id !== amenityId : item !== amenityId;
            });
        } else {
            // Always add as objects with {id, value}
            newAmenities = [...currentAmenities, facilityObj];
        }

        resolvedOnAmenitiesChange(newAmenities);
    };

    const handleNearbyPlaceChange = (e) => {
        const { name, value, dataset } = e.target;
        const placeId = Number(name);
        const placeName = dataset.placename || "";

        const currentNearbyPlaces = resolvedNearbyPlaces || [];
        const withoutCurrent = currentNearbyPlaces.filter((p) => p.id !== placeId);

        if (!value) {
            resolvedOnNearbyPlacesChange(withoutCurrent);
            return;
        }

        const newNearbyPlaces = [...withoutCurrent, { id: placeId, distance: parseInt(value), value: placeName }];
        resolvedOnNearbyPlacesChange(newNearbyPlaces);
    };

    const handleClearFiltersInternal = () => {
        // Call external clear handler
        onClearFilters?.();
    };

    const handleApplyFiltersInternal = () => {
        // Call external apply handler
        if (Number(resolvedMinPrice) > Number(resolvedMaxPrice)) {
            toast.error(t("minPriceGreaterThanMaxPrice"));
            return;
        }
        onApplyFilters?.();
    };

    const handleKiSearch = () => {
        const parsed = parseSmartPropertySearch(smartQuery, categories);
        const hasStructuredResult = parsed.category_id || parsed.city || parsed.zip_code ||
            parsed.min_price || parsed.max_price || parsed.property_type !== 'All';

        if (!hasStructuredResult) {
            parsed.keywords = smartQuery.trim();
        }

        onSmartSearch?.(parsed);
    };

    const handleSmartQueryKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleKiSearch();
        }
    };

    const renderAdvancedFiltersContent = ({ showActions = true } = {}) => (
        <>
            {/* Property Budget & Posted Since Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="lg:col-span-1">
                    <Label className="block text-sm font-medium text-gray-700 mb-1">{t('propertyBudget') || 'Property Budget'}</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            type="number"
                            placeholder={t('minPrice') || 'Min Price'}
                            value={resolvedMinPrice}
                            onChange={(e) => resolvedOnMinPriceChange(e.target.value)}
                            className="w-full text-sm md:text-base bg-gray-100 newBorder h-11 rounded-md focus:ring-0 focus:border-none focus-visible:ring-0"
                        />
                        <Input
                            type="number"
                            placeholder={t('maxPrice') || 'Max Price'}
                            value={resolvedMaxPrice}
                            onChange={(e) => resolvedOnMaxPriceChange(e.target.value)}
                            className=" w-full text-sm md:text-base bg-gray-100 newBorder h-11 rounded-md focus:ring-0 focus:border-none focus-visible:ring-0"
                        />
                    </div>
                </div>
                <div className="lg:col-span-1">
                    <Label htmlFor="postedSince" className="block text-sm font-medium text-gray-700 mb-1">{t('postedSince') || 'Posted Since'}</Label>
                    <Select
                        value={resolvedPostedSince}
                        onValueChange={resolvedOnPostedSinceChange}
                    >
                        <SelectTrigger
                            id="postedSince"
                            className="w-full text-sm md:text-base bg-gray-100 border-gray-200 rounded-md h-11 focus:ring-0 focus:border-none focus-visible:ring-0"
                        >
                            <SelectValue placeholder={t('anytime') || 'Anytime'} />
                        </SelectTrigger>
                        <SelectContent>
                            {postedSinceOptions.map(option => (
                                <SelectItem key={option} value={option}>{t(option) || option}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Amenities Section */}
            {facilities?.length > 0 &&
                <div className="mb-6">
                    <Label className="block text-sm font-medium text-gray-700 mb-2">{t('amenities')}</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-3">
                        {facilities.map(amenity => {
                            // Check if amenity is selected (handle both object and simple ID formats)
                            const isChecked = resolvedAmenities?.some(item => {
                                return typeof item === 'object' ? item.id === amenity.id : item === amenity.id;
                            });


                            return (
                                <div key={amenity.id} className="flex items-center gap-2">
                                    <Checkbox
                                        id={amenity.id}
                                        checked={isChecked}
                                        onCheckedChange={() => handleAmenityChange(amenity.id)}
                                        className="w-6 h-6 data-[state=checked]:primaryBg"
                                    />
                                    <Label htmlFor={amenity.id} className="text-sm font-normal text-gray-600 cursor-pointer">{amenity.translated_name || amenity.name}</Label>
                                </div>
                            );
                        })}
                    </div>
                </div>}

            {/* Nearby Places Section */}
            {nearByPlaces?.length > 0 && (
                <div className="mb-6">
                    <Label className="block text-sm font-medium text-gray-700 mb-2 capitalize">{t('nearbyPlaces')} {t('withInDistanceKm')}</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {nearByPlaces.map((place) => (
                            <div key={place.id} className="flex flex-col gap-1">
                                <Label className="text-xs text-gray-700 sm:text-sm">
                                    {place.name}
                                </Label>
                                <Input
                                    type="number"
                                    name={place?.id}
                                    id={place?.id}
                                    data-placename={place.name}
                                    className="w-full text-sm bg-gray-100 border-gray-200 rounded-md h-9 focus:ring-0 focus:border-none focus-visible:ring-0"
                                    placeholder={distancePlaceholder}
                                    onChange={handleNearbyPlaceChange}
                                    value={resolvedNearbyPlaces?.find(p => p.id === place.id)?.distance || ''}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showActions && renderFilterActions()}
        </>
    );

    const renderFilterActions = () => (
        <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={handleClearFiltersInternal} className="text-gray-700 hover:bg-gray-100">
                {t('clear')}
            </Button>
            <Button onClick={handleApplyFiltersInternal} className="bg-gray-900 text-white hover:bg-gray-700 px-5">
                {t('applyFilter')}
            </Button>
        </div>
    );

    const renderBasicFilterFields = () => (
        <>
            {/* Property Type Select (Sell/Rent/All) */}
            <div className="lg:col-span-1">
                <Label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-1">{t('sellOrRent')}</Label>
                <Select value={propertyType} onValueChange={onPropertyTypeChange}>
                    <SelectTrigger id="propertyType" className="!shadow-none w-full bg-gray-100 border-gray-200 rounded-md h-11 focus:ring-0 focus:border-none focus-visible:ring-0 text-sm md:text-base">
                        <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                        {propertyTypeOptions.map(option => (
                            <SelectItem key={option} value={option}>{t(option?.toLowerCase())}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            {/* Category Select */}
            <div className="lg:col-span-1">
                <Label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">{t('category')}</Label>
                <Select value={selectedCategory} onValueChange={onCategoryChange}>
                    <SelectTrigger id="category" className="!shadow-none w-full bg-gray-100 border-gray-200 rounded-md h-11 focus:ring-0 focus:border-none focus-visible:ring-0 text-sm md:text-base">
                        <SelectValue placeholder={t('selectCategory')} />
                    </SelectTrigger>
                    <SelectContent className='max-w-min'>
                        {/* Map existing categories */}
                        {categories?.length > 0 ? categories?.map(option => (
                            <SelectItem key={option?.id} value={option?.id}>{option?.translated_name || option?.category}</SelectItem>
                        )) : (
                            <SelectItem value="no-category-found" disabled>{t('noCategoriesFound')}</SelectItem>
                        )}
                        {/* 'Load More' button section */}
                        {hasMoreCategories && (
                            <div className="p-2 text-center border-t border-gray-200 mt-1">
                                <Button
                                    variant="link"
                                    onClick={handleLoadMoreCategories}
                                    disabled={isLoadingMore}
                                    className="text-sm h-auto p-0 disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
                                >
                                    {isLoadingMore ? (t('loading') || 'Loading...') : (t('loadMore') || 'Load More')}
                                </Button>
                            </div>
                        )}
                    </SelectContent>
                </Select>
            </div>
            {/* Location Input - Custom Autocomplete */}
            <div className="lg:col-span-1">
                <Label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">{t('location') || 'Location'}</Label>
                <div className="relative">
                    <CustomLocationAutocomplete
                        value={resolvedCity || resolvedState || resolvedCountry || resolvedLocationInput || ''}
                        onChange={(e) => resolvedOnCityChange(e.target.value)}
                        onPlaceSelect={handlePlaceSelect}
                        placeholder={t('enterLocation')}
                        className="!shadow-none w-full text-sm md:text-base bg-gray-100 newBorder rounded-md h-11 px-3 focus:outline-none"
                        debounceMs={1000}
                        maxResults={10}
                    />
                </div>
            </div>
        </>
    );

    return (
        // Outer container relative for positioning the dropdown
        <div className="relative w-full">
            <div className={`relative z-10 w-full overflow-hidden rounded-[22px] border border-white/70 bg-white/95 p-3 shadow-[0_20px_55px_-25px_rgba(15,23,42,0.5)] backdrop-blur-xl md:p-4 ${className}`}>
                <div className="pointer-events-none absolute -right-16 -top-24 h-52 w-52 rounded-full primaryBg opacity-10 blur-3xl" />
                <div className="relative flex flex-col gap-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl brandBg text-white shadow-md">
                                <HiOutlineSparkles className="h-5 w-5" />
                                <span className="absolute -right-1 -top-1 flex h-4 w-4">
                                    <span className="absolute h-full w-full animate-ping rounded-full primaryBg opacity-60" />
                                    <span className="relative h-4 w-4 rounded-full border-2 border-white primaryBg" />
                                </span>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="blackTextColor text-sm font-bold md:text-base">{t('kiPropertySearch')}</span>
                                    <span className="rounded-full primaryBg px-2 py-0.5 text-[10px] font-extrabold tracking-[0.16em] text-white">KI</span>
                                </div>
                                <p className="leadColor hidden text-xs sm:block">{t('kiSearchDescription')}</p>
                            </div>
                        </div>
                        <div className="flex rounded-lg bg-slate-100 p-1">
                            {propertyTypeOptions.map((option) => (
                                <button type="button" key={option} onClick={() => onPropertyTypeChange?.(option)}
                                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all md:px-4 ${propertyType === option ? 'brandBg text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`}>
                                    {t(option?.toLowerCase())}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 md:flex-row">
                        <div className="group relative min-w-0 flex-1">
                            <HiOutlineSparkles className="primaryColor absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2" />
                            <input id="ximmo24-ki-search" type="text" value={smartQuery}
                                onChange={(event) => setSmartQuery(event.target.value)}
                                onKeyDown={handleSmartQueryKeyDown}
                                placeholder={t('kiSearchPlaceholder')}
                                className="h-12 w-full rounded-xl border-2 border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:primaryBorderColor focus:shadow-[0_0_0_4px_rgba(14,165,233,0.10)] md:h-[52px]" />
                        </div>
                        <div className="flex gap-2">
                            {showFiltersButton && (
                                <Button type="button" variant="outline"
                                    className="h-12 flex-1 rounded-xl border-2 border-slate-200 bg-white px-4 text-sm text-slate-700 hover:bg-slate-50 md:h-[52px] md:flex-none md:px-5"
                                    onClick={() => onShowAdvancedFiltersChange?.(!showAdvancedFilters)} aria-expanded={showAdvancedFilters}>
                                    <HiOutlineAdjustmentsHorizontal className="mr-2 h-5 w-5" />{t('filters')}
                                </Button>
                            )}
                            {showSearchButton && (
                                <button type="button" onClick={handleKiSearch}
                                    className="primaryBg flex h-12 flex-[1.35] items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white shadow-[0_10px_24px_-12px_rgba(14,165,233,0.9)] transition-all hover:-translate-y-0.5 hover:brightness-95 md:h-[52px] md:flex-none md:px-6">
                                    <HiMagnifyingGlass className="h-5 w-5" />{t('kiSearchButton')}
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="leadColor mr-1 text-xs font-medium">{t('tryForExample')}</span>
                        {['Haus in Achern', 'Wohnung 77855', 'Haus kaufen bis 500.000 €'].map((suggestion) => (
                            <button type="button" key={suggestion} onClick={() => setSmartQuery(suggestion)}
                                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:primaryBorderColor hover:primaryColor">
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <Drawer open={isMobileView && showAdvancedFilters} onOpenChange={onShowAdvancedFiltersChange}>
                <DrawerContent className="h-[85vh] md:hidden">
                    <DrawerHeader className="shrink-0 border-b border-gray-100 pb-3">
                        <DrawerTitle>{t('smartFilters')}</DrawerTitle>
                    </DrawerHeader>
                    <div className="min-h-0 flex-1 overflow-y-auto px-2 py-4">
                        <div className="grid grid-cols-1 gap-4 mb-5">
                            {renderBasicFilterFields()}
                        </div>
                        {renderAdvancedFiltersContent({ showActions: false })}
                    </div>
                    <DrawerFooter className="shrink-0 border-t border-gray-200 bg-white px-4 py-3">
                        {renderFilterActions()}
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

            {/* --- Advanced Filters Dropdown Section --- */}
            {showAdvancedFilters && (
                // Absolute positioning below the top row
                <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-20 hidden w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl md:block md:p-6">
                    <div className="mb-5 grid grid-cols-3 gap-4">
                        {renderBasicFilterFields()}
                    </div>
                    {renderAdvancedFiltersContent()}
                </div>
            )}
        </div>
    );
};

export default SearchBox;
