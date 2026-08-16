import { GET_SEO_SETTINGS } from '@/api/apiEndpoints';
import MetaData from '@/components/meta/MetaData';
import axios from 'axios';
import dynamic from 'next/dynamic';

const AgentDetailsPage = dynamic(
    () => import('@/components/pagescomponents/AgentDetailsPage'),
    { ssr: false }
)

const fetchDataFromSeo = async () => {
    try {
        const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}${GET_SEO_SETTINGS}?page=agent-details`
        );

        const SEOData = response.data;

        return SEOData;
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
};

const index = ({ seoData, pageName }) => {
    return (
        <div>
            <MetaData
                title={seoData?.data?.[0]?.title}
                description={seoData?.data?.[0]?.description}
                keywords={seoData?.data?.[0]?.keywords}
                ogImage={seoData?.data?.[0]?.image}
                pageName={pageName}
                structuredData={seoData?.data?.[0]?.schema_markup}
            />
            <AgentDetailsPage />
        </div>
    )
}

let serverSidePropsFunction = null;
if (process.env.NEXT_PUBLIC_SEO === "true") {
    serverSidePropsFunction = async (context) => {
        const { params, query } = context; // Extract query and request object from context
        // Accessing the slug property
        const slugValue = params?.slug;
        const lang = query?.lang || 'en'; // Get lang from query params, default to 'en'
        const pageName = `/agent-details/${slugValue}/?lang=${lang}`;

        const seoData = await fetchDataFromSeo();
        return {
            props: {
                seoData,
                pageName,
            },
        };
    };
}
export const getServerSideProps = serverSidePropsFunction;

export default index
