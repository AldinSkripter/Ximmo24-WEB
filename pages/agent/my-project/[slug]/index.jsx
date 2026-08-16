import dynamic from 'next/dynamic';
import MetaData from '@/components/meta/MetaData';
import axios from 'axios';
import { GET_ADDED_PROJECTS } from '@/api/apiEndpoints';

const AgentProjectDetailsPage = dynamic(
    () => import('@/components/pagescomponents/AgentProjectDetailsPage'),
    { ssr: false }
);

const fetchDataFromSeo = async (slug) => {
    try {
        const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}${GET_ADDED_PROJECTS}?slug_id=${slug}&with_seo=1`
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
};

const AgentMyProjectPage = ({ seoData, pageName }) => {
    return (
        <div>
            <MetaData
                title={seoData?.data?.meta_title}
                description={seoData?.data?.meta_description}
                keywords={seoData?.data?.meta_keywords}
                ogImage={seoData?.data?.meta_image}
                pageName={pageName}
                structuredData={seoData?.data?.schema_markup}
            />
            <AgentProjectDetailsPage />
        </div>
    );
};

let serverSidePropsFunction;
if (process.env.NEXT_PUBLIC_SEO === 'true') {
    serverSidePropsFunction = async (context) => {
        const { params, query } = context;
        const encodedSlug = encodeURIComponent(params?.slug);
        const lang = query?.lang || 'en';
        const pageName = `/agent/my-project/${encodedSlug}/?lang=${lang}`;
        const seoData = await fetchDataFromSeo(encodedSlug);
        return {
            props: { seoData: seoData || null, pageName },
        };
    };
}

export const getServerSideProps = serverSidePropsFunction;

export default AgentMyProjectPage;
