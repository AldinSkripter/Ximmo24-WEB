import { BiHeart, BiLogIn } from "react-icons/bi";
import { BiBuildingHouse, BiMessageSquareDetail, BiBell, BiDollarCircle, BiUserX, BiCreditCard, BiNews, BiTachometer } from "react-icons/bi";
import { FaRegCircleUser } from "react-icons/fa6";
import { RiAdvertisementLine } from "react-icons/ri";
import { FaExclamation, FaRegCalendarAlt } from "react-icons/fa";
import ImageWithPlaceholder from "../image-with-placeholder/ImageWithPlaceholder";
import { useTranslation } from "../context/TranslationContext";
import { useRouter } from "next/router";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useDispatch, useSelector } from "react-redux";
import { logout, setRole } from "@/redux/slices/authSlice";
import { isDemoMode } from "@/utils/helperFunction";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { deleteUser, getAuth } from "firebase/auth";
import { deleteUserAccountApi } from "@/api/apiRoutes";
import FirebaseData from "@/utils/Firebase";
import { VerifiedUserBadge } from "@/utils/helperFunction";
import { MdOutlineVerifiedUser } from "react-icons/md";

export default function UserDropDown({ user, handleLogout, onClose }) {
    const t = useTranslation();
    const router = useRouter();
    const dispatch = useDispatch()
    const { lang } = router?.query;
    const { signOut } = FirebaseData();
    const userData = useSelector((state) => state?.User?.data)
    const webSettings = useSelector(state => state.WebSetting?.data);
    const isMobileAndTabletScreen = useMediaQuery("(max-width: 1024px)");
    const isAgentOwnListingDetailsPage =
        router?.pathname?.startsWith("/agent/my-property") ||
        router?.pathname?.startsWith("/agent/my-project");
    const isAgent = userData?.become_agent_status === "approved" && userData?.is_agent === true;
    const isAgentVerificationPending = userData?.become_agent_status === "pending";
    const isAgentVerificationRejected = userData?.become_agent_status === "rejected";
    const isAgentVerificationNotApplied = userData?.become_agent_status === "not_applied"
    const isBecomeAgentPage = router?.pathname === "/become-agent";
    const isUserDashboardPages = router?.asPath?.startsWith("/user/");

    const clearDeletedAccountSession = () => {
        dispatch(logout());
        dispatch(setRole({ data: "user" }));
        signOut();
    };

    // Handle delete account functionality
    const handleDeleteAccount = async () => {
        if (isDemoMode() && userData?.is_demo_user) {
            Swal.fire({
                title: t("opps"),
                text: t("notAllowdDemo"),
                icon: "warning",
                showCancelButton: false,
                customClass: {
                    confirmButton: "Swal-confirm-buttons",
                    cancelButton: "Swal-cancel-buttons",
                },
                confirmButtonText: t("ok"),
                cancelButtonText: t("cancel"),
            });
            return; // Stop further execution
        }

        // Initialize Firebase Authentication
        const auth = getAuth();

        // Get the currently signed-in user
        const user = auth?.currentUser;

        Swal.fire({
            title: t("areYouSure"),
            text: t("youNotAbelToRevertThis"),
            icon: "warning",
            showCancelButton: true,
            customClass: {
                confirmButton: "Swal-confirm-buttons",
                cancelButton: "Swal-cancel-buttons",
            },
            cancelButtonColor: "#d33",
            confirmButtonText: t("yes"),
            cancelButtonText: t("cancel"),
        }).then(async (result) => {
            if (result.isConfirmed) {
                // Delete the user
                if (user) {
                    try {
                        // Firebase deleteUser returns undefined on success
                        await deleteUser(user);

                        // After successful Firebase deletion, call the API
                        await deleteUserAccountApi();

                        // Handle success
                        clearDeletedAccountSession();
                        toast.success(t("accountDeletedSuccessfully"));
                        router.push("/");
                    } catch (error) {
                        console.error("Error deleting user:", error.message);
                        if (error.code === "auth/requires-recent-login") {
                            clearDeletedAccountSession();
                            toast.error(error.message);
                            router.push("/");
                        }
                    }
                } else {
                    try {
                        await deleteUserAccountApi();
                        clearDeletedAccountSession();
                        toast.success(t("accountDeletedSuccessfully"));
                        router.push("/");
                    } catch (err) {
                        console.error(err);
                    }
                }
            } else {
                console.error("delete account process canceled ");
            }
        });
    };


    const menuItems = [
        { icon: <BiBuildingHouse className="size-4 md:size-5" />, label: t("myListing"), route: `/user/listings?tab=properties&lang=${lang}` },
        ...(isMobileAndTabletScreen ? [{ icon: <RiAdvertisementLine className="size-4 md:size-5" />, label: t("myAdvertisements"), route: `/user/advertisement?lang=${lang}&tab=properties` }] : []),
        ...(isMobileAndTabletScreen ? [{ icon: <FaRegCalendarAlt className="size-4 md:size-5" />, label: t("myAppointments"), route: `/user/appointments?lang=${lang}` }] : []),
        { icon: <BiMessageSquareDetail className="size-4 md:size-5" />, label: t("messages"), route: `/user/chat?lang=${lang}` },
        { icon: <BiBell className="size-4 md:size-5" />, label: t("notifications"), route: `/user/notifications?lang=${lang}` },
        ...(isMobileAndTabletScreen ? [{ icon: <BiNews className="size-4 md:size-5" />, label: t("personalizedFeeds"), route: `/user/personalized-feeds?lang=${lang}` }] : []),
        { icon: <BiCreditCard className="size-4 md:size-5" />, label: t("mySubscriptions"), route: `/user/my-subscriptions?lang=${lang}` },
        ...(isMobileAndTabletScreen ? [{ icon: <BiDollarCircle className="size-4 md:size-5" />, label: t("transactionHistory"), route: `/user/transaction-history?lang=${lang}` }] : []),
        { icon: <FaRegCircleUser className="size-4 md:size-5" />, label: t("myProfile"), route: `/user/profile?lang=${lang}` },
        ...(isUserDashboardPages ? [{ icon: <BiHeart className="size-4 md:size-5" />, label: t("favourites"), route: `/user/favourites?lang=${lang}` }] : []),
        ...(isUserDashboardPages ? [{ icon: <BiUserX className="size-4 md:size-5" />, label: t("deleteAccount"), route: `/user/delete-account?lang=${lang}`, onClick: handleDeleteAccount }] : []),
    ];

    const agentMenuItems = [
        { icon: <BiTachometer className="size-4 md:size-5" />, label: t("myDashboard"), route: `/agent/dashboard?lang=${lang}` },
        { icon: <BiBuildingHouse className="size-4 md:size-5" />, label: t("myProperties"), route: `/agent/properties?lang=${lang}` },
        { icon: <BiBuildingHouse className="size-4 md:size-5" />, label: t("myProjects"), route: `/agent/projects?lang=${lang}` },
        { icon: <FaRegCalendarAlt className="size-4 md:size-5" />, label: t("bookings"), route: `/agent/bookings?lang=${lang}` },
        { icon: <BiMessageSquareDetail className="size-4 md:size-5" />, label: t("messages"), route: `/agent/chat?lang=${lang}` },
        { icon: <BiBell className="size-4 md:size-5" />, label: t("notifications"), route: `/agent/notifications?lang=${lang}` },
        { icon: <FaRegCircleUser className="size-4 md:size-5" />, label: t("myProfile"), route: `/agent/profile?lang=${lang}` },
    ];

    const showAgentOwnListingMenu = isAgent && isAgentOwnListingDetailsPage;
    const activeMenuItems = showAgentOwnListingMenu ? agentMenuItems : menuItems;
    const showSwitchToAgentButton = !showAgentOwnListingMenu && (isAgent || isAgentVerificationPending);

    const handleSwitchToAgentClick = () => {
        onClose?.();

        if (isAgent) {
            dispatch(setRole({ data: "agent" }))
            return router.push(`/agent/dashboard?lang=${lang}`)
        } else if (userData?.become_agent_status === "not_applied" && userData?.is_agent === false) {
            return router.push(`/become-agent?lang=${lang}`)
        } else if (isAgentVerificationPending) {
            return router.push(`/agent/dashboard?lang=${lang}`)
        }
    }



    const isActiveRoute = (route) => router?.asPath?.includes(route?.split("?")[0]);

    return (
        <div className="dropdown-content fixed inset-x-3 top-[76px] z-[100] flex max-h-[calc(100dvh-92px)] flex-col overflow-hidden rounded-[24px] border border-white/15 bg-[#071426]/[0.94] text-white shadow-[0_28px_90px_rgba(2,8,23,0.48)] backdrop-blur-2xl xl:absolute xl:inset-x-auto xl:right-0 xl:top-full xl:mt-3 xl:w-[390px]">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-30 blur-3xl"
                style={{ backgroundColor: "var(--primary-color)" }}
            />

            <div className="relative flex items-center gap-3 border-b border-white/10 p-4 sm:p-5">
                <div className="shrink-0 rounded-[18px] border border-white/15 bg-white/10 p-1 shadow-xl">
                    {user?.profile ? (
                        <ImageWithPlaceholder
                            src={user.profile}
                            alt={user?.name || t("user")}
                            width={58}
                            height={58}
                            sizes="58px"
                            quality={95}
                            unoptimized
                            className="h-[54px] w-[54px] rounded-[14px] object-cover"
                        />
                    ) : (
                        <div className="primaryBg flex h-[54px] w-[54px] items-center justify-center rounded-[14px] text-xl font-black uppercase text-white">
                            {(user?.name || user?.email)?.charAt(0)}
                        </div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-1.5">
                        <p className="min-w-0 truncate text-base font-black text-white sm:text-lg" title={user?.name}>
                            {user?.name}
                        </p>
                        {userData?.is_user_verified ? (
                            <VerifiedUserBadge color={webSettings?.system_color || "#0aa8e8"} width={18} height={18} />
                        ) : null}
                    </div>
                    <p className="truncate text-xs text-slate-400 sm:text-sm" title={user?.email}>{user?.email}</p>
                </div>
                <span className="primaryBg h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_16px_var(--primary-color)]" />
            </div>

            {showSwitchToAgentButton ? (
                <div className="relative border-b border-white/10 p-3 sm:px-4">
                    <button
                        type="button"
                        className="group flex min-h-11 w-full items-center justify-between rounded-xl border border-white/15 bg-white/[0.08] px-4 text-sm font-extrabold text-white transition-all hover:bg-white/[0.14]"
                        onClick={handleSwitchToAgentClick}
                    >
                        <span>{t("switchToAgent")}</span>
                        <span className="primaryBg flex h-7 w-7 items-center justify-center rounded-lg transition-transform group-hover:translate-x-0.5">
                            <BiTachometer className="h-4 w-4" />
                        </span>
                    </button>
                </div>
            ) : null}

            {isMobileAndTabletScreen && isAgentVerificationNotApplied && !isBecomeAgentPage ? (
                <div className="relative border-b border-white/10 p-3 sm:px-4">
                    <button
                        type="button"
                        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-4 text-sm font-extrabold text-white transition-all hover:bg-white/[0.14]"
                        onClick={handleSwitchToAgentClick}
                    >
                        <MdOutlineVerifiedUser className="h-5 w-5 primaryColor" />
                        {t("becomeAgent")}
                    </button>
                </div>
            ) : isMobileAndTabletScreen && isAgentVerificationRejected && !isBecomeAgentPage ? (
                <div className="relative border-b border-white/10 p-3 sm:px-4">
                    <button
                        type="button"
                        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 text-sm font-extrabold text-red-200"
                        onClick={() => router.push(`/become-agent/?lang=${lang}`)}
                    >
                        <FaExclamation className="h-4 w-4" />
                        {t("requestRejected")}
                    </button>
                </div>
            ) : null}

            <nav className="relative min-h-0 flex-1 overflow-y-auto p-2.5 sm:p-3 [scrollbar-color:rgba(255,255,255,0.2)_transparent]">
                <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-1">
                    {activeMenuItems.map((item, index) => {
                        const active = isActiveRoute(item.route);
                        return (
                            <button
                                key={item.route || index}
                                type="button"
                                aria-current={active ? "page" : undefined}
                                onClick={() => {
                                    onClose?.();
                                    if (item.onClick) {
                                        item.onClick();
                                    } else {
                                        router.push(item.route);
                                    }
                                }}
                                className={`group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold transition-all ${active ? "primaryBg text-white shadow-lg" : "text-slate-200 hover:bg-white/[0.09] hover:text-white"}`}
                            >
                                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? "bg-white/15" : "bg-white/[0.07] text-slate-300 group-hover:bg-white/10 group-hover:text-white"}`}>
                                    {item.icon}
                                </span>
                                <span className="min-w-0 truncate">{item.label}</span>
                                {active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" /> : null}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {!showAgentOwnListingMenu ? (
                <div className="relative border-t border-white/10 p-3 sm:p-4">
                    <button
                        type="button"
                        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 text-sm font-extrabold text-red-200 transition-all hover:bg-red-500/20 hover:text-white"
                        onClick={() => {
                            onClose?.();
                            handleLogout();
                        }}
                    >
                        <BiLogIn className="h-5 w-5" />
                        <span>{t("logout")}</span>
                    </button>
                </div>
            ) : null}
        </div>
    );
}
