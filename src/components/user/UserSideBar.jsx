import { BiBuildingHouse, BiMessageSquareDetail, BiBell, BiDollarCircle, BiUserX, BiCreditCard, BiLogOut, BiNews, BiHeart } from "react-icons/bi";
import { FaRegCircleUser } from "react-icons/fa6";
import { RiAdvertisementLine } from "react-icons/ri";
import { FaRegCalendarAlt } from "react-icons/fa";
import { useTranslation } from "../context/TranslationContext";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { deleteUser, getAuth } from "firebase/auth";
import { isDemoMode } from "@/utils/helperFunction";
import Swal from "sweetalert2";
import { beforeLogoutApi, deleteUserAccountApi } from "@/api/apiRoutes";
import { logout, setRole } from "@/redux/slices/authSlice";
import FirebaseData from "@/utils/Firebase";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";

const UserSidebarSkeleton = () => (
    <>
        <div className="mb-4 flex gap-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm xl:hidden">
            {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-11 w-32 shrink-0 rounded-xl" />
            ))}
        </div>
        <aside className="hidden w-full rounded-[26px] bg-[#071426] p-4 shadow-[0_24px_70px_rgba(15,23,42,0.18)] xl:block">
            <Skeleton className="mb-4 h-14 w-full rounded-2xl bg-white/10" />
            <div className="flex flex-col gap-2">
                {Array.from({ length: 10 }).map((_, index) => (
                    <Skeleton key={index} className="h-11 w-full rounded-xl bg-white/10" />
                ))}
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
            <nav
                aria-label="User navigation"
                className="mb-4 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2.5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:hidden"
            >
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActiveRoute(item.route);
                    return (
                        <button
                            key={item.route}
                            type="button"
                            onClick={() => navigate(item)}
                            aria-current={active ? "page" : undefined}
                            className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3.5 text-sm font-bold transition-all ${active ? "primaryBg text-white shadow-md" : "bg-slate-50 text-slate-700 active:bg-slate-100"}`}
                        >
                            <Icon className="h-[18px] w-[18px]" />
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
                            className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3.5 text-sm font-bold ${item.danger ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-700"}`}
                        >
                            <Icon className="h-[18px] w-[18px]" />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <aside className="sticky top-24 hidden w-full overflow-hidden rounded-[26px] bg-[#071426] text-white shadow-[0_28px_75px_rgba(15,23,42,0.18)] xl:block">
                <div className="relative border-b border-white/10 px-5 py-5">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full opacity-30 blur-3xl"
                        style={{ backgroundColor: "var(--primary-color)" }}
                    />
                    <div className="relative flex items-center gap-3">
                        <span className="primaryBg flex h-11 w-11 items-center justify-center rounded-2xl shadow-lg">
                            <FaRegCircleUser className="h-5 w-5" />
                        </span>
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] primaryColor">Ximmo24</p>
                            <p className="mt-0.5 text-sm font-extrabold text-white">{t("myProfile")}</p>
                        </div>
                    </div>
                </div>

                <nav aria-label="User navigation" className="px-3 py-3">
                    <div className="flex flex-col gap-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActiveRoute(item.route);
                            return (
                                <button
                                    key={item.route}
                                    type="button"
                                    onClick={() => navigate(item)}
                                    aria-current={active ? "page" : undefined}
                                    className={`group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-all duration-200 ${active ? "primaryBg text-white shadow-lg" : "text-slate-300 hover:bg-white/[0.08] hover:text-white"}`}
                                >
                                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? "bg-white/15" : "bg-white/[0.06] group-hover:bg-white/10"}`}>
                                        <Icon className="h-[18px] w-[18px]" />
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
                                    className={`group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-all ${item.danger ? "text-red-300 hover:bg-red-500/10 hover:text-red-200" : "text-slate-300 hover:bg-white/[0.08] hover:text-white"}`}
                                >
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
                                        <Icon className="h-[18px] w-[18px]" />
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
