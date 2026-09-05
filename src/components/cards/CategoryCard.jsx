import { useTranslation } from '../context/TranslationContext';
import { MdArrowForward } from 'react-icons/md';
import { ReactSVG } from 'react-svg';
import { useSelector, useDispatch } from 'react-redux';
import { setLockedFilter } from '@/redux/slices/propertyListSlice';
import { getCategoryLink, isRTL } from '@/utils/helperFunction';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ImageWithPlaceholder from '@/components/image-with-placeholder/ImageWithPlaceholder';

const CategoryCard = ({ category, passLocationFilter }) => {
    const t = useTranslation();
    const router = useRouter()
    const dispatch = useDispatch();
    const { lang } = router?.query;
    const webSettings = useSelector(state => state.WebSetting?.data)
    const isRtl = isRTL();
    const categoryImage = category?.image || '';
    const isSvgImage = /\.svg(?:\?|#|$)/i.test(categoryImage);

    const handleClick = () => {
        dispatch(setLockedFilter("category"));
    };

    return (
        <Link
            href={passLocationFilter ? getCategoryLink(category, lang) : `/properties/category/${category?.slug_id}?lang=${lang}`}
            onClick={handleClick}
            className='bg-white relative rounded-2xl p-4 border flex flex-col lg:flex-row justify-center md:justify-normal items-center gap-6 group transition-colors duration-300 ease-in-out overflow-hidden hover:cursor-pointer hover:cardHoverShadow hover:bg-white hover:border-primaryColor'
        >
            <div className='bg-[#F5F5F4] group-hover:primaryBg rounded-[8px] p-3 flex items-center justify-center transition-colors duration-500 ease-in-out'>
                {isSvgImage ? (
                    <ReactSVG
                        src={categoryImage}
                        beforeInjection={(svg) => {
                            svg.querySelectorAll("path,text,tspan,circle").forEach((path) => {
                                path.setAttribute("style", `fill: ${webSettings?.system_color}`);
                                path.classList.add("transition-all", "duration-500", "ease-in-out", "group-hover:!fill-white");
                            });
                            svg.setAttribute("style", "height: 48px; width: 48px;");
                        }}
                        className="flex w-12 h-12 items-center justify-center object-contain"
                        alt={category?.translated_name || category?.category}
                    />
                ) : (
                    <ImageWithPlaceholder
                        src={categoryImage}
                        alt={category?.translated_name || category?.category}
                        width={48}
                        height={48}
                        className="w-12 h-12 object-contain"
                    />
                )}
            </div>
            <div className='flex flex-col items-center lg:items-start gap-3'>
                <span className='text-base md:text-xl font-bold line-clamp-1 transition-colors duration-300 ease-in-out group-hover:text-primary'>{category?.translated_name || category?.category}</span>
                <span className='text-sm md:text-base sm:text-center md:text-start w-full font-normal leadColor transition-all duration-500 ease-in-out group-hover:opacity-0'>{category?.properties_count || category?.property_count || 0} {t("properties")}</span>
            </div>
            <div
                className={`absolute bottom-0 left-1/2 -translate-x-1/2  translate-y-full group-hover:-translate-y-3 bg-white primaryColor p-2 flex items-center gap-1 justify-center transition-all duration-500 ease-in-out ${isRtl ? "lg:left-[calc(100%-182px)]" : "lg:left-[182px]"}`}
            >
                <span className='text-sm text-nowrap md:text-base'>{t("view")} {t("properties")}</span>
                <MdArrowForward className={`primaryColor ${isRtl ? "rotate-180" : ""}`} />
            </div>
        </Link>
    )
}

export default CategoryCard
