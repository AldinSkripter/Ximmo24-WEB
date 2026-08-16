import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsTrigger, TabsList } from '../ui/tabs';
import AppointmentTableRow from './AppointmentTableRow';
import { useTranslation } from '../context/TranslationContext';
import { getUserAppointmentsApi, updateAppointmentStatusApi } from '@/api/apiRoutes';
import CustomPagination from '../ui/custom-pagination';
import { getFormattedDate } from '@/utils/helperFunction';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import AppointmentActionModal from '../reusable-components/appointment/AppointmentActionModal';

const AgentAppointmentRequests = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [appointments, setAppointments] = useState([]);
    const [activeTab, setActiveTab] = useState('upcoming');
    const limit = 10;
    const [offset, setOffset] = useState(0);
    const [total, setTotal] = useState(0);
    const [isPageLoading, setIsPageLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState(' ');
    const [meetingTypeFilter, setMeetingTypeFilter] = useState(' ');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);

    const handlePageChange = (newPage) => {
        setOffset((newPage - 1) * limit);
        // Fetch new data based on new offset if needed
    };

    const handleShowCancelModal = (appointmentId) => {
        setShowCancelModal(true);
        setSelectedAppointmentId(appointmentId);
    };

    const handleCloseCancelModal = () => {
        setShowCancelModal(false);
        setSelectedAppointmentId(null);
    };


    const t = useTranslation();


    const handleFetchAppointmentRequests = async () => {
        try {
            setIsPageLoading(true);
            const res = await getUserAppointmentsApi({
                offset,
                limit,
                date_filter: activeTab,
                status: statusFilter,
                meeting_type: meetingTypeFilter
            });

            // Transform the data to match the expected structure
            const transformedAppointments = res.data?.map(appointment => ({
                ...appointment,
                // Handle admin appointments (requested) vs agent appointments (booked)
                agent: appointment.agent || appointment.admin,
                // Ensure consistent property structure
                property: appointment.property,
                // Handle different meeting type formats
                meeting_type: appointment.meeting_type,
                // Ensure status is consistent
                status: appointment.status,
                // Handle availability types
                availability_types: appointment.availability_types
            })) || [];

            setAppointments(transformedAppointments);
            setTotal(res.total);
        } catch (error) {
            console.error("Error fetching appointments:", error);
        } finally {
            setIsPageLoading(false);
        }
    }

    const handleCancelAppointment = async (reason) => {
        try {
            const response = await updateAppointmentStatusApi({
                appointment_id: selectedAppointmentId,
                status: 'cancelled',
                reason: reason
            });

            if (response?.error === false && response?.data) {
                handleCloseCancelModal();
                handleFetchAppointmentRequests();
            }
        } catch (error) {
            console.error("Error cancelling appointment:", error);
        }
    };


    // Function to group appointments by date
    const groupAppointmentsByDate = (appointments) => {
        const grouped = appointments?.reduce((acc, appointment) => {
            const date = appointment.date;
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(appointment);
            return acc;
        }, {});

        // Sort appointments within each date group by start_at time (if available) or meetingTime
        Object.keys(grouped).forEach(date => {
            grouped[date].sort((a, b) => {
                // Use start_at if available, otherwise fallback to meetingTime
                const timeA = new Date(a.start_at).getTime();
                const timeB = new Date(b.start_at).getTime();
                return timeA - timeB;
            });
        });

        return grouped;
    };

    // Get grouped appointments and sort dates
    const groupedAppointments = groupAppointmentsByDate(appointments);
    const sortedDates = Object?.keys(groupedAppointments)?.sort((a, b) => {
        // Parse dates for proper sorting (assuming format "DD MMM YYYY" or similar)
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA - dateB;
    });
    useEffect(() => {
        handleFetchAppointmentRequests();
    }, [activeTab, statusFilter, meetingTypeFilter, offset])

    const totalEntries = appointments.length;
    const showingFrom = 1;
    const showingTo = totalEntries;

    return (
        <div className='flex flex-col'>
            {/* Breadcrumb with Filters */}
            <div className='pt-2 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <h1 className='brandColor font-bold text-2xl'>
                    {t("myRequestedAppointments")}
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
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full bg-white">
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
                        {/* Upcoming appointments will be listed here */}
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
                                                    isAgent={false}
                                                    activeTab={activeTab}
                                                    onCancel={handleShowCancelModal}
                                                    refetchData={handleFetchAppointmentRequests}
                                                    isRequestedAppointment={true}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            {appointments.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <p className="brandColor opacity-75 text-lg">{t("noUpcomingAppointments")}</p>
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
                    </TabsContent>
                    <TabsContent value="previous">
                        {/* Previous appointments will be listed here */}
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
                                                    <h4 className="text-base font-bold brandColor">{getFormattedDate(date, t)}</h4>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Appointments for this date */}
                                        <div className="flex flex-col gap-4">
                                            {dateAppointments.map((appointment) => (
                                                <AppointmentTableRow
                                                    key={appointment.id}
                                                    appointment={appointment}
                                                    isAgent={false}
                                                    activeTab={activeTab}
                                                    onCancel={handleShowCancelModal}
                                                    refetchData={handleFetchAppointmentRequests}
                                                    isRequestedAppointment={true}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            {appointments.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <p className="brandColor opacity-75 text-lg">{t("noPreviousAppointments")}</p>
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

export default AgentAppointmentRequests;