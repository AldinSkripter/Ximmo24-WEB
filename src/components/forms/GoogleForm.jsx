import React from 'react'
import { useTranslation } from '../context/TranslationContext'
import AuthButton from '../reusable-components/AuthButton'
import { FcGoogle } from 'react-icons/fc'

const GoogleForm = ({
    handleGoogleSignup,
}) => {
    const t = useTranslation()

    return (
        <form className="flex flex-col gap-2 p-3 sm:gap-4 sm:p-3 md:p-4">
            <div className='flex justify-center'>
                {t("loginToYourRealEstateAccount")}
            </div>
            <AuthButton
                text={t("CWG")}
                onClick={handleGoogleSignup}
                icon={<FcGoogle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />}
            />
        </form>
    )
}

export default GoogleForm