import { useTranslation } from '../context/TranslationContext';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { getCustomPagesApi } from '@/api/apiRoutes';
import RichTextContent from '../reusable-components/RichTextContent';
import NewBreadcrumb from '../breadcrumb/NewBreadCrumb';
import { Skeleton } from '../ui/skeleton';
import NoDataFound from '../no-data-found/NoDataFound';
import { useRouter } from 'next/router';

const MorePages = () => {
    const t = useTranslation();
    const router = useRouter();
    const langCode = router?.query?.lang;
    const pageName = router.query.slug[0];

    const morePagesQuery = useQuery({
        queryKey: [pageName, langCode],
        queryFn: async () => {
            const response = await getCustomPagesApi({ slug_id: pageName });
            return response.data?.[0];
        },
        enabled: !!langCode,
        staleTime: 10 * 60_000,
        gcTime: 0,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
    })

    return (
        <div>
            <NewBreadcrumb
                title={morePagesQuery.data?.translated_title}
                items={[{ href: `/more-pages/${pageName}`, label: morePagesQuery.data?.translated_title }]}
            />
            <section id="more-pages" className="my-12">
                <div className="container px-2">
                    {morePagesQuery.isLoading ? (
                        <Skeleton className="h-screen" />
                    ) : morePagesQuery.data ? (
                        <div className="primaryBackgroundBg rounded-lg p-4 shadow-md">
                            <RichTextContent content={morePagesQuery.data?.translated_content} />
                        </div>
                    ) : (
                        <div className="text-center text-gray-500">
                            <NoDataFound />
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

export default MorePages