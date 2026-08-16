"use client";
import { deleteStoryApi, getMyStoriesApi } from '@/api/apiRoutes';
import { Button } from "@/components/ui/button";
import CustomPagination from '@/components/ui/custom-pagination';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ReusableTable from "@/components/ui/reusable-table";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FaPlay } from "react-icons/fa";
import { MdAddCircleOutline, MdDeleteOutline } from "react-icons/md";
import { useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import { getShortTimeAgo } from '@/utils/helperFunction';
import ImageWithPlaceholder from '../image-with-placeholder/ImageWithPlaceholder';
import LightBox from '../property-detail/LightBox';
import { useTranslation } from '../context/TranslationContext';
import AddStoryModal from '../stories/AddStoryModal';

const STORY_DELETE_WINDOW_MS = 24 * 60 * 60 * 1000;

const StoryPreviewModal = ({ story, onOpenChange }) => (
    <Dialog open={!!story} onOpenChange={onOpenChange}>
        <DialogContent
            className="p-0 border-none bg-black w-full h-full max-w-full sm:max-w-[420px] sm:h-auto sm:aspect-[9/16] sm:rounded-2xl overflow-hidden flex items-center justify-center"
            overlayClassName="bg-[#121212]/90 backdrop-blur-md"
        >
            {story && (
                story.media_type === "video" ? (
                    <video
                        src={story.media_url}
                        controls
                        autoPlay
                        playsInline
                        className="w-full h-full object-contain bg-black"
                    />
                ) : (
                    <ImageWithPlaceholder
                        src={story.media_url}
                        alt={story.story_id}
                        width={500}
                        height={888}
                        className="w-full h-full object-contain"
                    />
                )
            )}
        </DialogContent>
    </Dialog>
);

const TableLoadingSkeleton = ({ itemLength }) => (
    <div className="w-full">
        <div className="bg-gray-50 border-y">
            <div className="grid grid-cols-7 px-6 py-4">
                {['w-24', 'w-16', 'w-16', 'w-24', 'w-24', 'w-12', 'w-16'].map((width, i) => (
                    <Skeleton key={i} className={`h-4 ${width}`} />
                ))}
            </div>
        </div>
        {[...Array(Number(itemLength))].map((_, rowIndex) => (
            <div key={rowIndex} className="border-b px-6 py-4">
                <div className="grid grid-cols-7 gap-4 items-center">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-16 w-16 rounded-md" />
                    <Skeleton className="h-16 w-16 rounded-md" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-12 mx-auto" />
                    <div className="flex justify-center">
                        <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

const AgentStories = () => {
    const t = useTranslation();
    const userData = useSelector((state) => state.User?.data);
    const language = useSelector((state) => state.LanguageSettings?.active_language);
    const webSettings = useSelector((state) => state.WebSetting?.data);

    const [isLoading, setIsLoading] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(false);
    const [allStories, setAllStories] = useState([]);
    const [offset, setOffset] = useState(0);
    const [isAddStoryOpen, setIsAddStoryOpen] = useState(false);
    const [previewStory, setPreviewStory] = useState(null);
    const [viewerIsOpen, setViewerIsOpen] = useState(false);
    const [lightboxImage, setLightboxImage] = useState(null);
    const limit = 8;

    const fetchStories = async () => {
        try {
            if (!isPageLoading) {
                setIsLoading(true);
            }
            const res = await getMyStoriesApi();
            if (!res?.error) {
                const premium = res?.data?.premium_stories || [];
                const nonPremium = res?.data?.non_premium_stories || [];
                const merged = [...premium, ...nonPremium].sort(
                    (a, b) => new Date(b.created_at) - new Date(a.created_at)
                );
                setAllStories(merged);
            }
        } catch (error) {
            console.error("Error in fetching stories", error);
        } finally {
            setIsLoading(false);
            setIsPageLoading(false);
        }
    };

    useEffect(() => {
        fetchStories();
    }, [language]);

    const isWithinDeleteWindow = (createdAt) => {
        if (!createdAt) return false;
        const createdTime = new Date(createdAt).getTime();
        if (Number.isNaN(createdTime)) return false;
        return Date.now() - createdTime < STORY_DELETE_WINDOW_MS;
    };

    const handleDeleteStoryConfirm = async (storyId) => {
        try {
            setIsLoading(true);
            const res = await deleteStoryApi({ story_id: storyId });
            if (!res?.error) {
                toast.success(t(res?.message) || t("storyDeletedSuccess"));
                fetchStories();
            } else {
                toast.error(t(res?.message) || t("somethingWentWrong"));
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Error in deleting story", error);
            toast.error(t("somethingWentWrong"));
            setIsLoading(false);
        }
    };

    const handleDeleteStory = (storyId) => {
        if (webSettings?.demo_mode === true && userData?.is_demo_user) {
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
            return;
        }

        Swal.fire({
            icon: "warning",
            title: t("areYouSure"),
            text: t("youWantToDeleteStory"),
            showCancelButton: true,
            customClass: {
                confirmButton: "Swal-confirm-buttons",
                cancelButton: "Swal-cancel-buttons",
            },
            confirmButtonText: t("yes"),
            cancelButtonText: t("cancel"),
        }).then((result) => {
            if (result.isConfirmed) {
                handleDeleteStoryConfirm(storyId);
            }
        });
    };

    const tableColumns = [
        {
            header: t("storyId"),
            accessor: "story_id",
            align: "left",
            renderCell: (elem) => (
                <span className="text-sm font-medium">{elem.story_id}</span>
            ),
        },
        {
            header: t("storyThumbnail"),
            accessor: "thumbnail_url",
            align: "center",
            renderCell: (elem) => {
                if (!elem.thumbnail_url) {
                    return <span className="text-xs">-</span>;
                }
                return (
                    <div
                        className="relative h-16 w-16 mx-auto rounded-md overflow-hidden bg-gray-100 cursor-pointer"
                        onClick={() => {
                            setLightboxImage({
                                src: elem.thumbnail_url,
                                alt: elem.story_id,
                            });
                            setViewerIsOpen(true);
                        }}
                    >
                        <ImageWithPlaceholder
                            src={elem.thumbnail_url}
                            alt={elem.story_id}
                            width={60}
                            height={60}
                            className="h-full w-full"
                        />
                    </div>
                );
            },
        },
        {
            header: t("story"),
            accessor: "media_type",
            align: "center",
            renderCell: (elem) => {
                if (!elem.media_url) {
                    return <span className="text-xs">-</span>;
                }
                const isVideo = elem.media_type === "video";
                return (
                    <div
                        className="relative h-16 w-16 mx-auto rounded-md overflow-hidden bg-gray-100 cursor-pointer"
                        onClick={() => setPreviewStory(elem)}
                    >
                        {isVideo ? (
                            <video
                                src={elem.media_url}
                                muted
                                playsInline
                                preload="metadata"
                                className="h-full w-full object-cover pointer-events-none"
                            />
                        ) : (
                            <ImageWithPlaceholder
                                src={elem.media_url}
                                alt={elem.story_id}
                                width={60}
                                height={60}
                                className="h-full w-full"
                            />
                        )}
                        {isVideo && (
                            <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <FaPlay className="text-white h-4 w-4" />
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            header: t("postedSince"),
            accessor: "created_at",
            align: "center",
            renderCell: (elem) => {
                if (!elem.created_at) return <span className="text-xs">-</span>;
                const createdDate = new Date(elem.created_at);
                if (Number.isNaN(createdDate.getTime())) return <span className="text-xs">-</span>;
                return (
                    <span className="text-sm secondryTextColor">
                        {getShortTimeAgo(elem.created_at)}
                    </span>
                );
            },
        },
        {
            header: t("listingType"),
            accessor: "linked_entity",
            align: "center",
            renderCell: (elem) => {
                const entity = elem.linked_entity;
                if (!entity?.type) return <span className="text-xs">-</span>;
                const isProperty = entity.type === "property";
                return (
                    <span className={`inline-block primaryBg primaryTextColor text-[11px] font-semibold px-2 py-0.5 rounded-md`}>
                        {t(entity.type)}
                    </span>
                );
            },
        },
        {
            header: t("views"),
            accessor: "view_count",
            align: "center",
            renderCell: (elem) => (
                <span className="text-sm secondryTextColor">
                    {elem.view_count ?? 0}
                </span>
            ),
        },
        {
            header: t("action"),
            accessor: "story_id",
            align: "center",
            renderCell: (elem) => {
                const canDelete = isWithinDeleteWindow(elem.created_at);
                return (
                    <div className="flex justify-center items-center">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-transparent h-8 w-8 p-0"
                                            disabled={!canDelete}
                                            onClick={() => handleDeleteStory(elem.story_id)}
                                        >
                                            <MdDeleteOutline className="h-4 w-4" />
                                        </Button>
                                    </span>
                                </TooltipTrigger>
                                {!canDelete && (
                                    <TooltipContent sideOffset={8}>
                                        <p>{t("storyDeleteWindowExpired")}</p>
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                );
            },
        },
    ];

    const total = allStories.length;
    const paginatedStories = allStories.slice(offset, offset + limit);

    const handlePageChange = (page) => {
        setIsPageLoading(true);
        setOffset((page - 1) * limit);
        setIsPageLoading(false);
    };

    return (
        <div className="space-y-4 p-2 md:p-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold">{t("myStories")}</h1>
                <Button
                    type="button"
                    className="primaryBg text-white hover:brandBg flex items-center gap-2"
                    onClick={() => setIsAddStoryOpen(true)}
                >
                    <MdAddCircleOutline className="size-6" />
                    {t("addStory")}
                </Button>
            </div>

            <div className="col-span-12 my-4">
                <div className="bg-white rounded-xl overflow-hidden">
                    {(isLoading || isPageLoading) ? (
                        <TableLoadingSkeleton itemLength={limit} />
                    ) : (
                        <ReusableTable
                            parentclassname="rounded-tl-xl rounded-tr-xl overflow-x-auto [&>div]:overflow-x-auto"
                            columns={tableColumns}
                            data={paginatedStories}
                            loading={false}
                            emptyMessage={t("noDataAvailable")}
                        />
                    )}

                    {!isLoading && !isPageLoading && (total > limit) && (
                        <div className="transition-opacity duration-200 overflow-hidden">
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
                        </div>
                    )}
                </div>
            </div>

            {isAddStoryOpen && (
                <AddStoryModal
                    isOpen={isAddStoryOpen}
                    onClose={() => setIsAddStoryOpen(false)}
                    onSuccess={fetchStories}
                />
            )}

            <StoryPreviewModal
                story={previewStory}
                onOpenChange={(open) => !open && setPreviewStory(null)}
            />

            <LightBox
                photos={lightboxImage ? [lightboxImage] : []}
                viewerIsOpen={viewerIsOpen}
                currentImage={0}
                setCurrentImage={() => { }}
                onClose={() => setViewerIsOpen(false)}
            />
        </div>
    );
};

export default AgentStories;
