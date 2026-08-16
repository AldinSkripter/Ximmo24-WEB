import React from 'react'
import ButtonLoader from '../ui/loaders/ButtonLoader';
import OTPInput from 'react-otp-input';
import { useTranslation } from '../context/TranslationContext';


// OTP Form
const OTPForm = ({
    phonenum,
    otp,
    setOTP,
    handleConfirm,
    showLoader,
    isCounting,
    timeLeft,
    formatTime,
    handleResendOTP,
    wrongNumber,
    wrongEmail,
    isEmailOtpEnabled,
    emailOtp = "", // Initialize as a string
    setEmailOtp,
    handleEmailOtpVerification,
    emailTimeLeft,
    isEmailCounting,
    email,
}) => {
    const t = useTranslation();
    // OTP component will handle all input, focus, and key events automatically
    // Determine if we're in email OTP mode - prioritize isEmailOtpEnabled state
    const isEmailMode = isEmailOtpEnabled === true;

    return (
        <form>
            <div className="flex w-full flex-col justify-center gap-3 p-3 sm:gap-6 sm:p-3 md:p-4">
                <div className="flex flex-col text-base sm:text-lg">
                    <h4 className="text-base font-medium md:text-xl">
                        {t("otpVerification")}
                    </h4>
                    <span className="secondryTextColor text-sm font-light md:text-base">
                        {isEmailMode ? t("enterOtpSentToEmail") : t("enterOtp")} <span className="primaryColor text-base font-medium [unicode-bidi:bidi-override] [direction:ltr]">{isEmailMode ? email : phonenum}</span>
                    </span>

                    <span
                        className="brandColor w-fit text-sm font-semibold hover:cursor-pointer hover:underline"
                        onClick={isEmailMode ? wrongEmail : wrongNumber}
                    >
                        {isEmailMode ? t("wrongEmail") : t("wrongNumber")}
                    </span>
                </div>
                <div className="flex flex-col gap-1 sm:gap-6">
                    {/* OTP Input Fields */}
                    <div className="userInput flex flex-wrap items-center justify-between gap-1 md:justify-center md:gap-5">
                        <OTPInput
                            value={isEmailMode ? emailOtp : otp}
                            onChange={isEmailMode ? setEmailOtp : setOTP}
                            numInputs={6}
                            shouldAutoFocus
                            renderInput={(props) => (
                                <input
                                    {...props}
                                    autoComplete="one-time-code"
                                    className="!w-10 !h-10 md:!w-[62px] md:!h-[62px] flex justify-center items-center !text-center rounded-lg border border-[--border-color] primaryBackgroundBg relative transition-all 
                  focus:outline-none focus:border-[--primary-color] focus:shadow-[0_0_5px_rgba(135,199,204,0.5)]"
                                />
                            )}
                            containerStyle="w-full flex justify-between md:justify-center gap-2 md:gap-5"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    isEmailMode ? handleEmailOtpVerification(e) : handleConfirm(e);
                                }
                            }}
                        />
                    </div>

                    {/* Resend OTP Section */}
                    <div className="resend-code flex flex-col items-center justify-center text-sm">
                        {(() => {
                            const isCountingActive = isEmailMode
                                ? isEmailCounting
                                : isCounting;
                            const currentTimeLeft = isEmailMode
                                ? emailTimeLeft
                                : timeLeft;

                            return isCountingActive ? (
                                <span
                                    id="re-text"
                                    className="flex items-center justify-center text-base font-semibold"
                                >
                                    {t("resendOtp")} {t("in")}&nbsp;<span className="primaryColor">{formatTime(currentTimeLeft)}</span>
                                </span>
                            ) : (
                                <span
                                    id="re-text"
                                    onClick={handleResendOTP}
                                    className="primaryColor hover:cursor-pointer"
                                >
                                    {t("resendOtp")}
                                </span>
                            );
                        })()}
                    </div>

                    {/* Continue Button */}
                    <button
                        type="submit"
                        className="brandBg primaryTextColor w-full rounded p-2 text-sm transition-all hover:primaryBg sm:p-[10px] sm:text-base md:text-base"
                        onClick={(e) =>
                            isEmailMode
                                ? handleEmailOtpVerification(e)
                                : handleConfirm(e)
                        }
                    >
                        {showLoader ? (
                            <ButtonLoader />
                        ) : (
                            <span>{t("confirm")}</span>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default OTPForm