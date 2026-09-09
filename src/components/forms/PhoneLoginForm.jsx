import { useState } from 'react';
import AuthButton from '../reusable-components/AuthButton';
import { RiMailSendFill } from 'react-icons/ri';
import { FcGoogle } from 'react-icons/fc';
import ButtonLoader from '../ui/loaders/ButtonLoader';
import { useTranslation } from '../context/TranslationContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { isRTL } from '@/utils/helperFunction';


const PhoneLoginForm = ({
    value,
    setValue,
    onSignUp,
    AllowSocialLogin,
    handleEmailLoginshow,
    CompanyName,
    handleGoogleSignup,
    ShowPhoneLogin,
    showLoader,
    handlesignUp,
    ShowEmailLogin,
    phonePassword,
    setPhonePassword,
    handleCheckPhoneNumber,
    handlePhoneLoginWithPassword,
    handlePhoneForgotPassword,
    showPasswordInput
}) => {
    const t = useTranslation();
    const isRtl = isRTL();
    const [showPassword, setShowPassword] = useState(false);
    const germanNationalNumber = String(value?.number || "").replace(/\D/g, "").replace(/^49/, "");

    const handleInputChange = (event) => {
        const nationalNumber = event.target.value.replace(/\D/g, "").slice(0, 13);
        setValue((prev) => ({
            ...prev,
            number: `49${nationalNumber}`,
            countryCode: "49"
        }));
    }

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                // Step 1: Check phone number (no password required yet)
                if (!showPasswordInput) {
                    handleCheckPhoneNumber(e);
                } else {
                    // Step 2: Submit with password
                    handlePhoneLoginWithPassword(e);
                }
            }}
        >
            <div className="flex w-full flex-col justify-center gap-3 p-3 sm:gap-6 sm:p-3 md:p-4">
                <div className="flex flex-col text-base sm:text-lg">
                    <h4 className="text-base font-medium md:text-2xl">
                        {t("enterMobile")}
                    </h4>
                    <div className="secondryTextColor text-sm font-light md:text-base">
                        {t("sendCode")}
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="phoneNumber"
                        className="text-sm font-medium sm:text-base"
                    >
                        {t("phoneNumber")}
                        <span className="ms-1 text-red-600">*</span>
                    </label>
                    <div className="flex h-14 w-full overflow-hidden rounded-[15px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,.045)] focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-500/10">
                        <div className="flex shrink-0 items-center gap-2 border-r border-slate-200 bg-slate-50 px-3 text-slate-900" aria-label="Deutschland +49">
                            <span className="text-lg" aria-hidden="true">🇩🇪</span>
                            <span className="text-sm font-bold sm:text-base">+49</span>
                        </div>
                        <input
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel-national"
                            name="phoneNumber"
                            id="phoneNumber"
                            required
                            autoFocus
                            minLength={6}
                            maxLength={13}
                            pattern="[0-9]{6,13}"
                            placeholder="151 23456789"
                            value={germanNationalNumber}
                            onChange={handleInputChange}
                            disabled={showPasswordInput}
                            className="ximmo-phone-native min-w-0 flex-1 rounded-none border-0 bg-white px-3 text-sm font-medium text-slate-950 outline-none shadow-none sm:px-4 sm:text-base"
                        />
                    </div>
                </div>
                {showPasswordInput && (
                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="password"
                            className="text-sm font-medium sm:text-base"
                        >
                            {t("password")}
                            <span className="ms-1 text-red-600">*</span>
                        </label>
                        <div className="mobile-number relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                className="primaryBackgroundBg w-full rounded-lg h-14 border newBorderColor p-2 text-sm outline-none sm:p-[10px] sm:text-base md:text-base"
                                placeholder={t("enterYourPassword")}
                                value={phonePassword}
                                onChange={(e) => setPhonePassword(e.target.value)}
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
                        <div
                            className="flex justify-end items-center text-base font-medium hover:cursor-pointer brandColor"
                            onClick={handlePhoneForgotPassword}
                            role="button"
                            tabIndex="0"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handlePhoneForgotPassword();
                                }
                            }}
                            aria-label={t("forgotPassword")}
                        >
                            {t("forgotPassword")}
                        </div>
                    </div>
                )}
                <button
                    type="submit"
                    className="brandBg primaryTextColor w-full rounded-lg p-2 text-sm transition-all hover:primaryBg sm:p-[10px] sm:text-base md:text-base"
                    disabled={showLoader}
                >
                    {showLoader ? (
                        <ButtonLoader />
                    ) : (
                        t("continue")
                    )}
                </button>
                <div className="flex flex-wrap justify-center text-sm sm:text-base">
                    <p className="me-1 text-[#555]">{t("dontHaveAccount")}</p>
                    <div
                        className="secondryTextColor font-bold transition-colors hover:cursor-pointer"
                        onClick={handlesignUp}
                    >
                        {t("registerNow")}
                    </div>
                </div>
                {(AllowSocialLogin || ShowEmailLogin) && (
                    <>
                        <div className="flex items-center justify-between ">
                            <hr className="secondryTextColor flex-grow border-0 border-t-[1.5px] border-dashed sm:border-t-[1.9px]" />
                            <div className="primaryBackgroundBg mx-2 rounded-full p-1 text-sm font-medium capitalize sm:mx-4 sm:p-2 md:p-3">
                                {t("OR")}
                            </div>
                            <hr className="secondryTextColor flex-grow border-0 border-t-[1.5px] border-dashed sm:border-t-[1.9px]" />
                        </div>
                    </>
                )}
                {ShowEmailLogin && (
                    <AuthButton
                        onClick={handleEmailLoginshow}
                        icon={<RiMailSendFill size={25} />}
                        text={t("CWE")}
                    />
                )}
                {AllowSocialLogin && (
                    <AuthButton
                        onClick={handleGoogleSignup}
                        icon={
                            <FcGoogle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                        }
                        text={t("CWG")}
                    />
                )}
            </div>
        </form>
    );
};

export default PhoneLoginForm
