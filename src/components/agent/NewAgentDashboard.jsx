import { useEffect, useState } from 'react';
import { useTranslation } from '../context/TranslationContext';
import ProfileCard from '../dashboard/ProfileCard';
import DataCards from '../dashboard/DataCards';
import VerifiedAgent from '../dashboard/VerifiedAgent';
import PropertyProjectChart from '../dashboard/PropertyProjectChart';
import CategoryViewChart from '../dashboard/CategoryViewChart';
import ActiveSubscriptions from '../dashboard/ActiveSubscriptions';
import MostViewedListings from '../dashboard/MostViewedListings';
import RecentAppointments from '../dashboard/RecentAppointments';
import RecentChats from '../dashboard/RecentChats';
import DashboardCard from '../dashboard/DashboardCard';
import RecentlyAddedProperties from '../dashboard/RecentlyAddedProperties';
import RecentlyAddedProjects from '../dashboard/RecentlyAddedProjects';
import { Skeleton } from '@/components/ui/skeleton';
import { store } from '@/redux/store';
import { getAgentDashboardActivePackagesApi, getAgentDashboardListingsApi, getAgentDashboardMostViewedCategoryApi, getAgentDashboardMostViewedListingApi, getAgentDashboardSummaryApi, getAgentDashboardAppointmentsApi } from '@/api/apiRoutes';
import { FaHome, FaFileAlt, FaExclamation } from 'react-icons/fa';
import { useRouter } from 'next/router';
import { MdOutlineAssignment } from 'react-icons/md';

const NewAgentDashboard = () => {
    const t = useTranslation();
    const userData = store.getState()?.User?.data;
    const router = useRouter();

    const { lang } = router?.query;

    const [dashboardApiData, setDashboardApiData] = useState({
        summeryData: null,
        listingsData: null,
        mostViewedCategoryData: null,
        mostViewedListingData: null,
        appointmentsData: null,
        chatData: null
    });

    const [activePackageList, setActivePackageList] = useState([]);
    const [activeSubscriptionsData, setActiveSubscriptionsData] = useState(null);

    const [loading, setLoading] = useState({
        summary: true,
        listings: true,
        categoryView: true,
        mostViewed: true,
        appointments: true,
        chats: true,
        activeSubscriptions: true
    });

    // ✅ Common Defaults
    const defaultTimeFilter = 'yearly';
    const defaultTab = 'property';
    const defaultTimeFilterForMostViewed = 'last_three_months';

    // ✅ Centralized Filters
    const [filters, setFilters] = useState({
        propertyProject: defaultTimeFilter,
        categoryView: defaultTimeFilter,
        activeSubscription: null,
        mostViewed: defaultTimeFilterForMostViewed,
        mostViewedTab: defaultTab,
        propertyProjectTab: defaultTab,
        appointments: defaultTimeFilter
    });

    const appointmentLimit = 5;
    const [appointmentOffset, setAppointmentOffset] = useState(0);
    const [appointmentCurrentPage, setAppointmentCurrentPage] = useState(1);

    // =================== API CALLS ===================

    const fetchDashboardSummery = async () => {
        try {
            setLoading(prev => ({ ...prev, summary: true, chats: true }));
            const res = await getAgentDashboardSummaryApi();
            if (res?.data) {
                setDashboardApiData(prev => ({
                    ...prev,
                    summeryData: res.data,
                    chatData: res?.data?.chats
                }));
            }
        } catch (error) {
            console.error(t("errorFetchingDashboardData"), error);
        } finally {
            setLoading(prev => ({ ...prev, summary: false, chats: false }));
        }
    };

    const fetchDashboardListings = async () => {
        try {
            setLoading(prev => ({ ...prev, listings: true }));
            const res = await getAgentDashboardListingsApi({
                type: filters.propertyProjectTab,
                range: filters.propertyProject
            });
            if (res?.data) {
                setDashboardApiData(prev => ({ ...prev, listingsData: res.data }));
            }
        } catch (error) {
            console.error(t("errorFetchingDashboardListings"), error);
        } finally {
            setLoading(prev => ({ ...prev, listings: false }));
        }
    };

    const fetchDashboardMostViewedCategory = async () => {
        try {
            setLoading(prev => ({ ...prev, categoryView: true }));
            const res = await getAgentDashboardMostViewedCategoryApi({
                range: filters.categoryView
            });
            if (res?.data) {
                setDashboardApiData(prev => ({
                    ...prev,
                    mostViewedCategoryData: res.data
                }));
            }
        } catch (error) {
            console.error(t("errorFetchingDashboardMostViewedCategory"), error);
        } finally {
            setLoading(prev => ({ ...prev, categoryView: false }));
        }
    };

    const fetchDashboardActivePackages = async () => {
        try {
            setLoading(prev => ({ ...prev, activeSubscriptions: true }));
            const res = await getAgentDashboardActivePackagesApi();
            if (res?.data && res.data.length > 0) {
                const packageList = res.data.map(pkg => ({
                    value: pkg.id.toString(),
                    label: pkg.translated_name || pkg.name
                }));
                setActivePackageList(packageList);
                setActiveSubscriptionsData(res.data);
                if (!filters.activeSubscription) {
                    setFilters(prev => ({
                        ...prev,
                        activeSubscription: packageList[0].value
                    }));
                }
            }
        } catch (error) {
            console.error(t("errorFetchingDashboardActivePackages"), error);
        } finally {
            setLoading(prev => ({ ...prev, activeSubscriptions: false }));
        }
    };

    const fetchDashboardMostViewedListing = async () => {
        try {
            setLoading(prev => ({ ...prev, mostViewed: true }));
            const res = await getAgentDashboardMostViewedListingApi({
                type: filters.mostViewedTab,
                range: filters.mostViewed
            });
            if (res?.data) {
                setDashboardApiData(prev => ({
                    ...prev,
                    mostViewedListingData: res.data
                }));
            }
        } catch (error) {
            console.error(t("errorFetchingDashboardMostViewedListing"), error);
        } finally {
            setLoading(prev => ({ ...prev, mostViewed: false }));
        }
    };

    const fetchDashboardAppointments = async () => {
        try {
            setLoading(prev => ({ ...prev, appointments: true }));
            const res = await getAgentDashboardAppointmentsApi({
                range: filters.appointments,
                offset: ((appointmentCurrentPage - 1) * appointmentLimit).toString(),
                limit: appointmentLimit.toString()
            });
            if (res?.data) {
                setDashboardApiData(prev => ({
                    ...prev,
                    appointmentsData: res.data
                }));
            }
        } catch (error) {
            console.error(t("errorFetchingDashboardAppointments"), error);
        } finally {
            setLoading(prev => ({ ...prev, appointments: false }));
        }
    };

    // =================== EFFECTS ===================
    // Skip all API calls when agent application is still pending review
    const isPending = userData?.become_agent_status === 'pending';
    const isRejected = userData?.become_agent_status === 'rejected';

    useEffect(() => {
        if (isPending || isRejected) return;
        fetchDashboardSummery();
        fetchDashboardActivePackages();
    }, [lang, isPending, isRejected]);

    useEffect(() => {
        if (isPending || isRejected) return;
        fetchDashboardListings();
    }, [filters.propertyProject, filters.propertyProjectTab, lang, isPending, isRejected]);

    useEffect(() => {
        if (isPending || isRejected) return;
        fetchDashboardMostViewedCategory();
    }, [filters.categoryView, lang, isPending, isRejected]);

    useEffect(() => {
        if (isPending || isRejected) return;
        fetchDashboardMostViewedListing();
    }, [filters.mostViewed, filters.mostViewedTab, lang, isPending, isRejected]);

    useEffect(() => {
        if (isPending || isRejected) return;
        fetchDashboardAppointments();
    }, [filters.appointments, appointmentCurrentPage, lang, isPending, isRejected]);

    // Handle appointment page change
    const handleAppointmentPageChange = (newPage) => {
        setAppointmentCurrentPage(newPage);
    };

    // Reset appointment page when filter changes
    useEffect(() => {
        setAppointmentCurrentPage(1);
    }, [filters.appointments, lang]);

    // =================== UI CONFIG ===================
    const timeframeOptions = [
        { value: 'weekly', label: t("thisWeek") },
        { value: 'monthly', label: t("thisMonth") },
        { value: 'yearly', label: t("thisYear") }
    ];
    const timeFrameOptionsForMostViewed = [
        { value: 'weekly', label: t("thisWeek") },
        { value: 'monthly', label: t("thisMonth") },
        { value: 'last_three_months', label: t("last3Months") },
    ];

    const viewTabs = [
        { value: 'property', label: t("property"), icon: FaHome },
        { value: 'project', label: t("projects"), icon: FaFileAlt }
    ];

    // =================== PENDING STATE UI ===================
    if (isPending || isRejected) {
        return (
            <div className="space-y-4">
                <h1 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">{t("myDashboard")}</h1>

                <div className="cardBg newBorder rounded-2xl w-full">
                    <div className="flex flex-col gap-6 items-center justify-center px-6 py-12 text-center">

                        {/* Icon circle */}
                        <div
                            className="primaryBgLight08 flex items-center justify-center rounded-full shrink-0"
                            style={{ width: 96, height: 96 }}
                        >
                            {isPending ? (
                                <MdOutlineAssignment
                                    size={44}
                                    className="primaryColor"
                                    aria-hidden="true"
                                />
                            ) : isRejected ? (
                                <FaExclamation
                                    size={44}
                                    className="primaryColor"
                                    aria-hidden="true"
                                />
                            ) : null}
                        </div>

                        {/* Text block */}
                        <div className="flex flex-col gap-2 items-center max-w-3xl">
                            {isPending ? (
                                <p className="font-bold text-sm md:text-base brandColor">
                                    {t("agentProfileUnderReview")}
                                </p>
                            ) : isRejected ? (
                                <p className="font-bold text-sm md:text-base brandColor">
                                    {t("agentProfileRejected")}
                                </p>
                            ) : null}
                            {isPending ? (
                                <p className="font-medium text-sm md:text-base leadColor">
                                    {t("agentPendingDescription")}
                                </p>
                            ) : isRejected ? (
                                <p className="font-medium text-sm md:text-base leadColor">
                                    {t("agentRejectedDescription")}
                                </p>
                            ) : null}
                        </div>

                        {/* Switch to User button */}
                        <button
                            onClick={() => {
                                if (isPending) {
                                    router.push(`/?lang=${lang}`);
                                    return;
                                }
                                router.push(`/become-agent?lang=${lang}`);
                            }}
                            className="brandBg text-white font-medium text-sm md:text-base rounded-lg p-2 md:px-3 md:py-2 hover:opacity-90 transition-opacity whitespace-nowrap"
                        >
                            {isPending ? t("switchToUser") : t("reapplyAgentForm")}
                        </button>

                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h1 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">{t("myDashboard")}</h1>

            {/* Profile & Data Cards */}
            <div className="bg-transparent">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
                    <div className="w-full">
                        <ProfileCard userName={userData?.name} />
                    </div>
                    <div className="w-full">
                        {loading.summary ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                <Skeleton className="h-48 md:h-56 rounded-lg" />
                                <Skeleton className="h-48 md:h-56 rounded-lg" />
                                <Skeleton className="h-48 md:h-56 rounded-lg" />
                                <Skeleton className="h-48 md:h-56 rounded-lg" />
                            </div>
                        ) : (
                            <DataCards dashboardData={dashboardApiData.summeryData} />
                        )}
                    </div>
                </div>
            </div>

            {/* Verified Agent */}
            <div className="grid-cols-1">
                <VerifiedAgent />
            </div>

            {/* Property Project Analytics */}
            <div className="w-full">
                <DashboardCard
                    title={t("propertyProjectAnalytics")}
                    filterOptions={timeframeOptions}
                    selectedFilter={filters.propertyProject}
                    onFilterChange={val => setFilters(prev => ({ ...prev, propertyProject: val }))}
                    showFilter={true}
                    showTabs={true}
                    tabs={viewTabs}
                    selectedTab={filters.propertyProjectTab}
                    onTabChange={val => setFilters(prev => ({ ...prev, propertyProjectTab: val }))}
                >
                    <PropertyProjectChart
                        selectedTimeframe={filters.propertyProject}
                        selectedType={filters.propertyProjectTab}
                        listingsData={dashboardApiData.listingsData}
                        isLoading={loading.listings}
                    />
                </DashboardCard>
            </div>

            {/* Category Views & Active Subscriptions */}
            <div className='grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6'>
                <div className='lg:col-span-5'>
                    <DashboardCard
                        title={t("categoryViews")}
                        filterOptions={timeframeOptions}
                        selectedFilter={filters.categoryView}
                        onFilterChange={val => setFilters(prev => ({ ...prev, categoryView: val }))}
                        showFilter={true}
                        showTabs={false}
                    >
                        <CategoryViewChart
                            selectedTimeframe={filters.categoryView}
                            categoryData={dashboardApiData.mostViewedCategoryData}
                            isLoading={loading.categoryView}
                        />
                    </DashboardCard>
                </div>
                <div className='lg:col-span-7'>
                    <DashboardCard
                        title={t("activeSubscriptions")}
                        filterOptions={activePackageList || []}
                        selectedFilter={filters.activeSubscription}
                        onFilterChange={val => setFilters(prev => ({ ...prev, activeSubscription: val }))}
                        showFilter={activePackageList && activePackageList.length > 0}
                        showTabs={false}
                    >
                        <ActiveSubscriptions
                            selectedPlan={filters.activeSubscription}
                            activeSubscriptionsData={activeSubscriptionsData || []}
                            isLoading={loading.activeSubscriptions}
                        />
                    </DashboardCard>
                </div>
            </div>

            {/* Most Viewed Listings */}
            <div className="w-full">
                <DashboardCard
                    title={t("mostViewedListings")}
                    filterOptions={timeFrameOptionsForMostViewed}
                    selectedFilter={filters.mostViewed}
                    onFilterChange={val => setFilters(prev => ({ ...prev, mostViewed: val }))}
                    tabs={viewTabs}
                    selectedTab={filters.mostViewedTab}
                    onTabChange={val => setFilters(prev => ({ ...prev, mostViewedTab: val }))}
                    showFilter={true}
                    showTabs={true}
                >
                    <MostViewedListings
                        selectedTimeframe={filters.mostViewed}
                        selectedView={filters.mostViewedTab}
                        mostViewedData={dashboardApiData.mostViewedListingData}
                        isLoading={loading.mostViewed}
                    />
                </DashboardCard>
            </div>


            <div className='grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6'>
                <div className='lg:col-span-7'>
                    <DashboardCard
                        title={t("appointments")}
                        filterOptions={timeframeOptions}
                        selectedFilter={filters.appointments}
                        onFilterChange={val => setFilters(prev => ({ ...prev, appointments: val }))}
                        showFilter={true}
                        showTabs={false}
                    >
                        <RecentAppointments
                            appointmentData={dashboardApiData.appointmentsData || []}
                            selectedTimeframe={filters.appointments}
                            currentPage={appointmentCurrentPage}
                            onPageChange={handleAppointmentPageChange}
                            isLoading={loading.appointments}
                        />
                    </DashboardCard>
                </div>
                <div className='lg:col-span-5'>
                    <DashboardCard
                        title={t("messages")}
                        showFilter={false}
                        showTabs={false}
                        showActions={true}
                        actionLink='/agent/chat'
                        actionText='viewAllMessages'
                    >
                        <RecentChats
                            chatData={dashboardApiData?.chatData || []}
                            userId={userData?.id}
                            isLoading={loading.chats}
                        />
                    </DashboardCard>
                </div>
            </div>

            {/* Recently Added Properties */}
            <div className="grid-cols-1">
                <DashboardCard
                    title={t("recentlyPropertyAdded")}
                    showFilter={false}
                    showTabs={false}
                    showActions={true}
                    actionLink='/agent/properties'
                    actionText='viewAllListing'
                >
                    <RecentlyAddedProperties />
                </DashboardCard>
            </div>

            {/* Recently Added Projects */}
            <div className="grid-cols-1">
                <DashboardCard
                    title={t("recentlyProjectsAdded")}
                    showFilter={false}
                    showTabs={false}
                    showActions={true}
                    actionLink='/agent/projects'
                    actionText='viewAllListing'
                >
                    <RecentlyAddedProjects />
                </DashboardCard>
            </div>

        </div>
    );
};

export default NewAgentDashboard;