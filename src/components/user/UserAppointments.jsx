import { useState } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { BiChevronLeft, BiChevronRight } from "react-icons/bi";
import { useTranslation } from "../context/TranslationContext";
import { getUserAppointmentsApi, updateAppointmentStatusApi } from "@/api/apiRoutes";
import { Skeleton } from "@/components/ui/skeleton";
import NoDataFound from "../no-data-found/NoDataFound";
import SomethingWentWrong from "../error/SomethingWentWrong";
import AppointmentTableRow from "../agent/AppointmentTableRow";
import AppointmentActionModal from "../reusable-components/appointment/AppointmentActionModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const formatDisplayValue = (value) => {
    if (!value) return "-";

    return String(value)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

const parseAppointmentDate = (value) => {
    if (!value) return null;

    const parsed = new Date(String(value).replace(" ", "T"));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatAppointmentDate = (value) => {
    const parsedDate = parseAppointmentDate(value);
    if (!parsedDate) return formatDisplayValue(value);

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(parsedDate);
};

const getAppointmentDateLabel = (appointment) => formatAppointmentDate(appointment?.date || appointment?.start_at);

const AppointmentCardSkeleton = () => (
    <div className="border flex flex-col gap-4 rounded-[16px] border-gray-200 bg-white p-4">
        <div className="flex flex-row items-start gap-[30px]">
            <div className="flex flex-1 items-center gap-3 lg:max-w-[450px] xl:max-w-[650px]">
                <Skeleton className="h-[48px] w-[48px] shrink-0 rounded-[8px]" />
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-56 max-w-full" />
                    <Skeleton className="h-3 w-32" />
                </div>
            </div>

            <div className="hidden flex-col gap-2 md:flex">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-24" />
            </div>

            <div className="hidden flex-col gap-2 md:flex">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-28" />
            </div>

            <div className="hidden flex-col gap-2 md:flex">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-7 w-24 rounded-[4px]" />
            </div>
        </div>

        <Skeleton className="h-14 w-full rounded-[8px]" />
    </div>
);

const AppointmentListSkeleton = ({ itemLength }) => (
    <div className="flex flex-col gap-6">
        <div className="primaryBackgroundBg rounded-md px-4 py-2">
            <Skeleton className="h-4 w-48 bg-white/60" />
        </div>

        <div className="hidden lg:flex flex-col gap-4">
            {Array.from({ length: itemLength }).map((_, index) => (
                <AppointmentCardSkeleton key={index} />
            ))}
        </div>

        <div className="flex flex-col gap-6 lg:hidden">
            {Array.from({ length: itemLength }).map((_, index) => (
                <div key={index} className="flex flex-col gap-2 rounded-[12px] border newBorderColor bg-white p-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-20 w-20 shrink-0 rounded-[8px]" />
                        <div className="flex flex-1 flex-col gap-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-5 w-40 max-w-full" />
                            <Skeleton className="h-3 w-28" />
                            <Skeleton className="h-3 w-36" />
                        </div>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-28" />
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-7 w-24 rounded-[4px]" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// Group appointments by date
const groupByDate = (items) => {
    return items.reduce((acc, item) => {
        if (!acc[item.date]) acc[item.date] = [];
        acc[item.date].push(item);
        return acc;
    }, {});
};

const UserAppointments = () => {
    const t = useTranslation();
    const [currentPage, setCurrentPage] = useState(1);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
    const router = useRouter();
    const itemsPerPage = 4;
    const activeTab = router.query.tab === "previous" ? "previous" : "upcoming";
    const [statusFilter, setStatusFilter] = useState(" ");
    const [meetingTypeFilter, setMeetingTypeFilter] = useState(" ");

    const appointmentsQuery = useQuery({
        queryKey: ["userAppointments", activeTab, currentPage, itemsPerPage, statusFilter, meetingTypeFilter],
        queryFn: async () => {
            const response = await getUserAppointmentsApi({
                limit: itemsPerPage,
                offset: (currentPage - 1) * itemsPerPage,
                date_filter: activeTab,
                status: statusFilter,
                meeting_type: meetingTypeFilter,
            });

            return response || {};
        },
        staleTime: 60_00_000, // 10 minutes
        refetchOnReconnect: false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,

    });

    const appointments = appointmentsQuery.data?.data || [];
    const totalItems = appointmentsQuery.data?.total || 0;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const groupedItems = groupByDate(appointments);
    const sortedGroupedEntries = Object.entries(groupedItems).sort(([dateA], [dateB]) => {
        return new Date(dateA) - new Date(dateB);
    });

    const handlePageChange = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    const handleTabChange = (tab) => {
        setCurrentPage(1);
        router.push(
            {
                pathname: router.pathname,
                query: {
                    ...router.query,
                    tab,
                },
            }
        );
    };

    const handleStatusFilterChange = (value) => {
        setStatusFilter(value);
        setCurrentPage(1);
    };

    const handleMeetingTypeFilterChange = (value) => {
        setMeetingTypeFilter(value);
        setCurrentPage(1);
    };

    const handleShowCancelModal = (appointmentId) => {
        setSelectedAppointmentId(appointmentId);
        setShowCancelModal(true);
    };

    const handleCloseCancelModal = () => {
        setSelectedAppointmentId(null);
        setShowCancelModal(false);
    };

    const handleCancelAppointment = async (reason) => {
        try {
            const response = await updateAppointmentStatusApi({
                appointment_id: selectedAppointmentId,
                status: "cancelled",
                reason,
            });

            if (response?.error === false && response?.data) {
                handleCloseCancelModal();
                appointmentsQuery.refetch();
            }
        } catch (error) {
            console.error("Error cancelling appointment:", error);
        }
    };

    const isLoading = appointmentsQuery.isLoading || appointmentsQuery.isFetching;
    const isError = appointmentsQuery.isError;

    return (
        <div className="flex flex-col rounded-xl md:rounded-2xl border w-full newBorderColor bg-white overflow-hidden">
            {/* Header */}
            <div className="flex flex-wrap gap-2 items-center md:justify-between justify-center p-4 border-b brandColor">
                <h1 className="text-base md:text-xl font-bold brandColor">{t("myAppointments")}</h1>
                <div className="flex flex-wrap items-center gap-3">
                    {/* Status Filter */}
                    <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                        <SelectTrigger className="w-full xs:w-[160px] brandColor bg-white newBorder focus:ring-0">
                            <SelectValue placeholder={t("status")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value=" ">{t("status")}</SelectItem>
                            <SelectItem value="pending">{t("pending")}</SelectItem>
                            <SelectItem value="confirmed">{t("confirmed")}</SelectItem>
                            <SelectItem value="completed">{t("completed")}</SelectItem>
                            <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
                            <SelectItem value="rescheduled">{t("rescheduled")}</SelectItem>
                            <SelectItem value="auto_cancelled">{t("auto_cancelled")}</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Meeting Type Filter */}
                    <Select value={meetingTypeFilter} onValueChange={handleMeetingTypeFilterChange}>
                        <SelectTrigger className="w-full xs:w-[160px] brandColor bg-white newBorder focus:ring-0">
                            <SelectValue placeholder={t("meetingType")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value=" ">{t("meetingType")}</SelectItem>
                            <SelectItem value="in_person">{t("inPerson")}</SelectItem>
                            <SelectItem value="virtual">{t("virtual")}</SelectItem>
                            <SelectItem value="phone">{t("phone")}</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex w-full sm:w-auto primaryBackgroundBg border newBorderColor rounded-lg p-2 gap-2">
                        <button
                            type="button"
                            onClick={() => handleTabChange("upcoming")}
                            className={`flex-1 sm:flex-none px-3 py-2 text-base font-medium rounded-lg transition-colors ${activeTab === "upcoming"
                                ? "primaryBg text-white"
                                : "text-gray-600 hover:text-gray-900 hover:bg-white"
                                }`}
                        >
                            {t("upcoming")}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTabChange("previous")}
                            className={`flex-1 sm:flex-none px-3 py-2 text-base font-medium rounded-lg transition-colors ${activeTab === "previous"
                                ? "primaryBg text-white"
                                : "text-gray-600 hover:text-gray-900 hover:bg-white"
                                }`}
                        >
                            {t("previous")}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <div className="flex flex-col gap-0 p-4">
                {isLoading ? (
                    <AppointmentListSkeleton itemLength={itemsPerPage} />
                ) : isError ? (
                    <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
                        <SomethingWentWrong />
                    </div>
                ) : totalItems === 0 ? (
                    <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
                        <NoDataFound title={t("noAppointmentsFoundTitle")} description={t("noAppointmentsFound")} />
                    </div>
                ) : (
                    sortedGroupedEntries.map(([date, items]) => (
                        <div key={date} className="flex flex-col gap-3 mb-6">
                            {/* Date header */}
                            <div className="primaryBackgroundBg px-4 py-2 rounded-md">
                                <p className="text-sm brandColor font-medium">
                                    {t("date")} -{" "}
                                    <span className="font-bold secondaryTextColor">{getAppointmentDateLabel(items[0])}</span>
                                </p>
                            </div>

                            <div className="flex flex-col gap-4">
                                {items.map((appointment) => (
                                    <AppointmentTableRow
                                        key={appointment.id}
                                        appointment={{
                                            ...appointment,
                                            agent: appointment.agent || appointment.admin,
                                            property: appointment.property,
                                        }}
                                        isAgent={false}
                                        showPropertyInfo={true}
                                        onCancel={handleShowCancelModal}
                                        activeTab={activeTab}
                                        refetchData={appointmentsQuery.refetch}
                                        isRequestedAppointment={true}
                                    />
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination Footer */}
            {totalItems > 0 && (
                <div className="flex items-center justify-between p-4 border-t newBorderColor mt-auto flex-wrap gap-4">
                    <span className="text-[14px] brandColor font-medium">
                        {t("showing")} {startIndex + 1} {t("to")} {endIndex}{" "}
                        {t("of")} {totalItems} {t("entries")}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`w-8 h-8 flex items-center justify-center rounded border brandBorder text-gray-600 hover:bg-gray-50 transition-colors ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                        >
                            <BiChevronLeft size={20} className="rtl:rotate-180" />
                        </button>
                        {[...Array(totalPages)].map((_, index) => (
                            <button
                                type="button"
                                key={index + 1}
                                onClick={() => handlePageChange(index + 1)}
                                className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${currentPage === index + 1
                                    ? "brandBg text-white"
                                    : "border brandBorder text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                {index + 1}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`w-8 h-8 flex items-center justify-center rounded border brandBorder text-gray-600 hover:bg-gray-50 transition-colors ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                        >
                            <BiChevronRight size={20} className="rtl:rotate-180" />
                        </button>
                    </div>
                </div>
            )}

            {showCancelModal && (
                <AppointmentActionModal
                    isOpen={showCancelModal}
                    onClose={handleCloseCancelModal}
                    appointmentId={selectedAppointmentId}
                    actionType="cancel"
                    title="cancelAppointment"
                    warningText="cancelAppointmentWarning"
                    submitButtonText="confirmCancelAppointment"
                    submitButtonColor="bgRed"
                    initialReason=""
                    showWarning={true}
                    isRequired={true}
                    handleSubmit={handleCancelAppointment}
                />
            )}
        </div>
    );
};

export default UserAppointments;
