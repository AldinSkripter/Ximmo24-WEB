'use client';

import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { BiCheck, BiChevronDown, BiCookie, BiLockAlt, BiShieldQuarter, BiX } from 'react-icons/bi';
import { CONSENT, CONSENT_EXPIRY_DAYS, getConsentLevel, getConsentPreferences, setConsent } from '@/utils/cookieConsent';

const translations = {
    de: {
        eyebrow: 'Ihre Privatsphäre bei Ximmo24', title: 'Cookies nach Ihren Wünschen',
        description: 'Notwendige Cookies sichern Anmeldung und Grundfunktionen. Analyse und Marketing starten nur mit Ihrer Zustimmung.',
        necessary: 'Notwendig', necessaryText: 'Sicherheit, Anmeldung und Ihre Einstellungen', always: 'Immer aktiv',
        analytics: 'Analyse', analyticsText: 'Hilft uns, Ximmo24 schneller und besser zu machen',
        advertising: 'Marketing', advertisingText: 'Ermöglicht relevante Inhalte und Kampagnen',
        details: 'Individuell einstellen', save: 'Auswahl speichern', privacy: 'Datenschutzerklärung',
        settings: 'Cookie-Einstellungen', close: 'Schließen', acceptAll: 'Alle akzeptieren',
        necessaryOnly: 'Nur notwendige', reject: 'Ablehnen', badge: 'Sicher & transparent',
    },
    en: {
        eyebrow: 'Your privacy at Ximmo24', title: 'Cookies, on your terms',
        description: 'Necessary cookies keep sign-in and core features working. Analytics and marketing only start with your permission.',
        necessary: 'Necessary', necessaryText: 'Security, sign-in and your preferences', always: 'Always active',
        analytics: 'Analytics', analyticsText: 'Helps us make Ximmo24 faster and better',
        advertising: 'Marketing', advertisingText: 'Enables relevant content and campaigns',
        details: 'Customize settings', save: 'Save selection', privacy: 'Privacy policy',
        settings: 'Cookie settings', close: 'Close', acceptAll: 'Accept all',
        necessaryOnly: 'Necessary only', reject: 'Reject', badge: 'Secure & transparent',
    },
};

const CookieComponent = () => {
    const [showPopup, setShowPopup] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [preferences, setPreferences] = useState({ analytics: false, advertising: false });
    const userData = useSelector(state => state.User);
    const websettings = useSelector(state => state.WebSetting);
    const activeLanguage = useSelector(state => state.LanguageSettings?.active_language);
    const text = translations[activeLanguage?.toLowerCase().startsWith('de') ? 'de' : 'en'];
    const data = userData?.data;

    const saveEssentialUserCookies = () => {
        if (typeof window === 'undefined') return;
        const options = { expires: CONSENT_EXPIRY_DAYS, sameSite: 'Lax', secure: window.location.protocol === 'https:' };
        if (data?.name) Cookies.set('user-name', data.name, options);
        if (data?.email) Cookies.set('user-email', data.email, options);
        if (data?.mobile) Cookies.set('user-number', data.mobile, options);
        if (userData?.jwtToken) Cookies.set('user-token', userData.jwtToken, options);
        if (websettings?.fcmToken) Cookies.set('user-fcmId', websettings.fcmToken, options);
        if (data?.logintype) Cookies.set('user-loginType', data.logintype, options);
    };

    const finish = (level, next) => {
        setPreferences(next);
        setConsent(level, CONSENT_EXPIRY_DAYS, next);
        saveEssentialUserCookies();
        setShowPopup(false);
    };

    useEffect(() => {
        const initializeConsent = window.setTimeout(() => {
            setPreferences(getConsentPreferences());
            if (!getConsentLevel()) setShowPopup(true);
        }, 0);
        return () => window.clearTimeout(initializeConsent);
    }, []);

    useEffect(() => {
        if (userData?.jwtToken && getConsentLevel()) saveEssentialUserCookies();
    }, [userData?.jwtToken]);

    if (!showPopup) return (
        <button type="button" onClick={() => { setPreferences(getConsentPreferences()); setShowDetails(true); setShowPopup(true); }}
            className="fixed bottom-4 left-4 z-[998] grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl"
            aria-label={text.settings} title={text.settings}><BiCookie size={22} /></button>
    );

    const logo = websettings?.data?.web_logo || websettings?.data?.header_logo || websettings?.data?.logo;

    return (
        <div className="fixed inset-0 z-[999] flex items-end justify-center bg-slate-950/45 p-3 backdrop-blur-[3px] sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="ximmo-cookie-title">
            <div className="relative w-full max-w-[680px] overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_28px_90px_rgba(15,23,42,.28)]">
                <div className="absolute inset-x-0 top-0 h-1 primaryBg" />
                <div className="relative max-h-[calc(100vh-24px)] overflow-y-auto p-5 sm:max-h-[calc(100vh-48px)] sm:p-7">
                    {getConsentLevel() && <button type="button" onClick={() => setShowPopup(false)} className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200" aria-label={text.close}><BiX size={23} /></button>}
                    <div className="flex items-start gap-4 pr-8">
                        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-sky-100 bg-sky-50 shadow-sm">
                            {/* The logo URL is administered remotely and already serves its full-resolution asset. */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {logo ? <img src={logo} alt="Ximmo24" className="h-full w-full object-contain p-1.5" /> : <BiShieldQuarter size={28} className="primaryColor" />}
                        </div>
                        <div>
                            <div className="mb-1 flex flex-wrap items-center gap-2"><span className="text-xs font-bold uppercase tracking-[.16em] primaryColor">{text.eyebrow}</span><span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700"><BiLockAlt />{text.badge}</span></div>
                            <h2 id="ximmo-cookie-title" className="text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">{text.title}</h2>
                        </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-[15px]">{text.description}</p>

                    {showDetails && <div className="mt-5 space-y-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-2">
                        <div className="flex items-center justify-between gap-4 rounded-xl bg-white p-3"><div><p className="flex items-center gap-2 font-bold text-slate-900"><BiCheck className="text-emerald-600" />{text.necessary}</p><p className="mt-0.5 text-xs text-slate-500">{text.necessaryText}</p></div><span className="shrink-0 text-xs font-bold text-emerald-700">{text.always}</span></div>
                        {[
                            ['analytics', text.analytics, text.analyticsText],
                            ['advertising', text.advertising, text.advertisingText],
                        ].map(([key, label, description]) => <label key={key} className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-white p-3"><span><span className="block font-bold text-slate-900">{label}</span><span className="mt-0.5 block text-xs text-slate-500">{description}</span></span><span className={`relative h-7 w-12 shrink-0 rounded-full transition ${preferences[key] ? 'primaryBg' : 'bg-slate-300'}`}><input type="checkbox" className="sr-only" checked={preferences[key]} onChange={event => setPreferences(current => ({ ...current, [key]: event.target.checked }))} /><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${preferences[key] ? 'left-6' : 'left-1'}`} /></span></label>)}
                    </div>}

                    <button type="button" onClick={() => setShowDetails(value => !value)} className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-slate-700 hover:text-slate-950">{text.details}<BiChevronDown className={`transition ${showDetails ? 'rotate-180' : ''}`} /></button>
                    <div className="mt-5 grid gap-2 sm:grid-cols-2">
                        <button type="button" onClick={() => finish(CONSENT.ALL, { analytics: true, advertising: true })} className="primaryBg rounded-xl px-5 py-3.5 text-sm font-bold text-white shadow-lg hover:brightness-95">{text.acceptAll}</button>
                        {showDetails ? <button type="button" onClick={() => finish(preferences.analytics || preferences.advertising ? CONSENT.CUSTOM : CONSENT.NECESSARY, preferences)} className="rounded-xl border-2 border-slate-900 bg-white px-5 py-3 text-sm font-bold text-slate-900 hover:bg-slate-50">{text.save}</button> : <button type="button" onClick={() => finish(CONSENT.NECESSARY, { analytics: false, advertising: false })} className="rounded-xl border-2 border-slate-900 bg-white px-5 py-3 text-sm font-bold text-slate-900 hover:bg-slate-50">{text.necessaryOnly}</button>}
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500"><Link href="/privacy-policy" className="font-semibold underline decoration-slate-300 underline-offset-4 hover:text-slate-950">{text.privacy}</Link><button type="button" onClick={() => finish(CONSENT.REJECTED, { analytics: false, advertising: false })} className="font-semibold hover:text-slate-950">{text.reject}</button></div>
                </div>
            </div>
        </div>
    );
};

export default CookieComponent;
