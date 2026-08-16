import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BiBell } from "react-icons/bi";
import { useSelector } from "react-redux";
import { useTranslation } from "../context/TranslationContext";
import { Skeleton } from "@/components/ui/skeleton";
import { getNotificationListApi } from "@/api/apiRoutes";
import ImageWithPlaceholder from "../image-with-placeholder/ImageWithPlaceholder";
import CustomPagination from "@/components/ui/custom-pagination";
import NoDataFound from "../no-data-found/NoDataFound";

export default function UserNotifications() {
    const t = useTranslation();
    const language = useSelector((state) => (state.LanguageSettings ? state.LanguageSettings.active_language : undefined));
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;

    const notificationsQuery = useQuery({
        queryKey: ["userNotifications", currentPage, itemsPerPage, language],
        queryFn: async () => {
            const response = await getNotificationListApi({
                limit: itemsPerPage,
                offset: (currentPage - 1) * itemsPerPage,
            });

            if (!response || response.error) {
                throw new Error((response && response.message) || t("somethingWentWrong"));
            }

            return response;
        },
        staleTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: true,
        retry: 2,
    });

    const currentNotifications = notificationsQuery.data && notificationsQuery.data.data ? notificationsQuery.data.data : [];
    const totalItems = Number(notificationsQuery.data && notificationsQuery.data.total) || 0;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const isLoading = notificationsQuery.isLoading || notificationsQuery.isFetching;
    const isError = notificationsQuery.isError;
    const errorMessage = (notificationsQuery.error && notificationsQuery.error.message) || t("somethingWentWrong");

    const handlePageChange = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    return (
        <div className="flex flex-col rounded-xl md:rounded-2xl border w-full newBorderColor bg-white">
            <div className="flex items-center justify-between border-b p-4 newBorderColor">
                <h1 className="text-base md:text-xl font-bold brandColor">{t("notifications")}</h1>
            </div>

            <div className="flex flex-col h-full">
                {currentNotifications?.length > 0 && (
                    <div className="mx-4 mt-6 flex items-center justify-between rounded-lg primaryBackgroundBg px-6 py-3">
                        <span className="text-sm font-bold secondaryTextColor">{t("notifications")}</span>
                        <span className="text-sm font-bold secondaryTextColor">{t("date")}</span>
                    </div>
                )}

                <div className="flex flex-col px-4 py-2">
                    {isLoading ? (
                        <div className="px-6 py-8">
                            <div className="flex flex-col gap-3">
                                {[...Array(itemsPerPage)].map((_, index) => (
                                    <Skeleton key={index} className="h-16 w-full rounded-md" />
                                ))}
                            </div>
                        </div>
                    ) : isError ? (
                        <div className="px-6 py-10 text-center text-sm text-gray-500">
                            {errorMessage}
                        </div>
                    ) : currentNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <NoDataFound title={t("noNotificationsFoundTitle")} description={t("noNotificationsFoundDescription")} /> 
                        </div>
                    ) : (
                        currentNotifications.map((item, index) => (
                            <div
                                key={(item && item.id) || index}
                                className={`flex items-center justify-between p-4 ${index !== currentNotifications.length - 1 ? "border-b newBorderColor" : ""}`}
                            >
                                <div className="flex w-full flex-wrap items-center gap-4 md:w-auto">
                                    <div className="flex w-full items-center justify-between md:w-auto">
                                        {item && item.notification_image ? (
                                            <ImageWithPlaceholder
                                                src={item.notification_image}
                                                alt={item.title || "Notification"}
                                                width={48}
                                                height={48}
                                                className="h-12 w-12 shrink-0 rounded-lg"
                                            />
                                        ) : (
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg primaryBgLight12">
                                                <BiBell className="h-6 w-6 shrink-0 brandColor" />
                                            </div>
                                        )}
                                        <div className="flex text-sm font-medium leadColor md:hidden">
                                            {(item && item.created) || "-"}
                                        </div>
                                    </div>

                                    <div className="flex flex-col">
                                        <h3 className="text-sm font-bold secondaryTextColor">{(item && item.title) || t("notification")}</h3>
                                        <p className="text-xs leadColor">{(item && item.description) || ""}</p>
                                    </div>
                                </div>

                                <div className="text-sm font-medium leadColor hidden md:block">
                                    {(item && item.created) || "-"}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {totalItems > 0 && (
                <CustomPagination
                    className="border-t !border-b-0 !border-x-0"
                    currentPage={currentPage}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    isLoading={isLoading}
                    translations={{
                        showing: t("showing"),
                        to: t("to"),
                        of: t("of"),
                        entries: t("entries"),
                    }}
                />
            )}
        </div>
    );
}
