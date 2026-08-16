import dynamic from 'next/dynamic';
import MetaData from '@/components/meta/MetaData';
import axios from 'axios';
import { GET_PROPETRES } from '@/api/apiEndpoints';

const AgentPropertyDetailsPage = dynamic(
    () => import('@/components/pagescomponents/AgentPropertyDetailsPage'),
    { ssr: false }
);

const fetchDataFromSeo = async (slug) => {
    try {
        const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}${GET_PROPETRES}?slug_id=${slug}&with_seo=1`
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
};

const AgentMyPropertyPage = ({ seoData, pageName }) => {
    return (
        <div>
            <MetaData
                title={seoData?.data?.[0]?.meta_title}
                description={seoData?.data?.[0]?.meta_description}
                keywords={seoData?.data?.[0]?.meta_keywords}
                ogImage={seoData?.data?.[0]?.meta_image}
                pageName={pageName}
                structuredData={seoData?.data?.[0]?.schema_markup}
            />
            <AgentPropertyDetailsPage />
        </div>
    );
};

let serverSidePropsFunction;
if (process.env.NEXT_PUBLIC_SEO === 'true') {
    serverSidePropsFunction = async (context) => {
        const { params, query } = context;
        const encodedSlug = encodeURIComponent(params?.slug);
        const lang = query?.lang || 'en';
        const pageName = `/agent/my-property/${encodedSlug}/?lang=${lang}`;
        const seoData = await fetchDataFromSeo(encodedSlug);
        return {
            props: { seoData, pageName },
        };
    };
}

export const getServerSideProps = serverSidePropsFunction;

export default AgentMyPropertyPage;
