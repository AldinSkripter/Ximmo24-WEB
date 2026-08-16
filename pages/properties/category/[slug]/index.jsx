import PropertyList from '@/components/pagescomponents/PropertyList';
import MetaData from '@/components/meta/MetaData';
import axios from 'axios';
import { GET_CATEGORIES } from '@/api/apiEndpoints';

const fetchDataFromSeo = async (slug) => {
    try {
        const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}${GET_CATEGORIES}?slug_id=${slug}`
        );

        const SEOData = response.data;


        return SEOData;
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
};

const CategoryPropertiesPage = ({ seoData, pageName, slug }) => {

    // // Handle potential missing slug during initial render
    const categorySlugName = typeof slug === 'string' ? slug : '';
    // Ideally, fetch the actual category name based on the slug for a better title
    const formattedCategoryName = categorySlugName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Basic formatting

    const metaTitle = categorySlugName
        ? `${formattedCategoryName} Properties - ${process.env.NEXT_PUBLIC_META_TITLE || 'eBroker'}`
        : `Category Properties - ${process.env.NEXT_PUBLIC_META_TITLE || 'eBroker'}`; // Fallback title

    return (
        <div>
            <MetaData
                title={metaTitle}
                description={seoData?.data?.[0]?.description}
                keywords={seoData?.data?.[0]?.keywords}
                ogImage={seoData?.data?.[0]?.image}
                pageName={pageName}
                structuredData={seoData?.data?.[0]?.schema_markup}
            />
            {/* Pass the categorySlug prop */}
            <PropertyList isCategoryPage={true} />
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
        const pageName = `/properties/category/${slugValue}/?lang=${lang}`;
        const seoData = await fetchDataFromSeo(slugValue);

        return {
            props: {
                seoData,
                slug: slugValue,
                pageName,
            },
        };
    };
}
export const getServerSideProps = serverSidePropsFunction;
export default CategoryPropertiesPage;