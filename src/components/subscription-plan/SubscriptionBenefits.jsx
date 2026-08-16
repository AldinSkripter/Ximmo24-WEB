import React from "react";
import { useTranslation } from "../context/TranslationContext";
import { SubscriptionTable } from "./SubscriptionTable";

const SubscriptionBenefits = ({ packages = [], features = [], page = "", currencySymbol = "" }) => {
    const t = useTranslation();

    if (page !== "become-agent" || !packages.length || !features.length) {
        return null;
    }

    return (
        <section className="primaryBackgroundBg w-full">
            <div className="container mx-auto pt-12">
                <div className="text-center">
                    <h2 className="text-xl font-bold brandColor md:text-2xl lg:text-3xl xl:text-4xl mb-2">
                        {t("comparePlansAndFeatures")}
                    </h2>
                    <p className="text-base font-medium leadColor max-w-md mx-auto">{t("comparePlansAndFeaturesDescription")}</p>
                </div>
                <div className="mt-8">
                    <SubscriptionTable packages={packages} features={features} currencySymbol={currencySymbol} />
                </div>
            </div>
        </section>
    );
};

export default SubscriptionBenefits;
