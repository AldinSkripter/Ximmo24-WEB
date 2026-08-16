import React from 'react'
import { useTranslation } from '../context/TranslationContext';
import AuthButton from '../reusable-components/AuthButton';
import { FcGoogle } from 'react-icons/fc';
import { BiMailSend, BiPhone } from 'react-icons/bi';


const RegisterTypeForm = ({
    registrationType,
    setRegistrationType,
    CompanyName,
    showRegisterOptions,
    setShowRegisterOptions,
    handleShowSignUp,
    handleSignIn,
    ShowEmailLogin,
    AllowSocialLogin,
    ShowPhoneLogin,
    handleGoogleSignup
}) => {
    const t = useTranslation();
    return (
        <div className="flex flex-col gap-6 px-4 py-6">
            <div className="flex flex-col gap-2">
                <h4 className="text-base font-bold brandColor">
                    {t("selectRegistrationMethod")}
                </h4>
                <p className="text-sm font-medium brandColor">
                    {t("pickOptionToRegister")} {CompanyName} {t("account")}
                </p>
            </div>
            <div className="flex flex-col gap-4">
                {ShowPhoneLogin && (
                    <AuthButton
                        onClick={() => {
                            setRegistrationType("phone");
                            handleShowSignUp(true);
                        }}
                        text={t("RWP")}
                        icon={<BiPhone className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />}
                    />
                )}
                {ShowEmailLogin && (
                    <AuthButton
                        onClick={() => {
                            setRegistrationType("email");
                            handleShowSignUp(false);
                        }}
                        text={t("RWE")}
                        icon={<BiMailSend className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />}
                    />
                )}
                {AllowSocialLogin && (
                    <AuthButton
                        onClick={handleGoogleSignup}
                        text={t("CWG")}
                        icon={
                            <FcGoogle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />}
                    />
                )}
            </div>
            <div className="flex justify-center items-center gap-1">
                {t("alreadyHaveAccount")}
                <div
                    className="secondryTextColor font-bold transition-colors hover:cursor-pointer"
                    onClick={handleSignIn}
                >
                    {t("signIn")}
                </div>
            </div>
        </div>
    )
}

export default RegisterTypeForm