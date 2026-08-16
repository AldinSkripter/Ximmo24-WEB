import { GET_SEO_SETTINGS } from '@/api/apiEndpoints'
import MetaData from '@/components/meta/MetaData'
import axios from 'axios'
import dynamic from 'next/dynamic'

const BecomeAgentPage = dynamic(() => import('@/components/pagescomponents/BecomeAgentPage'), { ssr: false })

const fetchDataFromSeo = async () => {
    try {
        const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}${GET_SEO_SETTINGS}?page=become-agent`
        );

        const SEOData = response?.data;
        return SEOData;
    } catch (error) {
        console.error("Error fetching data:", error);
        throw error; // Re-throw the error to be caught by getServerSideProps
    }
}

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
            <BecomeAgentPage />
        </div>
    )
}

let serverSidePropsFunction = null;
if (process.env.NEXT_PUBLIC_SEO === "true") {
    serverSidePropsFunction = async (context) => {
        const { query } = context;
        const lang = query?.lang || 'en';
        const pageName = `/become-agent/?lang=${lang}`;
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
