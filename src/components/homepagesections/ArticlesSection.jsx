import { getFormattedDate, truncate } from '@/utils/helperFunction';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { useTranslation } from '../context/TranslationContext';
import ImageWithPlaceholder from '../image-with-placeholder/ImageWithPlaceholder';
import CustomLink from '../context/CustomLink';
import { ReactSVG } from 'react-svg';
import { FaRegEye } from 'react-icons/fa';

const ArticlesSection = ({ data }) => {
    const router = useRouter();
    const t = useTranslation();
    const webSettings = useSelector((state) => state.WebSetting?.data);
    // Early return if no data
    if (!data || data.length === 0) return null;

    // Up to 4 articles for 2x2 grid
    const articles = data.slice(0, 4);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xl:gap-6">
            {articles.map((article, idx) => (
                <CustomLink
                    href={`/article-details/${article?.slug_id}`}
                    key={article?.id || idx}
                    tabIndex={0}
                    aria-label={article?.translated_title || article?.title}
                    className="relative flex flex-col lg:flex-row gap-4 xl:gap-6 cursor-pointer bg-white"
                >
                    {/* Article Image */}
                    <div className="w-full lg:w-[175px] xl:w-[200px] 2xl:w-[280px] shrink-0">
                        <ImageWithPlaceholder
                            src={article?.image}
                            alt={article?.translated_title || article?.title}
                            className="w-full h-[240px] lg:h-[200px] rounded-2xl object-cover"
                            loading='lazy'
                        />
                    </div>
                    {/* Content */}
                    <div className="flex-1 flex flex-col justify-center gap-3 py-2 min-w-0" >
                        {/* Category Badge */}
                        {article?.category_id !== "0" &&
                            (<span className="flex items-center gap-2 primaryBackgroundBg leadColor text-sm font-bold p-2 rounded-lg truncate w-fit max-w-[150px]" aria-label={article?.category?.category}>
                                <ReactSVG
                                    src={article?.category?.image}
                                    beforeInjection={(svg) => {
                                        svg.setAttribute(
                                            "style",
                                            `height: 100%; width: 100%;`,
                                        );
                                        svg.querySelectorAll("path").forEach((path) => {
                                            path.setAttribute(
                                                "style",
                                                `fill: var(--facilities-icon-color);`,
                                            );
                                        });
                                    }}
                                    className="w-4 h-4 rounded-full object-cover shrink-0"
                                    alt={article?.category?.translated_name || article?.category?.name || 'category icon'}
                                />
                                <span className="truncate">{article?.category?.translated_name || article?.category?.category}</span>
                            </span>)}
                        {/* Title */}
                        <h3 className="text-sm md:text-base font-bold brandColor line-clamp-2 break-words px-1">
                            {article?.translated_title || article?.title}
                        </h3>
                        {/* Meta */}
                        <div className="flex items-center gap-2 mt-2 overflow-hidden">
                            {webSettings?.admin_image && (
                                <ImageWithPlaceholder
                                    src={webSettings.admin_image}
                                    alt={webSettings.admin_name}
                                    className="w-8 h-8 rounded-full object-cover cardBorder shrink-0"
                                    loading='lazy'
                                />
                            )}
                            <span className="text-sm font-medium leadColor truncate">{t("by")} {webSettings?.admin_name} - {getFormattedDate(article.created_at, t)}</span>
                            {article?.view_count > 0 && (
                                <span className="flex items-center gap-1 text-sm leadColor shrink-0 ml-auto">
                                    <FaRegEye />
                                    {article?.view_count}
                                </span>
                            )}
                        </div>
                    </div>
                </CustomLink>
            ))}
        </div>
    );
};

export default ArticlesSection;