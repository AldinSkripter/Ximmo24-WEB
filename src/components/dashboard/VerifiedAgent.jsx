import { useTranslation } from '../context/TranslationContext';
import { useSelector } from 'react-redux';
import CustomLink from '../context/CustomLink';
import { VerifiedAgentBadge } from '@/utils/helperFunction';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { MdInfoOutline } from 'react-icons/md';

const VerifiedAgent = () => {
    const t = useTranslation();

    const userData = useSelector(state => state.User?.data);
    const webSettings = useSelector(state => state.WebSetting?.data);
    const userVerificationStatus = userData?.agent_verification_status; // Possible values: "approved", "pending", "rejected", "not_applied"
    const rejectReason = userData?.agent_verification_reject_reason;


    // Render verification content based on status
    const renderVerificationContent = () => {
        switch (userVerificationStatus) {
            case "approved":
                return (
                    <div className="p-5 h-full flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-2xl md:text-4xl font-medium mb-2">
                                {t("verifySuccessTitle")}
                            </h1>
                            <p className="text-base mb-4 opacity-80">{t("verifySuccessDesc")}</p>
                        </div>
                        <div className="flex items-center gap-2 primaryColor bg-white uppercase px-3 py-2 rounded-lg font-bold">
                            <span className="font-medium">{t("verified")}</span>
                            <VerifiedAgentBadge color={webSettings?.system_color} width={20} height={20} />
                        </div>
                    </div>
                );
            case "rejected":
                return (
                    <div className="p-5 h-full flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h1 className="text-2xl md:text-4xl font-medium mb-2 flex items-center gap-2">
                                {t("verifyFailTitle")}
                                {rejectReason && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
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
                                            </TooltipTrigger>
                                        </Tooltip>
                                    </TooltipProvider>)}
                            </h1>
                            <p className="text-base mb-4 opacity-80">{t("verifyFailDesc")}</p>
                        </div>
                        <CustomLink href="/agent/verification-form">
                            <button className="text-base  font-semibold bg-white primaryColor px-5 py-2.5 rounded-lg">
                                {t("reApply")}
                            </button>
                        </CustomLink>
                    </div>
                );
            case "pending":
                return (
                    <div className="p-5 h-full flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h1 className="text-2xl md:text-4xl font-medium mb-2">
                                {t("verifyPendingTitle")}
                            </h1>
                            <p className="text-base mb-4 opacity-80">{t("verifyPendingDesc")}</p>
                        </div>
                    </div>
                );
            case "initial":
            default:
                return (
                    <div className="p-5 h-full flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h1 className="text-2xl md:text-4xl font-medium mb-2">
                                {t("verifyIntialTitle")}
                            </h1>
                            <p className="text-base mb-4 opacity-80">{t("verifyIntialDesc")}</p>
                        </div>
                        <CustomLink href="/agent/verification-form">
                            <button className="bg-white primaryColor px-4 py-2 rounded-md font-bold">
                                {t("apply")}
                            </button>
                        </CustomLink>
                    </div>
                );
        }
    };

    return (
        <div className='grid grid-cols-1 gap-4'>
            <div className="min-h-[130px] border col-span-12 md:col-span-12 primaryBg text-white rounded-lg overflow-hidden">
                {renderVerificationContent()}
            </div>
        </div>
    );
};

export default VerifiedAgent;