import ButtonLoader from '../ui/loaders/ButtonLoader';
import AuthButton from '../reusable-components/AuthButton';
import { FcGoogle, FcPhoneAndroid } from 'react-icons/fc';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useTranslation } from '../context/TranslationContext';
import { isRTL } from '@/utils/helperFunction';
import { useState } from 'react';


// Email Login Form
const EmailLoginForm = ({
    signInFormData,
    handleSignInInputChange,
    SignInWithEmail,
    handlesignUp,
    AllowSocialLogin,
    ShowPhoneLogin,
    handlePhoneLogin,
    handleGoogleSignup,
    showLoader,
    emailReverify,
    onForgotPasswordClick,
    handleResendOTP,
    showEmailLoginForm,
    showEmailContent
}) => {
    const t = useTranslation();
    const isRtl = isRTL();
    const [showPassword, setShowPassword] = useState(false);

    return (
        <form>
            <div className="flex w-full flex-col justify-center gap-3 p-3 sm:gap-4 sm:p-3 md:p-4">
                {showEmailLoginForm && showEmailContent ? (
                    <>
                        <div className="flex flex-col gap-1 sm:gap-2">
                            <label htmlFor="email" className="text-sm font-medium sm:text-base">
                                {t("email")}
                                <span className="ms-1 text-red-600">*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                placeholder={t("enterYourEmail")}
                                className="primaryBackgroundBg w-full rounded border-none p-2 text-sm outline-none sm:p-[10px] sm:text-base md:text-base"
                                value={signInFormData?.email}
                                onChange={handleSignInInputChange}
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-1 sm:gap-2">
                            <label
                                htmlFor="password"
                                className="text-sm font-medium sm:text-base"
                            >
                                {t("password")}
                                <span className="ms-1 text-red-600">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    id="password"
                                    placeholder={t("enterYourPassword")}
                                    className="primaryBackgroundBg w-full rounded border-none p-2 text-sm outline-none sm:p-[10px] sm:text-base md:text-base"
                                    value={signInFormData?.password}
                                    onChange={handleSignInInputChange}
                                    required
                                />
                                <button
                                    type="button"
                                    className={`absolute w-8 h-8 md:w-10 md:h-10 flex items-center justify-center primaryBackgroundBg ${isRtl ? "left-1 top-1/2 -translate-y-1/2" : "right-2 top-1/2 -translate-y-1/2 sm:right-1"}`}
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <FaEyeSlash className="h-4 w-4 opacity-50 hover:opacity-100 sm:h-5 sm:w-5" />
                                    ) : (
                                        <FaEye className="h-4 w-4 opacity-50 hover:opacity-100 sm:h-5 sm:w-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <div
                                className="text-sm font-bold underline transition-colors hover:cursor-pointer sm:text-base"
                                onClick={onForgotPasswordClick}
                            >
                                {t("forgotPasswd")}
                            </div>
                        </div>
                        {emailReverify ? (
                            <button
                                type="button"
                                className="brandBg primaryTextColor w-full rounded-lg p-2 text-sm transition-all hover:primaryBg sm:p-[10px] sm:text-base md:text-base"
                                onClick={handleResendOTP}
                                disabled={showLoader}
                            >
                                {showLoader ? (
                                    <ButtonLoader />
                                ) : (
                                    t("resendVerificationCode")
                                )}
                            </button>
                        ) : (
                            <button
                                className="brandBg primaryTextColor w-full rounded-lg p-2 text-sm transition-all hover:primaryBg sm:p-[10px] sm:text-base md:text-base"
                                onClick={(e) => SignInWithEmail(e)}
                            >
                                {t("signIn")}
                            </button>
                        )}
                    </>
                ) : null}
                {(ShowPhoneLogin || showEmailLoginForm) ? (
                    <div className="flex flex-wrap justify-center text-sm sm:text-base">
                        <p className="me-1 text-[#555]">{t("dontHaveAccount")}</p>
                        <div
                            className="secondryTextColor font-bold transition-colors hover:cursor-pointer"
                            onClick={handlesignUp}
                        >
                            {t("registerNow")}
                        </div>
                    </div>
                ) : null}
                {(AllowSocialLogin || ShowPhoneLogin) && (
                    <div className="mt-1 flex items-center justify-between sm:mt-2">
                        <hr className="secondryTextColor flex-grow border-0 border-t-[1.5px] border-dashed sm:border-t-[1.9px]" />
                        <div className="primaryBackgroundBg mx-2 rounded-full p-1 text-sm font-medium capitalize sm:mx-4 sm:p-2 md:p-3">
                            {t("OR")}
                        </div>
                        <hr className="secondryTextColor flex-grow border-0 border-t-[1.5px] border-dashed sm:border-t-[1.9px]" />
                    </div>
                )}
                {ShowPhoneLogin && (
                    <AuthButton
                        text={t("CWP")}
                        onClick={handlePhoneLogin}
                        icon={
                            <FcPhoneAndroid className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                        }
                    />
                )}
                {AllowSocialLogin && (
                    <AuthButton
                        text={t("CWG")}
                        onClick={handleGoogleSignup}
                        icon={<FcGoogle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />}
                    />
                )}
            </div>
        </form>
    );
};

export default EmailLoginForm