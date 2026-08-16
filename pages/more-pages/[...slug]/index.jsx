import { GET_SEO_SETTINGS } from '@/api/apiEndpoints'
import MetaData from '@/components/meta/MetaData'
import MorePagesPage from '@/components/pagescomponents/MorePagesPage'
import axios from 'axios'
import React from 'react'

const fetchDataFromSeo = async (pageName) => {
    try {
        const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}${GET_SEO_SETTINGS}?page=${pageName}`
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
            <MorePagesPage />
        </div>
    )
}
let serverSidePropsFunction = null;

if (process.env.NEXT_PUBLIC_SEO === "true") {
    serverSidePropsFunction = async (context) => {
        const { query } = context;
        const lang = query?.lang || 'en';
        const pageName = `/more-pages/${query?.slug[0]}/?lang=${lang}`;
        const seoData = await fetchDataFromSeo(query?.slug[0]?.split("-").join("+"));
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