import { LuArrowRight } from 'react-icons/lu';
import ImageWithPlaceholder from '../image-with-placeholder/ImageWithPlaceholder';
import { MdOutlineVerifiedUser, MdInfoOutline } from 'react-icons/md';
import { useTranslation } from '../context/TranslationContext';
import becomeAgent from "@/assets/BecomeAgent.svg";
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { setRole } from '@/redux/slices/authSlice';

const BecomeAgentHeroSection = ({ agentBenefitCards = [] }) => {
    const router = useRouter();
    const dispatch = useDispatch();
    const { lang } = router?.query;
    const t = useTranslation();
    const userData = useSelector((state) => state.User?.data)
    const isAgentFormRejected = userData?.become_agent_status === "rejected";
    const isAgentFormPending = userData?.become_agent_status === "pending";
    const isAgentApproved = userData?.become_agent_status === "approved" && userData?.is_agent === true;
    const rejectReason = userData?.become_agent_reject_reason;

    const handleSwitchToAgentProfile = () => {
        dispatch(setRole({ data: "agent" }))
        router?.push(`/agent/dashboard?lang=${lang}`);
    }


    return (
        <section className='brandBg py-8 md:py-12 lg:py-14 xl:py-[60px] px-4 md:px-0'>
            <div className='container mx-auto flex flex-col lg:grid lg:grid-cols-2 gap-[120px]'>
                <div className='flex items-center  max-w-[750px]'>
                    <div className='flex flex-col items-center md:items-start gap-10'>
                        <div className='flex gap-2 items-center border border-white/[0.16] p-4 rounded-3xl bg-white/[.14]'>
                            <MdOutlineVerifiedUser className='text-white w-6 h-6' />
                            <span className='text-white text-base font-medium'>{t("powerUpYourListings")}</span>
                        </div>
                        <div className='flex flex-col gap-4'>
                            <h2 className='text-xl sm:text-2xl md:text-3xl font-bold text-white lg:text-4xl xl:text-5xl'>
                                {!isAgentApproved ? t("becomeAnAgent") : t("switchToAgentProfileNow")}
                            </h2>
                            <p className='text-base text-white opacity-65'>
                                {!isAgentApproved ? t("becomeAnAgentDescription") : t("switchToAgentProfileNowDescription")}
                            </p>
                        </div>
                        <div className='flex items-center gap-3'>
                            {isAgentApproved ? (
                                <button type='button' className={`rounded-lg bg-white flex items-center gap-2 p-4`} onClick={handleSwitchToAgentProfile}>
                                    <span className="text-base font-medium brandColor">{t("switchToAgent")}</span>
                                    <LuArrowRight className='w-5 h-5 text-black' />
                                </button>
                            ) :
                                <button type='button' disabled={isAgentFormPending} onClick={() => router?.push(`/become-agent-form?lang=${lang}`)} className={`rounded-lg bg-white flex items-center gap-2 p-4`}>
                                    <span className="text-base font-medium brandColor">{isAgentFormRejected ? t("reapplyAgentForm") : isAgentFormPending ? t("verificationPending") : t("getStarted")}</span>
                                    {!isAgentFormPending && <LuArrowRight className='w-5 h-5 text-black' />}
                                </button>}
                            {isAgentFormRejected && rejectReason && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                type='button'
                                                className='text-white/80 hover:text-white transition-colors focus:outline-none'
                                                aria-label='View rejection reason'
                                            >
                                                <MdInfoOutline className='w-6 h-6' />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side='right' className='bg-white text-gray-800 shadow-lg rounded-xl p-4 max-w-64'>
                                            <p className='text-xs font-semibold text-red-500 mb-1'>{t("rejectionReason")}</p>
                                            <p className='text-sm leadColor'>{rejectReason}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                        <div className='grid grid-cols-1 sm:grid-cols-2 justify-center md:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6'>
                            {agentBenefitCards.map((card, index) => (
                                <div key={index} className='flex flex-col items-center gap-3 p-6 md:py-10 md:px-7 bg-white/[8%] border border-white/[0.16] rounded-3xl md:max-w-[170px] max-h-[158px] md:max-h-48 overflow-hidden'>
                                    <div className='w-12 h-12 flex items-center justify-center bg-white/[16%] rounded-full'>
                                        {card.icon}
                                    </div>
                                    <span className='text-base text-center text-white font-medium line-clamp-2 break-words'>{card.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className='aspect-[750/800]'>
                    <ImageWithPlaceholder
                        src={becomeAgent}
                        width={750}
                        height={800}
                        alt='becomeAnAgentImage'
                        className='aspect-[750/800] rounded-3xl'
                    />
                </div>
            </div>
        </section >
    )
}

export default BecomeAgentHeroSection;