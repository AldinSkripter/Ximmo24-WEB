"use client";

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../context/TranslationContext';
import { getPackagesApi, getPaymentSettingsApi } from '@/api/apiRoutes';
import SubscriptionCardSkeleton from '../skeletons/SubscriptionCardSkeleton';
import { useSelector } from 'react-redux';
import { motion } from "framer-motion";
import CustomLink from '../context/CustomLink';
import UserSubscriptionCard from "./UserSubscriptionCard";
import { isRTL } from '@/utils/helperFunction';
import { useRouter } from 'next/router';
import PaymentHandlers from '../subscription-plan/PaymentHandlers';
import PaymentSelectionModal from '../subscription-plan/PaymentSelectionModal';
import NoDataFoundPlaceholder from '../reusable-components/icons/NoDataFoundPlaceholder';


const UserSubscription = ({ isUser = true }) => {
    const t = useTranslation();
    const router = useRouter();
    const isRtl = isRTL();

    const userData = useSelector((state) => state.User?.data);
    const webSettings = useSelector((state) => state.WebSetting?.data);

    const [isLoading, setIsLoading] = useState(true);
    const [activePackages, setActivePackages] = useState([]);
    const [allFeatures, setAllFeatures] = useState([]);

    // Payment related states
    const [paymentSettingsdata, setPaymentSettingsData] = useState([]);
    const [priceData, setPriceData] = useState("");
    const [showPaymentSelection, setShowPaymentSelection] = useState(false);

    const systemSettings = useSelector(state => state?.WebSetting?.data);
    const language = useSelector((state) => state.LanguageSettings?.active_language);
    const user = useSelector((state) => state.User?.data);
    const token = useSelector((state) => state.User?.jwtToken);
    const CurrencySymbol = systemSettings?.currency_symbol;

    const containerRef = useRef(null);

    // Razorpay initialization
    const isUserLoggedIn = token ? true : false;

    const lang = router?.query?.lang;

    // Payment gateway active checks
    const stripeActive = paymentSettingsdata.some(
        (item) => item.type === "stripe_gateway" && item.data === "1",
    );
    const razorpayActive = paymentSettingsdata.some(
        (item) => item.type === "razorpay_gateway" && item.data === "1",
    );
    const payStackActive = paymentSettingsdata.some(
        (item) => item.type === "paystack_gateway" && item.data === "1",
    );
    const payPalActive = paymentSettingsdata.some(
        (item) => item.type === "paypal_gateway" && item.data === "1",
    );
    const FlutterwaveActive = paymentSettingsdata.some(
        (item) => item.type === "flutterwave_status" && item.data === "1",
    );
    const bankTransferActive = paymentSettingsdata.some(
        (item) => item.type === "bank_transfer_status" && item.data === "1",
    );
    const cashFreeActive = paymentSettingsdata.some(
        (item) => item.type === "cashfree_gateway" && item.data === "1",
    );
    const midtransActive = paymentSettingsdata.some(
        (item) => item.type === "midtrans_gateway" && item.data === "1",
    );
    const phonepeActive = paymentSettingsdata.some(
        (item) => item.type === "phonepe_gateway" && item.data === "1",
    );

    // Bank details
    const bankDetails = systemSettings?.bank_details;

    const fetchActivePackages = async () => {
        try {
            setIsLoading(true);
            const response = await getPackagesApi();
            setActivePackages(response?.active_packages?.filter?.(item => item.user_type === (isUser ? "user" : "agent")));
            setAllFeatures(response?.all_features);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching active packages:', error);
            setIsLoading(false);
        }
    };

    const fetchPaymentSettings = async () => {
        try {
            const res = await getPaymentSettingsApi();
            if (!res?.error) {
                setPaymentSettingsData(res?.data);
            } else {
                console.error("Error fetching payment settings:", res?.message);
            }
        } catch (err) {
            console.error("Error fetching payment settings:", err);
        }
    };

    useEffect(() => {
        fetchActivePackages();
    }, [language]);

    useEffect(() => {
        if (isUserLoggedIn) {
            fetchPaymentSettings();
        }
    }, [isUserLoggedIn]);

    // Format date helper function
    const formatDate = (inputDate) => {
        if (inputDate === null) {
            return "Lifetime";
        }

        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        const date = new Date(inputDate);
        const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" });
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();

        return `${t(dayOfWeek?.toLowerCase())}, ${day} ${t(month?.toLowerCase())}, ${year}`;
    };

    // Calculate remaining time helper function
    const calculateRemainingTime = (endDate, durationHours) => {
        const now = new Date();
        const end = new Date(endDate);
        const timeDiff = end - now;

        if (timeDiff <= 0) return "0 " + t("timeLeft"); // Expired

        // If duration is in hours (less than 24 hours)
        if (durationHours <= 24) {
            const remainingHours = Math.ceil(timeDiff / (1000 * 60 * 60));
            return `${remainingHours} ${t("hoursLeft")}`;
        }

        // Otherwise, calculate remaining days
        const remainingDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        return `${remainingDays} ${t("daysLeft")}`;
    };

    // Helper to get feature limit and inclusion status
    const getFeatureLimit = (features, featureId) => {
        const feature = features?.find(f => f.id === featureId);

        if (!feature) {
            return { included: false, limit: null };
        }

        if (feature.limit_type === "unlimited") {
            return {
                included: true,
                limit: null,
                type: feature.limit_type,
            };
        } else {
            return {
                included: true,
                limit: feature.total_limit,
                usedLimit: feature.used_limit,
                type: feature.limit_type,
            };
        }
    };

    const formatDuration = (hours) => {
        if (hours >= 24) {
            const days = Math.floor(hours / 24);
            return `${days} ${t("days")}`;
        } else {
            return `${hours} ${t("hours")}`;
        }
    };

    // Check if any online payment gateway is active
    const hasActiveOnlinePayment = () => {
        return (
            stripeActive ||
            razorpayActive ||
            payStackActive ||
            payPalActive ||
            FlutterwaveActive ||
            cashFreeActive
        );
    };

    // Handle online payment selection — directly triggers the payment handler
    const handleOnlinePayment = (selectedGateway) => {
        setShowPaymentSelection(false);

        switch (selectedGateway) {
            case "stripe":
                if (stripeActive) createPaymentIntent();
                break;
            case "razorpay":
                if (razorpayActive) handleRazorpayPayment();
                break;
            case "paystack":
                if (payStackActive) handlePayStackPayment();
                break;
            case "paypal":
                if (payPalActive) handlePaypalPayment();
                break;
            case "flutterwave":
                if (FlutterwaveActive) handleFlutterwavePayment();
                break;
            case "cashfree":
                if (cashFreeActive) handleCashfreePayment();
                break;
            case "midtrans":
                if (midtransActive) handleMidtransPayment();
                break;
            case "phonepe":
                if (phonepeActive) handlePhonepePayment();
                break;
            default:
                console.error("Unknown payment gateway:", selectedGateway);
        }
    };

    // Payment handlers — popup-based flow
    const {
        handleRazorpayPayment,
        handlePayStackPayment,
        handlePaypalPayment,
        handleFlutterwavePayment,
        createPaymentIntent,
        handleCashfreePayment,
        handleMidtransPayment,
        handlePhonepePayment,
        cleanupListener,
    } = PaymentHandlers({
        priceData,
        setLoading: setIsLoading,
        router,
    });

    // Clean up message listener on unmount
    useEffect(() => {
        return () => {
            cleanupListener();
        };
    }, [cleanupListener]);

    return (
        <div className="w-full h-full lg:mx-auto relative bg-white rounded-xl md:rounded-2xl newBorder" ref={containerRef}>

            <div className="mb-4 sm:mb-6 px-4 bg-white py-3 border-b newBorderColor rounded-t-2xl">
                <h2 className="text-base sm:text-xl font-bold">
                    {t("mySubscriptions")}
                </h2>
            </div>

            {isLoading ? (
                // Show skeleton loading UI
                <div className="space-y-4 sm:space-y-6">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <SubscriptionCardSkeleton key={index} />
                    ))}
                </div>
            ) : activePackages && activePackages.length > 0 ? (
                // Create a container for sticky scroll sections with enough space to scroll
                <div className={`px-2 md:px-4 ${window?.innerWidth >= 1280 ? 'space-y-6' : 'space-y-4 sm:space-y-6'}`}>
                    {activePackages.map((subscriptionData, index) => (
                        <div
                            key={subscriptionData.id || index}
                            className={`${window?.innerWidth >= 1280 ? 'sticky-section ' : ''} ${window?.innerWidth >= 1280 && index === activePackages?.length - 1 ? '!mb-[102px]' : ''}`}
                            style={
                                window?.innerWidth >= 1280 ? {
                                    position: 'sticky',
                                    top: `${index}px`,
                                    zIndex: index,
                                    // marginBottom: index === activePackages.length - 1 ? '14vh' : 0,
                                    paddingTop: 0
                                } : {}
                            }
                        >
                            <UserSubscriptionCard
                                subscriptionData={subscriptionData}
                                index={index}
                                totalCards={activePackages.length}
                                allFeatures={allFeatures}
                                t={t}
                                isRtl={isRtl}
                                CurrencySymbol={CurrencySymbol}
                                formatDuration={formatDuration}
                                formatDate={formatDate}
                                calculateRemainingTime={calculateRemainingTime}
                                getFeatureLimit={getFeatureLimit}
                                isUserLoggedIn={isUserLoggedIn}
                                systemSettings={systemSettings}
                                user={user}
                                setPriceData={setPriceData}
                                hasActiveOnlinePayment={hasActiveOnlinePayment}
                                bankTransferActive={bankTransferActive}
                                setShowPaymentSelection={setShowPaymentSelection}
                                handleOnlinePayment={handleOnlinePayment}
                                router={router}
                                lang={lang}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center flex flex-col h-full items-center justify-center mx-auto p-4 sm:p-8 gap-3"
                >
                    <NoDataFoundPlaceholder
                        width={200}
                        height={200}
                        color={webSettings?.system_color}
                    />
                    <div className="flex flex-col items-center justify-center">
                        <h3 className="primaryColor text-base md:text-2xl font-medium">{t("noActiveSubscriptions")}</h3>
                        <span className='text-center text-sm md:text-base font-normal secondryTextColor'>{t("noActiveSubscriptionsDescription")}</span>
                    </div>
                    <CustomLink href={`${isUser ? "/subscription-plan" : "/agent/packages"}`} className="primaryBg justify-self-center w-fit text-white px-4 py-2 font-bold rounded-md">
                        {t("viewPlans")}
                    </CustomLink>
                </motion.div>
            )}

            {showPaymentSelection && (
                <PaymentSelectionModal
                    isOpen={showPaymentSelection}
                    onClose={() => setShowPaymentSelection(false)}
                    onOnlinePayment={handleOnlinePayment}
                    stripeActive={stripeActive}
                    razorpayActive={razorpayActive}
                    payStackActive={payStackActive}
                    payPalActive={payPalActive}
                    flutterwaveActive={FlutterwaveActive}
                    bankDetails={bankDetails}
                    bankTransferActive={bankTransferActive}
                    cashFreeActive={cashFreeActive}
                    midtransActive={midtransActive}
                    phonepeActive={phonepeActive}
                    hasOnlinePayment={hasActiveOnlinePayment()}
                    packageId={priceData?.id}
                    priceData={priceData}
                    CurrencySymbol={CurrencySymbol}
                />
            )}
        </div>
    );
};

export default UserSubscription;