'use client';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useSelector } from 'react-redux';
import { useTranslation } from '../context/TranslationContext';
import CookieIcon from '../reusable-components/icons/CookieIcon';
import { CONSENT, CONSENT_EXPIRY_DAYS, getConsentLevel, setConsent } from '@/utils/cookieConsent';

const CookieComponent = () => {
    const t = useTranslation();
    const [showPopup, setShowPopup] = useState(false);

    const userData = useSelector(state => state.User);
    const websettings = useSelector(state => state.WebSetting);
    const data = userData?.data;
    const isLogin = userData?.jwtToken;

    const saveUserCookies = () => {
        Cookies.set('user-name', data?.name, { expires: CONSENT_EXPIRY_DAYS });
        Cookies.set('user-email', data?.email, { expires: CONSENT_EXPIRY_DAYS });
        Cookies.set('user-number', data?.mobile, { expires: CONSENT_EXPIRY_DAYS });
        Cookies.set('user-token', userData?.jwtToken, { expires: CONSENT_EXPIRY_DAYS });
        Cookies.set('user-fcmId', websettings?.fcmToken, { expires: CONSENT_EXPIRY_DAYS });
        Cookies.set('user-loginType', data?.logintype, { expires: CONSENT_EXPIRY_DAYS });
    };

    const clearUserCookies = () => {
        ['user-name', 'user-email', 'user-number', 'user-token', 'user-fcmId', 'user-loginType'].forEach(
            key => Cookies.remove(key)
        );
    };

    const handleAcceptAll = () => {
        setConsent(CONSENT.ALL);
        saveUserCookies();
        setShowPopup(false);
    };

    const handleAcceptNecessary = () => {
        setConsent(CONSENT.NECESSARY);
        saveUserCookies();
        setShowPopup(false);
    };

    const handleRejectAll = () => {
        setConsent(CONSENT.REJECTED);
        clearUserCookies();
        setShowPopup(false);
    };

    useEffect(() => {
        if (!getConsentLevel()) {
            setShowPopup(true);
        }
    }, []);

    // If user logs in after already consenting, save their cookies
    useEffect(() => {
        const level = getConsentLevel();
        if (isLogin && (level === CONSENT.ALL || level === CONSENT.NECESSARY)) {
            saveUserCookies();
        }
    }, [isLogin, userData]);

    if (!showPopup) return null;

    return (
        <div className='fixed bottom-1 right-1 md:bottom-5 md:right-5 sm:bottom-[10px] sm:right-[10px] z-[999]
            bg-white shadow-lg rounded-lg flex flex-col items-center justify-center gap-3 md:gap-4
            w-[280px] p-3
            sm:w-[330px] sm:px-4 sm:py-4
            md:w-[450px] md:p-5
            lg:w-[470px]
            will-change-transform'>
            <div className="imgWrapper w-[80px] h-[80px] relative flex-shrink-0">
                <CookieIcon color={websettings?.data?.system_color} className='object-contain' />
            </div>

            <div className='content flex flex-col gap-4 items-center text-center'>
                <span className='text-lg sm:text-lg md:text-xl lg:text-2xl font-bold secondryTextColor'>{t("cookieConsent")}</span>
                <span className='text-sm sm:text-sm md:text-base lg:text-base secondryTextColor font-semibold'>{t("cookieConsentDescription")}</span>
            </div>

            <div className="btnsWrapper flex flex-col items-stretch w-full gap-2 mt-2">
                <button
                    onClick={handleAcceptAll}
                    className='primaryBg text-sm md:text-base text-white px-5 py-2 rounded-sm font-semibold w-full'>
                    {t("acceptAllCookies")}
                </button>
                <button
                    onClick={handleAcceptNecessary}
                    className='btnBorder text-sm md:text-base bg-transparent px-5 py-2 rounded-sm font-semibold w-full'>
                    {t("acceptNecessaryCookies")}
                </button>
                <button
                    onClick={handleRejectAll}
                    className='text-sm md:text-base bg-transparent px-5 py-2 rounded-sm font-semibold w-full secondryTextColor hover:bg-gray-100 transition-colors'>
                    {t("rejectAllCookies")}
                </button>
            </div>
        </div>
    );
};

export default CookieComponent;
