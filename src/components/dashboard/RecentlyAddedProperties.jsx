import { useEffect, useState } from 'react';
import { useTranslation } from '../context/TranslationContext';
import { getAddedPropertiesApi } from '@/api/apiRoutes';
import ReusableTable from '@/components/ui/reusable-table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPriceAbbreviated, handlePackageCheck, isRTL, RejectionTooltip, renderStatusBadge, truncate } from '@/utils/helperFunction';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { Avatar } from '../ui/avatar';
import CustomLink from '../context/CustomLink';
import { exclamationIcon } from '@/assets/svg';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { changePropertyStatusApi, deletePropertyApi } from '@/api/apiRoutes';
import PremiumIcon from "@/assets/premium.svg";
import { AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import toast from 'react-hot-toast';
import { AiOutlineEdit } from "react-icons/ai";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaCrown, FaRegEye } from "react-icons/fa";
import { MdDeleteOutline, MdOutlineSell, MdRemoveRedEye } from "react-icons/md";
import Swal from 'sweetalert2';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '../ui/navigation-menu';
import { PackageTypes } from '@/utils/checkPackages/packageTypes';
import ChangeStatusModal from '../agent/ChangeStatusModal';
import ImageWithPlaceholder from '../image-with-placeholder/ImageWithPlaceholder';

const TableLoadingSkeleton = ({ itemLength }) => (
    <div className="w-full">
        {/* Table Header Skeleton */}
        <div className="bg-gray-50 border-y">
            <div className="grid grid-cols-6 px-6 py-4">
                {['w-32', 'w-24', 'w-24', 'w-24', 'w-24', 'w-24'].map((width, i) => (
                    <Skeleton key={i} className={`h-4 ${width}`} />
                ))}
            </div>
        </div>

        {/* Table Rows Skeleton */}
        {[...Array(Number(itemLength))].map((_, rowIndex) => (
            <div key={rowIndex} className="border-b px-6 py-4">
                <div className="grid grid-cols-6 gap-4 items-center">
                    <div className="flex items-center space-x-3">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <div className="flex items-center gap-2 justify-center">
                        <Skeleton className="h-6 w-12 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                </div>
            </div>
        ))}
    </div>
);

const RecentlyAddedProperties = () => {
    const t = useTranslation();
    const router = useRouter();
    const { lang } = router?.query;
    const isRtl = isRTL();
    const language = useSelector((state) => state.LanguageSettings?.active_language);
    const webSettings = useSelector(state => state.WebSetting?.data);

    const placeholderImage = webSettings?.web_placeholder_image


    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);

    // State for status change modal
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState(null);

    const fetchRecentProperties = async () => {
        setLoading(true);
        try {
            const res = await getAddedPropertiesApi({
                limit: 5,
                offset: 0,
                added_as: "agent"
            });
            if (res?.data) {
                setProperties(res.data);
            }
        } catch (error) {
            console.error('Error fetching recent properties:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle opening the status change modal
    const handleOpenStatusModal = (property) => {
        setSelectedProperty(property);
        setStatusModalOpen(true);
    };

    useEffect(() => {
        fetchRecentProperties();
    }, [language]);

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
            // setLoading(true);
            const newStatus = currentStatus === 1 ? 0 : 1;
            const res = await changePropertyStatusApi({
                property_id: propertyId,
                status: newStatus,
            });
            if (!res?.error) {
                toast.success(t("statusUpdatedSuccessfully"));
                setProperties((prevProperties) =>
                    prevProperties.map((property) =>
                        property.id === propertyId
                            ? { ...property, status: newStatus }
                            : property
                    )
                );
                // setLoading(false);
            } else {
                toast.error(res?.message || t("failedToUpdateStatus"));
            }
        } catch (error) {
            // setLoading(false);
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
            setLoading(true);
            const res = await deletePropertyApi({ id: propertyId });
            if (!res?.error) {
                toast.success(t(res?.message));
                fetchRecentProperties(); // Refresh properties after deletion
            } else {
                toast.error(t(res?.message) || t("failedToDeleteProperty"));
            }
        } catch (error) {
            console.error("Error in deleting property", error);
            toast.error(t(error?.message) || t("failedToDeleteProperty"));
        } finally {
            setLoading(false);
        }
    };

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


    const handleEditProperty = (propertySlug) => {
        router.push(`/agent/edit-property/${propertySlug}?lang=${lang}`);
    };

    const handleRedirect = (propertySlug) => {
        router.push(`/agent/my-property/${propertySlug}?lang=${lang}`)
    };


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
                                onError={placeholderImage}
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
                <CustomLink href={`/user/interested/${elem.slug_id}`}>
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
                    {elem?.edit_reason && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="cursor-help">
                                        {exclamationIcon()}
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                    <p className="text-sm">{elem.edit_reason}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
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
                        disabled={elem.request_status === "pending" || elem.request_status === "rejected"}
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
            renderCell: (elem) => formatPriceAbbreviated(elem.price),
        },
        {
            header: t("action"),
            accessor: "id",
            align: "center",
            renderCell: (elem, rowIndex, data) => {
                const isLastRow = rowIndex === properties.length - 1;
                const isFirstRow = rowIndex === 0;
                const totalRows = properties.length;
                return (
                    <div className="flex justify-center items-center gap-2">
                        <Button size="sm" variant="outline" className="bg-transparent h-8 w-8 p-0" onClick={() => handleRedirect(elem?.slug_id)} >
                            <MdRemoveRedEye className="h-4 w-4" />
                        </Button>
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
        <div className="space-y-4">
            {loading ? (
                <TableLoadingSkeleton itemLength={5} />
            ) : (
                <>
                    <ReusableTable
                        parentclassname="!border-0 rounded-b-2xl overflow-x-auto [&>div]:overflow-x-auto p-4"
                        columns={tableColumns}
                        data={properties}
                        loading={false}
                        emptyMessage={t("noDataAvailable")}
                        headerClassName='primaryBackgroundBg [&>tr]:!border-b-0 ltr:[&_tr_th:first-child]:rounded-l-xl rtl:[&_tr_th:first-child]:rounded-r-xl ltr:[&_tr_th:last-child]:rounded-r-xl rtl:[&_tr_th:last-child]:rounded-l-xl [&>div>table>tbody>tr>td]:!border-0'
                    />
                </>
            )}
            {/* Change Status Modal */}
            {selectedProperty && (
                <ChangeStatusModal
                    open={statusModalOpen}
                    onOpenChange={setStatusModalOpen}
                    propertyId={selectedProperty.id}
                    propertyType={selectedProperty.property_type}
                    onStatusChanged={fetchRecentProperties}
                />
            )}
        </div>
    );
};

export default RecentlyAddedProperties;
