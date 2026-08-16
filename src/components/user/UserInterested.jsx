"use client";

import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CustomPagination from "@/components/ui/custom-pagination";
import ReusableTable from "@/components/ui/reusable-table";
import { Skeleton } from "@/components/ui/skeleton";
import { getInterestedUsersApi } from "@/api/apiRoutes";
import { useTranslation } from "../context/TranslationContext";
import { useSelector } from "react-redux";
import { useState } from "react";
import Link from "next/link";

const TableLoadingSkeleton = ({ itemLength }) => (
    <div className="w-full">
        <div className="bg-gray-50 border-y">
            <div className="grid grid-cols-5 px-6 py-4 gap-4">
                {['w-10', 'w-40', 'w-40', 'w-40', 'w-40'].map((width, index) => (
                    <Skeleton key={index} className={`h-4 ${width}`} />
                ))}
            </div>
        </div>

        {[...Array(Number(itemLength))].map((_, rowIndex) => (
            <div key={rowIndex} className="border-b px-6 py-4">
                <div className="grid grid-cols-5 items-center gap-4">
                    <Skeleton className="h-4 w-10" />
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-28" />
                </div>
            </div>
        ))}
    </div>
);

const UserInterested = ({ params }) => {
    const t = useTranslation();
    const router = useRouter();
    const language = useSelector((state) => state.LanguageSettings?.active_language);
    const slug = params?.[0] || router?.query?.slug?.split?.("/")?.[1];

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const interestedUsersQuery = useQuery({
        queryKey: ["userInterestedUsers", slug, currentPage, language],
        queryFn: async () => {
            const response = await getInterestedUsersApi({
                slug_id: slug,
                limit: itemsPerPage,
                offset: (currentPage - 1) * itemsPerPage,
            });

            if (!response || response.error) {
                throw new Error(response?.message || t("somethingWentWrong"));
            }

            return response;
        },
        enabled: Boolean(slug),
        staleTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: true,
        retry: 2,
    });

    const currentUsers = interestedUsersQuery.data?.data || [];
    const totalItems = Number(interestedUsersQuery.data?.total) || 0;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const isLoading = interestedUsersQuery.isLoading || interestedUsersQuery.isFetching;

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const tableColumns = [
        {
            header: t("id"),
            accessor: "id",
            align: "center",
        },
        {
            header: t("profile"),
            accessor: "profile",
            align: "center",
            renderCell: (user) => (
                <div className="flex justify-center items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.profile || ""} alt={user?.name || "User"} />
                        <AvatarFallback>{user?.name ? user?.name?.charAt(0) : "U"}</AvatarFallback>
                    </Avatar>
                </div>
            ),
        },
        {
            header: t("name"),
            accessor: "name",
            align: "center",
        },
        {
            header: t("email"),
            accessor: "email",
            align: "center",
            renderCell: (user) => (
                <Link href={`mailto:${user?.email}`} className="text-center">
                    {user?.email}
                </Link>
            ),
        },
        {
            header: t("mobileNo"),
            accessor: "mobile",
            align: "center",
            renderCell: (user) => (
                <Link href={`tel:${user?.mobile}`} className="text-center">
                    {user?.mobile}
                </Link>
            ),
        },
    ];

    return (
        <div className="flex flex-col rounded-2xl border w-full h-full bg-white newBorderColor">
            <div className="flex items-center justify-between border-b p-6 newBorderColor">
                <h1 className="text-base md:text-xl font-bold brandColor">{t("interestedUsers")}</h1>
            </div>

            <div className="bg-white rounded-b-2xl overflow-hidden p-4">
                {isLoading ? (
                    <TableLoadingSkeleton itemLength={itemsPerPage} />
                ) : (
                    <ReusableTable
                        parentclassname="rounded-tl-xl rounded-tr-xl overflow-x-auto [&>div]:overflow-x-auto !border-0"
                        headerClassName="primaryBackgroundBg [&>tr]:!border-b-0 ltr:[&_tr_th:first-child]:rounded-l-xl rtl:[&_tr_th:first-child]:rounded-r-xl ltr:[&_tr_th:last-child]:rounded-r-xl rtl:[&_tr_th:last-child]:rounded-l-xl [&>div>table>tbody>tr>td]:!border-0"
                        columns={tableColumns}
                        data={currentUsers}
                        isLoading={false}
                        emptyMessage={t("noDataAvailable")}
                    />
                )}

                {totalItems > 0 && currentPage < totalPages && (
                    <CustomPagination
                        className="border-t !border-b-0 !border-x-0 mt-auto"
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
        </div>
    );
};

export default UserInterested;