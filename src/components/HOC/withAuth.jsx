"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Loader from "@/components/ui/loaders/Loader";
import Swal from "sweetalert2";
import { useTranslation } from "@/components/context/TranslationContext";
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { useSelector } from 'react-redux';
import toast from "react-hot-toast";

const withAuth = (WrappedComponent) => {
    const Wrapper = (props) => {
        const t = useTranslation()
        const router = useRouter();
        const { lang } = router?.query;

        const isUserLoggedIn = useAuthStatus();

        // Use useSelector instead of direct store.getState() to prevent undefined access
        const userData = useSelector(state => state?.User?.data);
        const hasSubscription = useSelector(state => state?.WebSetting?.data?.subscription);
        const isPremiumUser = useSelector(state => state?.WebSetting?.data?.is_premium);

        const [isAuthorized, setIsAuthorized] = useState(false);
        const [authChecked, setAuthChecked] = useState(false);
        const wasLoggedInRef = useRef(isUserLoggedIn);
        const loginToastShownRef = useRef(false);

        useEffect(() => {
            if (!router.isReady) {
                return;
            }

            const currentPath = router.asPath?.split("?")?.[0] || "";

            // Base private routes without dynamic slugs
            const privateRoutes = [
                "/user",
                "/agent",
                "/my-property",
                "/my-project",
                "/all-personalized-feeds",
                "/become-agent-form",
                "/become-agent"
            ];

            // Updated subscription routes to support dynamic slugs
            const subscriptionRoutes = ["/user/properties", "/user/add-project"];

            const premiumUserRoutes = [
                // `/project-details/lang=${lang}`, // Base path for dynamic slugs
                "/property-details"  // Base path for dynamic slugs
            ];

            // Check if current path exactly matches one of the private routes
            const isPrivateRoute = privateRoutes.some((route) =>
                currentPath === route || currentPath.startsWith(`${route}/`)
            );

            // const isPremiumUserRoute = premiumUserRoutes.some((route) =>
            //     currentPath === route || currentPath.startsWith(`${route}/`)
            // );

            if (isPrivateRoute && !isUserLoggedIn) {
                const lostAuthAfterBeingLoggedIn = wasLoggedInRef.current;

                if (!lostAuthAfterBeingLoggedIn && !loginToastShownRef.current) {
                    toast.error(t("pleaseLoginToAccess"));
                    loginToastShownRef.current = true;
                }

                setIsAuthorized(false);
                setAuthChecked(true);
                router.push(`/?lang=${lang}`);
                return;
            }
            // else if (isPremiumUserRoute && !isPremiumUser) {
            //     setIsAuthorized(false);
            //     Swal.fire({
            //         title: t("oops"),
            //         text: t("notPremiumUser"),
            //         icon: "warning",
            //         allowOutsideClick: false,
            //         showCancelButton: false,
            //         customClass: {
            //             confirmButton: "Swal-confirm-buttons",
            //             cancelButton: "Swal-cancel-buttons",
            //         },
            //         confirmButtonText: t("ok"),
            //     }).then((result) => {
            //         if (result.isConfirmed) {
            //             router.push(`/?lang=${lang}`);
            //         }
            //     });
            //     setAuthChecked(true);
            //     return;
            // } 
            else {
                setIsAuthorized(true);
            }

            setAuthChecked(true);
            wasLoggedInRef.current = isUserLoggedIn;

            if (isUserLoggedIn || !isPrivateRoute) {
                loginToastShownRef.current = false;
            }
        }, [userData, router, hasSubscription, isPremiumUser, isUserLoggedIn, lang, t]);

        if (!authChecked) {
            return <Loader />;
        }

        return isAuthorized ? <WrappedComponent {...props} /> : null;
    };

    return Wrapper;
};

export default withAuth;
