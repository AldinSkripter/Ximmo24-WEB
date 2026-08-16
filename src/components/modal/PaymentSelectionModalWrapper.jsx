"use client";
import React, { useEffect } from "react";
import PaymentSelectionModal from "@/components/subscription-plan/PaymentSelectionModal";
import PaymentHandlers from "@/components/subscription-plan/PaymentHandlers";
import { useTranslation } from "@/components/context/TranslationContext";

/**
 * Reusable payment selection wrapper used by both AddProperty and AddProject.
 * Handles gateway activation checks, payment handler initialization, and modal rendering.
 */
const PaymentSelectionModalWrapper = ({
    payAsYouGoData,
    paymentSettingsData,
    showPaymentSelection,
    setShowPaymentSelection,
    paymentLoading,
    setPaymentLoading,
    router,
    websettings,
    priceData,
    CurrencySymbol,
    onPaymentSuccess,
    onPaymentFailed,
    onPaymentSelectionClose,
}) => {
    const t = useTranslation();

    // Payment gateway active checks
    const stripeActive = paymentSettingsData.some(
        (item) => item.type === "stripe_gateway" && item.data === "1"
    );
    const razorpayActive = paymentSettingsData.some(
        (item) => item.type === "razorpay_gateway" && item.data === "1"
    );
    const payStackActive = paymentSettingsData.some(
        (item) => item.type === "paystack_gateway" && item.data === "1"
    );
    const payPalActive = paymentSettingsData.some(
        (item) => item.type === "paypal_gateway" && item.data === "1"
    );
    const flutterwaveActive = paymentSettingsData.some(
        (item) => item.type === "flutterwave_status" && item.data === "1"
    );
    const bankTransferActive = paymentSettingsData.some(
        (item) => item.type === "bank_transfer_status" && item.data === "1"
    );
    const cashFreeActive = paymentSettingsData.some(
        (item) => item.type === "cashfree_gateway" && item.data === "1"
    );
    const midtransActive = paymentSettingsData.some(
        (item) => item.type === "midtrans_gateway" && item.data === "1"
    );
    const phonepeActive = paymentSettingsData.some(
        (item) => item.type === "phonepe_gateway" && item.data === "1"
    );

    const bankDetails = websettings?.bank_details;

    const hasActiveOnlinePayment = () => {
        return (
            stripeActive ||
            razorpayActive ||
            payStackActive ||
            payPalActive ||
            flutterwaveActive ||
            cashFreeActive ||
            phonepeActive ||
            midtransActive
        );
    };

    // Payment handlers with pay_as_you_go_id — now popup-based
    const {
        handleRazorpayPayment,
        handlePayStackPayment,
        handlePaypalPayment,
        handleFlutterwavePayment,
        createPaymentIntent,
        handleCashfreePayment,
        handlePhonepePayment,
        handleMidtransPayment,
        cleanupListener,
    } = PaymentHandlers({
        priceData: null,
        payAsYouGoId: payAsYouGoData?.id,
        setLoading: setPaymentLoading,
        router,
        onPaymentSuccess,
        onPaymentFailed,
    });

    // Clean up message listener on unmount
    useEffect(() => {
        return () => {
            cleanupListener();
        };
    }, [cleanupListener]);

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
                if (flutterwaveActive) handleFlutterwavePayment();
                break;
            case "cashfree":
                if (cashFreeActive) handleCashfreePayment();
                break;
            case "phonepe":
                if (phonepeActive) handlePhonepePayment();
                break;
            case "midtrans":
                if (midtransActive) handleMidtransPayment();
                break;
            default:
                console.error("Unknown payment gateway:", selectedGateway);
        }
    };

    const handleModalClose = () => {
        setShowPaymentSelection(false);
    };

    const handleModalDismiss = () => {
        setShowPaymentSelection(false);
        onPaymentSelectionClose?.();
    };

    if (paymentLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent p-4">
                <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-8 py-6 shadow-xl">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
                    <p className="text-base font-medium text-gray-700">{t("processingPayment")}</p>
                </div>
            </div>
        );
    }

    if (!showPaymentSelection) return null;

    return (
        <PaymentSelectionModal
            isOpen={showPaymentSelection}
            onClose={handleModalClose}
            onDismiss={handleModalDismiss}
            onOnlinePayment={handleOnlinePayment}
            stripeActive={stripeActive}
            razorpayActive={razorpayActive}
            payStackActive={payStackActive}
            payPalActive={payPalActive}
            flutterwaveActive={flutterwaveActive}
            cashFreeActive={cashFreeActive}
            phonepeActive={phonepeActive}
            midtransActive={midtransActive}
            bankDetails={bankDetails}
            bankTransferActive={bankTransferActive}
            hasOnlinePayment={hasActiveOnlinePayment()}
            payAsYouGoId={payAsYouGoData?.id}
            priceData={priceData}
            CurrencySymbol={CurrencySymbol}
        />
    );
};

export default PaymentSelectionModalWrapper;
