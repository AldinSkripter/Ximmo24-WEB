import { GET_SEO_SETTINGS } from "@/api/apiEndpoints";
import MetaData from "@/components/meta/MetaData";
import axios from "axios";
import dynamic from "next/dynamic";
const ContactUsPage = dynamic(
  () => import("@/components/pagescomponents/ContactUsPage"),
  { ssr: false },
);

const fetchDataFromSeo = async () => {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}${GET_SEO_SETTINGS}?page=contact-us`
    );

    const SEOData = response.data;
    return SEOData;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error; // Re-throw the error to be caught by getServerSideProps
  }
};

const index = ({ seoData, pageName = "/contact-us/" }) => {
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
      <ContactUsPage />
    </div>
  );
};

let serverSidePropsFunction = null;
if (process.env.NEXT_PUBLIC_SEO === "true") {
  serverSidePropsFunction = async (context) => {

    const { query } = context; // Extract query and request object from context
    const lang = query.lang || 'en'; // Get lang from query params, default to 'en'

    const pageName = `/contact-us/?lang=${lang}`;

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
