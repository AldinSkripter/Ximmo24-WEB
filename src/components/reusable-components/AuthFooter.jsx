import CustomLink from "../context/CustomLink";
import { useTranslation } from "@/components/context/TranslationContext";

const AuthFooter = ({ setShowLogin }) => {
    const t = useTranslation();
    return (
        <div className="text-center text-xs sm:text-sm md:text-base">
            <span>{t("byClick")} </span>
            <span className="inline-flex flex-wrap justify-center">
                <CustomLink onClick={() => setShowLogin(false)} href={"/terms-and-conditions"} className="primaryColor hover:underline">
                    {t("terms&Conditions")}
                </CustomLink>
                <span className="mx-1">{t("and")}</span>
                <CustomLink onClick={() => setShowLogin(false)} href={"/privacy-policy"} className="primaryColor hover:underline">
                    {t("privacyPolicy")}
                </CustomLink>
            </span>
        </div>
    );
};

export default AuthFooter;