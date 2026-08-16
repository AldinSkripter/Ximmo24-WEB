"use client";
import { useTranslation } from "../context/TranslationContext";
import { useSelector } from "react-redux";
import RichTextContent from "../reusable-components/RichTextContent";
import NewBreadcrumb from "../breadcrumb/NewBreadCrumb";
import NoDataFound from "../no-data-found/NoDataFound";
import { getTermsAndConditionsApi } from "@/api/apiRoutes";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "../ui/skeleton";

const TermsAndConditions = () => {
  const t = useTranslation();
  const langCode = useSelector((state) => state.LanguageSettings?.active_language);

  const termsAndConditionsQuery = useQuery({
    queryKey: ["termsAndConditions", langCode],
    queryFn: async () => {
      const response = await getTermsAndConditionsApi();
      return response.data.data;
    },
    enabled: !!langCode,
  })
  return (
    <div>
      <NewBreadcrumb title={t("termsAndConditions")} items={[{ href: "/terms-and-conditions", label: t("termsAndConditions") }]} />
      <section id="terms-and-conditions" className="my-12">
        <div className="container px-2">
          {termsAndConditionsQuery?.isLoading ? (
            <Skeleton className="h-screen" />
          ) : termsAndConditionsQuery.data ?
            (<div className="primaryBackgroundBg rounded-lg p-4 shadow-md">
              <RichTextContent content={termsAndConditionsQuery.data} />
            </div>) : (
              <div className="flex flex-col items-center justify-center gap-3">
                <NoDataFound />
              </div>
            )}
        </div>
      </section>
    </div>
  );
};

export default TermsAndConditions;
