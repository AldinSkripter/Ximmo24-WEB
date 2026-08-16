import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import ImageWithPlaceholder from "@/components/image-with-placeholder/ImageWithPlaceholder";
import { BiMap, BiChevronLeft, BiChevronRight } from "react-icons/bi";
import { FiEye, FiTrash2 } from "react-icons/fi";
import { useTranslation } from "../context/TranslationContext";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import { toast } from "react-hot-toast";
import { deleteAdvertisementApi, getFeaturedDataApi } from "@/api/apiRoutes";
import { getFormattedDate } from "@/utils/helperFunction";
import ReusableTable from "@/components/ui/reusable-table";
import { Button } from "../ui/button";
import CustomLink from "../context/CustomLink";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import NoDataFound from "../no-data-found/NoDataFound";

const DesktopAdvertisementTableSkeleton = ({ itemLength, activeTab, t }) => (
    <Table className="min-w-full text-left" parentclassname="!border-0">
        <TableHeader className="primaryBackgroundBg [&>tr]:!border-b-0 [&>tr>th:first-child]:!rounded-l-lg [&>tr>th:last-child]:!rounded-r-lg">
            <TableRow>
                <TableHead className="p-4 text-sm font-semibold text-transparent">
                    {activeTab === "Property" ? t("properties") : t("projects")}
                </TableHead>
                <TableHead className="p-4 text-sm font-semibold text-transparent text-center">
                    {t("status")}
                </TableHead>
                <TableHead className="p-4 text-sm font-semibold text-transparent text-center">
                    {t("featuredOn")}
                </TableHead>
                <TableHead className="p-4 text-sm font-semibold text-transparent text-center">
                    {t("expiryDate")}
                </TableHead>
                <TableHead className="p-4 text-sm font-semibold text-transparent text-center">
                    {t("remainingDays")}
                </TableHead>
                <TableHead className="p-4 text-sm font-semibold text-transparent text-center">
                    {t("action")}
                </TableHead>
            </TableRow>
        </TableHeader>
        <TableBody className="w-full">
            {Array.from({ length: itemLength }).map((_, rowIndex) => (
                <TableRow key={rowIndex} className="border-b newBorderColor">
                    <TableCell className="p-4">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-12 w-12 shrink-0 rounded-md" />
                            <div className="flex flex-col gap-2">
                                <Skeleton className="h-4 w-44 max-w-full" />
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-3 w-3 rounded-full" />
                                    <Skeleton className="h-3 w-28" />
                                </div>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell className="p-4 text-center">
                        <div className="flex justify-center">
                            <Skeleton className="h-7 w-20 rounded-md" />
                        </div>
                    </TableCell>
                    <TableCell className="p-4 text-center">
                        <Skeleton className="mx-auto h-4 w-24" />
                    </TableCell>
                    <TableCell className="p-4 text-center">
                        <Skeleton className="mx-auto h-4 w-24" />
                    </TableCell>
                    <TableCell className="p-4 text-center">
                        <Skeleton className="mx-auto h-4 w-16" />
                    </TableCell>
                    <TableCell className="p-4 text-center">
                        <div className="flex justify-center">
                            <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                    </TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
);

const MyAdvertisements = () => {
    const t = useTranslation();
    const router = useRouter();
    const language = useSelector(
        (state) => state.LanguageSettings?.active_language,
    );
    const [currentPage, setCurrentPage] = useState(1);

    // Derive activeTab from URL query param (tab=property or tab=projects)
    const tabParam = router?.query?.tab;
    const activeTab = tabParam === "projects" ? "Projects" : "Property";

    const handleTabChange = (tab) => {
        setCurrentPage(1);
        router.push(
            {
                pathname: router.pathname,
                query: { ...router.query, tab },
            },
            undefined,
            { shallow: true }
        );
    };

    const isLaptopScreen = useMediaQuery("(min-width: 1024px)");

    const itemsPerPage = isLaptopScreen ? 8 : 4;
    const offset = (currentPage - 1) * itemsPerPage;

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    const advertisementsQuery = useQuery({
        queryKey: [
            "userAdvertisements",
            activeTab,
            currentPage,
            itemsPerPage,
            language,
        ],
        queryFn: async () => {
            const type = activeTab === "Property" ? "property" : "project";
            const response = await getFeaturedDataApi({
                type,
                limit: itemsPerPage,
                offset,
            });

            if (!response || response.error) {
                throw new Error(response?.message || t("somethingWentWrong"));
            }

            return response;
        },
        staleTime: 10 * 60_000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: "always",
        retry: 2,
    });

    const currentListings = (advertisementsQuery.data?.data || []).map((item) => {
        const advertisementItem =
            activeTab === "Property" ? item?.property : item?.project;
        const statusValue = String(
            item?.status ?? advertisementItem?.status ?? "",
        ).toLowerCase();

        return {
            id: item?.id || advertisementItem?.id,
            title:
                advertisementItem?.translated_title || advertisementItem?.title || "-",
            image: advertisementItem?.image || advertisementItem?.title_image || "",
            location:
                [
                    advertisementItem?.city,
                    advertisementItem?.state,
                    advertisementItem?.country,
                ]
                    .filter(Boolean)
                    .join(", ") || "-",
            statusLabel:
                statusValue === "0" ||
                    statusValue === "active" ||
                    statusValue === "approved"
                    ? t("active")
                    : statusValue === "1" || statusValue === "pending"
                        ? t("pending")
                        : statusValue === "2" || statusValue === "rejected"
                            ? t("rejected")
                            : statusValue === "3" || statusValue === "expired"
                                ? t("expired")
                                : String(item?.status ?? advertisementItem?.status ?? "-"),
            statusClassName:
                statusValue === "0" ||
                    statusValue === "active" ||
                    statusValue === "approved"
                    ? "newGreenBgLight newGreenTextColor"
                    : statusValue === "1" || statusValue === "pending"
                        ? "primarySellBgLight12 primarySellText"
                        : "bg-red-50 text-red-600",
            featuredOn: item?.start_date
                ? getFormattedDate(item.start_date, t)
                : item?.featuredOn || "-",
            expiryDate: item?.end_date
                ? getFormattedDate(item.end_date, t)
                : item?.expiryDate || "-",
            remainingDays: item?.remaining_days ?? item?.remainingDays ?? "-",
            slugId: advertisementItem?.slug_id,
        };
    });
    const totalItems = Number(advertisementsQuery.data?.total) || 0;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = totalItems === 0 ? 0 : offset + 1;
    const endIndex = Math.min(offset + itemsPerPage, totalItems);
    const isLoading =
        advertisementsQuery.isLoading || advertisementsQuery.isFetching;
    const isError = advertisementsQuery.isError;

    const desktopTableColumns = [
        {
            header: activeTab === "Property" ? t("properties") : t("projects"),
            accessor: "title",
            align: "left",
            renderCell: (item) => (
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md">
                        <ImageWithPlaceholder
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex flex-col">
                        <h3 className="max-w-48 truncate text-sm font-bold text-gray-900 xl:max-w-56">
                            {item.title}
                        </h3>
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                            <BiMap size={14} className="mr-1" />
                            {item.location}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            header: t("status"),
            accessor: "statusLabel",
            align: "center",
            renderCell: (item) => (
                <span
                    className={`rounded-md px-3 py-1 text-xs font-medium ${item.statusClassName}`}
                >
                    {item.statusLabel}
                </span>
            ),
        },
        {
            header: t("featuredOn"),
            accessor: "featuredOn",
            align: "center",
            renderCell: (item) => (
                <span className="text-sm secondaryTextColor">{item.featuredOn}</span>
            ),
        },
        {
            header: t("expiryDate"),
            accessor: "expiryDate",
            align: "center",
            renderCell: (item) => (
                <span className="text-sm secondaryTextColor">{item.expiryDate}</span>
            ),
        },
        {
            header: t("remainingDays"),
            accessor: "remainingDays",
            align: "center",
            renderCell: (item) => (
                <span className="text-sm secondaryTextColor">{item.remainingDays}</span>
            ),
        },
        {
            header: t("action"),
            accessor: "id",
            align: "center",
            renderCell: (elem) => {
                const path = activeTab === "Property"
                    ? `/my-property/${elem?.slugId}`
                    : `/my-project/${elem?.slugId}`;
                return (
                    <div className="flex items-center justify-center gap-2">
                        <CustomLink href={path}>
                            <Button size="sm" variant="ghost" className="blueTextColor hover:blueTextColor hover:bg-blue-100 blueBgLight h-8 w-8 p-0">
                                <FiEye className="size-4" />
                            </Button>
                        </CustomLink>
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteAdvertisement(elem)}
                            className="h-8 w-8 p-0 redColorText redColorLightBg"
                            aria-label={t("delete")}
                        >
                            <FiTrash2 className="size-4" />
                        </Button>
                    </div>
                );
            },
        },
    ];

    const handlePageChange = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    const handleDeleteAdvertisement = (item) => {
        const isProjectListing = activeTab === "Projects";

        Swal.fire({
            icon: "warning",
            title: t("areYouSure"),
            text: isProjectListing ? t("deleteProjectAdvertisement") : t("deletePropertyAdvertisement"),
            showCancelButton: true,
            confirmButtonText: t("yesDelete") || t("delete"),
            cancelButtonText: t("cancel"),
            customClass: {
                confirmButton: "Swal-confirm-buttons",
                cancelButton: "Swal-cancel-buttons",
            },
        }).then(async (result) => {
            if (!result.isConfirmed) return;

            try {
                const response = await deleteAdvertisementApi({
                    id: item?.id,
                });

                if (!response?.error) {
                    toast.success(t(response?.message || "success"));
                    advertisementsQuery.refetch();
                } else {
                    toast.error(t(response?.message || "somethingWentWrong"));
                }
            } catch (error) {
                toast.error(t(error?.message || "somethingWentWrong"));
            }
        });
    };

    return (
        <div className="flex flex-col rounded-xl md:rounded-2xl border w-full newBorderColor bg-white overflow-hidden">
            {/* Header */}
            <div className="flex flex-wrap gap-2  items-center md:justify-between justify-center p-4 border-b brandColor">
                <h1 className="text-base md:text-xl font-bold brandColor">
                    {t("myAdvertisements")}
                </h1>
                <div className="flex primaryBackgroundBg border newBorderColor rounded-lg p-1.5 gap-1">
                    <button
                        type="button"
                        onClick={() => handleTabChange("property")}
                        aria-pressed={activeTab === "Property"}
                        className={`px-3 py-2 text-base font-medium rounded-lg transition-colors ${activeTab === "Property" ? "primaryBg text-white" : "secondaryTextColor hover:text-gray-900"}`}
                    >
                        {t("property")}
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTabChange("projects")}
                        aria-pressed={activeTab === "Projects"}
                        className={`px-3 py-2 text-base font-medium rounded-lg transition-colors ${activeTab === "Projects" ? "primaryBg text-white" : "secondaryTextColor hover:text-gray-900"}`}
                    >
                        {t("projects")}
                    </button>
                </div>
            </div>

            <div className="w-full flex flex-col gap-4 p-4 lg:p-6">
                {isLoading ? (
                    <>
                        <div className="hidden lg:block">
                            <DesktopAdvertisementTableSkeleton
                                itemLength={itemsPerPage}
                                activeTab={activeTab}
                                t={t}
                            />
                        </div>
                        <div className="flex flex-col gap-4 lg:hidden">
                            {Array.from({ length: Math.min(itemsPerPage, 4) }).map((_, index) => (
                                <div
                                    key={index}
                                    className="flex flex-col gap-4 rounded-xl border p-4 newBorderColor"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex flex-1 items-center gap-3">
                                            <Skeleton className="h-12 w-12 shrink-0 rounded-md" />
                                            <div className="flex flex-1 flex-col gap-2">
                                                <Skeleton className="h-4 w-40 max-w-full" />
                                                <Skeleton className="h-3 w-28" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-8 w-8 rounded-md" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : isError ? (
                    <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
                        {t("errorOccurred")}
                    </div>
                ) : currentListings.length === 0 ? (
                    <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
                        <NoDataFound title={t("noAdvertisementsFoundTitle")} description={t("noAdvertisementsFoundTitleDescription")} />
                    </div>
                ) : (
                    <>
                        <div className="hidden lg:block">
                            <ReusableTable
                                columns={desktopTableColumns}
                                data={currentListings}
                                isLoading={isLoading}
                                emptyMessage={t("noDataAvailable")}
                                tableClassName="min-w-full text-left"
                                headerClassName="primaryBackgroundBg [&>tr]:!border-b-0 ltr:[&_tr_th:first-child]:rounded-l-xl rtl:[&_tr_th:first-child]:rounded-r-xl ltr:[&_tr_th:last-child]:rounded-r-xl rtl:[&_tr_th:last-child]:rounded-l-xl [&>div>table>tbody>tr>td]:!border-0"
                                parentclassname="!border-0"
                            />
                        </div>

                        <div className="flex flex-col gap-8 lg:hidden">
                            {currentListings.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex flex-col gap-2 items-start justify-start border p-4 rounded-xl newBorderColor hover:shadow-sm transition-shadow"
                                >
                                    <div className="flex w-full items-center">
                                        <div className="flex justify-between w-full border-b pb-2">
                                            <p className="flex flex-col font-bold text-sm brandColor">
                                                {activeTab === "Property" ? t("property") : t("project")}:
                                            </p>
                                            <div className="flex flex-col items-end">
                                                <div className="flex h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                                                    <ImageWithPlaceholder
                                                        src={item.image}
                                                        alt={item.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <h3 className="mt-2 max-w-xs text-right text-sm font-bold text-gray-900">
                                                    {item.title}
                                                </h3>
                                                <div className="mt-1 flex items-center text-xs text-gray-500">
                                                    <BiMap size={14} className="mr-1" />
                                                    {item.location}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex w-full justify-between pb-2 border-b">
                                        <p className="text-sm font-bold brandColor">
                                            {t("status")}:
                                        </p>
                                        <span
                                            className={`rounded-md px-3 py-1 text-xs font-medium ${item.statusClassName}`}
                                        >
                                            {item.statusLabel}
                                        </span>
                                    </div>

                                    <div className="flex w-full justify-between pb-2 border-b">
                                        <p className="text-sm font-bold brandColor">
                                            {t("featuredOn")}:
                                        </p>
                                        <span className="text-sm secondaryTextColor">
                                            {item.featuredOn}
                                        </span>
                                    </div>

                                    <div className="flex w-full justify-between pb-2 border-b">
                                        <p className="text-sm font-bold brandColor">
                                            {t("expiryDate")}:
                                        </p>
                                        <span className="text-sm secondaryTextColor">
                                            {item.expiryDate}
                                        </span>
                                    </div>

                                    <div className="flex w-full justify-between pb-2 border-b">
                                        <p className="text-sm font-bold brandColor">
                                            {t("remainingDays")}:
                                        </p>
                                        <span className="text-sm secondaryTextColor font-medium">
                                            {item.remainingDays}
                                        </span>
                                    </div>

                                    <div className="flex w-full justify-between pt-2">
                                        <p className="text-sm font-bold brandColor">
                                            {t("action")}:
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <CustomLink href={activeTab === "Property" ? `/my-property/${item.slugId}` : `/my-project/${item.slugId}`}>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    aria-label={t("view")}
                                                    className="blueTextColor hover:blueTextColor hover:bg-blue-100 blueBgLight h-10 w-10 p-0"
                                                >
                                                    <FiEye size={20} />
                                                </Button>
                                            </CustomLink>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                aria-label={t("delete")}
                                                onClick={() => handleDeleteAdvertisement(item)}
                                                className="h-10 w-10 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                                            >
                                                <FiTrash2 size={20} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {totalItems > 0 && (
                <div className="flex items-center justify-between border-t p-6 newBorderColor mt-auto flex-wrap gap-4">
                    <span className="text-sm brandColor font-medium">
                        {t("showing")} {startIndex} {t("to")} {endIndex} {t("of")}{" "}
                        {totalItems} {t("entries")}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`w-8 h-8 flex items-center justify-center rounded border brandBorder secondaryTextColor hover:bg-gray-50 ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            <BiChevronLeft size={20} className="rtl:rotate-180" />
                        </button>
                        {[...Array(totalPages)].map((_, index) => (
                            <button
                                type="button"
                                key={index + 1}
                                onClick={() => handlePageChange(index + 1)}
                                className={`w-8 h-8 flex items-center justify-center rounded ${currentPage === index + 1 ? "brandBg text-white" : "border brandBorder secondaryTextColor hover:bg-gray-50"}`}
                            >
                                {index + 1}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`w-8 h-8 flex items-center justify-center rounded border brandBorder secondaryTextColor hover:bg-gray-50 ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            <BiChevronRight size={20} className="rtl:rotate-180" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyAdvertisements;
