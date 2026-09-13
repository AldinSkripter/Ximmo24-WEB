import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import { Building2 } from 'lucide-react'
import ImageWithPlaceholder from '@/components/image-with-placeholder/ImageWithPlaceholder'
import { useTranslation } from '@/components/context/TranslationContext'
import { VerifiedUserBadge } from '@/utils/helperFunction'

const Layout = dynamic(() => import('@/components/layout/Layout'), { ssr: false })
const UserRoot = dynamic(() => import('@/components/user/UserRoot'), { ssr: false })
const UserSideBar = dynamic(() => import('@/components/user/UserSideBar'), { ssr: false })
const PushNotificationLayout = dynamic(() => import('@/components/wrapper/PushNotificationLayout'), { ssr: false })

const DashboardAvatar = ({ user }) => {
    if (user?.profile) {
        return (
            <ImageWithPlaceholder
                src={user.profile}
                alt={user?.name || 'User'}
                width={88}
                height={88}
                sizes="(max-width: 640px) 64px, 88px"
                quality={95}
                unoptimized
                className="h-16 w-16 rounded-[20px] border-2 border-white/30 object-cover shadow-2xl sm:h-[88px] sm:w-[88px] sm:rounded-[26px]"
            />
        )
    }

    return (
        <div className="primaryBg flex h-16 w-16 items-center justify-center rounded-[20px] border-2 border-white/30 text-2xl font-black uppercase text-white shadow-2xl sm:h-[88px] sm:w-[88px] sm:rounded-[26px] sm:text-3xl">
            {user?.name?.charAt(0) || 'U'}
        </div>
    )
}

const UserDashboardPage = () => {
    const [notificationData, setNotificationData] = useState(null)
    const router = useRouter()
    const t = useTranslation()
    const user = useSelector((state) => state.User?.data)
    const userLoading = useSelector((state) => state.User?.loading)
    const webSettings = useSelector((state) => state.WebSetting?.data)
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
                <main className="relative min-h-[72vh] overflow-hidden bg-[#f3f6fa]">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -left-24 top-12 h-80 w-80 rounded-full opacity-[0.16] blur-3xl"
                        style={{ backgroundColor: 'var(--primary-color)' }}
                    />
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full opacity-[0.08] blur-3xl"
                        style={{ backgroundColor: 'var(--primary-color)' }}
                    />

                    <div className="container relative z-[1] mx-auto px-3 py-5 sm:px-4 sm:py-8 lg:py-10">
                        {!hideSidebar ? (
                            <section className="relative mb-5 overflow-hidden rounded-[26px] bg-[#071426] text-white shadow-[0_28px_80px_rgba(15,23,42,0.2)] sm:rounded-[34px]">
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute -right-12 -top-24 h-80 w-80 rounded-full opacity-40 blur-3xl"
                                    style={{ backgroundColor: 'var(--primary-color)' }}
                                />
                                <div className="absolute inset-y-0 right-0 hidden w-[38%] opacity-[0.08] lg:block">
                                    <div className="absolute right-20 top-1/2 h-48 w-48 -translate-y-1/2 rotate-12 rounded-[46px] border-[28px] border-white" />
                                    <Building2 className="absolute right-7 top-1/2 h-36 w-36 -translate-y-1/2 text-white" strokeWidth={1.2} />
                                </div>

                                <div className="relative p-5 sm:p-7 lg:p-9">
                                    <div className="flex min-w-0 items-center gap-4 sm:gap-6">
                                        <DashboardAvatar user={user} />
                                        <div className="min-w-0">
                                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                                <span className="primaryBg rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                                                    Ximmo24
                                                </span>
                                                {user?.is_user_verified ? (
                                                    <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">
                                                        <VerifiedUserBadge color={webSettings?.system_color} width={16} height={16} />
                                                        {t('verified')}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <h1 className="truncate text-2xl font-black tracking-[-0.04em] sm:text-4xl">
                                                {user?.name}
                                            </h1>
                                            <p className="mt-1 truncate text-sm text-slate-400 sm:text-base">{user?.email}</p>
                                        </div>
                                    </div>


                                </div>

                            </section>
                        ) : null}

                        <div className={`${hideSidebar ? '' : 'xl:grid xl:grid-cols-[286px_minmax(0,1fr)]'} items-start gap-5 2xl:gap-7`}>
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
