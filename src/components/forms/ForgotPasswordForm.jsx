import React, { useState } from 'react'
import { useTranslation } from '@/components/context/TranslationContext';
import ButtonLoader from '@/components/ui/loaders/ButtonLoader';

// Forgot Password Form/Modal
const ForgotPasswordForm = ({ onSubmit, onBackToLogin, showLoader }) => {
    const t = useTranslation();
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(email);
    };
    const [email, setEmail] = useState("");
    return (
        <form onSubmit={handleSubmit}>
            <div className="flex w-full flex-col justify-center gap-3 p-3 sm:gap-4 sm:p-3 md:p-4">
                <div className="mt-5 flex flex-col gap-2 text-base sm:text-lg">
                    <h4 className="text-base font-medium md:text-2xl">
                        {t("forgotPassword")}
                    </h4>
                    <div className="secondryTextColor font-light">
                        {t("enterEmailForReset")}
                    </div>
                </div>
                <div className="flex flex-col gap-1 sm:gap-2">
                    <label
                        htmlFor="forgot-email"
                        className="text-base font-medium sm:text-lg"
                    >
                        {t("email")}
                        <span className="ms-1 text-red-600">*</span>
                    </label>
                    <input
                        type="email"
                        id="forgot-email"
                        name="forgot-email"
                        className="primaryBackgroundBg w-full rounded border-none p-2 text-base outline-none sm:p-[10px] md:text-base"
                        placeholder={t("enterYourEmail")}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <button
                    type="submit"
                    className="brandBg primaryTextColor w-full rounded p-2 text-base transition-all hover:primaryBg sm:p-[10px] sm:text-lg md:text-base"
                    disabled={showLoader}
                >
                    {showLoader ? (
                        <ButtonLoader />
                    ) : (
                        t("submit")
                    )}
                </button>
                <div
                    className="primaryColor inline-flex items-center justify-center text-sm transition-opacity hover:cursor-pointer hover:underline hover:opacity-80 md:text-base"
                    onClick={onBackToLogin}
                >
                    {t("backtoLogin")}
                </div>
            </div>
        </form>
    );
};

export default ForgotPasswordForm