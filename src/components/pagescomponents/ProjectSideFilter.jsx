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
import { getCategoriesApi } from "@/api/apiRoutes";
import {
  MdOutlineKeyboardArrowDown,
  MdOutlineKeyboardArrowUp,
} from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { IoCloseOutline, IoFilterSharp } from "react-icons/io5";
import searchIcon from "@/assets/searchIcon.svg";
import Image from "next/image";
import { extractAddressComponents, isRTL } from "@/utils/helperFunction";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { FiLock } from "react-icons/fi";

/**
 * ProjectSideFilter component for filtering projects by various criteria
 * Simplified version of PropertySideFilter without property-specific fields
 */
const ProjectSideFilter = ({
  showBorder = true,
  onFilterApply,
  handleClearFilter,
  handleCloseFilter,
  currentFilters,
  hideFilter = false,
  hideFilterType = "",
  isMobileSheet = false,
  setIsFilterSheetOpen,
  locked = null,
}) => {
  const t = useTranslation();
  const router = useRouter();
  const slug = router?.query?.slug || "";
  const isFeaturedLocked = locked === "featured";
  const isPremiumLocked = locked === "premium";
  const isLocationLocked = locked === "location";
  const language = useSelector(
    (state) => state?.LanguageSettings?.current_language
  );
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const limit = 10;

  // Filter states
  const [keywords, setKeywords] = useState("");
  const [locationInput, setLocationInput] = useState({
    formatted_address: "",
    city: "",
    state: "",
    country: "",
  });
  const [postedTime, setPostedTime] = useState("anytime");
  const [isSmartFilterOpen, setIsSmartFilterOpen] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [projectType, setProjectType] = useState("All"); // 'All', 'upcoming', or 'under_construction'

  const isRtl = isRTL();

  // Handle place selection from custom autocomplete
  const handlePlaceSelect = (placeData, placeDetails) => {
    if (placeData) {
      if (placeData.address_components) {
        const data = extractAddressComponents(placeData);
        setLocationInput({
          formatted_address: data.formattedAddress,
          city: data.city,
          state: data.state,
          country: data.country,
        });
      } else {
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
      category_id: selectedCategory === "all" ? "" : selectedCategory,
      city: locationInput.city,
      state: locationInput.state,
      country: locationInput.country,
      posted_since: postedTime === "anytime" ? "" : postedTime,
      promoted: isFeatured ? "1" : "",
      is_premium: isPremium ? "1" : "",
      ...(projectType !== "All" && { project_type: projectType }),
    };

    Object.entries(filters).forEach(([key, value]) => {
      if (value === "" || value === undefined) {
        delete filters[key];
      }
    });

    if (onFilterApply) {
      onFilterApply(filters);
    }
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
        if (offset > 0) {
          setCategories((prev) => [...prev, ...res.data]);
        } else {
          setCategories(res.data);
        }
        setIsCategoriesFetched(true);
        if (res.total !== undefined) {
          setTotalCategories(res.total);
        }
      } else {
        if (offset === 0) {
          setCategories([]);
        }
        setIsCategoriesFetched(true);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      if (offset === 0) {
        setCategories([]);
      }
      setIsCategoriesFetched(true);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [offset, language]);

  useEffect(() => {
    if (isCategoriesFetched) {
      if (!currentFilters?.category_id) {
        const updatedSelectedCategory =
          categories?.length > 0 ? "all" : "no-categories-found";
        setSelectedCategory(updatedSelectedCategory);
      }
    }
  }, [isCategoriesFetched, categories, currentFilters?.category_id]);

  useEffect(() => {
    if (currentFilters) {
      const hasLocationData =
        currentFilters.city || currentFilters.state || currentFilters.country;
      const formattedAddress = ["city", "state", "country"].every(
        (key) => currentFilters[key]
      )
        ? [
          currentFilters.city,
          currentFilters.state,
          currentFilters.country,
        ].join(", ")
        : "";

      setKeywords(currentFilters.keywords || "");

      if (currentFilters.category_id) {
        setSelectedCategory(parseInt(currentFilters.category_id));
      } else if (isCategoriesFetched) {
        const updatedSelectedCategory =
          categories?.length > 0 ? "all" : "no-categories-found";
        setSelectedCategory(updatedSelectedCategory);
      }

      if (hasLocationData) {
        setLocationInput({
          formatted_address: formattedAddress,
          city: currentFilters.city || "",
          state: currentFilters.state || "",
          country: currentFilters.country || "",
        });
      }

      setPostedTime(currentFilters.posted_since || "anytime");
      setIsFeatured(currentFilters.promoted == "1" || false);
      setIsPremium(currentFilters.is_premium == "1" || false);
      const mappedFilterType = currentFilters.project_type === 0
        ? "upcoming"
        : currentFilters.project_type === 1
          ? "under_construction"
          : "All";
      setProjectType(mappedFilterType);
    }
  }, [currentFilters]);

  const handleLoadMore = () => {
    setOffset(offset + limit);
  };
  const hasMoreCategories = categories.length < totalCategories;

  // Check if any filters have been applied
  // Locked filters (location, featured, premium) are pre-set and cannot be cleared,
  // so they must NOT count toward "a filter is applied" check.
  const hasAnyFilterApplied = () => {
    const defaultCategoryValue =
      categories?.length > 0 ? "all" : "no-categories-found";

    const hasCommonFilters =
      keywords !== "" ||
      selectedCategory !== defaultCategoryValue ||
      // Location only counts as "applied" when it is NOT locked
      (!isLocationLocked && locationInput?.formatted_address !== "") ||
      postedTime !== "anytime" ||
      projectType !== "All";

    // Active switches that are NOT locked
    const hasActiveNonLockedSwitches =
      (isFeatured && !isFeaturedLocked) ||
      (isPremium && !isPremiumLocked);

    return hasCommonFilters || hasActiveNonLockedSwitches;
  };

  // Handle clear filter button click
  const handleClearFilterClick = () => {
    handleClearFilter?.();
    setKeywords("");
    const updatedSelectedCategory =
      categories?.length > 0 ? "all" : "no-categories-found";
    setSelectedCategory(updatedSelectedCategory);
    if (!isLocationLocked) {
      setLocationInput({
        formatted_address: "",
        city: "",
        state: "",
        country: "",
      });
    }
    setPostedTime("anytime");
    setProjectType("All");
    if (!isPremiumLocked) {
      setIsPremium(false);
    }
    if (!isFeaturedLocked) {
      setIsFeatured(false);
    }
  };

  const isAnyFilterApplied = hasAnyFilterApplied();

  return (
    <div
      className={`flex ${isMobileSheet ? "h-full justify-around" : "h-fit"} flex-col overflow-hidden rounded-lg ${showBorder ? "border bg-white" : ""}`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between ${showBorder ? "border-b" : ""} p-3 sm:p-4`}
      >
        <h2 className="text-lg font-medium sm:text-xl">{t("filter")}</h2>
        <div className="flex items-center gap-2">
          {/* Show clear button in header only for non-mobile-sheet layout */}
          {isAnyFilterApplied && !isMobileSheet && (
            <button
              onClick={handleClearFilterClick}
              className="text-xs font-medium sm:text-sm text-red-600 hover:text-red-700 transition-colors"
            >
              {t("clearFilter")}
            </button>
          )}
          {isMobileSheet && (
            <button
              onClick={() => setIsFilterSheetOpen(false)}
              className="w-9 h-9 primaryBackgroundBg leadColor rounded-xl flex items-center justify-center"
            >
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
        <div className="mb-4 mt-3 px-3 sm:mb-6 sm:px-4">
          <h3 className="mb-1.5 text-sm font-medium sm:mb-2 sm:text-base">
            {t("category")}
          </h3>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
                      {category?.translated_name ||
                        category.name ||
                        category.category}
                    </SelectItem>
                  ))}
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
            value={locationInput?.formatted_address || ""}
            onChange={handleLocationInputChange}
            onPlaceSelect={handlePlaceSelect}
            placeholder={t("enterLocation")}
            className="primaryBackgroundBg leadColor newBorderColor w-full rounded-lg border-[1.5px] px-3 py-2.5 text-sm focus:outline-none sm:px-4 sm:py-3 sm:text-base"
            disabled={isLocationLocked ? true : false}
            showFindMyLocation={!isLocationLocked}
            debounceMs={1000}
            maxResults={10}
            inputProps={{
              name: "formatted_address",
            }}
          />
        </div>

        {/* Project Type Filter (Upcoming / Under Construction) */}
        <div className="mb-4 px-3 sm:mb-6 sm:px-4">
          <h3 className="mb-1.5 text-sm font-medium sm:mb-2 sm:text-base">
            {t("projectType")}
          </h3>
          <Select value={projectType} onValueChange={setProjectType}>
            <SelectTrigger className="primaryBackgroundBg leadColor newBorderColor !h-auto w-full border-[1.5px] !px-3 !py-2.5 text-sm focus:outline-none focus:ring-0 sm:!px-4 sm:!py-3 sm:text-base !shadow-none">
              <SelectValue placeholder={t("all")} />
            </SelectTrigger>
            <SelectContent className="max-w-min">
              <SelectItem value="All">{t("all")}</SelectItem>
              <SelectItem value="upcoming">{t("upcoming")}</SelectItem>
              <SelectItem value="under_construction">{t("under_construction")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Project Feature Toggles */}
        <div className="border-t">
          {/* Featured Project */}
          {!(hideFilter && hideFilterType === "featured-projects" && !isFeaturedLocked) ? (
            <div className="flex min-h-[62px] items-center justify-between border-b p-3 sm:p-4">
              <span className="text-sm font-medium sm:text-base">
                {t("isFeaturedProject")}
              </span>
              <div className="flex items-center gap-2">
                {isFeaturedLocked && <FiLock className="text-sm" />}
                <Switch
                  className={`data-[state=checked]:primaryBg h-4 w-8 rounded-2xl transition-colors duration-300 sm:h-5 sm:w-10 [&>span]:h-2.5 [&>span]:w-2.5 ${isRtl ? "data-[state=checked]:[&>span]:-translate-x-4" : "data-[state=checked]:[&>span]:translate-x-4"} sm:[&>span]:h-3 sm:[&>span]:w-3 ${isRtl ? "sm:data-[state=checked]:[&>span]:-translate-x-5" : "sm:data-[state=checked]:[&>span]:translate-x-5"}`}
                  checked={isFeatured}
                  onCheckedChange={setIsFeatured}
                  disabled={slug === "featured-projects" || isFeaturedLocked}
                />
              </div>
            </div>
          ) : null}

          {/* Premium Project */}
          {!(hideFilter && hideFilterType === "premium-projects" && !isPremiumLocked) ? (
            <div className="flex min-h-[62px] items-center justify-between p-3 sm:p-4">
              <span className="text-sm font-medium sm:text-base">
                {t("isPremiumProject")}
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
                      <SelectItem value="yesterday">
                        {t("yesterday")}
                      </SelectItem>
                      <SelectItem value="lastWeek">{t("lastWeek")}</SelectItem>
                      <SelectItem value="lastMonth">
                        {t("lastMonth")}
                      </SelectItem>
                      <SelectItem value="last3Months">
                        {t("last3Months")}
                      </SelectItem>
                      <SelectItem value="last6Months">
                        {t("last6Months")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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

export default ProjectSideFilter;
