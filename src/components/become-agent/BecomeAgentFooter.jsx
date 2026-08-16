import React from 'react';
import { useTranslation } from '../context/TranslationContext';
import { useSelector } from 'react-redux';

const BecomeAgentFooter = () => {
    const t = useTranslation();
    const webSettings = useSelector((state) => state.WebSetting?.data);
    const companyName = webSettings?.company_name;
    const currentYear = new Date().getFullYear();
    return (
        <footer className="w-full bg-black py-4 flex justify-center items-center">
            <p className="text-white text-xs font-light">
                {t("copyright")} &copy; {currentYear} {companyName}.{" "}
                {t("allRightsReserved")}
            </p>
        </footer>
    );
};

export default BecomeAgentFooter;
