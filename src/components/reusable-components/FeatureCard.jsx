import { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from '@/components/context/TranslationContext';
import Swal from 'sweetalert2';
import { PackageTypes } from '@/utils/checkPackages/packageTypes';
import { useSelector } from 'react-redux';
import { handlePackageCheck } from '@/utils/helperFunction';
import { AdFeatureIcon } from '@/assets/svg';

const FeatureCard = ({ propertyId, isProject = false, handleRefresh }) => {
    const t = useTranslation();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const webSettings = useSelector(state => state.WebSetting?.data);
    const user = useSelector(state => state.User?.data);

    const handleFeatureClick = (e) => {
        if (webSettings?.demo_mode === true && user?.is_demo_user) {
            Swal.fire({
                title: t("opps"),
                text: t("notAllowdDemo"),
                icon: "warning",
                showCancelButton: false,
                customClass: {
                    confirmButton: "Swal-buttons",
                },
                confirmButtonText: t("ok"),
            });
            return false;
        }
        if (isProject) {
            handlePackageCheck(e, PackageTypes.PROJECT_FEATURE, router, propertyId, null, null, true, t, router?.asPath?.includes("/my-project") ? true : false);
        } else {
            handlePackageCheck(e, PackageTypes.PROPERTY_FEATURE, router, propertyId, null, true, false, t, router?.asPath?.includes("/my-property") ? true : false);
        }
        handleRefresh();
    };

    return (
        <div className="w-full mb-7 overflow-hidden border border-gray-200 rounded-2xl">
            <h2 className="text-base font-extrabold blackTextColor border-b p-5">
                {isProject ? t("featuredAdProject") : t("featuredAdProperty")}
            </h2>

            <div className="p-4 space-y-4">
                <div className="flex items-center gap-4">
                    <AdFeatureIcon color={webSettings?.system_color} className="h-12 w-12 object-contain" />
                    <p className="text-sm font-medium text-gray-700">
                        {isProject ? t("dontWaitFeatureYourProject") : t("dontWaitFeatureYourAd")}
                    </p>
                </div>

                <button
                    onClick={handleFeatureClick}
                    disabled={isLoading}
                    className="w-full h-11 text-base font-medium border-none text-white brandBg rounded-lg transition-all hover:opacity-90"
                >
                    {isLoading ? t("processing") : t("featureNow")}
                </button>
            </div>
        </div>
    );
};

export default FeatureCard; 