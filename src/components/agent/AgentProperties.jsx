"use client";
import { changePropertyStatusApi, deletePropertyApi, getAddedPropertiesApi, renewListingApi, getPackagesApi, getPaymentSettingsApi, activateListingApi } from '@/api/apiRoutes';
import PremiumIcon from "@/assets/premium.svg";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import ReusableTable from "@/components/ui/reusable-table";
import { Switch } from "@/components/ui/switch";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";
import { PackageTypes } from '@/utils/checkPackages/packageTypes';
import { checkPackageAvailable } from '@/utils/checkPackages/checkPackage';
import { formatPriceAbbreviated, formatExpiryDateLabel, handlePackageCheck, isRTL, RejectionTooltip, renderStatusBadge, truncate } from "@/utils/helperFunction";
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AiOutlineEdit } from "react-icons/ai";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaCheck, FaCrown, FaRegEye } from "react-icons/fa";
import { MdAutorenew, MdDeleteOutline, MdOutlineSell, MdRemoveRedEye } from "react-icons/md";
import { useSelector, useDispatch } from 'react-redux';

import Swal from 'sweetalert2';
import CustomLink from '../context/CustomLink';
import PayAsYouGoModal from '@/components/modal/PayAsYouGoModal';
import PaymentSelectionModalWrapper from '@/components/modal/PaymentSelectionModalWrapper';
import { useTranslation } from '../context/TranslationContext';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '../ui/navigation-menu';
import ChangeStatusModal from './ChangeStatusModal';
import CustomPagination from '@/components/ui/custom-pagination';
import { Skeleton } from "@/components/ui/skeleton";
import { exclamationIcon } from '@/assets/svg';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import ImageWithPlaceholder from '../image-with-placeholder/ImageWithPlaceholder';

// Add TableLoadingSkeleton component
const TableLoadingSkeleton = ({ itemLength }) => (
    <div className="w-full">
        {/* Table Header Skeleton */}
        <div className="bg-gray-50 border-y">
            <div className="grid grid-cols-8 px-6 py-4">
                {['w-32', 'w-24', 'w-24', 'w-24', 'w-24', 'w-24', 'w-24', 'w-16'].map((width, i) => (
                    <Skeleton key={i} className={`h-4 ${width}`} />
                ))}
            </div>
        </div>

        {/* Table Rows Skeleton */}
        {[...Array(Number(itemLength))].map((_, rowIndex) => (
            <div key={rowIndex} className="border-b px-6 py-4">
                <div className="grid grid-cols-8 gap-4 items-center">
                    {/* Property Title and Image */}
                    <div className="flex items-center space-x-3">
                        {/* <div className="relative p-3">
                            <Skeleton className="h-16 w-16 rounded-md" />
                        </div> */}
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-3 w-12" />
                        </div>
                    </div>

                    {/* Other columns */}
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-16 rounded-full" />
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

const AgentProperties = () => {
    const t = useTranslation();
    const router = useRouter();
    const dispatch = useDispatch();
    const { lang } = router?.query;
    const isRtl = isRTL();
    // Get data from redux state
    const userData = useSelector(state => state.User?.data);
    const language = useSelector((state) => state.LanguageSettings?.active_language);
    const webSettings = useSelector(state => state.WebSetting?.data);
    const userVerificationStatus = webSettings?.verification_status; // possible values: "initial", "pending", "success", "failed"¨ˆ

    const [isLoading, setIsLoading] = useState(false);
    // State for status change modal
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState(null);

    // Renew listing state
    const [showPayAsYouGoModal, setShowPayAsYouGoModal] = useState(false);
    const [payAsYouGoData, setPayAsYouGoData] = useState(null);
    const [paymentSettingsData, setPaymentSettingsData] = useState([]);
    const [showPaymentSelection, setShowPaymentSelection] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [pendingPayAsYouGoAction, setPendingPayAsYouGoAction] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [propertyTypeFilter, setPropertyTypeFilter] = useState('');

    const [getFeaturedListing, setFeaturedListing] = useState([]);
    const [offset, setOffset] = useState(0);
    const [total, setTotal] = useState(0);
    const [view, setView] = useState(0);
    const limit = 8;

    const [isPageLoading, setIsPageLoading] = useState(false);
    const itemsPerPage = 8; // Match with limit variable

    // Handle featuring a property
    const handleFeatureClick = (e, propertyId) => {
        e.preventDefault();
        // Implementation for featuring a property would go here
        if (webSettings.demo_mode === true && userData?.is_demo_user) {
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
        handlePackageCheck(e, PackageTypes.PROPERTY_FEATURE, router, propertyId, null, null, null, t);
    };

    const placeholderImage = () => {
        console.error('Image error handled');
    };

    // Handle opening the status change modal
    const handleOpenStatusModal = (property) => {
        setSelectedProperty(property);
        setStatusModalOpen(true);
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

    const fetchProperties = async () => {
        try {
            if (!isPageLoading) {
                setIsLoading(true);
            }
            const res = await getAddedPropertiesApi({
                limit: limit.toString(),
                offset: offset.toString(),
                request_status: statusFilter === '' ? ' ' : statusFilter,
                property_type: propertyTypeFilter === '' ? ' ' : propertyTypeFilter,
                added_as: "agent",
            });
            if (!res?.error) {
                setFeaturedListing(res?.data);
                setTotal(res?.total);
                setView(res?.total_views);
            }
        } catch (error) {
            console.error("Error in fetching properties", error);
        } finally {
            setIsLoading(false);
            setIsPageLoading(false);
        }
    };

    useEffect(() => {
        fetchProperties();
    }, [offset, language, statusFilter, propertyTypeFilter]);

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

    const handleRenewListing = async (propertyId) => {
        try {
            const isAvailable = await checkPackageAvailable(PackageTypes.PROPERTY_LIST);
            if (isAvailable) {
                const res = await renewListingApi({ id: propertyId, type: "property" });
                if (!res?.error) {
                    toast.success(t(res?.message) || t("renewed"));
                    fetchProperties();
                } else {
                    toast.error(t(res?.message) || t("somethingWentWrong"));
                }
                return;
            }

            // Package not available — fetch PAYG data and show modal
            await openPayAsYouGoFlow({ actionType: "renew", propertyId });
        } catch (error) {
            console.error("Error checking package for renew:", error);
            toast.error(t("somethingWentWrong"));
        }
    };

    const handlePayAsYouGoPaymentSuccess = async () => {
        const pendingAction = pendingPayAsYouGoAction;
        if (!pendingAction?.propertyId || !pendingAction?.actionType) return;

        try {
            if (pendingAction.actionType === "renew") {
                const res = await renewListingApi({ id: pendingAction.propertyId, type: "property" });
                if (!res?.error) {
                    toast.success(t(res?.message) || t("renewed"));
                    fetchProperties();
                } else {
                    toast.error(t(res?.message) || t("somethingWentWrong"));
                }
                return;
            }

            if (pendingAction.actionType === "approve") {
                const res = await activateListingApi({
                    id: pendingAction.propertyId,
                    listing_type: "property",
                });
                if (!res?.error) {
                    toast.success(t("propertySubmittedForApproval"));
                    fetchProperties();
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

    // Handle Property Active/Deactive Status toggle
    const handleStatusToggle = async (propertyId, currentStatus) => {
        if (webSettings.demo_mode === true && userData?.is_demo_user) {
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

        try {
            setIsLoading(true);
            const newStatus = currentStatus === 1 ? 0 : 1;
            const res = await changePropertyStatusApi({
                property_id: propertyId,
                status: newStatus,
            });
            if (!res?.error) {
                toast.success(t("statusUpdatedSuccessfully"));
                fetchProperties(); // Refresh properties after status change
            } else {
                toast.error(res?.message || t("failedToUpdateStatus"));
            }
        } catch (error) {
            setIsLoading(false);
            toast.error(t("failedToUpdateStatus"));
        }
    };

    // Handle deleting a property
    const handleDeleteProperty = async (propertyId) => {
        if (webSettings.demo_mode === true && userData?.is_demo_user) {
            Swal.fire({
                title: t("oops"),
                text: t("notAllowdDemo"),
                icon: "warning",
                showCancelButton: false,
                customClass: {
                    confirmButton: "Swal-confirm-buttons",
                    cancelButton: "Swal-cancel-buttons",
                },
                confirmButtonText: t("ok"),
            });
            return false;
        }

        Swal.fire({
            icon: "warning",
            title: t("areYouSure"),
            text: t("youWantToDeleteProperty"),
            customClass: {
                confirmButton: "Swal-confirm-buttons",
            },
        }).then((result) => {
            if (result.isConfirmed) {
                handleDeletePropertyConfirm(propertyId);
            }
        });
    };

    const handleDeletePropertyConfirm = async (propertyId) => {
        try {
            setIsLoading(true);
            const res = await deletePropertyApi({ id: propertyId });
            if (!res?.error) {
                toast.success(t(res?.message));
                fetchProperties(); // Refresh properties after deletion
            } else {
                toast.error(t(res?.message) || t("failedToDeleteProperty"));
            }
        } catch (error) {
            console.error("Error in deleting property", error);
            toast.error(t(error?.message) || t("failedToDeleteProperty"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditProperty = (propertySlug) => {
        router.push(`/agent/edit-property/${propertySlug}?lang=${lang}`);
    };


    const handleSubmitListingForApproval = async (elem) => {
        try {
            const response = await activateListingApi({
                id: elem.id,
                listing_type: "property",
            });
            if (!response?.error) {
                toast.success(t("propertySubmittedForApproval"));
                fetchProperties();
            } else if (isPayAsYouGoPackageError(response?.message)) {
                await openPayAsYouGoFlow({ actionType: "approve", propertyId: elem.id });
            } else {
                toast.error(t(response?.message));
            }
        } catch (error) {
            const errorMessage = error?.response?.data?.message || error?.message || "";
            if (isPayAsYouGoPackageError(errorMessage)) {
                await openPayAsYouGoFlow({ actionType: "approve", propertyId: elem.id });
                return;
            }
            console.error(error);
            toast.error(t("somethingWentWrong"));
        }
    }


    // Define table columns configuration
    const tableColumns = [
        {
            header: t("property"),
            accessor: "title",
            align: isRtl ? "right" : "left",
            renderCell: (elem) => (
                <div className="flex items-center space-x-3">
                    <div className="relative p-3">
                        <div className="h-16 w-16 rounded-md overflow-hidden bg-gray-100">
                            <ImageWithPlaceholder
                                src={elem.title_image}
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
                                        <p>{t("premiumProperty")}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                    <div className='w-full'>
                        <div className="font-medium rtl:text-start">{truncate(elem.translated_title || elem.title, 25)}</div>
                        <div className="text-sm text-gray-500">
                            {elem?.promoted ?
                                <span className="primaryColor font-bold flex items-center">
                                    {t("featured")}
                                </span> : null}
                            <div className="flex flex-col md:flex-row justify-between gap-2">
                                <span className='rtl:text-start'>{elem.city}, {elem.state}, {elem.country}</span>
                                <div className='flex items-center gap-1'>
                                    {elem.total_click > 0 && (
                                        <>
                                            <FaRegEye className="" size={12} /> {elem.total_click}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
        {
            header: t("propertyType"),
            accessor: "category.category",
            align: "center",
            renderCell: (elem) => (
                <span className="capitalize px-3 py-1.5 rounded-lg text-sm">
                    {elem.category?.translated_name || elem.category?.category}
                </span>
            ),
        },
        {
            header: t("rentSale"),
            accessor: "property_type",
            align: "center",
            renderCell: (elem) => (
                <span className={`capitalize px-3 py-1.5 rounded-lg text-sm ${elem.property_type === 'sell' ? 'primarySellText primarySellBg' : 'primaryRentText primaryRentBg'}`}>
                    {t(elem.property_type)}
                </span>
            ),
        },
        {
            header: t("interestedUsers"),
            accessor: "interested_users",
            align: "center",
            renderCell: (elem) => (
                <CustomLink href={`/agent/interested/${elem.slug_id}`}>
                    {elem.interested_users && elem.interested_users.length > 0 ? (
                        <div className="flex justify-center overflow-hidden">
                            {elem.interested_users.slice(0, 3).map((user, index) => (
                                <Avatar key={user?.id} className="border-2 border-white w-8 h-8">
                                    <AvatarImage src={user?.profile || ""} alt={user?.name || `User ${user?.id + 1}`} />
                                    <AvatarFallback>{user?.name ? user?.name?.charAt(0) : "U"}</AvatarFallback>
                                </Avatar>
                            ))}
                            {elem.interested_users.length > 3 && (
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 border-2 border-white text-xs">
                                    +{elem.interested_users.length - 3}
                                </div>
                            )}
                        </div>
                    ) : (
                        <span className="text-xs">-</span>
                    )}
                </CustomLink>
            ),
        },
        {
            header: t("adminStatus"),
            accessor: "request_status",
            align: "center",
            renderCell: (elem) => (
                <div className="flex justify-center items-center gap-2">
                    {renderStatusBadge(elem.request_status, t)}
                    {elem.request_status === 'rejected' && <RejectionTooltip reason={elem?.reject_reason?.reason} t={t} />}
                    {elem?.edit_reason && <EditReasonTooltip reason={elem.edit_reason} />}
                </div>
            ),
        },
        {
            header: t("propertyStatus"),
            accessor: "status",
            align: "center",
            renderCell: (elem) => (
                <div className="flex justify-center items-center gap-1">
                    <Switch
                        checked={elem.status === 1 && elem?.request_status !== "pending"}
                        onCheckedChange={() => handleStatusToggle(elem.id, elem.status)}
                        disabled={elem?.request_status === "draft" || elem?.request_status === "pending" || elem?.request_status === "rejected" || elem?.is_expired === 1}
                        className={`${elem.status === 1 && elem?.request_status !== "pending" ? "!primaryBg" : "!bg-[#28252566]"} rounded-[100px] h-4 w-8 transition-colors duration-300 sm:h-5 sm:w-10 [&>span]:h-2.5 [&>span]:w-2.5 ${isRtl ? "data-[state=checked]:[&>span]:-translate-x-4" : "data-[state=checked]:[&>span]:translate-x-4"} sm:[&>span]:h-3 sm:[&>span]:w-3 ${isRtl ? "sm:data-[state=checked]:[&>span]:-translate-x-5" : "sm:data-[state=checked]:[&>span]:translate-x-5"}`}
                    />
                    <span className={`ml-2 text-sm ${elem.status === 1 && elem?.request_status !== "pending" ? "primaryColor" : "secondryTextColor"} capitalize`}>
                        {elem.status === 1 && elem?.request_status !== "pending" ? t("active") : t("deactive")}
                    </span>
                </div>
            ),
        },
        {
            header: t("price"),
            accessor: "price",
            align: "center",
            renderCell: (elem) => (
                <div className="flex items-center font-medium">
                    <span className="text-sm">
                        {formatPriceAbbreviated(elem.price)}
                    </span>
                    <span className="text-sm leading-none truncate font-normal">{elem?.property_type === "rent" && elem?.rentduration ? "/ " + t(elem?.rentduration?.toLowerCase()) : ""}</span>
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
            renderCell: (elem, rowIndex, data) => {
                const isLastRow = rowIndex === getFeaturedListing.length - 1;
                const isFirstRow = rowIndex === 0;
                const totalRows = getFeaturedListing.length;
                return (
                    <div className="flex justify-center items-center gap-2">
                        <Button size="sm" variant="outline" className="bg-transparent h-8 w-8 p-0" onClick={() => router.push(`/agent/my-property/${elem.slug_id}?lang=${lang}`)}>
                            <MdRemoveRedEye className="h-4 w-4" />
                        </Button>
                        {elem?.request_status === "draft" ? (
                            <Button size="sm" variant="ghost" className="primaryBg primaryText hover:primaryBg hover:primaryColor h-8 w-8 p-0" onClick={() => handleSubmitListingForApproval(elem)}>
                                <FaCheck className="text-white h-4 w-4" />
                            </Button>
                        ) : null}
                        <NavigationMenu className={`
                        ${isRtl ? "[&_div:nth-child(2)]:!left-5 [&_div:nth-child(2)]:!right-auto" : "[&_div:nth-child(2)]:!right-5 [&_div:nth-child(2)]:!left-auto"}
                        [&_div:nth-child(2)>div]:!z-[9999]
                        [&_div:nth-child(2)>div]:!bg-white
                        [&_div:nth-child(2)>div]:!shadow-lg
                        [&_div:nth-child(2)>div]:!border
                        [&_div:nth-child(2)>div]:!rounded-lg
                        ${totalRows === 1 ? "[&_div:nth-child(2)]:!-bottom-[30px] [&_div:nth-child(2)]:!top-auto" : ""}
                        ${isLastRow && totalRows > 1 ? "[&_div:nth-child(2)]:!bottom-[40px] [&_div:nth-child(2)]:!top-auto" : ""}
                        ${isFirstRow && totalRows > 1 ? "[&_div:nth-child(2)]:!top-0 [&_div:nth-child(2)]:!bottom-auto" : ""}
                    `}>
                            <NavigationMenuList>
                                <NavigationMenuItem>
                                    <NavigationMenuTrigger
                                        className="primaryRentBg 
                                        primaryRentText 
                                        [&_svg.lucide]:hidden 
                                        hover:primaryRentBg 
                                        data-[state=open]:!primaryRentBg 
                                        data-[state=open]:!primaryRentText 
                                        hover:primaryRentText 
                                        data-[state=active]:!primaryRentBg 
                                        data-[state=active]:!primaryRentText 
                                        p-3 
                                        focus:primaryRentBg focus:primaryRentText ">
                                        <BsThreeDotsVertical className="h-4 w-4" />
                                    </NavigationMenuTrigger>
                                    <NavigationMenuContent className="grid !w-[150px] gap-1 relative z-[9999] !max-w-[150px] !min-w-[150px]">
                                        {elem.is_expired === 1 ? (
                                            <NavigationMenuLink
                                                className='rtl:text-start px-3 py-2 flex justify-start items-center gap-2 bg-white hover:primaryBgLight hover:primaryColor hover:cursor-pointer'
                                                onClick={() => handleRenewListing(elem?.id)}
                                            >
                                                <MdAutorenew />{t("renewListing")}
                                            </NavigationMenuLink>
                                        ) : (
                                            <>
                                                {elem.request_status !== "pending" && elem?.property_type !== "rented" && elem?.property_type !== "sold" &&
                                                    <NavigationMenuLink className='rtl:text-start px-3 py-2 flex justify-start items-center gap-2 bg-white hover:primaryBgLight hover:primaryColor hover:cursor-pointer' onClick={() => handleEditProperty(elem?.slug_id)}>
                                                        <AiOutlineEdit />{t("edit")}
                                                    </NavigationMenuLink>
                                                }
                                                {elem.request_status !== "pending" &&
                                                    elem?.is_feature_available ? (
                                                    <NavigationMenuLink
                                                        key="feature"
                                                        onClick={(e) =>
                                                            handleFeatureClick(e, elem?.id)
                                                        }
                                                        className='rtl:text-start px-3 py-2 flex justify-start items-center gap-2 bg-white hover:primaryBgLight hover:primaryColor hover:cursor-pointer'
                                                    >
                                                        <FaCrown />
                                                        {t("featured")}
                                                    </NavigationMenuLink>
                                                ) : null}
                                                {elem.request_status !== "pending" &&
                                                    elem.status === 1 &&
                                                    elem.property_type !== "sold" ? (
                                                    <NavigationMenuLink
                                                        className='rtl:text-start px-3 py-2 flex justify-start items-center gap-2 bg-white hover:primaryBgLight hover:primaryColor hover:cursor-pointer'
                                                        onClick={() => handleOpenStatusModal(elem)}
                                                    >
                                                        <MdOutlineSell />{t("changeStatus")}
                                                    </NavigationMenuLink>
                                                ) : null}
                                                <NavigationMenuLink className='rtl:text-start px-3 py-2 flex justify-start items-center gap-2 bg-white hover:primaryBgLight hover:primaryColor hover:cursor-pointer'
                                                    onClick={() => handleDeleteProperty(elem?.id)}
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

    // Add handlePageChange function
    const handlePageChange = (page) => {
        setIsPageLoading(true);
        setOffset((page - 1) * limit);
    };

    return (
        <div className="space-y-4 p-2 md:p-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold">{t("myProperties")}</h1>
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
                    <Select value={propertyTypeFilter} onValueChange={(value) => {
                        setPropertyTypeFilter(value);
                        setOffset(0); // Reset to first page when filter changes
                    }}>
                        <SelectTrigger className="w-full xs:w-[180px] brandColor bg-white newBorder focus:ring-0">
                            <SelectValue placeholder={t("propertyType")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value=" ">{t("all")}</SelectItem>
                            <SelectItem value="0">{t("sell")}</SelectItem>
                            <SelectItem value="1">{t("rent")}</SelectItem>
                            <SelectItem value="2">{t("sold")}</SelectItem>
                            <SelectItem value="3">{t("rented")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Property Listing Table */}
            <div className="col-span-12 my-4">
                <div className="bg-white rounded-xl overflow-hidden">
                    {(isLoading || isPageLoading) ? (
                        <TableLoadingSkeleton itemLength={itemsPerPage} />
                    ) : (
                        <ReusableTable
                            parentclassname="rounded-tl-xl rounded-tr-xl overflow-x-auto [&>div]:overflow-x-auto"
                            columns={tableColumns}
                            data={getFeaturedListing}
                            loading={false}
                            emptyMessage={t("noDataAvailable")}
                        />
                    )}

                    {/* Add Pagination */}
                    {!isLoading && !isPageLoading && (total > itemsPerPage) && <div className={`transition-opacity duration-200 overflow-hidden ${isPageLoading ? 'opacity-50' : 'opacity-100'}`}>
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
            </div>

            {/* Change Status Modal */}
            {selectedProperty && (
                <ChangeStatusModal
                    open={statusModalOpen}
                    onOpenChange={setStatusModalOpen}
                    propertyId={selectedProperty.id}
                    propertyType={selectedProperty.property_type}
                    onStatusChanged={fetchProperties}
                />
            )}

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
                onPaymentSuccess={handlePayAsYouGoPaymentSuccess}
                onPaymentFailed={clearPayAsYouGoFlow}
            />
        </div>
    );
};

export default AgentProperties;