import axios from "axios";
import MetaData from "@/components/meta/MetaData";
import HomePage from "@/components/pagescomponents/HomePage";
import { GET_SEO_SETTINGS } from "@/api/apiEndpoints";
import { setPublicPageCache } from "@/utils/publicPageCache";

const fetchDataFromSeo = async () => {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}${GET_SEO_SETTINGS}`
    );

    const SEOData = response.data;

    return SEOData;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
};

/**
 * Root page that handles language redirection based on SEO settings
 */
export default function Home({ seoData, pageName }) {
  return (
    <>
      <MetaData
        title={seoData?.data?.[0]?.title}
        description={seoData?.data?.[0]?.description}
        keywords={seoData?.data?.[0]?.keywords}
        ogImage={seoData?.data?.[0]?.image}
        pageName={pageName}
        structuredData={seoData?.data?.[0]?.schema_markup}
      />
      <HomePage />
    </>
  );
}

let serverSidePropsFunction = null;
if (process.env.NEXT_PUBLIC_SEO === "true") {
  serverSidePropsFunction = async (context) => {
    const { query, res } = context;
    const lang = query?.lang || "en";

    setPublicPageCache(res, { maxAge: 300, staleWhileRevalidate: 3600 });

    return {
      props: {
        seoData: await fetchDataFromSeo(),
        pageName: `/?lang=${lang}`,
      },
    };
  };
}

export const getServerSideProps = serverSidePropsFunction;
