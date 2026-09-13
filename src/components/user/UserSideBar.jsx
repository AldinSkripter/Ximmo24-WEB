import ImageWithPlaceholder from "@/components/image-with-placeholder/ImageWithPlaceholder";
import { BiBuildingHouse, BiMessageSquareDetail, BiBell, BiDollarCircle, BiUserX, BiCreditCard, BiLogOut, BiNews, BiHeart } from "react-icons/bi";
import { FaRegCircleUser } from "react-icons/fa6";
import { RiAdvertisementLine } from "react-icons/ri";
import { FaRegCalendarAlt } from "react-icons/fa";
import { useTranslation } from "../context/TranslationContext";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { deleteUser, getAuth } from "firebase/auth";
import { isDemoMode, VerifiedUserBadge } from "@/utils/helperFunction";
import Swal from "sweetalert2";
import { beforeLogoutApi, deleteUserAccountApi } from "@/api/apiRoutes";
import { logout, setRole } from "@/redux/slices/authSlice";
import FirebaseData from "@/utils/Firebase";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";

const UserAvatar = ({ user, compact = false }) => {
    const sizeClass = compact ? "h-12 w-12" : "h-20 w-20";

    if (user?.profile) {
        return (
            <ImageWithPlaceholder
                src={user.profile}
                alt={user?.name || "User"}
                width={compact ? 48 : 80}
                height={compact ? 48 : 80}
                sizes={compact ? "48px" : "80px"}
                quality={95}
                unoptimized
                className={`${sizeClass} shrink-0 rounded-2xl border border-white/20 object-cover shadow-lg`}
            />
        );
    }

    return (
        <div className={`${sizeClass} primaryBg flex shrink-0 items-center justify-center rounded-2xl border border-white/20 text-xl font-extrabold uppercase text-white shadow-lg`}>
            {user?.name?.charAt(0) || "U"}
        </div>
    );
};

const UserSidebarSkeleton = () => (
    <>
        <div className="mb-4 rounded-[22px] border border-white/80 bg-white p-3 shadow-lg xl:hidden">
            <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <div className="flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-2 h-3 w-44" />
                </div>
            </div>
            <div className="mt-3 flex gap-2 overflow-hidden">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-10 w-28 shrink-0 rounded-xl" />
                ))}
            </div>
        </div>
        <aside className="hidden w-full overflow-hidden rounded-[30px] bg-[#071426] shadow-[0_24px_70px_rgba(15,23,42,0.18)] xl:block">
            <div className="p-5">
                <Skeleton className="h-32 w-full rounded-2xl bg-white/10" />
                <div className="mt-5 flex flex-col gap-2">
                    {Array.from({ length: 10 }).map((_, index) => (
                        <Skeleton key={index} className="h-12 w-full rounded-xl bg-white/10" />
                    ))}
                </div>
            </div>
        </aside>
    </>
);

const UserSidebar = ({ isLoading }) => {
    const t = useTranslation();
    const router = useRouter();
    const dispatch = useDispatch();
    const { signOut } = FirebaseData();

    const lang = router?.query?.lang;
    const pathname = router?.asPath;
    const user = useSelector((state) => state?.User?.data);
    const webSettings = useSelector((state) => state.WebSetting?.data);
    const FcmToken = useSelector((state) => state.WebSetting?.fcmToken);

    if (isLoading) {
        return <UserSidebarSkeleton />;
    }

    const clearDeletedAccountSession = () => {
        dispatch(logout());
        dispatch(setRole({ data: "user" }));
        signOut();
    };

    const handleLogout = async () => {
        Swal.fire({
            title: t("areYouSure"),
            text: t("youNotAbelToRevertThis"),
            icon: "warning",
            showCancelButton: true,
            customClass: {
                confirmButton: "Swal-confirm-buttons",
                cancelButton: "Swal-cancel-buttons",
            },
            confirmButtonText: t("yesLogout"),
            cancelButtonText: t("cancel"),
        }).then(async (result) => {
            if (!result.isConfirmed) return;

            try {
                if (FcmToken) {
                    const res = await beforeLogoutApi({ fcm_id: FcmToken });
                    if (res.error) return;
                }

                dispatch(logout());
                dispatch(setRole({ data: "user" }));
                signOut();
                toast.success(t("logoutSuccess"));
                router.push("/");
            } catch (error) {
                console.error("Error logging out:", error);
            }
        });
    };

    const handleDeleteAccount = async () => {
        if (isDemoMode() && user?.is_demo_user) {
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
            return;
        }

        const auth = getAuth();
        const firebaseUser = auth?.currentUser;

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
            if (!result.isConfirmed) return;

            try {
                if (firebaseUser) {
                    await deleteUser(firebaseUser);
                }

                await deleteUserAccountApi();
                clearDeletedAccountSession();
                toast.success(t("accountDeletedSuccessfully"));
                router.push("/");
            } catch (error) {
                console.error("Error deleting user:", error?.message || error);
                if (error?.code === "auth/requires-recent-login") {
                    clearDeletedAccountSession();
                    toast.error(error.message);
                    router.push("/");
                }
            }
        });
    };

    const menuItems = [
        { icon: BiBuildingHouse, label: t("myListing"), route: `/user/listings?tab=properties&lang=${lang}` },
        { icon: RiAdvertisementLine, label: t("myAdvertisements"), route: `/user/advertisement?lang=${lang}` },
        { icon: FaRegCalendarAlt, label: t("myAppointments"), route: `/user/appointments?lang=${lang}` },
        { icon: BiMessageSquareDetail, label: t("messages"), route: `/user/chat?lang=${lang}` },
        { icon: BiBell, label: t("notifications"), route: `/user/notifications?lang=${lang}` },
        { icon: BiNews, label: t("personalizedFeeds"), route: `/user/personalized-feeds?lang=${lang}` },
        { icon: BiCreditCard, label: t("mySubscriptions"), route: `/user/my-subscriptions?lang=${lang}` },
        { icon: BiDollarCircle, label: t("transactionHistory"), route: `/user/transaction-history?lang=${lang}` },
        { icon: FaRegCircleUser, label: t("myProfile"), route: `/user/profile?lang=${lang}` },
        { icon: BiHeart, label: t("favourites"), route: `/user/favourites?lang=${lang}` },
    ];

    const accountActions = [
        { icon: BiLogOut, label: t("logout"), onClick: handleLogout },
        { icon: BiUserX, label: t("deleteAccount"), onClick: handleDeleteAccount, danger: true },
    ];

    const isActiveRoute = (route) => pathname?.includes(route.split("?")[0]);

    const navigate = (item) => {
        if (item.onClick) {
            item.onClick();
            return;
        }
        router.push(item.route);
    };

    return (
        <>
            <div className="mb-4 overflow-hidden rounded-[22px] border border-white/80 bg-white/95 shadow-[0_16px_45px_rgba(15,23,42,0.09)] backdrop-blur-xl xl:hidden">
                <div className="flex items-center gap-3 border-b border-slate-100 p-3.5">
                    <UserAvatar user={user} compact />
                    <div className="min-w-0 flex-1">
                        <p className="flex min-w-0 items-center gap-1.5 font-extrabold text-slate-900">
                            <span className="truncate">{user?.name}</span>
                            {user?.is_user_verified ? (
                                <VerifiedUserBadge color={webSettings?.system_color} width={17} height={17} />
                            ) : null}
                        </p>
                        <p className="truncate text-xs text-slate-500">{user?.email}</p>
                    </div>
                </div>
                <nav aria-label="User navigation" className="flex gap-2 overflow-x-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActiveRoute(item.route);
                        return (
                            <button
                                key={item.route}
                                type="button"
                                onClick={() => navigate(item)}
                                className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-sm font-bold transition-all ${active ? "primaryBg primaryBorderColor text-white shadow-md" : "border-slate-200 bg-white text-slate-700"}`}
                            >
                                <Icon className="h-5 w-5" />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                    {accountActions.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.label}
                                type="button"
                                onClick={() => navigate(item)}
                                className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-sm font-bold ${item.danger ? "border-red-100 bg-red-50 text-red-600" : "border-slate-200 bg-white text-slate-700"}`}
                            >
                                <Icon className="h-5 w-5" />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            <aside className="sticky top-24 hidden w-full overflow-hidden rounded-[30px] bg-[#071426] text-white shadow-[0_28px_75px_rgba(15,23,42,0.2)] xl:block">
                <div className="relative overflow-hidden p-5">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-30 blur-3xl"
                        style={{ backgroundColor: "var(--primary-color)" }}
                    />
                    <div className="relative rounded-[22px] border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
                        <div className="flex items-center gap-3">
                            <UserAvatar user={user} />
                            <div className="min-w-0 flex-1">
                                <p className="flex min-w-0 items-center gap-1.5 text-base font-extrabold">
                                    <span className="truncate" title={user?.name}>{user?.name}</span>
                                    {user?.is_user_verified ? (
                                        <VerifiedUserBadge color={webSettings?.system_color} width={18} height={18} />
                                    ) : null}
                                </p>
                                <p className="mt-1 truncate text-xs text-slate-400" title={user?.email}>{user?.email}</p>
                            </div>
                        </div>
                        <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full w-2/3 rounded-full primaryBg" />
                        </div>
                    </div>
                </div>

                <nav aria-label="User navigation" className="relative px-3 pb-3">
                    <div className="flex flex-col gap-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActiveRoute(item.route);
                            return (
                                <button
                                    key={item.route}
                                    type="button"
                                    onClick={() => navigate(item)}
                                    className={`group flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 text-left text-sm font-semibold transition-all duration-200 ${active ? "primaryBg translate-x-1 text-white shadow-lg" : "text-slate-300 hover:translate-x-1 hover:bg-white/[0.08] hover:text-white"}`}
                                >
                                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? "bg-white/15" : "bg-white/[0.06] group-hover:bg-white/10"}`}>
                                        <Icon className="h-[19px] w-[19px]" />
                                    </span>
                                    <span className="min-w-0 truncate">{item.label}</span>
                                    {active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" /> : null}
                                </button>
                            );
                        })}
                    </div>

                    <div className="my-3 h-px bg-white/10" />

                    <div className="flex flex-col gap-1">
                        {accountActions.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.label}
                                    type="button"
                                    onClick={() => navigate(item)}
                                    className={`group flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 text-left text-sm font-semibold transition-all ${item.danger ? "text-red-300 hover:bg-red-500/10 hover:text-red-200" : "text-slate-300 hover:bg-white/[0.08] hover:text-white"}`}
                                >
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
                                        <Icon className="h-[19px] w-[19px]" />
                                    </span>
                                    <span className="truncate">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </nav>
            </aside>
        </>
    );
};

export default UserSidebar;
