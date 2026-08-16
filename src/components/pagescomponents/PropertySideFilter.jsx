"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/components/context/TranslationContext";
import CustomLocationAutocomplete from "../location-search/CustomLocationAutocomplete";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAdvancedFilterDataApi, getCategoriesApi, getFacilitiesForFilterApi, getNearbyPlacesForFilterApi } from "@/api/apiRoutes";
import {
  MdOutlineKeyboardArrowDown,
  MdOutlineKeyboardArrowUp,
} from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { IoCloseOutline, IoFilterSharp } from "react-icons/io5";
import searchIcon from "@/assets/searchIcon.svg";
import Image from "next/image";
import { Checkbox } from "../ui/checkbox";
import { extractAddressComponents, isRTL } from "@/utils/helperFunction";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { FiLock } from "react-icons/fi";
/**
 * PropertySideFilter component for filtering properties by various criteria
 * Includes filters for property type, location, price range, and posting time
*/
const PropertySideFilter = ({
  showBorder = true,
  onFilterApply,
  handleClearFilter,
  handleCloseFilter,
  currentFilters,
  hideFilter = false,
  hideFilterType = "",
  citySlug,
  isMobileSheet = false,
  setIsFilterSheetOpen,
  locked = null
}) => {
  const t = useTranslation();
  const router = useRouter();
  const slug = router?.query?.slug || "";
  const isFeaturedLocked = locked === "featured";
  const isPremiumLocked = locked === "premium";
  const isLocationLocked = locked === "location";
  const isCategoryLocked = locked === "category";
  const language = useSelector((state) => state?.LanguageSettings?.current_language)
  const [categories, setCategories] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [filterPlaces, setFilterPlaces] = useState([]);

  const limit = 10;

  const webSettings = useSelector((state) => state.WebSetting?.data)
  const distanceSymbol = webSettings?.distance_option
  const distanceSymbolMap = {
    km: t('enterDistanceInKm'),
    m: t('enterDistanceInMeters'),
    mi: t('enterDistanceInMiles'),
    yd: t('enterDistanceInYards')
  }
  const distancePlaceholder = t(distanceSymbolMap[distanceSymbol]) || t('enterDistanceInkm')

  // Filter states
  const [keywords, setKeywords] = useState(""); // For search keywords
  const [propertyType, setPropertyType] = useState("All"); // 'All', 'Sell' or 'Rent' - default to 'All' for UI
  const [locationInput, setLocationInput] = useState({
    formatted_address: "",
    city: "",
    state: "",
    country: "",
  }); // For the input field
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [postedTime, setPostedTime] = useState("anytime"); // 'anytime', 'lastWeek', 'yesterday'
  const [isSmartFilterOpen, setIsSmartFilterOpen] = useState(false); // Smart filter toggle
  const [isFeatured, setIsFeatured] = useState(false); // Is Featured Property
  const [isPremium, setIsPremium] = useState(false); // Is Premium Property

  // Location input state
  const isRtl = isRTL()

  // Handle place selection from custom autocomplete
  const handlePlaceSelect = (placeData, placeDetails) => {
    if (placeData) {
      // Get the place data
      if (placeData.address_components) {
        const data = extractAddressComponents(placeData);
        setLocationInput({
          formatted_address: data.formattedAddress,
          city: data.city,
          state: data.state,
          country: data.country,
        });
      } else {
        // Fallback to formatted address
        setLocationInput({
          formatted_address: placeData.formatted_address,
          city: "",
          state: "",
          country: "",
        });
      }
    }
  };
  // Handle manual input change
  const handleLocationInputChange = (e) => {
    setLocationInput({
      ...locationInput,
      [e.target.name]: e.target.value,
    });
    // If user clears the input, also clear the locationInput value
    if (!e.target.value) {
      setLocationInput({
        formatted_address: "",
        city: "",
        state: "",
        country: "",
      });
    }
  };

  // Handle apply filter button click
  const handleApplyFilter = () => {
    const filters = {
      keywords: keywords,
      // Only include property_type if it's not "All"
      ...(propertyType !== "All" && { property_type: propertyType }),
      category_id: selectedCategory === "all" ? "" : selectedCategory,
      city: locationInput.city,
      state: citySlug ? "" : locationInput.state,
      country: citySlug ? "" : locationInput.country,
      min_price: minPrice ? minPrice.toString() : "",
      max_price: maxPrice ? maxPrice.toString() : "",
      posted_since: postedTime === "anytime" ? "" : postedTime,
      amenities: selectedFacilities,
      promoted: isFeatured,
      is_premium: isPremium ? "1" : "",
      nearbyPlaces: filterPlaces || []
    };

    Object.entries(filters).forEach(([key, value]) => {
      if (value === "" || value === undefined) {
        delete filters[key];
      }
    });

    if (Number(minPrice) > Number(maxPrice)) {
      toast.error(t("minPriceGreaterThanMaxPrice"));
      return;
    }

    if (onFilterApply) {
      onFilterApply(filters);
    }
    // Close sheet if handleCloseFilter function is provided (optional)
    if (handleCloseFilter) {
      handleCloseFilter();
    }
  };
  const [isCategoriesFetched, setIsCategoriesFetched] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const res = await getCategoriesApi({ limit: limit, offset: offset });
      if (res?.data) {
        // If loading more, append to existing categories
        if (offset > 0) {
          setCategories((prevCategories) => [...prevCategories, ...res.data]);
        } else {
          setCategories(res.data);
        }
        setIsCategoriesFetched(true);

        // Save total count if it exists in the response
        if (res.total !== undefined) {
          setTotalCategories(res.total);
        }
      } else {
        // If no data received, set empty array
        if (offset === 0) {
          setCategories([]);
        }
        setIsCategoriesFetched(true);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      // On error, set empty categories and mark as fetched
      if (offset === 0) {
        setCategories([]);
      }
      setIsCategoriesFetched(true);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleApplyNearbyPlaceChange = (e) => {
    const { name, value } = e.target;
    const placeId = Number(name);

    setFilterPlaces((prevPlaces) => {
      const withoutCurrent = prevPlaces.filter((p) => p.id !== placeId);

      if (!value) return withoutCurrent;

      return [...withoutCurrent, { id: placeId, value: parseInt(value) }];
    });
  };

  const normalizeNearbyPlaces = (places = []) => {
    if (!Array.isArray(places)) return [];

    return places
      .map((place) => {
        const id = Number(place?.id);
        const value = Number(place?.value ?? place?.distance);

        if (Number.isNaN(id) || Number.isNaN(value)) {
          return null;
        }

        return { id, value };
      })
      .filter(Boolean);
  };


  useEffect(() => {
    fetchCategories();
  }, [offset, language]);

  // Update selectedCategory when categories are fetched or currentFilters changes
  useEffect(() => {
    if (isCategoriesFetched && categories?.length > 0) {
      if (currentFilters?.category_id) {
        setSelectedCategory(parseInt(currentFilters.category_id));
      } else if (currentFilters?.category_slug_id) {
        const matchedCategory = categories.find(
          (c) => c.slug_id === currentFilters.category_slug_id
        );
        if (matchedCategory) {
          setSelectedCategory(matchedCategory.id);
        } else {
          setSelectedCategory("all");
        }
      } else {
        setSelectedCategory("all");
      }
    }
  }, [isCategoriesFetched, categories, currentFilters?.category_id, currentFilters?.category_slug_id]);

  const fetchAdvancedFilterData = async () => {
    try {
      const res = await getAdvancedFilterDataApi();
      if (res?.data && !res?.error) {
        setFacilities(res.data?.parameters || []);
        setNearbyPlaces(res.data?.nearby_facilities || []);
      }
    } catch (error) {
      console.error("Error fetching advanced filter data:", error?.message);
    }
  }


  useEffect(() => {
    fetchAdvancedFilterData()
  }, [language]);

  useEffect(() => {
    if (currentFilters) {
      const hasLocationData = currentFilters.city || currentFilters.state || currentFilters.country;
      const formattedAddress = [
        currentFilters.city,
        currentFilters.state,
        currentFilters.country,
      ].filter(Boolean).join(", ");

      setKeywords(currentFilters.keywords || "");


      // Handle property_type mapping: default to "All" for UI if empty or not specified
      const mappedPropertyType =
        currentFilters.property_type === "Sell"
          ? "Sell"
          : currentFilters.property_type === "Rent"
            ? "Rent"
            : "All"; // Default to "All" for UI when empty or not specified
      setPropertyType(mappedPropertyType);

      // Only update location input if there's actual location data
      if (hasLocationData) {
        setLocationInput({
          formatted_address: formattedAddress,
          city: currentFilters.city || "",
          state: currentFilters.state || "",
          country: currentFilters.country || "",
        });
      }

      setMinPrice(currentFilters.min_price || "");
      setMaxPrice(currentFilters.max_price || "");
      setPostedTime(currentFilters.posted_since || "anytime");
      const processedAmenities = currentFilters?.amenities || [];
      const processedNearbyPlaces = normalizeNearbyPlaces(
        currentFilters?.nearby_places || currentFilters?.nearbyPlaces || []
      );

      // Set filterPlaces from currentFilters if available
      setFilterPlaces(processedNearbyPlaces);

      setSelectedFacilities(processedAmenities);
      setIsFeatured(currentFilters.promoted == "1" || false);
      setIsPremium(currentFilters.is_premium == "1" || false);
    }
  }, [currentFilters]);

  const handleLoadMore = () => {
    setOffset(offset + limit);
  };
  // Determine if there are more categories to load
  const hasMoreCategories = categories.length < totalCategories;

  // Check if any filters have been applied
  const hasAnyFilterApplied = () => {
    // Determine the default category value based on categories availability
    const defaultCategoryValue = categories?.length > 0 ? "all" : "no-categories-found";

    // Common filters that users can modify
    const hasCommonFilters = (
      keywords !== "" ||
      propertyType !== "All" ||
      (selectedCategory !== defaultCategoryValue && !isCategoryLocked) ||
      locationInput?.formatted_address !== "" ||
      minPrice !== "" ||
      maxPrice !== "" ||
      postedTime !== "anytime" ||
      selectedFacilities.length > 0 ||
      filterPlaces.length > 0
    );

    // Active switches that are NOT locked
    const hasActiveNonLockedSwitches = (
      (isFeatured && !isFeaturedLocked) ||
      (isPremium && !isPremiumLocked)
    );

    return hasCommonFilters || hasActiveNonLockedSwitches;
  };

  // Handle clear filter button click
  const handleClearFilterClick = () => {
    // First reset all local filter states
    handleClearFilter?.();
    setKeywords("");
    setPropertyType("All");

    // Set category to appropriate default based on availability
    if (!isCategoryLocked) {
      const updatedSelectedCategory = categories?.length > 0 ? "all" : "no-categories-found";
      setSelectedCategory(updatedSelectedCategory);
    }
    if (!isLocationLocked) {
      setLocationInput({
        formatted_address: "",
        city: "",
        state: "",
        country: "",
      });
    }
    setMinPrice("");
    setMaxPrice("");
    setPostedTime("anytime");
    setSelectedFacilities([]);

    if (!isFeaturedLocked) {
      setIsFeatured(false);
    }
    if (!isPremiumLocked) {
      setIsPremium(false);
    }
  };

  const handleFacilityChange = (facilityId) => {
    const facility = facilities.find(f => f.id == facilityId);

    if (!facility) return; // safeguard if not found

    const facilityObj = {
      id: parseInt(facilityId),
      value: facility.translated_name || facility.name,
    };

    setSelectedFacilities((prevSelected) => {
      const exists = prevSelected.some(item =>
        (typeof item === 'object' ? item.id : item) == facilityId
      );

      if (exists) {
        // Remove if already exists
        return prevSelected.filter(item =>
          (typeof item === 'object' ? item.id : item) != facilityId
        );
      } else {
        // Always return objects with {id, value}
        return [...prevSelected, facilityObj];
      }
    });
  };

  // Check if any filters are applied
  const isAnyFilterApplied = hasAnyFilterApplied();

  return (
    <div className={`flex ${isMobileSheet ? "h-full justify-around" : "h-fit"} flex-col overflow-hidden rounded-lg ${showBorder ? "border bg-white" : ""}`}>
      {/* Header */}
      <div className={`flex items-center justify-between ${showBorder ? "border-b" : ""} p-3 sm:p-4`}>
        <h2 className="text-lg font-medium sm:text-xl">{t("filter")}</h2>
        <div className="flex items-center gap-2">
          {isAnyFilterApplied && !isMobileSheet && <button
            onClick={handleClearFilterClick}
            className={`text-xs font-medium sm:text-sm text-red-600`}
            disabled={!isAnyFilterApplied}
          >
            {t("clearFilter")}
          </button>}
          {isMobileSheet && (
            <button
              onClick={() => setIsFilterSheetOpen(false)}
              className="w-9 h-9 primaryBackgroundBg leadColor rounded-xl flex items-center justify-center  " >
              <IoCloseOutline size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-grow overflow-y-auto">
        {/* Keywords Filter */}
        <div className="mb-4 mt-3 px-3 sm:mb-6 sm:mt-4 sm:px-4">
          <h3 className="mb-1.5 text-sm font-medium sm:mb-2 sm:text-base">
            {t("keywords")}
          </h3>
          <input
            type="text"
            placeholder={t("enterSearchKeywords")}
            className="primaryBackgroundBg leadColor newBorderColor w-full rounded-lg border-[1.5px] px-3 py-2.5 text-sm focus:outline-none sm:px-4 sm:py-3 sm:text-base"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div className="mb-4 px-3 sm:mb-6 sm:px-4">
          <h3 className="mb-1.5 text-sm font-medium sm:mb-2 sm:text-base flex items-center gap-1.5">
            {t("category")}
            {isCategoryLocked && <FiLock className="text-xs text-gray-500" />}
          </h3>
          <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={isCategoryLocked}>
            <SelectTrigger className="primaryBackgroundBg leadColor newBorderColor !h-full w-full border-[1.5px] !px-3 !py-2.5 text-sm focus:outline-none focus:ring-0 sm:!px-4 sm:!py-3 sm:text-base !shadow-none">
              <SelectValue
                placeholder={
                  categoriesLoading
                    ? t("loading")
                    : categories?.length > 0
                      ? t("all")
                      : t("noCategoriesFound")
                }
              />
            </SelectTrigger>
            <SelectContent className="max-w-min">
              {categoriesLoading ? (
                <SelectItem value="loading" disabled>
                  {t("loading")}
                </SelectItem>
              ) : categories?.length > 0 ? (
                <>
                  <SelectItem value="all">{t("all")}</SelectItem>
                  {categories.map((category) => (
                    <SelectItem
                      key={category.id || category.category_id}
                      value={category.id || category.category_id}
                      className="text-wrap"
                    >
                      {category?.translated_name || category.name || category.category}
                    </SelectItem>
                  ))}

                  {/* Load more button only if there are more categories */}
                  {hasMoreCategories && (
                    <div className="px-2 py-1.5 text-center">
                      <button
                        onClick={handleLoadMore}
                        disabled={loading}
                        className="text-xs text-primary hover:underline focus:outline-none sm:text-sm"
                      >
                        {loading ? t("loading") : t("loadMore")}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <SelectItem value="no-categories-found" disabled>
                  {t("noCategoriesFound")}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Location Filter */}
        <div className="mb-4 px-3 sm:mb-6 sm:px-4">
          <h3 className="mb-1.5 text-sm font-medium sm:mb-2 sm:text-base flex items-center gap-1.5">
            {t("location")}
            {isLocationLocked && <FiLock className="text-xs text-gray-500" />}
          </h3>
          <CustomLocationAutocomplete
            value={citySlug ? citySlug : locationInput?.formatted_address || ""}
            onChange={handleLocationInputChange}
            onPlaceSelect={handlePlaceSelect}
            placeholder={t("enterLocation")}
            className="primaryBackgroundBg leadColor newBorderColor w-full rounded-lg border-[1.5px] px-3 py-2.5 text-sm focus:outline-none sm:px-4 sm:py-3 sm:text-base"
            disabled={citySlug || isLocationLocked ? true : false}
            showFindMyLocation={!isLocationLocked}
            debounceMs={1000}
            maxResults={10}
            inputProps={{
              name: "formatted_address"
            }}
          />
        </div>

        {/* Property Type Filter (Sell/Rent) */}
        <div className="mb-4 px-3 sm:mb-6 sm:px-4">
          <h3 className="mb-1.5 text-sm font-medium sm:mb-2 sm:text-base">
            {t("sellOrRent")}
          </h3>
          <Select value={propertyType} onValueChange={setPropertyType}>
            <SelectTrigger className="primaryBackgroundBg leadColor newBorderColor !h-auto w-full border-[1.5px] !px-3 !py-2.5 text-sm focus:outline-none focus:ring-0 sm:!px-4 sm:!py-3 sm:text-base !shadow-none">
              <SelectValue placeholder={t("all")} />
            </SelectTrigger>
            <SelectContent className="max-w-min">
              <SelectItem value="All">{t("all")}</SelectItem>
              <SelectItem value="Sell">{t("sell")}</SelectItem>
              <SelectItem value="Rent">{t("rent")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Property Feature Toggles */}
        <div className="border-t">
          {/* Featured Property */}
          {!(hideFilter && hideFilterType === "featured-properties" && !isFeaturedLocked) ? (
            <div className="flex min-h-[62px] items-center justify-between border-b p-3 sm:p-4">
              <span className="text-sm font-medium sm:text-base">
                {t("isFeaturedProperty")}
              </span>
              <div className="flex items-center gap-2">
                {isFeaturedLocked && <FiLock className="text-sm" />}
                <Switch
                  className={`data-[state=checked]:primaryBg h-4 w-8 rounded-2xl transition-colors duration-300 sm:h-5 sm:w-10 [&>span]:h-2.5 [&>span]:w-2.5 ${isRtl ? "data-[state=checked]:[&>span]:-translate-x-4" : "data-[state=checked]:[&>span]:translate-x-4"} sm:[&>span]:h-3 sm:[&>span]:w-3 ${isRtl ? "sm:data-[state=checked]:[&>span]:-translate-x-5" : "sm:data-[state=checked]:[&>span]:translate-x-5"}`}
                  checked={isFeatured}
                  onCheckedChange={setIsFeatured}
                  disabled={slug === "featured-properties" || isFeaturedLocked}
                />
              </div>
            </div>
          ) : null}

          {/* Premium Property */}
          {!(hideFilter && hideFilterType === "premium-properties" && !isPremiumLocked) ? (
            <div className="flex min-h-[62px] items-center justify-between p-3 sm:p-4">
              <span className="text-sm font-medium sm:text-base">
                {t("isPremiumProperty")}
              </span>
              <div className="flex items-center gap-2">
                {isPremiumLocked && <FiLock className="text-sm" />}
                <Switch
                  className={`data-[state=checked]:primaryBg h-4 w-8 rounded-2xl transition-colors duration-300 sm:h-5 sm:w-10 [&>span]:h-2.5 [&>span]:w-2.5 ${isRtl ? "data-[state=checked]:[&>span]:-translate-x-4" : "data-[state=checked]:[&>span]:translate-x-4"} sm:[&>span]:h-3 sm:[&>span]:w-3 ${isRtl ? "sm:data-[state=checked]:[&>span]:-translate-x-5" : "sm:data-[state=checked]:[&>span]:translate-x-5"}`}
                  checked={isPremium}
                  onCheckedChange={setIsPremium}
                  disabled={isPremiumLocked}
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* Smart Filter Collapsible */}
        <div className="border-t p-3 sm:p-4">
          <button
            onClick={() => setIsSmartFilterOpen(!isSmartFilterOpen)}
            className="brandBorder hover:brandBg group flex w-full items-center justify-between rounded-lg border-[1.5px] px-3 py-2.5 sm:px-5 sm:py-3"
          >
            <div className="flex items-center">
              <div className="mr-2">
                <IoFilterSharp className="text-base group-hover:fill-white sm:text-lg" />
              </div>
              <span className="text-sm font-medium group-hover:text-white sm:text-base">
                {t("smartFilters")}
              </span>
            </div>
            {!isSmartFilterOpen ? (
              <MdOutlineKeyboardArrowDown className="h-5 w-5 group-hover:fill-white sm:h-7 sm:w-7" />
            ) : (
              <MdOutlineKeyboardArrowUp className="h-5 w-5 group-hover:fill-white sm:h-7 sm:w-7" />
            )}
          </button>

          {/* Smart Filter Content */}
          <AnimatePresence initial={false}>
            {isSmartFilterOpen && (
              <motion.div
                key="smart-filter-content"
                initial="collapsed"
                animate="open"
                exit="collapsed"
                variants={{
                  open: { opacity: 1, height: "auto", marginTop: "16px" },
                  collapsed: { opacity: 0, height: 0, marginTop: "0px" },
                }}
                transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                className="overflow-hidden px-0.5 sm:px-1"
              >
                {/* Property Budget */}
                <div className="mb-4 sm:mb-5">
                  <h3 className="mb-2 text-sm font-medium sm:mb-3 sm:text-base">
                    {t("propertyBudget")}
                  </h3>
                  <div className="grid lg:grid-cols-2 gap-2 sm:gap-3">
                    <input
                      type="number"
                      placeholder={t("minPrice")}
                      className="newBorderColor primaryBackgroundBg w-full rounded-lg border-[1.5px] px-3 py-2.5 text-sm focus:outline-none sm:px-4 sm:py-3 sm:text-base"
                      value={minPrice}
                      min={0}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder={t("maxPrice")}
                      className="newBorderColor primaryBackgroundBg w-full rounded-lg border-[1.5px] px-3 py-2.5 text-sm focus:outline-none sm:px-4 sm:py-3 sm:text-base"
                      value={maxPrice}
                      min={parseInt(minPrice || 0) + 1}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>

                {/* Posted Since */}
                <div className="mb-4 sm:mb-5">
                  <h3 className="mb-2 text-sm font-medium sm:mb-3 sm:text-base">
                    {t("postedSince")}
                  </h3>
                  <Select value={postedTime} onValueChange={setPostedTime}>
                    <SelectTrigger className="!shadow-none primaryBackgroundBg leadColor newBorderColor !h-auto w-full border-[1.5px] !px-3 !py-2.5 text-sm focus:outline-none focus:ring-0 sm:!px-4 sm:!py-3 sm:text-base">
                      <SelectValue placeholder={t("anytime")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anytime">{t("anytime")}</SelectItem>
                      <SelectItem value="yesterday">{t("yesterday")}</SelectItem>
                      <SelectItem value="lastWeek">{t("lastWeek")}</SelectItem>
                      <SelectItem value="lastMonth">{t("lastMonth")}</SelectItem>
                      <SelectItem value="last3Months">{t("last3Months")}</SelectItem>
                      <SelectItem value="last6Months">{t("last6Months")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Amenities */}
                {facilities?.length > 0 &&
                  <div className="mb-4 sm:mb-5">
                    <h3 className="mb-2 text-sm font-medium sm:mb-3 sm:text-base">
                      {t("amenities")} :
                    </h3>
                    <div className="grid lg:grid-cols-2 gap-x-2 gap-y-2 px-0 sm:gap-x-4 sm:gap-y-3 sm:px-2">
                      {facilities.map((facility) => {
                        const isChecked = selectedFacilities?.some(item => {
                          return typeof item === 'object' ? item.id === facility.id : item === facility.id;
                        }) || false;

                        return (
                          <label
                            key={facility.id}
                            htmlFor={`facility-${facility.id}`}
                            className={`flex cursor-pointer items-center gap-2`}
                          >
                            <Checkbox
                              id={`facility-${facility.id}`}
                              checked={isChecked}
                              onCheckedChange={() =>
                                handleFacilityChange(facility.id)
                              }
                              className="data-[state=checked]:primaryBg h-4 w-4 rounded hover:cursor-pointer sm:h-5 sm:w-5"
                            />
                            <span
                              className={` line-clamp-3
                                ${isChecked
                                  ? "primaryColor text-xs font-medium sm:text-sm"
                                  : "text-xs text-gray-700 sm:text-sm"
                                }`}
                            >
                              {facility.translated_name || facility.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>}
                {nearbyPlaces?.length > 0 && (
                  <div className="mb-4 sm:mb-5">
                    <h3 className="mb-2 text-sm font-medium sm:mb-3 sm:text-base capitalize">
                      {t("nearbyPlaces")} {t('withInDistanceKm')} :
                    </h3>
                    <div className="grid grid-cols-12 gap-3">
                      {nearbyPlaces?.map((place) => {
                        // Find the corresponding distance value from filterPlaces
                        const selectedPlace = filterPlaces.find(fp => fp.id === place.id);
                        const distanceValue = selectedPlace?.value || "";

                        return (
                          <div className="col-span-6" key={place.id}>
                            <label className="text-xs text-gray-700 sm:text-sm">
                              {place.name}
                            </label>
                            <input
                              type="number"
                              name={place?.id}
                              id={place?.id}
                              value={distanceValue}
                              data-placename={place.name}
                              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none"
                              placeholder={distancePlaceholder}
                              onChange={handleApplyNearbyPlaceChange}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer / Search Button */}
      <div className="flex items-center gap-2 justify-between mt-auto p-3 sm:p-4">
        {/* In mobile-sheet mode, show Clear Filter alongside the search button */}
        {isMobileSheet && isAnyFilterApplied && (
          <button
            onClick={handleClearFilterClick}
            className="flex-shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors sm:px-4 sm:py-3 sm:text-sm"
          >
            {t("clearFilter")}
          </button>
        )}
        <button
          onClick={handleApplyFilter}
          className="brandBg hover:primaryBg flex w-full items-center justify-center rounded-lg py-2.5 text-white sm:py-3"
        >
          <Image
            src={searchIcon}
            alt="search"
            className="mr-1.5 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5"
          />
          <span className="text-sm sm:text-base">{t("search")}</span>
        </button>
      </div>
    </div>
  );
};

export default PropertySideFilter;
