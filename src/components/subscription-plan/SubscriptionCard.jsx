"use client";
import { useRef, useState } from "react";
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

const SubscriptionCard = ({ data, index = 1, allFeatures, subscribePayment, page = "" }) => {
  const t = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const cardRef = useRef(null);
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
  const visualThemes = [
    { ring: "conic-gradient(from 0deg,#09a8ec,#7357ff,#ec4899,#f59e0b,#09a8ec)", glow: "rgba(9,168,236,.18)", badge: "linear-gradient(135deg,#e8f8ff,#f4efff)" },
    { ring: "conic-gradient(from 45deg,#8b5cf6,#ec4899,#fb7185,#fbbf24,#8b5cf6)", glow: "rgba(139,92,246,.18)", badge: "linear-gradient(135deg,#f3efff,#fff0f7)" },
    { ring: "conic-gradient(from 90deg,#06b6d4,#22c55e,#eab308,#f97316,#06b6d4)", glow: "rgba(34,197,94,.16)", badge: "linear-gradient(135deg,#e9fbff,#effcf2)" },
    { ring: "conic-gradient(from 135deg,#f59e0b,#ef4444,#a855f7,#0ea5e9,#f59e0b)", glow: "rgba(245,158,11,.17)", badge: "linear-gradient(135deg,#fff8e7,#fff0f2)" },
  ];
  const visualTheme = visualThemes[(Math.max(1, index) - 1) % visualThemes.length];

  const handlePointerMove = (event) => {
    if (!cardRef.current) return;
    const bounds = cardRef.current.getBoundingClientRect();
    cardRef.current.style.setProperty("--pointer-x", `${event.clientX - bounds.left}px`);
    cardRef.current.style.setProperty("--pointer-y", `${event.clientY - bounds.top}px`);
    cardRef.current.style.setProperty("--pointer-opacity", "1");
  };

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
    <div ref={cardRef} onMouseMove={handlePointerMove} onMouseLeave={() => cardRef.current?.style.setProperty("--pointer-opacity", "0")} className="group relative isolate h-full w-full overflow-hidden rounded-[34px] p-[2px] transition duration-500 hover:-translate-y-2" style={{ background: visualTheme.ring, boxShadow: `0 22px 65px ${visualTheme.glow}`, "--pointer-opacity": 0 }}>
      <div className="pointer-events-none absolute inset-0 z-[3] rounded-[34px] opacity-[var(--pointer-opacity)] transition-opacity duration-300" style={{ background: `radial-gradient(260px circle at var(--pointer-x) var(--pointer-y), rgba(255,255,255,.7), ${visualTheme.glow} 38%, transparent 72%)`, mixBlendMode: "screen" }} aria-hidden="true" />
    <article
      className={`relative z-[1] flex h-full min-h-[38rem] w-full flex-col overflow-hidden rounded-[32px] p-5 sm:p-6 ${data?.is_active ? "bg-[linear-gradient(145deg,#050a12,#0b1728_55%,#111827)]" : "bg-[linear-gradient(150deg,#ffffff,#f8fbff_50%,#f3f0ff)]"}`}
      aria-label={`Subscription plan: ${planName}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 opacity-70" style={{ background: `radial-gradient(circle at 80% 0%, ${visualTheme.glow}, transparent 68%)` }} />
      <div className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full border border-white/30 bg-white/10 backdrop-blur-3xl transition-transform duration-700 group-hover:scale-125" />
      <div className="pointer-events-none absolute bottom-24 left-[-70px] h-44 w-44 rounded-full opacity-30 blur-3xl" style={{ background: visualTheme.ring }} />
      <div className="relative flex flex-1 flex-col gap-5">
        <header className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3"><span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-sm font-extrabold ${data?.is_active ? "bg-white/10 text-white ring-1 ring-white/15" : "bg-white/80 text-slate-800 ring-1 ring-slate-200/80"}`}>
            <span className="grid h-7 w-7 place-items-center rounded-full text-xs font-black text-slate-900" style={{ background: visualTheme.badge }}>{String(index).padStart(2, "0")}</span>
            <BiCrown size={17} className={data?.is_active ? "text-amber-300" : "primaryColor"} />
            <span className={`line-clamp-1 opacity-100 ${data?.is_active ? "text-white" : "leadColor"}`}>{planName} {!isPaidPlan ? t("plan") : ""}</span>
          </span>{data?.is_active && <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-wider primaryColor">{t("currentPlan")}</span>}</div>

          <div className="flex flex-col items-start gap-2">
            <h3 className={`break-words text-sm font-semibold ${data?.is_active ? "text-white/75" : "text-slate-500"}`}>
              {planDurationLabel}
            </h3>
          </div>
        </header>

        <div className={`relative overflow-hidden rounded-[22px] border p-5 backdrop-blur-xl ${data?.is_active ? "border-white/15 bg-white/[.07]" : "border-white bg-white/75 shadow-[0_12px_35px_rgba(15,23,42,.06)]"}`}>
          <span className="absolute bottom-0 left-0 h-1 w-full opacity-80" style={{ background: visualTheme.ring }} />
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

        <section className={`flex flex-1 flex-col rounded-[22px] border p-4 backdrop-blur-xl ${data?.is_active ? "border-white/10 bg-white/[.045]" : "border-white bg-white/80 shadow-[0_12px_35px_rgba(15,23,42,.05)]"}`}>
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
    </div>
  );
};

export default SubscriptionCard;
