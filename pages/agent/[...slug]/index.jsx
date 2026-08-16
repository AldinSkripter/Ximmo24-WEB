import AgentDashboardPage from '@/components/pagescomponents/AgentDashboardPage';
import MetaData from '@/components/meta/MetaData';
import axios from 'axios';
import { GET_SEO_SETTINGS } from '@/api/apiEndpoints';

const fetchDataFromSeo = async () => {
    try {
        const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}${GET_SEO_SETTINGS}?page=chat`
        );

        const SEOData = response.data;
        return SEOData;
    } catch (error) {
        console.error("Error fetching data:", error);
        throw error;
    }
};

const UserSlugPage = ({ slug, seoData, pageName }) => {
    let metaTitle = '', metaDescription = '', metaKeywords = '', metaImage = '', page = '';
    if (slug?.[0] === 'chat') {
        metaTitle = seoData?.data?.[0]?.title;
        metaDescription = seoData?.data?.[0]?.description;
        metaKeywords = seoData?.data?.[0]?.keywords;
        metaImage = seoData?.data?.[0]?.image;
        page = pageName;
    } else {
        metaTitle = process.env.NEXT_PUBLIC_META_TITLE;
        metaDescription = seoData?.data?.[0]?.description;
        metaKeywords = seoData?.data?.[0]?.keywords;
        metaImage = seoData?.data?.[0]?.image;
        page = pageName;
    }

    return (
        <div>
            <MetaData
                title={metaTitle}
                description={metaDescription}
                keywords={metaKeywords}
                pageName={page}
                structuredData={seoData?.data?.[0]?.schema_markup}
            />
            <AgentDashboardPage />
        </div>
    )
}

let serverSidePropsFunction = null;
if (process.env.NEXT_PUBLIC_SEO === "true") {
    serverSidePropsFunction = async (context) => {
        const { params, query } = context;
        const lang = query?.lang || 'en'; // Get lang from query params, default to 'en'
        const pageName = `/agent/${params?.slug?.join('/')}/?lang=${lang}`;
        const slug = params?.slug;
        const seoData = await fetchDataFromSeo();
        return {
            props: {
                seoData,
                pageName,
                slug,
            },
        };
    };
}

export const getServerSideProps = serverSidePropsFunction;

export default UserSlugPage 