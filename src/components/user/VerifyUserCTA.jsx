"use client";

import { useSelector } from "react-redux";
import { useTranslation } from "../context/TranslationContext";
import CustomLink from "../context/CustomLink";
import { VerifiedUserBadge } from "@/utils/helperFunction";
import { MdInfoOutline } from "react-icons/md";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

const VerifyUserCTA = () => {
    const t = useTranslation();
    const userData = useSelector((state) => state.User?.data);
    const webSettings = useSelector((state) => state.WebSetting?.data);
    const verificationStatus = userData?.user_verification_status;
    const rejectReason = userData?.user_verification_reject_reason;

    const status = String(verificationStatus || "initial").toLowerCase(); // Possible values: "approved", "pending", "rejected", "not_applied"

    if (status === "approved") {
        return (
            <div className="flex flex-col gap-4 rounded-2xl border newBorderColor primaryBg p-4 sm:p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-lg font-bold text-white sm:text-xl">
                            {t("verifyUserSuccessTitle")}
                        </h2>
                        <p className="text-sm leading-6 text-white sm:text-base">
                            {t("verifyUserSuccessDesc")}
                        </p>
                    </div>
                    <div className="flex w-fit items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold uppercase brandColor">
                        <span>{t("verified")}</span>
                        <VerifiedUserBadge
                            color={webSettings?.system_color}
                            width={20}
                            height={20}
                        />
                    </div>
                </div>
            </div>
        );
    }

    if (status === "pending") {
        return (
            <div className="flex flex-col gap-4 rounded-2xl border newBorderColor primaryBg p-4 text-white sm:p-5">
                <div className="flex flex-col gap-2">
                    <h2 className="text-lg font-bold sm:text-xl">
                        {t("verifyPendingTitle")}
                    </h2>
                    <p className="text-sm leading-6 opacity-90 sm:text-base">
                        {t("verifyPendingDesc")}
                    </p>
                </div>
            </div>
        );
    }

    if (status === "rejected" || status === "failed") {
        return (
            <div className="flex flex-col gap-4 rounded-2xl border newBorderColor primaryBg p-4 text-white sm:p-5">
                <div className="flex flex-col md:flex-row justify-between gap-2">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-lg font-bold sm:text-xl flex items-center gap-2">
                            {t("verifyFailTitle")}
                            {rejectReason && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                type='button'
                                                className='text-white/80 hover:text-white transition-colors focus:outline-none'
                                                aria-label='View rejection reason'
                                            >
                                                <MdInfoOutline className="size-5 text-white" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side='right' className='bg-white text-gray-800 shadow-lg rounded-xl p-4 max-w-64'>
                                            <p className='text-xs font-semibold text-red-500 mb-1'>{t("rejectionReason")}</p>
                                            <p className='text-sm leadColor'>{rejectReason}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>)}
                        </h2>
                        <p className="text-sm leading-6 opacity-90 sm:text-base">
                            {t("verifyFailDesc")}
                        </p>
                    </div>
                    <CustomLink href="/user/verification-form">
                        <button
                            type="button"
                            className="rounded-lg bg-white px-4 py-2.5 text-sm font-bold primaryColor transition-colors hover:bg-gray-50 sm:text-base"
                        >
                            {t("applyForUserVerification")}
                        </button>
                    </CustomLink>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 rounded-2xl border newBorderColor primaryBg p-4 text-white sm:p-5">
            <div className="flex flex-col md:flex-row justify-between gap-2">
                <div className="flex flex-col gap-2">
                    <h2 className="text-lg font-bold sm:text-xl">
                        {t("verifyUserInitialTitle")}
                    </h2>
                    <p className="text-sm leading-6 opacity-90 sm:text-base">
                        {t("verifyUserInitialDesc")}
                    </p>
                </div>
                <CustomLink href="/user/verification-form">
                    <button
                        type="button"
                        className="rounded-lg bg-white px-4 py-2.5 text-sm font-bold primaryColor transition-colors hover:bg-gray-50 sm:text-base"
                    >
                        {t("applyForUserVerification")}
                    </button>
                </CustomLink>
            </div>
        </div>
    );
};

export default VerifyUserCTA;