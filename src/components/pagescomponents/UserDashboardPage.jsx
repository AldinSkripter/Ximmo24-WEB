import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'

const Layout = dynamic(() => import('@/components/layout/Layout'), { ssr: false })
const UserRoot = dynamic(() => import('@/components/user/UserRoot'), { ssr: false })
const UserSideBar = dynamic(() => import('@/components/user/UserSideBar'), { ssr: false })
const PushNotificationLayout = dynamic(() => import('@/components/wrapper/PushNotificationLayout'), { ssr: false })

const UserDashboardPage = () => {
    const [notificationData, setNotificationData] = useState(null)
    const router = useRouter()
    const userLoading = useSelector((state) => state.User?.loading)
    const slugArray = Array.isArray(router.query?.slug)
        ? router.query.slug
        : router.query?.slug
            ? [router.query.slug]
            : []
    const mainSection = slugArray[0]
    const hideSidebar = [
        'add-property',
        'edit-property',
        'add-project',
        'edit-project',
        'my-property',
        'my-project',
        'verification-form',
    ].includes(mainSection)
    const isLoading = userLoading || !router.isReady

    const handleNotificationReceived = (data) => {
        setNotificationData(data)
    }

    return (
        <Layout>
            <PushNotificationLayout onNotificationReceived={handleNotificationReceived}>
                <main className="relative min-h-[72vh] overflow-hidden bg-[#f4f7fb]">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -left-24 top-12 h-80 w-80 rounded-full opacity-20 blur-3xl"
                        style={{ backgroundColor: 'var(--primary-color)' }}
                    />
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full opacity-[0.08] blur-3xl"
                        style={{ backgroundColor: 'var(--primary-color)' }}
                    />

                    <div className="container relative z-[1] mx-auto px-3 py-6 sm:px-4 sm:py-8 lg:py-12">
                        <div
                            className={`${hideSidebar ? '' : 'xl:grid xl:grid-cols-[300px_minmax(0,1fr)]'} items-start gap-5 2xl:gap-7`}
                        >
                            {!hideSidebar ? <UserSideBar isLoading={isLoading} /> : null}
                            <UserRoot notificationData={notificationData} isLoading={isLoading} />
                        </div>
                    </div>
                </main>
            </PushNotificationLayout>
        </Layout>
    )
}

export default UserDashboardPage
