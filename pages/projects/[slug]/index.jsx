import MetaData from "@/components/meta/MetaData";
import ViewAllProjectListingPage from "@/components/pagescomponents/ViewAllProjectListingPage";
import React from "react";
import axios from "axios";
import { GET_SEO_SETTINGS } from "@/api/apiEndpoints";

const fetchDataFromSeo = async (page) => {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}${GET_SEO_SETTINGS}?page=${page}`
    );

    const SEOData = response.data;

    return SEOData;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
};

const index = ({ slug, seoData, pageName }) => {
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
      <ViewAllProjectListingPage />
    </div>
  );
};

let serverSidePropsFunction = null;
if (process.env.NEXT_PUBLIC_SEO === "true") {
  serverSidePropsFunction = async ({ params, query }) => {
    let { slug } = params;
    const pageName = `/projects/${slug}/?lang=${query?.lang || 'en'}&filters=${query?.filters || ''}`;
    const seoData = await fetchDataFromSeo(slug);
    return {
      props: {
        seoData,
        slug,
        pageName,
      },
    };
  };
}

export const getServerSideProps = serverSidePropsFunction;
export default index;