import { GET_SEO_SETTINGS } from "@/api/apiEndpoints";
import MetaData from "@/components/meta/MetaData";
import axios from "axios";
import dynamic from "next/dynamic";
const AboutUsPage = dynamic(
  () => import("@/components/pagescomponents/AboutUsPage"),
  { ssr: false },
);

const fetchDataFromSeo = async () => {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}${GET_SEO_SETTINGS}?page=about-us`
    );

    const SEOData = response.data;


    return SEOData;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
};
const index = ({ seoData, pageName = "/about-us/" }) => {

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
      <AboutUsPage />
    </div>
  );
};

let serverSidePropsFunction = null;
if (process.env.NEXT_PUBLIC_SEO === "true") {
  serverSidePropsFunction = async (context) => {
    const { params, query } = context; // Extract params and query from context
    const lang = query.lang || 'en'; // Get lang from query params, default to 'en'
    const pageName = `/about-us/?lang=${lang}`;
    const seoData = await fetchDataFromSeo();
    // Pass the fetched data as props to the page component
    return {
      props: {
        seoData,
        pageName,
      },
    };
  };
}

export const getServerSideProps = serverSidePropsFunction;

export default index;
