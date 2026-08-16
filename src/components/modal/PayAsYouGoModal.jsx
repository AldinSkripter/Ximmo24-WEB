"use client";
import { useTranslation } from "@/components/context/TranslationContext";
import { useSelector } from "react-redux";
import { IoClose } from "react-icons/io5";
import { BiMoneyWithdraw } from "react-icons/bi";
import { FaRegClock } from "react-icons/fa";
import { useRouter } from "next/router";

const PayAsYouGoModal = ({ isOpen, onClose, payAsYouGoData, onContinuePayment, onViewMorePlans, isProject = false, isProcessing = false }) => {
  const t = useTranslation();
  const router = useRouter();
  const isAgentRoute = router?.asPath?.includes("/agent");

  const currencySymbol = useSelector(
    (state) => state?.WebSetting?.data?.currency_symbol || "$"
  );

  if (!isOpen) return null;
  if (payAsYouGoData?.length === 0 && isAgentRoute) {
    router?.replace(isAgentRoute ? `/agent/packages?lang=${router?.query?.lang}` : `/user/packages?lang=${router?.query?.lang}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="text-xl font-bold leadColor">
            {t("payAsYouGo")}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <IoClose size={22} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Info Card */}
          <div className="my-4 rounded-xl primaryBgLight08 p-4">
            <div className="flex items-center bg-white p-3 rounded-xl gap-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg primaryBg">
                <BiMoneyWithdraw size={24} className="text-white" />
              </div>
              <p className="text-sm text-gray-700">
                {isProject ? t("payAsYouGoDescriptionProject") : t("payAsYouGoDescription")}
              </p>
            </div>
            {/* Dashed Divider */}
            <div className="my-5 border-t-2 border-dashed primaryBorderColor" />
            {/* Pay As You Go Details */}
            {payAsYouGoData ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaRegClock size={20} className="primaryColor" />
                  <p className="text-sm font-medium secondryTextColor">
                    {t("yourListingWillExpireIn")} <span className="primaryColor">30</span> {t("days")}
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold brandColor">
                    {/* {payAsYouGoData.name} */}
                    {currencySymbol}{payAsYouGoData.price}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between mb-6">
                <p className="text-lg font-semibold leadColor">
                  {t("subscriptionRequired")}
                </p>
              </div>
            )}
          </div>

          {/* Continue Payment Button */}
          {payAsYouGoData && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => {
                onContinuePayment?.();
              }}
              className="w-full rounded-xl primaryBg py-2 px-3 text-center text-lg font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {t("continuePayment")}
            </button>
          )}

          {/* View More Plans Link */}
          <div className={`${payAsYouGoData ? 'mt-4' : 'mt-0'} text-center`}>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => {
                onViewMorePlans?.();
              }}
              className={`${payAsYouGoData ? 'primaryColor text-base' : 'w-full rounded-xl primaryBg py-3.5 text-lg text-white'} font-medium hover:underline disabled:cursor-not-allowed disabled:opacity-70`}
            >
              {t("viewMorePlans")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayAsYouGoModal;
