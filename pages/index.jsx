import axios from "axios";
import MetaData from "@/components/meta/MetaData";
import HomePage from "@/components/pagescomponents/HomePage";
import { GET_HOMEPAGE_OTHER_SECTIONS, GET_HOMEPAGE_SECTIONS, GET_SEO_SETTINGS } from "@/api/apiEndpoints";
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


const fetchHomepageHero = async (languageCode) => {
  const apiBase = `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}`;
  const headers = {
    "Content-Language": languageCode,
    "X-Active-Role": "user",
  };

  try {
    // Both responses are already cacheable on the backend. Fetching them here
    // places the slider URL and homepage switches directly in the first HTML.
    const [sectionsResponse, heroResponse] = await Promise.all([
      axios.get(`${apiBase}${GET_HOMEPAGE_SECTIONS}`, {
        headers,
        params: { platform: "web" },
      }),
      axios.get(`${apiBase}${GET_HOMEPAGE_OTHER_SECTIONS}`, {
        headers,
        params: { platform: "web", lightweight: 1 },
      }),
    ]);

    return {
      sections: sectionsResponse?.data?.data ?? sectionsResponse?.data ?? null,
      otherSections: heroResponse?.data?.data ?? heroResponse?.data ?? null,
    };
  } catch (error) {
    console.error("Error preloading homepage hero:", error);
    return { sections: null, otherSections: null };
  }
};

/**
 * Root page that handles language redirection based on SEO settings
 */
export default function Home({ seoData, pageName, initialHomepageSections, initialHomepageOtherSections, initialLanguage }) {
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
      <HomePage
        initialHomepageSections={initialHomepageSections}
        initialHomepageOtherSections={initialHomepageOtherSections}
        initialLanguage={initialLanguage}
      />
    </>
  );
}

let serverSidePropsFunction = null;
if (process.env.NEXT_PUBLIC_SEO === "true") {
  serverSidePropsFunction = async (context) => {
    const { query, res } = context;
    const lang = query?.lang || "en";

    setPublicPageCache(res, { maxAge: 300, staleWhileRevalidate: 3600 });

    const [seoData, homepageHero] = await Promise.all([
      fetchDataFromSeo(),
      fetchHomepageHero(lang),
    ]);

    return {
      props: {
        seoData,
        pageName: `/?lang=${lang}`,
        initialHomepageSections: homepageHero.sections,
        initialHomepageOtherSections: homepageHero.otherSections,
        initialLanguage: lang,
      },
    };
  };
}

export const getServerSideProps = serverSidePropsFunction;
