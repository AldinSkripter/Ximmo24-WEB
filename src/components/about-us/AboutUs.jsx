"use client";
import { useTranslation } from "../context/TranslationContext";
import { useSelector } from "react-redux";
import RichTextContent from "../reusable-components/RichTextContent";
import NewBreadcrumb from "../breadcrumb/NewBreadCrumb";
import NoDataFound from "../no-data-found/NoDataFound";
import { useQuery } from "@tanstack/react-query";
import { getAboutUsApi } from "@/api/apiRoutes";
import { Skeleton } from "../ui/skeleton";

const AboutUs = () => {
  const t = useTranslation();
  const langCode = useSelector((state) => state.LanguageSettings?.active_language);

  const aboutUsQuery = useQuery({
    queryKey: ["aboutUs", langCode],
    queryFn: async () => {
      const response = await getAboutUsApi();
      return response.data.data;
    },
    enabled: !!langCode,
  })
  return (
    <div>
      <NewBreadcrumb
        title={t("aboutUs")}
        items={[{ href: "/about-us", label: t("aboutUs") }]}
      />
      <section id="about-us" className="my-12">
        <div className="container px-2">
          {aboutUsQuery.isLoading ? (
            <Skeleton className="h-screen" />
          ) : aboutUsQuery.data ? (
            <div className="primaryBackgroundBg rounded-lg p-4 shadow-md">
              <RichTextContent content={aboutUsQuery.data} />
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <NoDataFound />
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
