import { BiCheckShield } from "react-icons/bi";
import { FiX } from 'react-icons/fi';
import { useRouter } from 'next/router';
import { useTranslation } from '../context/TranslationContext';

const BecomeAgentHeader = () => {
    const router = useRouter();
    const t = useTranslation();

    return (
        <div className='primaryBackgroundBg'>
            <div className="w-full py-8 px-4 md:px-0 flex flex-col gap-6 container">
                <div className="flex justify-between items-start w-full gap-2">
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                        <div className="w-14 h-14 md:w-[72px] md:h-[72px] shrink-0 rounded-xl primaryBg flex items-center justify-center text-white">
                            <BiCheckShield className="w-8 h-8 md:w-10 md:h-10" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-xl md:text-2xl font-bold brandColor mb-1">{t("becomeAgent")}</h1>
                            <p className="text-sm font-medium leadColor">
                                {t("becomeAgentDescription")}<br className="hidden md:block" />
                                {t("becomeAgentDescription2")}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 md:w-12 md:h-12 shrink-0 border-2 bg-white border-gray-200 rounded-lg flex items-center justify-center leadColor hover:bg-gray-50 transition-colors"
                    >
                        <FiX className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BecomeAgentHeader;
