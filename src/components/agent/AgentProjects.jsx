"use client";
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import ReusableTable from "@/components/ui/reusable-table";
import { Switch } from "@/components/ui/switch";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '../ui/navigation-menu';
import CustomPagination from '@/components/ui/custom-pagination';
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { useTranslation } from '../context/TranslationContext';
import { truncate, handlePackageCheck, isDemoMode, renderStatusBadge, RejectionTooltip, isRTL, formatExpiryDateLabel } from "@/utils/helperFunction";
import { checkPackageAvailable } from '@/utils/checkPackages/checkPackage';
import { AiOutlineEdit } from "react-icons/ai";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaCheck, FaCrown } from "react-icons/fa";
import { MdAutorenew, MdDeleteOutline, MdRemoveRedEye } from "react-icons/md";
import { getUserProjectsApi, changeProjectStatusApi, deleteProjectApi, renewListingApi, getPackagesApi, getPaymentSettingsApi, activateListingApi } from '@/api/apiRoutes';
import toast from 'react-hot-toast';
import { PackageTypes } from '@/utils/checkPackages/packageTypes';
import Swal from 'sweetalert2';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';

import PayAsYouGoModal from '@/components/modal/PayAsYouGoModal';
import PaymentSelectionModalWrapper from '@/components/modal/PaymentSelectionModalWrapper';
import { exclamationIcon } from '@/assets/svg';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import PremiumIcon from "@/assets/premium.svg";
import ImageWithPlaceholder from '../image-with-placeholder/ImageWithPlaceholder';
// Table Loading Skeleton Component
const TableLoadingSkeleton = ({ itemLength }) => (
    <div className="w-full">
        {/* Table Header Skeleton */}
        <div className="bg-gray-50 border-y">
            <div className="grid grid-cols-7 px-6 py-4">
                {['w-32', 'w-24', 'w-24', 'w-24', 'w-24', 'w-24', 'w-16'].map((width, i) => (
                    <Skeleton key={i} className={`h-4 ${width}`} />
                ))}
            </div>
        </div>

        {/* Table Rows Skeleton */}
        {[...Array(Number(itemLength))].map((_, rowIndex) => (
            <div key={rowIndex} className="border-b px-6 py-4">
                <div className="grid grid-cols-7 gap-4 items-center">
                    {/* Project Title and Image */}
                    <div className="flex items-center space-x-3">
                        {/* <div className="relative p-3">
                            <Skeleton className="h-16 w-16 rounded-md" />
                        </div> */}
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>

                    {/* Other columns */}
                    <Skeleton className="h-4 w-24" />
                    <div className="flex justify-center">
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <div className="flex items-center gap-2 justify-center">
                        <Skeleton className="h-6 w-12 rounded-full" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                    <div className="flex justify-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

const EditReasonTooltip = ({ reason }) => {
    const [open, setOpen] = useState(false);
    return (
        <TooltipProvider>
            <Tooltip open={open} onOpenChange={setOpen}>
                <TooltipTrigger
                    asChild
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
                >
                    <span className="cursor-help">
                        {exclamationIcon()}
                    </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs" onPointerDownOutside={() => setOpen(false)}>
                    <p className="text-sm">{reason}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

const AgentProjects = () => {
    const t = useTranslation();
    const router = useRouter();
    const dispatch = useDispatch();
    const isRtl = isRTL();
    const { lang } = router?.query;
    const isDemoModeActive = isDemoMode();
    const userData = useSelector((state) => state.User?.data);
    const language = useSelector((state) => state.LanguageSettings?.active_language);
    const webSettings = useSelector(state => state.WebSetting?.data);
    // States
    const [isLoading, setIsLoading] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(false);
    const [offset, setOffset] = useState(0);
    const [total, setTotal] = useState(15); // Dummy total count
    const limit = 5; // Items per page

    // Dummy data for projects
    const [projects, setProjects] = useState([]);

    // Filters
    const [statusFilter, setStatusFilter] = useState('')
    const [projectTypeFilter, setProjectTypeFilter] = useState('')

    // Renew listing state
    const [showPayAsYouGoModal, setShowPayAsYouGoModal] = useState(false);
    const [payAsYouGoData, setPayAsYouGoData] = useState(null);
    const [paymentSettingsData, setPaymentSettingsData] = useState([]);
    const [showPaymentSelection, setShowPaymentSelection] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [pendingPayAsYouGoAction, setPendingPayAsYouGoAction] = useState(null);


    const fetchUserProjects = async () => {
        setIsLoading(true);
        try {
            const res = await getUserProjectsApi({
                limit: limit.toString(),
                offset: offset.toString(),
                type: projectTypeFilter === '' ? '' : projectTypeFilter,
                request_status: statusFilter === '' ? '' : statusFilter,
                added_as: "agent"
            });
            setProjects(res?.data);
            setTotal(res?.total);
        } catch (error) {
            console.error("Error in fetching user projects", error);
        } finally {
            setIsLoading(false);
            setIsPageLoading(false);
        }
    };

    useEffect(() => {
        fetchUserProjects();
    }, [offset, language, statusFilter, projectTypeFilter]);

    // Fetch payment settings for renew flow
    useEffect(() => {
        const fetchPaymentSettings = async () => {
            try {
                const res = await getPaymentSettingsApi();
                if (!res?.error) setPaymentSettingsData(res?.data || []);
            } catch (err) {
                console.error("Error fetching payment settings:", err);
            }
        };
        fetchPaymentSettings();
    }, []);

    const handleRenewListing = async (projectId) => {
        try {
            const isAvailable = await checkPackageAvailable(PackageTypes.PROJECT_LIST);
            if (isAvailable) {
                const res = await renewListingApi({ id: projectId, type: "project" });
                if (!res?.error) {
                    toast.success(t(res?.message) || t("renewed"));
                    fetchUserProjects();
                } else {
                    toast.error(t(res?.message) || t("somethingWentWrong"));
                }
                return;
            }

            // Package not available — redirect to packages page
            await openPayAsYouGoFlow({ actionType: "renew", projectId });
        } catch (error) {
            console.error("Error checking package for renew:", error);
            toast.error(t("somethingWentWrong"));
        }
    };

    const clearPayAsYouGoFlow = () => {
        setShowPayAsYouGoModal(false);
        setShowPaymentSelection(false);
        setPendingPayAsYouGoAction(null);
        setPayAsYouGoData(null);
    };

    const isPayAsYouGoPackageError = (message = "") => {
        const normalizedMessage = String(message).toLowerCase();
        return (
            normalizedMessage.includes("package limit is exceeded") ||
            normalizedMessage.includes("upgrade your package to activate this listing")
        );
    };

    const openPayAsYouGoFlow = async () => {
        toast.error(t("pleasePurchasePackageToProceed"));
        router?.push(`/agent/packages?lang=${router?.query?.lang || ""}`);
    };

    const handlePostPaymentRenew = async () => {
        const pendingAction = pendingPayAsYouGoAction;
        if (!pendingAction?.projectId || !pendingAction?.actionType) return;

        try {
            if (pendingAction.actionType === "renew") {
                const res = await renewListingApi({ id: pendingAction.projectId, type: "project" });
                if (!res?.error) {
                    toast.success(t(res?.message) || t("renewed"));
                    fetchUserProjects();
                } else {
                    toast.error(t(res?.message) || t("somethingWentWrong"));
                }
                return;
            }

            if (pendingAction.actionType === "approve") {
                const res = await activateListingApi({
                    id: pendingAction.projectId,
                    listing_type: "project",
                });
                if (!res?.error) {
                    toast.success(t("projectSubmittedForApproval"));
                    fetchUserProjects();
                } else {
                    toast.error(t(res?.message) || t("somethingWentWrong"));
                }
            }
        } catch (error) {
            console.error("Error in renew listing after payment:", error);
            toast.error(t("somethingWentWrong"));
        } finally {
            clearPayAsYouGoFlow();
        }
    };

    // Handlers
    const handleStatusToggle = async (projectId, currentStatus) => {
        try {
            // Call API to change status
            const newStatus = currentStatus === 1 ? 0 : 1;
            const response = await changeProjectStatusApi({
                project_id: projectId,
                status: newStatus
            });

            if (response?.error === false) {
                // Update local state only if API call is successful
                setProjects(prev => prev.map(project =>
                    project.id === projectId
                        ? { ...project, status: newStatus }
                        : project
                ));
                toast.success(t("projectStatusUpdatedSuccessfully"));
                fetchUserProjects();
            }
        } catch (error) {
            console.error("Error in changing project status:", error);
        }
    };

    // Handle featuring a project
    const handleFeatureClick = (e, projectId) => {
        e.preventDefault();
        // Implementation for featuring a project would go here
        if (isDemoModeActive && userData?.is_demo_user) {
            Swal.fire({
                title: t("oops"),
                text: t("notAllowdDemo"),
                icon: "warning",
                showCancelButton: false,
                customClass: {
                    confirmButton: "Swal-buttons",
                },
                confirmButtonText: t("ok"),
            });
            return false;
        }
        handlePackageCheck(e, PackageTypes.PROJECT_FEATURE, router, projectId, null, null, true, t);
    };

    // Handle edit click
    const handleClickEdit = (slugId) => {
        if (isDemoModeActive && userData?.is_demo_user) {
            Swal.fire({
                title: t("oops"),
                text: t("notAllowdDemo"),
                icon: "warning",
                showCancelButton: false,
                customClass: {
                    confirmButton: "Swal-buttons",
                },
                confirmButtonText: t("ok"),
            });
            return false;
        }
        router.push(`/agent/edit-project/${slugId}?lang=${lang}`);
    };

    // Handle delete click
    const handleClickDelete = (projectId) => {
        if (isDemoModeActive && userData?.is_demo_user) {
            Swal.fire({
                title: t("oops"),
                text: t("notAllowdDemo"),
                icon: "warning",
                showCancelButton: false,
                customClass: {
                    confirmButton: "Swal-buttons",
                },
                confirmButtonText: t("ok"),
            });
            return false;
        }

        Swal.fire({
            title: t("areYouSure"),
            text: t("deleteProjectWarning"),
            icon: "warning",
            showCancelButton: true,
            customClass: {
                confirmButton: "Swal-confirm-buttons",
                cancelButton: "Swal-cancel-buttons",
            },
            confirmButtonText: t("yesDelete"),
            cancelButtonText: t("cancel"),
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    // Call delete API here
                    const response = await deleteProjectApi({ id: projectId });
                    if (response?.error === false) {
                        toast.success(t(response?.message));
                        fetchUserProjects(); // Refresh the list
                    }
                } catch (error) {
                    toast.error(t(error?.message) || t("somethingWentWrong"));
                    console.error("Error deleting project:", error);
                }
            }
        });
    };


    const handlePageChange = (page) => {
        setIsPageLoading(true);
        setOffset((page - 1) * limit);
        // Simulate API call
        setTimeout(() => {
            setIsPageLoading(false);
        }, 500);
    };

    const handleSubmitListingForApproval = async (elem) => {
        try {
            const response = await activateListingApi({
                id: elem.id,
                listing_type: "project",
            });
            if (!response?.error) {
                toast.success(t("projectSubmittedForApproval"));
                fetchUserProjects();
            } else if (isPayAsYouGoPackageError(response?.message)) {
                await openPayAsYouGoFlow({ actionType: "approve", projectId: elem.id });
            } else {
                toast.error(t(response?.message));
            }
        } catch (error) {
            const errorMessage = error?.response?.data?.message || error?.message || "";
            if (isPayAsYouGoPackageError(errorMessage)) {
                await openPayAsYouGoFlow({ actionType: "approve", projectId: elem.id });
                return;
            }
            console.error(error);
            toast.error(t("somethingWentWrong"));
        }
    }

    // Table columns configuration
    const tableColumns = [
        {
            header: t("listingTitle"),
            accessor: "title",
            align: isRtl ? "right" : "left",
            renderCell: (elem) => (
                <div className="flex items-center space-x-3">
                    <div className="relative p-3">
                        <div className="h-16 w-16 rounded-md overflow-hidden bg-gray-100">
                            <ImageWithPlaceholder
                                src={elem.image}
                                alt={elem.title}
                                width={60}
                                height={60}
                                className="object-cover h-full w-full"
                            />
                        </div>
                        {elem.is_premium && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="absolute top-4 left-3 text-white text-xs px-1 rounded">
                                            <ImageWithPlaceholder src={PremiumIcon} alt="Premium" width={20} height={20} />
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent sideOffset={8}>
                                        <p>{t("premiumProject")}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                    <div>
                        <div className="font-medium">{truncate(elem.translated_title || elem.title, 25)}</div>
                        {elem?.is_promoted ?
                            <span className="primaryColor font-bold flex items-center">
                                {t("featured")}
                            </span> : null}
                        <div className="text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                {elem.city}, {elem.state}, {elem.country}
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            header: t("category"),
            accessor: "category",
            align: "center",
            renderCell: (elem) => (
                <span className="capitalize px-3 py-1.5 rounded-lg text-sm">
                    {elem.category?.translated_name || elem.category?.category || '-'}
                </span>
            ),
        },
        {
            header: t("type"),
            accessor: "type",
            align: "center",
            renderCell: (elem) => (
                <span className={`capitalize px-3 text-nowrap py-1.5 rounded-lg text-sm ${elem.type === 'upcoming'
                    ? 'primarySellText primarySellBg'
                    : 'primaryRentText primaryRentBg'
                    }`}>
                    {t(elem.type)}
                </span>
            ),
        },
        {
            header: t("postedOn"),
            accessor: "created_at",
            align: "center",
            renderCell: (elem) => (
                <span className="text-sm text-gray-600">
                    {elem?.posted_since}
                </span>
            ),
        },
        {
            header: t("adminStatus"),
            accessor: "request_status",
            align: "center",
            renderCell: (elem) => (
                <div className="flex items-center justify-center gap-2">
                    {renderStatusBadge(elem.request_status, t)}
                    {elem.request_status === 'rejected' && <RejectionTooltip reason={elem?.reject_reason?.reason} t={t} />}
                    {elem?.edit_reason && <EditReasonTooltip reason={elem.edit_reason} />}
                </div>
            ),
        },
        {
            header: t("projectStatus"),
            accessor: "status",
            align: "center",
            renderCell: (elem) => (
                <div className="flex justify-center items-center rtl:gap-2">
                    <Switch
                        checked={elem.status === 1 && elem?.request_status !== "pending"}
                        onCheckedChange={() => handleStatusToggle(elem.id, elem.status)}
                        disabled={elem?.request_status === "draft" || elem?.request_status === "pending" || elem?.request_status === "rejected" || elem?.is_expired === 1}
                        className={`${elem.status === 1 && elem?.request_status !== "pending" ? "!primaryBg" : "!bg-[#28252566]"} rounded-[100px]
                          h-4 w-8 transition-colors duration-300 sm:h-5 sm:w-10 [&>span]:h-2.5 [&>span]:w-2.5 ${isRtl ? "data-[state=checked]:[&>span]:-translate-x-4" : "data-[state=checked]:[&>span]:translate-x-4"} sm:[&>span]:h-3 sm:[&>span]:w-3 ${isRtl ? "sm:data-[state=checked]:[&>span]:-translate-x-5" : "sm:data-[state=checked]:[&>span]:translate-x-5"}`}
                    />
                    <span className={`ml-2 text-sm ${elem.status === 1 && elem?.request_status !== "pending" ? "primaryColor" : "secondryTextColor"} capitalize`}>
                        {elem.status === 1 && elem?.request_status !== "pending" ? t("active") : t("deactive")}
                    </span>
                </div>
            ),
        },
        {
            header: t("expiryDate"),
            accessor: "expiry_date",
            align: "center",
            renderCell: (elem) => {
                if (!elem.expiry_date) return <span className="text-xs">-</span>;
                const label = formatExpiryDateLabel(elem.expiry_date, t);
                return <span className={`text-sm text-nowrap font-medium secondryTextColor`}>{label}</span>;
            },
        },
        {
            header: t("action"),
            accessor: "id",
            align: "center",
            renderCell: (elem, rowIndex) => {
                const isLastRow = rowIndex === projects.length - 1;
                const isSingleRow = projects.length === 1;
                const directionClass = isRtl
                    ? "[&_div:nth-child(2)]:left-5 [&_div:nth-child(2)]:right-auto"
                    : "[&_div:nth-child(2)]:right-5 [&_div:nth-child(2)]:left-auto";

                const rowPositionClass = isLastRow
                    ? "[&_div:nth-child(2)]:bottom-[40px] [&_div:nth-child(2)]:top-auto"
                    : "[&_div:nth-child(2)]:bottom-0";

                const singleRowClass =
                    isSingleRow && !isRtl
                        ? "[&_div:nth-child(2)]:right-10 [&_div:nth-child(2)]:top-[-4rem]"
                        : isSingleRow && isRtl ? "[&_div:nth-child(2)]:-right-24 [&_div:nth-child(2)]:top-[-4rem]" : "";

                return (
                    <div className="flex justify-center items-center gap-2">
                        <Button size="sm" variant="outline" className="bg-transparent h-8 w-8 p-0" onClick={() => router.push(`/agent/my-project/${elem.slug_id}?lang=${lang}`)}>
                            <MdRemoveRedEye className="h-4 w-4" />
                        </Button>
                        {elem?.request_status === "draft" ? (
                            <Button size="sm" variant="ghost" className="primaryBg primaryText hover:primaryBg hover:primaryColor h-8 w-8 p-0" onClick={() => handleSubmitListingForApproval(elem)}>
                                <FaCheck className="text-white h-4 w-4" />
                            </Button>
                        ) : null}
                        <NavigationMenu className={`
                            
                            [&_div:nth-child(2)>div]:!z-[9999]
                            [&_div:nth-child(2)>div]:!bg-white
                            ${directionClass}
                            ${rowPositionClass}
                            ${singleRowClass}
                        `}>
                            <NavigationMenuList>
                                <NavigationMenuItem>
                                    <NavigationMenuTrigger className="primaryRentBg primaryRentText [&_svg.lucide]:hidden hover:primaryRentBg data-[state=open]:!primaryRentBg data-[state=open]:!primaryRentText hover:primaryRentText data-[state=active]:!primaryRentBg data-[state=active]:!primaryRentText p-3 focus:primaryRentBg focus:primaryRentText">
                                        <BsThreeDotsVertical className="h-4 w-4" />
                                    </NavigationMenuTrigger>
                                    <NavigationMenuContent className="grid !w-[150px] gap-1 relative z-[9999]">
                                        {elem.is_expired === 1 ? (
                                            <NavigationMenuLink
                                                onClick={() => handleRenewListing(elem?.id)}
                                                className='rtl:text-start px-3 py-2 flex justify-start items-center gap-2 bg-white hover:primaryBgLight hover:primaryColor hover:cursor-pointer'
                                            >
                                                <MdAutorenew />{t("renewListing")}
                                            </NavigationMenuLink>
                                        ) : (
                                            <>
                                                {/* Edit option - only show if status is not pending */}
                                                {elem.request_status !== "pending" && (
                                                    <NavigationMenuLink
                                                        onClick={() => handleClickEdit(elem.slug_id)}
                                                        className='rtl:text-start px-3 py-2 flex justify-start items-center gap-2 bg-white hover:primaryBgLight hover:primaryColor hover:cursor-pointer'
                                                    >
                                                        <AiOutlineEdit />{t("edit")}
                                                    </NavigationMenuLink>
                                                )}

                                                {/* Feature option - show if not pending and feature is available */}
                                                {elem.request_status !== "pending" && elem?.is_feature_available && (
                                                    <NavigationMenuLink
                                                        onClick={(e) => handleFeatureClick(e, elem.id)}
                                                        className='rtl:text-start px-3 py-2 flex justify-start items-center gap-2 bg-white hover:primaryBgLight hover:primaryColor hover:cursor-pointer'
                                                    >
                                                        <FaCrown />
                                                        {t("featured")}
                                                    </NavigationMenuLink>
                                                )}

                                                {/* Delete option */}
                                                <NavigationMenuLink
                                                    onClick={() => handleClickDelete(elem?.id)}
                                                    className='rtl:text-start px-3 py-2 flex justify-start items-center gap-2 bg-white hover:primaryBgLight hover:primaryColor hover:cursor-pointer'
                                                >
                                                    <MdDeleteOutline />{t("delete")}
                                                </NavigationMenuLink>
                                            </>
                                        )}
                                    </NavigationMenuContent>
                                </NavigationMenuItem>
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>
                );
            },
        },
    ];


    return (
        <div className="space-y-4 p-2 md:p-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold">{t("myProjects")}</h1>
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
                            <SelectItem value=" ">{t("all")}</SelectItem>
                            <SelectItem value="approved">{t("approved")}</SelectItem>
                            <SelectItem value="rejected">{t("rejected")}</SelectItem>
                            <SelectItem value="pending">{t("pending")}</SelectItem>
                            <SelectItem value="expired">{t("expired")}</SelectItem>
                            <SelectItem value="draft">{t("draft")}</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Property Type Filter */}
                    <Select value={projectTypeFilter} onValueChange={(value) => {
                        setProjectTypeFilter(value);
                        setOffset(0); // Reset to first page when filter changes
                    }}>
                        <SelectTrigger className="w-full xs:w-[180px] brandColor bg-white newBorder focus:ring-0">
                            <SelectValue placeholder={t("projectType")} defaultValue={'all'}/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value=" ">{t("all")}</SelectItem>
                            <SelectItem value="upcoming">{t("upcoming")}</SelectItem>
                            <SelectItem value="under_construction">{t("under_construction")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="bg-white rounded-xl">
                {(isLoading || isPageLoading) ? (
                    <TableLoadingSkeleton itemLength={limit} />
                ) : (
                    <ReusableTable
                        parentclassname="rounded-tl-xl rounded-tr-xl overflow-x-auto [&>div]:overflow-x-auto"
                        columns={tableColumns}
                        data={projects}
                        loading={false}
                        emptyMessage={t("noDataAvailable")}
                    />
                )}

                {/* Pagination */}
                {!isPageLoading && !isLoading && total > limit && <div className={`transition-opacity duration-200 ${isPageLoading ? 'opacity-0' : 'opacity-100'}`}>
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
                    />
                </div>}
            </div>
            {/* Pay As You Go Modal (Renew) */}
            <PayAsYouGoModal
                isOpen={showPayAsYouGoModal}
                onClose={clearPayAsYouGoFlow}
                payAsYouGoData={payAsYouGoData}
                onContinuePayment={() => setShowPaymentSelection(true)}
                onViewMorePlans={() => {
                    clearPayAsYouGoFlow();
                    router.push(`/agent/packages?lang=${lang}`);
                }}
                isProcessing={paymentLoading}
                isProject={true}
            />

            {/* Payment Selection Modal (Renew) */}
            <PaymentSelectionModalWrapper
                payAsYouGoData={payAsYouGoData}
                paymentSettingsData={paymentSettingsData}
                showPaymentSelection={showPaymentSelection}
                setShowPaymentSelection={setShowPaymentSelection}
                paymentLoading={paymentLoading}
                setPaymentLoading={setPaymentLoading}
                router={router}
                websettings={webSettings}
                onPaymentSuccess={handlePostPaymentRenew}
                onPaymentFailed={clearPayAsYouGoFlow}
            />
        </div>
    );
};

export default AgentProjects;