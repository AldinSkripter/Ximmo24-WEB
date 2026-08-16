import { isRTL } from '@/utils/helperFunction'
import React, { useState } from 'react'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import { useTranslation } from '../context/TranslationContext'
import ButtonLoader from '../ui/loaders/ButtonLoader'

const PhoneLoginPasswordForm = ({
    phone,
    password,
    handlePasswordChange,
    confirmPassword,
    handleConfirmPasswordChange,
    onSubmit,
    showLoader
}) => {
    const t = useTranslation()
    const isRtl = isRTL()
    const [showPass, setShowPass] = useState(false)
    const [showConfirmPass, setShowConfirmPass] = useState(false)
    return (
        <form className='flex flex-col gap-3 px-4 py-6' onSubmit={(e) => {
            e.preventDefault();
            onSubmit(e);
        }}>
            <div className='flex flex-col gap-2'>
                <label className='mb-2 font-medium' htmlFor='password'>
                    {t("password")}
                    <span className='text-red-600'>*</span></label>
                <div className="relative">
                    <input
                        type={showPass ? 'text' : 'password'}
                        id='password'
                        value={password}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        required
                        className="primaryBackgroundBg w-full rounded-lg h-14 border newBorderColor p-2 text-sm outline-none sm:p-[10px] sm:text-base md:text-base"
                        placeholder={t("enterYourPassword")}
                    />
                    <button
                        type="button"
                        className={`absolute w-8 h-8 md:w-10 md:h-10 flex items-center justify-center primaryBackgroundBg ${isRtl ? "left-1 top-1/2 -translate-y-1/2" : "right-2 top-1/2 -translate-y-1/2 sm:right-1"}`}
                        onClick={() => setShowPass(!showPass)}
                        aria-label={showPass ? "Hide password" : "Show password"}
                    >
                        {showPass ? (
                            <FaEyeSlash className="h-4 w-4 opacity-50 hover:opacity-100 sm:h-5 sm:w-5" />
                        ) : (
                            <FaEye className="h-4 w-4 opacity-50 hover:opacity-100 sm:h-5 sm:w-5" />
                        )}
                    </button>
                </div>
            </div>
            <div className='flex flex-col mt-4'>
                <label className='mb-2 font-medium' htmlFor='confirmPassword'>
                    {t("confirmPassword")}
                    <span className='text-red-600'>*</span></label>
                <div className="relative">
                    <input
                        type={showConfirmPass ? 'text' : 'password'}
                        id='confirmPassword'
                        value={confirmPassword}
                        onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                        required
                        className="primaryBackgroundBg w-full rounded-lg h-14 border newBorderColor p-2 text-sm outline-none sm:p-[10px] sm:text-base md:text-base"
                        placeholder={t("enterYourPassword")}
                    />
                    <button
                        type="button"
                        className={`absolute w-8 h-8 md:w-10 md:h-10 flex items-center justify-center primaryBackgroundBg ${isRtl ? "left-1 top-1/2 -translate-y-1/2" : "right-2 top-1/2 -translate-y-1/2 sm:right-1"}`}
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        aria-label={showConfirmPass ? "Hide password" : "Show password"}
                    >
                        {showConfirmPass ? (
                            <FaEyeSlash className="h-4 w-4 opacity-50 hover:opacity-100 sm:h-5 sm:w-5" />
                        ) : (
                            <FaEye className="h-4 w-4 opacity-50 hover:opacity-100 sm:h-5 sm:w-5" />
                        )}
                    </button>
                </div>
            </div>
            <div className='mt-6'>
                <button
                    type='submit'
                    className='w-full primaryBg text-white p-2 rounded-md disabled:opacity-50'
                    disabled={showLoader}
                >
                    {showLoader ? <ButtonLoader /> : t("submit")}
                </button>
            </div>
        </form>
    )
}

export default PhoneLoginPasswordForm