import { BiMapPin } from 'react-icons/bi'
import { useTranslation } from '../context/TranslationContext'
import { isRTL } from '@/utils/helperFunction';
import { MdArrowForward } from 'react-icons/md';
import CustomLink from '../context/CustomLink';

const CityCard = ({ property, isDetailsPage = false }) => {
    const t = useTranslation();
    const isRtl = isRTL()
    return (
        <CustomLink href={`/properties/city/${property?.City}`} className={`group transition-colors duration-300 ease-in-out overflow-hidden hover:cursor-pointer hover:cardHoverShadow hover:bg-white hover:border-primaryColor relative rounded-2xl ${isDetailsPage ? "w-full" : "w-[250px]"} h-[250px] bg-white newBorder p-4 flex flex-col bg-primary justify-between gap-3 hover:shadow-sm`}>
            <div className='w-14 h-14 rounded-full primaryBgLight12 group-hover:primaryBg flex items-center justify-center'>
                <BiMapPin className='primaryColor group-hover:text-white w-6 h-6' />
            </div>

            <div className="flex flex-col items-start gap-3">
                <span
                    className="text-base md:text-xl font-bold line-clamp-1 transition-colors duration-300 ease-in-out group-hover:text-primary"
                >
                    {property?.City}
                </span>

                {property?.Count ? (
                    <span
                        className="text-sm md:text-base text-start w-full font-normal leadColor transition-opacity duration-500 ease-in-out group-hover:opacity-0"
                    >
                        {property?.Count} {t("properties")}
                    </span>
                ) : (
                    <span className="h-6" />
                )}
            </div>

            <div
                className={`
                    absolute bottom-0 ${isRtl ? "right-2" : "left-2"} -translate-x-0 translate-y-full
                    group-hover:-translate-y-3 bg-white primaryColor p-2 flex items-center gap-1 justify-center
                    transition-all duration-500 ease-in-out
                `}
            >
                <span className="text-sm md:text-base whitespace-nowrap">
                    {t("view")} {t("properties")}
                </span>
                <MdArrowForward className={`primaryColor ${isRtl ? "rotate-180" : ""}`} />
            </div>

        </CustomLink>
    )
}

export default CityCard