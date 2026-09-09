import { useState } from 'react';
import ButtonLoader from '../ui/loaders/ButtonLoader';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { isRTL } from '@/utils/helperFunction';
import { useTranslation } from '../context/TranslationContext';


// Register Form
const RegisterForm = ({
    registerFormData,
    handleRegisterInputChange,
    handleRegisterPhoneChange,
    handleRegisterUser,
    handleSignIn,
    showLoader,
    isMobileReq
}) => {
    const t = useTranslation();
    const isRtl = isRTL();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const germanNationalNumber = String(registerFormData?.phone || "").replace(/\D/g, "").replace(/^49/, "");

    const handlePhoneChange = (event) => {
        const nationalNumber = event.target.value.replace(/\D/g, "").slice(0, 13);
        handleRegisterPhoneChange(`49${nationalNumber}`, { dialCode: "49", countryCode: "de" });
    };
    return (
        <form onSubmit={handleRegisterUser}>
            <div className="flex w-full flex-col justify-center gap-3 p-3 sm:gap-4 sm:p-3 md:p-4">
                <div className="flex flex-col gap-1 sm:gap-2">
                    <label htmlFor="name" className="text-sm font-medium sm:text-base">
                        {t("name")}
                        <span className="ms-1 text-red-600">*</span>
                    </label>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        placeholder={t("enterYourName")}
                        className="primaryBackgroundBg w-full rounded border-none p-2 text-sm outline-none sm:p-[10px] sm:text-base md:text-base"
                        value={registerFormData?.name}
                        onChange={handleRegisterInputChange}
                        required
                    />
                </div>
                <div className="flex flex-col gap-1 sm:gap-2">
                    <label htmlFor="email" className="text-sm font-medium sm:text-base">
                        {t("email")}
                        {!isMobileReq && <span className="ms-1 text-red-600">*</span>}
                    </label>
                    <input
                        type="text"
                        name="email"
                        id="email"
                        placeholder={t("enterEmail")}
                        className="primaryBackgroundBg w-full rounded border-none p-2 text-sm outline-none sm:p-[10px] sm:text-base md:text-base"
                        value={registerFormData?.email}
                        onChange={handleRegisterInputChange}
                        required={!isMobileReq}
                    />
                </div>
                <div className="flex flex-col gap-1 sm:gap-2">
                    <label htmlFor="phone" className="text-sm font-medium sm:text-base">
                        {t("phoneNumber")}
                        {isMobileReq && <span className="ms-1 text-red-600">*</span>}
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
                            name="phone"
                            id="phone"
                            required={isMobileReq}
                            minLength={isMobileReq ? 6 : undefined}
                            maxLength={13}
                            pattern={isMobileReq ? "[0-9]{6,13}" : undefined}
                            placeholder="151 23456789"
                            value={germanNationalNumber}
                            onChange={handlePhoneChange}
                            className="ximmo-phone-native min-w-0 flex-1 rounded-none border-0 bg-white px-3 text-sm font-medium text-slate-950 outline-none shadow-none sm:px-4 sm:text-base"
                        />
                    </div>
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
                            value={registerFormData?.password}
                            onChange={handleRegisterInputChange}
                            required
                        />
                        <button
                            type="button"
                            className={`absolute w-8 h-8 md:w-10 md:h-10 flex items-center justify-center primaryBackgroundBg ${isRtl ? "left-1 top-1/2 -translate-y-1/2" : "right-2 top-1/2 -translate-y-1/2 sm:right-1"}`}
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                                <FaEyeSlash className="h-4 w-4 hover:opacity-100 sm:h-5 sm:w-5" />
                            ) : (
                                <FaEye className="h-4 w-4 hover:opacity-100 sm:h-5 sm:w-5" />
                            )}
                        </button>
                    </div>
                    <div className="flex flex-col gap-1 sm:gap-2">
                        <label
                            htmlFor="confirmPassword"
                            className="text-sm font-medium sm:text-base"
                        >
                            {t("confirmPassword")}
                            <span className="ms-1 text-red-600">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                id="confirmPassword"
                                placeholder={t("enterConfirmPassword")}
                                className="primaryBackgroundBg w-full rounded border-none p-2 text-sm outline-none sm:p-[10px] sm:text-base md:text-base"
                                value={registerFormData?.confirmPassword}
                                onChange={handleRegisterInputChange}
                                required
                            />
                            <button
                                type="button"
                                className={`absolute w-8 h-8 md:w-10 md:h-10 flex items-center justify-center primaryBackgroundBg ${isRtl ? "left-1 top-1/2 -translate-y-1/2" : "right-2 top-1/2 -translate-y-1/2 sm:right-1"}`}
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? (
                                    <FaEyeSlash className="h-4 w-4  hover:opacity-100 sm:h-5 sm:w-5" />
                                ) : (
                                    <FaEye className="h-4 w-4  hover:opacity-100 sm:h-5 sm:w-5" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
                <button
                    type="submit"
                    className="brandBg primaryTextColor w-full rounded-lg p-2 text-sm transition-all hover:primaryBg sm:p-[10px] sm:text-base md:text-base"
                >
                    {showLoader ? (
                        <ButtonLoader />
                    ) : (
                        t("register")
                    )}
                </button>
                <div className="flex flex-wrap justify-center text-sm sm:text-base">
                    <p className="me-1 text-[#555]">{t("alreadyHaveAccount")}</p>
                    <div
                        className="secondryTextColor font-bold transition-colors hover:cursor-pointer"
                        onClick={handleSignIn}
                    >
                        {t("signIn")}
                    </div>
                </div>
            </div>
        </form>
    );
};

export default RegisterForm
