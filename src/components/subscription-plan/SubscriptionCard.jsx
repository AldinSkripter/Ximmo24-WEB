"use client";
import { useState } from "react";
import { BiSolidCheckCircle, BiSolidXCircle, BiCrown, BiShieldQuarter } from "react-icons/bi";
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
        <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 text-center text-sm font-extrabold primaryColor shadow-sm">
          <BiShieldQuarter size={20} /> {t("currentPlan")}
        </div>
      );
    }

    if (data?.package_status === "review") {
      return (
        <div className="mt-5 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
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
          className="mt-5 w-full rounded-2xl border-2 brandBorder bg-white px-4 py-3.5 text-center text-base font-bold brandColor shadow-sm transition-transform"
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
        className="mt-5 w-full rounded-2xl primaryBg px-4 py-3.5 text-center text-base font-extrabold text-white shadow-[0_12px_30px_rgba(15,23,42,.16)] transition-transform hover:brightness-95"
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
      className={`group relative flex h-full min-h-[38rem] w-full flex-col overflow-hidden rounded-[28px] border p-5 shadow-[0_18px_55px_rgba(15,23,42,.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(15,23,42,.14)] sm:p-6 ${data?.is_active ? "border-transparent primaryBg" : "border-slate-200/90 bg-white"}`}
      aria-label={`Subscription plan: ${planName}`}
    >
      <div className={`pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full ${data?.is_active ? "bg-white/10" : "primaryBackgroundBg opacity-70"}`} />
      <div className="relative flex flex-1 flex-col gap-5">
        <header className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3"><span className={`inline-flex w-fit items-center gap-2 rounded-full ${data?.is_active ? "bg-white/20" : "primaryBackgroundBg"} px-4 py-2 text-sm font-extrabold`}>
            <BiCrown size={18} className={data?.is_active ? "text-white" : "primaryColor"} />
            <span className={`line-clamp-1 opacity-100 ${data?.is_active ? "text-white" : "leadColor"}`}>{planName} {!isPaidPlan ? t("plan") : ""}</span>
          </span>{data?.is_active && <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-wider primaryColor">{t("currentPlan")}</span>}</div>

          <div className="flex flex-col items-start gap-2">
            <h3 className={`break-words text-sm font-semibold ${data?.is_active ? "text-white/75" : "text-slate-500"}`}>
              {planDurationLabel}
            </h3>
          </div>
        </header>

        <div className={`rounded-2xl border p-4 ${data?.is_active ? "border-white/15 bg-white/10" : "border-slate-100 bg-slate-50/80"}`}>
          <p className={`text-3xl font-black tracking-tight lg:text-4xl ${data?.is_active ? "text-white" : "text-slate-950"}`}>
            {isPaidPlan
                ? `${currencySymbol}${formatPlanPrice(data?.price)}`
                : t("free")}
          </p>
          <div className={`mt-1 text-sm font-medium ${data?.is_active ? "text-white/70" : "text-slate-500"}`}>
            {!isPaidPlan ? (
              <p>{t("foreverFree")}</p>
            ) : (
              <div className="h-6" aria-hidden="true" />
            )}
          </div>
        </div>

        <section className={`flex flex-1 flex-col rounded-2xl border p-4 ${data?.is_active ? "border-white/15 bg-slate-950/10" : "border-slate-100 bg-white"}`}>
          <div className="flex max-h-[310px] min-h-[260px] flex-col overflow-y-auto pr-1">
            <div className="flex flex-col gap-3.5">
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
                    className={`flex items-start gap-3 text-sm font-semibold ${data?.is_active ? "text-white/90" : "text-slate-700"}`}
                    key={feature.id}
                  >
                    <span className="mt-0.5 flex-shrink-0 sm:mt-0">
                      {assignedFeature ? (
                        <BiSolidCheckCircle size={21} className={`${data?.is_active ? "text-white" : "primaryColor"}`} />
                      ) : (
                        <BiSolidXCircle size={21} className={data?.is_active ? "text-white/45" : "text-slate-300"} />
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
