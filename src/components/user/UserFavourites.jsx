"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { BiHeart } from "react-icons/bi";
import { useTranslation } from "../context/TranslationContext";
import { getFavouritePropertyApi } from "@/api/apiRoutes";
import PropertyVerticalCard from "../cards/PropertyVerticalCard";
import VerticlePropertyCardSkeleton from "../skeletons/VerticlePropertyCardSkeleton";
import NoDataFound from "../no-data-found/NoDataFound";

const LIMIT = 8;

const UserFavourites = () => {
    const t = useTranslation();
    const language = useSelector((state) => state.LanguageSettings?.active_language);

    const [favouriteProperty, setFavouriteProperty] = useState([]);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");
    const [totalCount, setTotalCount] = useState(0);

    const favouritesQuery = useQuery({
        queryKey: ["userFavourites", language, offset, LIMIT],
        queryFn: async () => {
            const response = await getFavouritePropertyApi({
                limit: LIMIT,
                offset,
            });

            if (!response || response.error) {
                throw new Error(response?.message || t("somethingWentWrong"));
            }

            return response;
        },
        staleTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: true,
        retry: 2,
    });

    const isLoading = favouritesQuery.isLoading && !favouritesQuery.data;
    const isError = favouritesQuery.isError || Boolean(error);
    const errorMessage = error || favouritesQuery.error?.message || t("somethingWentWrong");

    useEffect(() => {
        const responseData = favouritesQuery.data;

        if (!responseData) return;

        const newData = responseData?.data || [];
        const nextTotalCount = Number(responseData?.total) || 0;

        setTotalCount(nextTotalCount);

        if (offset === 0) {
            setFavouriteProperty(newData);
        } else {
            setFavouriteProperty((prev) => {
                const existingIds = new Set(prev.map((property) => property.id));
                const merged = [...prev];

                newData.forEach((property) => {
                    if (!existingIds.has(property.id)) {
                        merged.push(property);
                    }
                });

                return merged;
            });
        }

        setHasMore(offset + newData.length < nextTotalCount);
        setLoadingMore(false);
    }, [favouritesQuery.data, offset]);

    const handleRemoveProperty = async (propertyId) => {
        setFavouriteProperty((prev) => {
            const updatedList = prev.filter((property) => property.id !== propertyId);
            setHasMore(updatedList.length < Math.max(totalCount - 1, 0));
            return updatedList;
        });

        setTotalCount((prev) => Math.max(prev - 1, 0));
    };

    useEffect(() => {
        if (!favouritesQuery.isError) return;

        setError(favouritesQuery.error?.message || t("somethingWentWrong"));
    }, [favouritesQuery.isError, favouritesQuery.error, t]);

    const fetchFavouriteProperty = () => {
        setError("");
        setOffset(0);
        setFavouriteProperty([]);
        setTotalCount(0);
        setHasMore(true);
        setLoadingMore(false);
        favouritesQuery.refetch();
    };

    const handleLoadMore = () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        setOffset((prev) => prev + LIMIT);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col rounded-2xl border w-full bg-white newBorderColor">
                <div className="flex items-center justify-between border-b p-6 newBorderColor">
                    <h1 className="text-xl font-bold brandColor">{t("myFavourites")}</h1>
                </div>
                <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: LIMIT }).map((_, index) => (
                        <VerticlePropertyCardSkeleton key={index} />
                    ))}
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col rounded-2xl border w-full bg-white newBorderColor">
                <div className="flex items-center justify-between border-b p-6 newBorderColor">
                    <h1 className="text-xl font-bold brandColor">{t("myFavourites")}</h1>
                </div>

                <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full primaryBgLight12">
                        <BiHeart className="h-8 w-8 brandColor opacity-40" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <h2 className="text-lg font-bold secondaryTextColor">{t("errorLoadingFavorites")}</h2>
                        <p className="text-sm leadColor">{errorMessage || t("pleaseTryAgainLater")}</p>
                    </div>
                    <button
                        type="button"
                        onClick={fetchFavouriteProperty}
                        className="rounded-lg primaryBg px-6 py-2 font-medium text-white transition-opacity hover:opacity-90"
                    >
                        {t("tryAgain")}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col rounded-2xl border w-full bg-white newBorderColor">
            <div className="flex flex-col gap-2 border-b p-6 newBorderColor sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                    <h1 className="text-base md:text-xl font-bold brandColor">{t("myFavourites")}</h1>
                    <p className="text-sm leadColor">{totalCount > 0 ? `${totalCount} ${t("favourites")}` : t("startExploringAndSaveProperties")}</p>
                </div>
            </div>

            <div className="flex flex-col gap-6 p-4">
                {favouriteProperty.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                        <NoDataFound title={t("noFavoritesYet")} description={t("startExploringAndSaveProperties")} />
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {favouriteProperty.map((property) => (
                                <PropertyVerticalCard
                                    key={property.id}
                                    property={property}
                                    removeCard={handleRemoveProperty}
                                />
                            ))}
                        </div>

                        {hasMore ? (
                            <div className="flex justify-center">
                                <button
                                    type="button"
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className={`rounded-lg border brandBorder px-6 py-2 font-medium brandColor transition-colors hover:brandBg hover:text-white ${loadingMore ? "cursor-not-allowed opacity-50" : "hover:opacity-90"}`}
                                >
                                    {loadingMore ? t("loading") : t("loadMore")}
                                </button>
                            </div>
                        ) : null}
                    </>
                )}
            </div>
        </div>
    );
};

export default UserFavourites;