import { useEffect, useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsTrigger, TabsList } from '../ui/tabs';
import { useTranslation } from '../context/TranslationContext';
import AppointmentTableRow from './AppointmentTableRow';
import CustomPagination from '@/components/ui/custom-pagination';
import { useSelector } from 'react-redux';
import { getAgentAppointmentsApi, getUserAppointmentsApi, updateAppointmentStatusApi } from '@/api/apiRoutes';
import AppointmentActionModal from '../reusable-components/appointment/AppointmentActionModal';
import { getFormattedDate, isRTL } from '@/utils/helperFunction';
import { useRouter } from 'next/router';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const AgentAppointmentRowSkeleton = () => {
    return (
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <div className="md:overflow-x-auto no-scrollbar">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8 p-4 w-full no-scrollbar">
                    {/* User/Agent Info */}
                    <div className="flex justify-start items-center gap-4 w-full md:w-[300px] md:max-w-[300px]">
                        <div className="w-12 h-12 flex-shrink-0">
                            <Skeleton className="w-12 h-12 rounded object-cover" />
                        </div>
                        <div className="flex flex-col gap-2 w-full md:w-[220px] md:max-w-[220px]">
                            <Skeleton className="h-4 w-28 rounded" />
                            <Skeleton className="h-3 w-40 rounded" />
                        </div>
                    </div>

                    {/* Property Info */}
                    <div className="flex justify-start items-center gap-4 w-full md:w-[300px] md:max-w-[300px]">
                        <div className="w-12 h-12 flex-shrink-0">
                            <Skeleton className="w-12 h-12 rounded-lg object-cover" />
                        </div>
                        <div className="flex flex-col gap-2 w-full">
                            <Skeleton className="h-3.5 w-24 rounded" />
                            <Skeleton className="h-4 w-32 rounded" />
                        </div>
                    </div>

                    {/* Meeting Type */}
                    <div className="flex flex-col gap-2 w-full md:w-[150px] md:max-w-[150px] items-start md:items-center">
                        <Skeleton className="h-3.5 w-20 rounded" />
                        <Skeleton className="h-4 w-16 rounded" />
                    </div>

                    {/* Meeting Time */}
                    <div className="flex flex-col gap-2 w-full md:w-[150px] md:max-w-[150px] items-start md:items-center">
                        <Skeleton className="h-3.5 w-20 rounded" />
                        <Skeleton className="h-4 w-28 rounded" />
                    </div>

                    {/* Status */}
                    <div className="flex flex-col gap-2 w-full md:w-[150px] md:max-w-[150px] items-start md:items-center">
                        <Skeleton className="h-3.5 w-12 rounded" />
                        <Skeleton className="h-8 w-20 rounded" />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap md:flex-nowrap justify-start sm:justify-center items-start sm:items-center gap-2 md:gap-4 w-full md:w-auto">
                        <Skeleton className="h-10 w-28 rounded" />
                        <Skeleton className="h-10 w-10 rounded" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const AgentAppointmentListSkeleton = () => {
    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
                {/* Date Header Skeleton */}
                <div className="flex flex-col gap-2 py-4 px-6 primaryBackgroundBg rounded-lg border newBorder">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-4 w-12 rounded" />
                            <span className="brandColor opacity-75">-</span>
                            <Skeleton className="h-5 w-36 rounded" />
                        </div>
                    </div>
                </div>

                {/* Rows Skeletons */}
                <div className="flex flex-col gap-4">
                    {Array.from({ length: 10 }).map((_, index) => (
                        <div key={index}>
                            <AgentAppointmentRowSkeleton />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const AgentAppointmentBookings = () => {
    const t = useTranslation();
    const router = useRouter()
    const { lang } = router?.query;
    const isRtl = isRTL();

    // State management
    const [activeTab, setActiveTab] = useState('upcoming');
    const [offset, setOffset] = useState(0);
    const [appointments, setAppointments] = useState([]);
    const [total, setTotal] = useState(0);
    const [isPageLoading, setIsPageLoading] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [statusFilter, setStatusFilter] = useState(' ');
    const [meetingTypeFilter, setMeetingTypeFilter] = useState(' ');

    // Constants
    const limit = 10;

    // Redux state
    const User = useSelector(state => state.User?.data);
    const isAgent = User?.is_agent === true && User?.become_agent_status === "approved";


    // Utility functions
    const groupAppointmentsByDate = useCallback((appointments) => {
        const grouped = appointments.reduce((acc, appointment) => {
            const date = appointment.date;
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(appointment);
            return acc;
        }, {});

        // Sort appointments within each date group by start_at time
        Object.keys(grouped).forEach(date => {
            grouped[date].sort((a, b) => {
                const timeA = new Date(a.start_at).getTime();
                const timeB = new Date(b.start_at).getTime();
                return timeA - timeB;
            });
        });

        return grouped;
    }, []);

    // Get grouped appointments and sort dates
    const groupedAppointments = groupAppointmentsByDate(appointments);
    const sortedDates = Object.keys(groupedAppointments).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA - dateB;
    });

    // Page change handler
    const handlePageChange = useCallback((newPage) => {
        setOffset((newPage - 1) * limit);
    }, [limit]);

    // Data fetching functions
    const fetchAppointments = useCallback(async () => {
        setIsPageLoading(true);
        try {
            const apiCall = isAgent ? getAgentAppointmentsApi : getUserAppointmentsApi;
            const res = await apiCall({
                offset,
                limit,
                date_filter: activeTab,
                status: statusFilter,
                meeting_type: meetingTypeFilter
            });

            if (res?.error === false && res?.data) {
                setAppointments(res.data);
                setTotal(res?.total || 0);
            } else {
                // Handle API error response
                setAppointments([]);
                setTotal(0);
            }
        } catch (error) {
            console.error("Error fetching appointments:", error);
            setAppointments([]);
            setTotal(0);
        } finally {
            setIsPageLoading(false);
        }
    }, [isAgent, offset, limit, activeTab, statusFilter, meetingTypeFilter, lang]);
    // Modal handlers
    const handleShowCancelModal = useCallback((appointmentId) => {
        setShowCancelModal(true);
        setSelectedAppointmentId(appointmentId);
    }, []);

    const handleCloseCancelModal = useCallback(() => {
        setShowCancelModal(false);
        setSelectedAppointmentId(null);
    }, []);

    // Appointment action handlers
    const handleCancelAppointment = useCallback(async (reason) => {
        try {
            const response = await updateAppointmentStatusApi({
                appointment_id: selectedAppointmentId,
                status: 'cancelled',
                reason: reason
            });

            if (response?.error === false && response?.data) {
                handleCloseCancelModal();
                fetchAppointments(); // Refresh data after successful cancellation
            }
        } catch (error) {
            console.error("Error cancelling appointment:", error);
        }
    }, [selectedAppointmentId, fetchAppointments, handleCloseCancelModal]);

    const handleAcceptClick = useCallback(async (appointment) => {
        try {
            const response = await updateAppointmentStatusApi({
                appointment_id: appointment.id,
                status: "confirmed"
            });

            if (!response?.error && response?.data) {
                fetchAppointments(); // Refresh data after successful acceptance
            }
        } catch (error) {
            console.error("Error accepting appointment:", error);
        }
    }, [fetchAppointments]);

    const handleShowViewDetails = useCallback((appointment) => {
        setIsExpanded(!isExpanded);
    }, [isExpanded]);
    // Effects
    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    // Render appointment list for a specific tab
    const renderAppointmentList = (tabType) => {
        const emptyMessage = tabType === 'upcoming' ? t("noUpcomingAppointments") : t("noPreviousAppointments");

        if (isPageLoading) {
            return <AgentAppointmentListSkeleton />;
        }

        return (
            <div className="flex flex-col gap-8">
                {sortedDates.map((date) => {
                    const dateAppointments = groupedAppointments[date];
                    return (
                        <div key={date} className="flex flex-col gap-4">
                            {/* Date Header */}
                            <div className="flex flex-col gap-2 py-4 px-6 primaryBackgroundBg rounded-lg border newBorder">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium brandColor opacity-75">{t("date")}</span>
                                        <span className="brandColor opacity-75">-</span>
                                        <h3 className="text-base font-bold brandColor">{getFormattedDate(date, t)}</h3>
                                    </div>
                                </div>
                            </div>

                            {/* Appointments for this date */}
                            <div className="flex flex-col gap-4">
                                {dateAppointments.map((appointment) => (
                                    <AppointmentTableRow
                                        key={appointment.id}
                                        appointment={appointment}
                                        isAgent={isAgent}
                                        onCancel={handleShowCancelModal}
                                        onViewDetails={handleShowViewDetails}
                                        onAccept={handleAcceptClick}
                                        activeTab={activeTab}
                                        refetchData={fetchAppointments}
                                        isRequestedAppointment={true}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}

                {appointments.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <p className="brandColor opacity-75 text-lg">{emptyMessage}</p>
                    </div>
                )}

                {appointments.length > 0 && (
                    <CustomPagination
                        currentPage={Math.floor(offset / limit) + 1}
                        totalItems={total}
                        itemsPerPage={limit}
                        onPageChange={handlePageChange}
                        isLoading={isPageLoading}
                        translations={{
                            showing: t("showing"),
                            to: t("to"),
                            of: t("of"),
                            entries: t("entries")
                        }}
                        className='border-t rounded-tl-xl rounded-tr-xl mb-3'
                    />
                )}
            </div>
        );
    };

    return (
        <div className='flex flex-col '>
            {/* Breadcrumb with Filters */}
            <div className='pt-2 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <h1 className='brandColor font-bold text-2xl'>
                    {t("myAppointments")}
                </h1>

                {/* Filter Dropdowns */}
                <div className='flex flex-col xs:flex-row gap-3'>
                    {/* Status Filter */}
                    <Select value={statusFilter} onValueChange={(value) => {
                        setStatusFilter(value);
                        setOffset(0); // Reset to first page when filter changes
                    }}>
                        <SelectTrigger className="w-full xs:w-[180px] brandColor bg-white newBorder focus:ring-0">
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
                    <Select value={meetingTypeFilter} onValueChange={(value) => {
                        setMeetingTypeFilter(value);
                        setOffset(0); // Reset to first page when filter changes
                    }}>
                        <SelectTrigger className="w-full xs:w-[180px] brandColor bg-white newBorder focus:ring-0">
                            <SelectValue placeholder={t("meetingType")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value=" ">{t("meetingType")}</SelectItem>
                            <SelectItem value="in_person">{t("inPerson")}</SelectItem>
                            <SelectItem value="virtual">{t("virtual")}</SelectItem>
                            <SelectItem value="phone">{t("phone")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className='flex bg-white rounded-xl h-full px-4'>
                <Tabs dir={isRtl ? "rtl" : "ltr"} value={activeTab} onValueChange={setActiveTab} className="w-full bg-white">
                    <div className="border-b newBorderColor overflow-x-auto">
                        <TabsList className="w-full h-auto bg-transparent p-0 gap-7 rounded-none justify-start">
                            <TabsTrigger
                                value="upcoming"
                                className="p-3 rounded-none border-b-2 border-transparent data-[state=active]:primaryBorderColor data-[state=active]:bg-transparent bg-transparent hover:bg-transparent transition-colors !shadow-none"
                            >
                                <span className={`text-sm sm:text-base font-manrope whitespace-nowrap ${activeTab === 'upcoming'
                                    ? 'font-bold primaryColor'
                                    : 'font-medium brandColor'
                                    }`}>
                                    {t("upcoming")}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="previous"
                                className="p-3 rounded-none border-b-2 border-transparent data-[state=active]:primaryBorderColor data-[state=active]:bg-transparent bg-transparent hover:bg-transparent transition-colors !shadow-none"
                            >
                                <span className={`text-sm sm:text-base font-manrope whitespace-nowrap ${activeTab === 'previous'
                                    ? 'font-bold primaryColor'
                                    : 'font-medium brandColor'
                                    }`}>
                                    {t("previous")}
                                </span>
                            </TabsTrigger>
                        </TabsList>

                    </div>
                    <TabsContent value="upcoming">
                        {renderAppointmentList('upcoming')}
                    </TabsContent>
                    <TabsContent value="previous">
                        {renderAppointmentList('previous')}
                    </TabsContent>
                </Tabs>
            </div>
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

export default AgentAppointmentBookings;