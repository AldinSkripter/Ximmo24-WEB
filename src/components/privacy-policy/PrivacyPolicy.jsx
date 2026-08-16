"use client";
import { useTranslation } from "../context/TranslationContext";
import { useSelector } from "react-redux";
import RichTextContent from "../reusable-components/RichTextContent";
import NewBreadcrumb from "../breadcrumb/NewBreadCrumb";
import NoDataFound from "../no-data-found/NoDataFound";
import { useQuery } from "@tanstack/react-query";
import { getPrivacyPolicyApi } from "@/api/apiRoutes";
import { Skeleton } from "../ui/skeleton";

const PrivacyPolicy = () => {
  const t = useTranslation();
  const langCode = useSelector((state) => state.LanguageSettings?.active_language);

  const privacyPolicyQuery = useQuery({
    queryKey: ["privacyPolicy", langCode],
    queryFn: async () => {
      const response = await getPrivacyPolicyApi();
      return response.data.data;
    },
    enabled: !!langCode,
  })
  return (
    <div>
      <NewBreadcrumb title={t("privacyPolicy")} items={[{ href: "/privacy-policy", label: t("privacyPolicy") }]} />
      <section id="privacy-policy" className="my-12">
        <div className="container px-2">
          {privacyPolicyQuery.isLoading ? (
            <Skeleton className="h-screen" />
          ) : privacyPolicyQuery.data ?
            (<div className="primaryBackgroundBg rounded-lg p-4 shadow-md">
              <RichTextContent content={privacyPolicyQuery.data} />
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

export default PrivacyPolicy;
