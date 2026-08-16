import PropertyList from '@/components/pagescomponents/PropertyList';
import MetaData from '@/components/meta/MetaData';
import axios from 'axios';
import { GET_SEO_SETTINGS } from '@/api/apiEndpoints';

const fetchDataFromSeo = async () => {
    try {
        const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}${GET_SEO_SETTINGS}?page=properties-nearby-city`
        );

        const SEOData = response.data;


        return SEOData;
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
};

const CityPropertiesPage = ({ seoData, slug, pageName = "/properties/city/" }) => {

    const slugName = `Properties in ${slug?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - ${process.env.NEXT_PUBLIC_META_TITLE}`;
    return (
        <div>
            <MetaData
                title={seoData?.data?.[0]?.title || slugName}
                description={seoData?.data?.[0]?.description}
                keywords={seoData?.data?.[0]?.keywords}
                ogImage={seoData?.data?.[0]?.image}
                pageName={pageName}
                structuredData={seoData?.data?.[0]?.schema_markup}
            />
            {/* Pass the citySlug prop */}
            <PropertyList isCityPage={true} />
        </div>
    )
}

let serverSidePropsFunction = null;
if (process.env.NEXT_PUBLIC_SEO === "true") {
    serverSidePropsFunction = async (context) => {
        const { params, query } = context; // Extract params and query from context
        // Accessing the slug property
        const slugValue = params?.slug;

        const lang = query?.lang || 'en'; // Get lang from query params, default to 'en'
        const path = `/properties/city/${slugValue}/?lang=${lang}`;

        const seoData = await fetchDataFromSeo(slugValue);

        return {
            props: {
                seoData,
                slug: slugValue,
                pageName: path
            },
        };
    };
}
export const getServerSideProps = serverSidePropsFunction;

export default CityPropertiesPage