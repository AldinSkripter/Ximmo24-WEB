"use client";
import { useState } from "react";
import { BiSolidCheckCircle, BiSolidXCircle } from "react-icons/bi";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { useTranslation } from "../context/TranslationContext";
import { isRTL } from "@/utils/helperFunction";
import { FaArrowRight, FaInfoCircle } from "react-icons/fa";
import CustomLink from "../context/CustomLink";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TooltipArrow } from "@radix-ui/react-tooltip";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { uploadBankReceiptFileApi } from "@/api/apiRoutes";

const SubscriptionCard = ({ data, allFeatures, subscribePayment, page = "" }) => {
  const t = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const router = useRouter();
  const { lang } = router?.query;
  const isRtl = isRTL();
  const initialFeatureCount = 7;
  const featureList = allFeatures || [];

  const currencySymbol = useSelector((state) => {
    if (!state || !state.WebSetting) {
      return "$";
    }

    return state.WebSetting.data?.currency_symbol || "$";
  });

  const planName = data?.translated_name || data?.name;
  const isPaidPlan = data?.package_type === "paid";
  const planDurationHours = Number(data?.duration) || 0;
  const isLongTermPlan = isPaidPlan && planDurationHours > 24 * 30;
  const planDurationDays = Math.ceil(planDurationHours / 24);
  const planDurationMonths = Math.max(1, Math.round(planDurationDays / 30));
  const planDurationLabel = `${planDurationDays} ${t("days")}`;
  const hasExtraFeatures = featureList.length > initialFeatureCount;
  const visibleFeatures = showAllFeatures
    ? featureList
    : featureList.slice(0, initialFeatureCount);

  const formatPlanPrice = (value) =>
    new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
    }).format(value || 0);

  const handleFileUpload = async (file, transationId) => {
    if (!file) {
      toast.error(t("pleaseSelectFile"));
      return;
    }

    if (!transationId) {
      toast.error(t("transactionInfoMissing"));
      return;
    }

    setIsUploading(true);

    try {
      const response = await uploadBankReceiptFileApi({
        file,
        payment_transaction_id: transationId,
      });

      if (response.error === false) {
        toast.success(t("receiptUploadedSuccessfully"));
        router.push(`/user/transaction-history/?lang=${lang}`);
        return;
      }

      toast.error(response.message || t("receiptUploadFailed"));
    } catch (error) {
      console.error("Error uploading receipt:", error);
      toast.error(error?.message || t("receiptUploadFailed"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleReuploadChange = (event) => {
    handleFileUpload(event.target.files?.[0], data?.payment_transaction_id);
  };

  const renderFooter = () => {
    if (data?.is_active) {
      return (
        <div className={`mt-2 lg:mt-6 rounded-lg border ${data?.is_active ? "bg-white primaryColor" : "brandBorder brandColor"} p-2 md:px-4 md:py-3 text-center text-base md:text-lg font-medium `}>
          {t("currentPlan")}
        </div>
      );
    }

    if (data?.package_status === "review") {
      return (
        <div className="mt-6 flex items-center justify-between rounded-lg border brandBorder p-3 md:px-4 md:py-3 brandColor">
          <div className="flex items-center gap-2">
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger>
                  <FaInfoCircle className="text-gray-500" size={16} />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px]">
                  {t("verficationPendingTooltip")}
                  <TooltipArrow className="fill-gray-700" />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="text-sm font-medium">{t("verificationPending")}</span>
          </div>
          <CustomLink
            href={`/${router?.asPath?.includes("/user/") ? "user/transaction-history" : "agent/transaction-history"}`}
            className="flex items-center gap-2 text-sm font-medium text-gray-700"
          >
            {t("view")}
            <FaArrowRight className={`${isRtl ? "rotate-180" : ""}`} />
          </CustomLink>
        </div>
      );
    }

    if (data?.package_status === "rejected") {
      return (
        <motion.button
          className="mt-2 lg:mt-6 w-full rounded-lg border brandBorder bg-white p-2 md:px-4 md:py-3 text-center text-base md:text-lg font-medium brandColor transition-transform"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          disabled={isUploading}
        >
          {isUploading ? (
            <span>{t("uploading")}</span>
          ) : (
            <>
              <label htmlFor="reupload-input" className="cursor-pointer">
                {t("reuploadReceipt")}
              </label>
              <input
                id="reupload-input"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.png"
                className="hidden"
                onChange={handleReuploadChange}
                aria-label={`Reupload document for ${planName} plan`}
              />
            </>
          )}
        </motion.button>
      );
    }

    return (
      <motion.button
        className="mt-2 lg:mt-6 w-full rounded-lg border brandBorder bg-white p-2 md:px-4 md:py-3 text-center text-base md:text-lg font-medium brandColor transition-transform"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        aria-label={`Subscribe ${planName} plan`}
        onClick={(event) => subscribePayment(event, data)}
      >
        {t("getStarted")}
      </motion.button>
    );
  };

  return (
    <article
      className={`flex h-full w-full flex-col rounded-2xl newBorder bg-white p-4 min-h-[32rem] sm:min-h-[34rem] md:min-h-[36rem] lg:min-h-[38rem] xl:min-h-[40rem] ${data?.is_active ? "primaryBg" : ""} `}
      aria-label={`Subscription plan: ${planName}`}
    >
      <div className="flex flex-1 flex-col gap-2 md:gap-4 lg:gap-6">
        <header className="flex flex-col gap-2 sm:gap-3 md:gap-6 lg:gap-8">
          <span className={`inline-flex w-fit items-center gap-2 md:gap-3 rounded-full ${data?.is_active ? "bg-white/[24%]" : "primaryBackgroundBg"} px-6 py-3 text-base font-bold `}>
            <span className={`line-clamp-1 opacity-100 ${data?.is_active ? "text-white" : "leadColor"}`}>{planName} {!isPaidPlan ? t("plan") : ""}</span>
          </span>

          <div className="flex flex-col items-start gap-2">
            <h3 className={`break-words text-base md:text-xl lg:text-2xl xl:text-[28px] font-bold ${data?.is_active ? "text-white" : "brandColor"}`}>
              {planDurationLabel}
            </h3>
          </div>
        </header>

        <hr className={`newBorder ${data?.is_active ? "opacity-[24%]" : ""}`} />

        <div className="flex flex-col gap-2">
          <p className={`text-base md:text-xl lg:text-2xl xl:text-[28px] font-bold ${data?.is_active ? "text-white" : "brandColor"}`}>
            {isPaidPlan
                ? `${currencySymbol}${formatPlanPrice(data?.price)}`
                : t("free")}
          </p>
          <div className={`text-base font-medium ${data?.is_active ? "text-white" : "brandColor"} opacity-[66%]`}>
            {!isPaidPlan ? (
              <p>{t("foreverFree")}</p>
            ) : (
              <div className="h-6" aria-hidden="true" />
            )}
          </div>
        </div>

        <hr className={`newBorder ${data?.is_active ? "opacity-[24%]" : ""}`} />

        <section className="flex flex-col">
          <div className="flex flex-col overflow-y-auto h-[275px] lg:h-[320px] xl:h-[360px]">
            <div className="flex flex-col gap-2 md:gap-3 lg:gap-5">
              {visibleFeatures.map((feature) => {
                let assignedFeature = null;
                if (page === "become-agent") {
                  assignedFeature = data?.package_features?.find(
                    (item) => item.feature_id === feature.id,
                  );
                } else {
                  assignedFeature = data?.features?.find(
                    (item) => item.id === feature.id,
                  );
                }
                {/* const assignedFeature = data?.features?.find(
                  (item) => item.feature_id === feature.id,
                ); */}

                return (
                  <div
                    className={`flex items-center gap-4 text-sm font-medium ${data?.is_active ? "text-white" : "leadColor"} md:text-base`}
                    key={feature.id}
                  >
                    <span className="mt-0.5 flex-shrink-0 sm:mt-0">
                      {assignedFeature ? (
                        <BiSolidCheckCircle size={24} className={`${data?.is_active ? "text-white" : "primaryColor"}`} />
                      ) : (
                        <BiSolidXCircle size={24} className="text-[#DB3D26]" />
                      )}
                    </span>
                    <span className="line-clamp-2 break-words">
                      {feature?.translated_name || feature?.name}
                      {assignedFeature ? (
                        <>
                          {": "}
                          {assignedFeature.limit_type === "limited"
                            ? assignedFeature.limit
                            : t("unlimited")}
                        </>
                      ) : null}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-4">
            {hasExtraFeatures ? (
              <button
                type="button"
                className={`inline-flex w-fit self-center text-sm font-semibold ${data?.is_active ? "text-white" : "primaryColor"}`}
                onClick={() => setShowAllFeatures((prev) => !prev)}
                aria-expanded={showAllFeatures}
              >
                {showAllFeatures ? t("showLess") : t("showMore")}
              </button>
            ) : null}

            {page === "become-agent" ? null : renderFooter()}
          </div>
        </section>
      </div>
    </article>
  );
};

export default SubscriptionCard;
