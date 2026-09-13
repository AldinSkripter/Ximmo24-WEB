"use client"

import { useRouter } from 'next/router'
import { Skeleton } from '@/components/ui/skeleton'
import UserListings from './UserListings'
import UserAdvertisements from './UserAdvertisements'
import UserAppointments from './UserAppointments'
import UserPersonalizedFeeds from './UserPersonalizedFeeds'
import UserNotifications from './UserNotifications'
import UserTransactionHistory from './UserTransactionHistory'
import UserProfile from './UserProfile'
import UserSubscription from './UserSubscription'
import UserChat from './UserChat'
import AddProperty from '@/components/agent/property/AddProperty'
import EditProperty from '@/components/agent/property/EditProperty'
import AddProject from '../agent/project/AddProject'
import EditProject from '../agent/project/EditProject'
import UserVerificationForm from './UserVerificationForm'
import UserFavourites from './UserFavourites'
import UserInterested from './UserInterested'

const UserRootSkeleton = () => (
    <div className="min-w-0 flex-1 overflow-hidden rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:rounded-[30px] sm:p-6">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2">
                <Skeleton className="h-7 w-44 rounded-lg" />
                <Skeleton className="h-4 w-72 max-w-full rounded-md" />
            </div>
            <Skeleton className="h-11 w-36 rounded-xl" />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="mt-3 h-8 w-3/4" />
                    <Skeleton className="mt-4 h-4 w-full" />
                    <Skeleton className="mt-2 h-4 w-5/6" />
                </div>
            ))}
        </div>
        <div className="mt-5 flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full rounded-2xl" />
            ))}
        </div>
    </div>
)

const componentMap = {
    listings: UserListings,
    advertisement: UserAdvertisements,
    appointments: UserAppointments,
    chat: UserChat,
    notifications: UserNotifications,
    'personalized-feeds': UserPersonalizedFeeds,
    'my-subscriptions': UserSubscription,
    'transaction-history': UserTransactionHistory,
    profile: UserProfile,
    'add-property': AddProperty,
    'edit-property': EditProperty,
    'add-project': AddProject,
    'edit-project': EditProject,
    'verification-form': UserVerificationForm,
    favourites: UserFavourites,
    interested: UserInterested,
}

const STANDALONE_SECTIONS = new Set([
    'add-property',
    'edit-property',
    'add-project',
    'edit-project',
    'verification-form',
])

const UserRoot = ({ notificationData, isLoading }) => {
    const router = useRouter()
    const { slug = [] } = router.query
    const slugArray = Array.isArray(slug) ? slug : [slug]
    const requestedSection = slugArray[0]
    const mainSection = !requestedSection || requestedSection === 'dashboard' ? 'listings' : requestedSection
    const params = slugArray.slice(1)
    const Component = componentMap[mainSection]

    if (isLoading) {
        return <UserRootSkeleton />
    }

    if (!Component) {
        return null
    }

    if (STANDALONE_SECTIONS.has(mainSection)) {
        return (
            <div className="min-w-0 flex-1">
                <Component
                    params={params}
                    notificationData={notificationData}
                    showHeader={false}
                    showRoundedBorders
                />
            </div>
        )
    }

    return (
        <section className="min-w-0 flex-1 overflow-hidden rounded-[24px] border border-white/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.09)] sm:rounded-[30px]">
            <div className="h-1 w-full primaryBg" />
            <div className="min-w-0">
                <Component
                    params={params}
                    notificationData={notificationData}
                    showHeader={false}
                    showRoundedBorders
                />
            </div>
        </section>
    )
}

export default UserRoot
