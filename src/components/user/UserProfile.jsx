"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import ImageWithPlaceholder from "../image-with-placeholder/ImageWithPlaceholder";
import { useTranslation } from "../context/TranslationContext";
import CustomLocationAutocomplete from "../location-search/CustomLocationAutocomplete";
import { extractAddressComponents } from "@/utils/helperFunction";
import { getUserProfileApi, updateUserProfileApi, getMapDetailsApi } from "@/api/apiRoutes";
import { updateUserProfile } from "@/redux/slices/authSlice";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import PhoneInput from "react-phone-input-2";
import { PhoneNumberUtil } from "google-libphonenumber";
import { getPhoneInputConfig } from '@/utils/phoneUtils';
import { BiSolidImageAdd } from "react-icons/bi";
import { FaUser } from "react-icons/fa";
import { HiOutlineMapPin } from "react-icons/hi2";
import ButtonLoader from "../ui/loaders/ButtonLoader";
import VerifyUserCTA from "./VerifyUserCTA";

const LocationPickerModal = dynamic(
    () => import("../agent/LocationPickerModal"),
    {
        ssr: false,
        loading: () => null,
    },
);

const phoneUtil = PhoneNumberUtil.getInstance();
const getIsoFromDialCode = (dialCode) => {
    if (!dialCode) return process.env.NEXT_PUBLIC_DEFAULT_COUNTRY?.toLowerCase() || 'us';
    try {
        return phoneUtil.getRegionCodeForCountryCode(parseInt(dialCode, 10))?.toLowerCase()
            || process.env.NEXT_PUBLIC_DEFAULT_COUNTRY?.toLowerCase() || 'us';
    } catch {
        return process.env.NEXT_PUBLIC_DEFAULT_COUNTRY?.toLowerCase() || 'us';
    }
};

const buildFormData = (data = {}) => ({
    firstName: data?.name || "",
    email: data?.email || "",
    phone:
        data?.country_code && data?.mobile
            ? `${data.country_code}${data.mobile}`
            : data?.mobile || "",
    countryCode: data?.country_code || "",
    location: "",
    latitude: data?.latitude || null,
    longitude: data?.longitude || null,
    address: data?.address || "",
    city: data?.city || "",
    state: data?.state || "",
    country: data?.country || "",
    about_me: data?.about_me || "",
    profileImage: null,
});

const UserProfile = () => {
    const t = useTranslation();
    const dispatch = useDispatch();
    const fileInputRef = useRef(null);
    const userData = useSelector((state) => state.User?.data);
    const webSettings = useSelector((state) => state.WebSetting?.data);
    const activeLanguage = useSelector(
        (state) => state.LanguageSettings?.active_language,
    );

    const [formData, setFormData] = useState(() => buildFormData(userData));
    const [previewImage, setPreviewImage] = useState(userData?.profile || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [phoneCountry, setPhoneCountry] = useState(() => getIsoFromDialCode(userData?.country_code));

    const fetchAddressFromCoordinates = async (lat, lng) => {
        try {
            const response = await getMapDetailsApi({
                latitude: lat.toString(),
                longitude: lng.toString(),
                place_id: "",
            });

            if (response?.error === false && response?.data?.result) {
                const firstResult = response.data.result;
                const addressData = extractAddressComponents(firstResult);
                const formattedAddress = addressData.formattedAddress || firstResult.formatted_address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

                setFormData((previous) => ({
                    ...previous,
                    location: formattedAddress,
                    city: addressData.city || previous.city,
                    state: addressData.state || previous.state,
                    country: addressData.country || previous.country,
                }));
            } else {
                const coordString = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                setFormData((previous) => ({
                    ...previous,
                    location: coordString,
                }));
            }
        } catch (error) {
            const coordString = `${lat?.toFixed(6)}, ${lng?.toFixed(6)}`;
            setFormData((previous) => ({
                ...previous,
                location: coordString,
            }));
            toast.error(t("locationError"));
        }
    };

    const profileQuery = useQuery({
        queryKey: ["userProfile", activeLanguage],
        queryFn: async () => {
            const response = await getUserProfileApi();

            if (response?.error) {
                throw new Error(response?.message || t("somethingWentWrong"));
            }

            dispatch(updateUserProfile({ data: response.data }));

            return response?.data || response;
        },
        staleTime: 0,
        // refetchOnWindowFocus: false,
        // refetchOnReconnect: false,
        // refetchOnMount: true,
        // retry: 2,
    });

    const profileData = profileQuery.data || userData;
    const isLoadingProfile = profileQuery.isLoading && !profileData;

    useEffect(() => {
        if (!profileData) return;

        setFormData(buildFormData(profileData));
        setPreviewImage(profileData?.profile || "");
        if (profileData?.country_code) setPhoneCountry(getIsoFromDialCode(profileData.country_code));
    }, [profileData]);

    useEffect(() => {
        if (profileData?.latitude && profileData?.longitude) {
            fetchAddressFromCoordinates(profileData.latitude, profileData.longitude);
        }
    }, [profileData?.latitude, profileData?.longitude]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData((previous) => ({ ...previous, [name]: value }));
    };

    const handleImageUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setFormData((previous) => ({ ...previous, profileImage: file }));

        const reader = new FileReader();
        reader.onloadend = () => setPreviewImage(reader.result);
        reader.readAsDataURL(file);
    };

    const handlePlaceSelect = (placeData) => {
        try {
            if (!placeData) return;

            const { city, state, country, formattedAddress } =
                extractAddressComponents(placeData);

            setFormData((previous) => ({
                ...previous,
                location: formattedAddress || previous.location,
                city: city || previous.city,
                state: state || previous.state,
                country: country || previous.country,
                latitude: placeData.latitude || previous.latitude,
                longitude: placeData.longitude || previous.longitude,
            }));
        } catch (error) {
            toast.error(t("locationError"));
        }
    };

    const handleLocationFromModal = (locationData) => {
        setFormData((previous) => ({
            ...previous,
            location: locationData.location,
            city: locationData.city,
            state: locationData.state,
            country: locationData.country,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
        }));
    };

    const handlePhoneNumberChange = (value, data) => {
        setFormData((previous) => ({
            ...previous,
            phone: value,
            countryCode: data?.dialCode || previous.countryCode,
        }));
        if (data?.countryCode) setPhoneCountry(data.countryCode);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleSubmit = async (event) => {
        event?.preventDefault();

        if (webSettings?.demo_mode && profileData?.is_demo_user) {
            Swal.fire({
                title: t("oops"),
                text: t("notAllowdDemo"),
                icon: "warning",
                showCancelButton: false,
                customClass: {
                    confirmButton: "Swal-confirm-buttons",
                    cancelButton: "Swal-cancel-buttons",
                },
                confirmButtonText: t("ok"),
            });
            return;
        }

        if (!previewImage && !profileData?.profile) {
            toast.error(t("profilePictureRequired"));
            return;
        }

        if (!formData.phone) {
            toast.error(t("phoneNumberIsRequired"));
            return;
        }

        const countryCodeDigitsOnly =
            formData?.countryCode?.replace(/\D/g, "") || "";
        const startsWithCountryCode =
            countryCodeDigitsOnly &&
            formData?.phone?.startsWith(countryCodeDigitsOnly);
        const formattedNumber = startsWithCountryCode
            ? formData.phone.substring(countryCodeDigitsOnly.length)
            : formData.phone;

        const rawPhoneNumber = `+${formData?.countryCode || ""}${formattedNumber}`;

        let phone;
        try {
            phone = phoneUtil.parseAndKeepRawInput(rawPhoneNumber, "ZZ");

            if (!phoneUtil.isValidNumber(phone)) {
                toast.error(t("invalidPhoneNumber"));
                return;
            }
        } catch (error) {
            toast.error(
                error?.message?.includes("Invalid country calling code")
                    ? t("invalidCountryCode")
                    : t("invalidPhoneNumberFormat"),
            );
            return;
        }

        const countryCode = String(phone.getCountryCode());
        // const mobile = phone.getNationalNumber().toString();
        const mobile = formattedNumber;

        setIsSubmitting(true);
        try {
            const response = await updateUserProfileApi({
                userid: profileData?.id || userData?.id || "",
                name: formData.firstName,
                email: formData.email,
                mobile,
                address: formData.address,
                firebase_id: profileData?.firebase_id || userData?.firebase_id || "",
                logintype: profileData?.logintype || userData?.logintype || "",
                profile: formData.profileImage || undefined,
                latitude: formData.latitude || "",
                longitude: formData.longitude || "",
                about_me: formData.about_me,
                city: formData.city,
                state: formData.state,
                country: formData.country,
                country_code: countryCode,
            });

            if (response?.data) {
                dispatch(updateUserProfile({ data: response.data }));
                setPreviewImage(response.data?.profile || previewImage);
                setFormData(buildFormData(response.data));
                toast.success(t("profileUpdatedSuccessfully"));
                await profileQuery.refetch();
                return;
            }

            toast.error(t("profileUpdateFailed"));
        } catch (error) {
            toast.error(t("profileUpdateFailed"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const phoneConfig = getPhoneInputConfig(phoneCountry);

    if (isLoadingProfile) {
        return <Skeleton className="h-[720px] w-full rounded-2xl" />;
    }

    return (
        <div className="min-h-[640px] bg-[#f7f9fc]">
            <form onSubmit={handleSubmit}>
                <header className="flex flex-col gap-4 border-b border-slate-100 bg-white px-5 py-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] primaryColor">
                            <span className="primaryBg h-2 w-2 rounded-full" />
                            Ximmo24
                        </div>
                        <h1 className="text-2xl font-black tracking-[-0.035em] text-slate-950 sm:text-3xl">
                            {t("myProfile")}
                        </h1>
                    </div>
                    <Button
                        type="submit"
                        className="primaryBg h-12 w-full rounded-xl px-7 text-sm font-extrabold text-white shadow-[0_12px_30px_rgba(15,23,42,0.12)] transition-all hover:-translate-y-0.5 hover:brightness-95 sm:w-auto sm:text-base"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <ButtonLoader />
                                {t("updating")}
                            </span>
                        ) : (
                            t("updateProfile")
                        )}
                    </Button>
                </header>

                <div className="grid items-start gap-5 p-4 sm:p-6 lg:p-7 xl:grid-cols-[300px_minmax(0,1fr)]">
                    <aside className="overflow-hidden rounded-[24px] bg-[#071426] text-white shadow-[0_20px_55px_rgba(15,23,42,0.16)] xl:sticky xl:top-24">
                        <div className="relative overflow-hidden p-6">
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-40 blur-3xl"
                                style={{ backgroundColor: "var(--primary-color)" }}
                            />
                            <div className="relative flex flex-col items-center text-center">
                                <div className="relative">
                                    <div className="h-28 w-28 overflow-hidden rounded-[30px] border-2 border-white/20 bg-white/10 shadow-2xl">
                                        {previewImage ? (
                                            <ImageWithPlaceholder
                                                src={previewImage}
                                                alt={profileData?.name || t("profilePicture")}
                                                width={112}
                                                height={112}
                                                sizes="112px"
                                                quality={95}
                                                unoptimized
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-slate-300">
                                                <FaUser size={36} />
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleUploadClick}
                                        aria-label={t("uploadProfile")}
                                        className="primaryBg absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-xl border-4 border-[#071426] text-white shadow-lg transition-transform hover:scale-105"
                                    >
                                        <BiSolidImageAdd className="h-5 w-5" />
                                    </button>
                                </div>
                                <h2 className="mt-5 max-w-full truncate text-xl font-black">{profileData?.name || t("myProfile")}</h2>
                                <p className="mt-1 max-w-full truncate text-sm text-slate-400">{profileData?.email}</p>
                                <button
                                    type="button"
                                    onClick={handleUploadClick}
                                    className="mt-5 w-full rounded-xl border border-white/15 bg-white/[0.08] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/[0.13]"
                                >
                                    {t("uploadProfile")}
                                </button>
                                <input
                                    ref={fileInputRef}
                                    id="profileImage"
                                    name="profileImage"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                                <p className="mt-3 text-xs leading-5 text-slate-400">{t("profilePictureNote")}</p>
                            </div>
                        </div>
                    </aside>

                    <div className="min-w-0 space-y-5">
                        {profileQuery.isError && !profileData ? (
                            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                                {profileQuery.error?.message || t("somethingWentWrong")}
                            </div>
                        ) : null}

                        <VerifyUserCTA />

                        <section className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)] sm:p-7">
                            <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
                                <span className="primaryBgLight12 primaryColor flex h-11 w-11 items-center justify-center rounded-2xl">
                                    <FaUser className="h-5 w-5" />
                                </span>
                                <h2 className="text-lg font-black text-slate-900">{t("myProfile")}</h2>
                            </div>

                            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                                <div className="flex flex-col gap-2">
                                    <Label className="text-sm font-bold text-slate-700">
                                        {t("fullName")} <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        placeholder={t("enterFullName")}
                                        className="h-14 rounded-xl border-slate-200 bg-slate-50 px-4 text-base text-slate-900 shadow-none transition-colors focus-visible:primaryBorderColor focus-visible:ring-0"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label className="text-sm font-bold text-slate-700">
                                        {t("emailAddress")} <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        disabled={profileData?.logintype != "1"}
                                        placeholder={t("enterEmail")}
                                        className="h-14 rounded-xl border-slate-200 bg-slate-50 px-4 text-base text-slate-900 shadow-none disabled:cursor-not-allowed disabled:opacity-60 focus-visible:primaryBorderColor focus-visible:ring-0"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label className="text-sm font-bold text-slate-700">
                                        {t("phoneNumber")} <span className="text-red-500">*</span>
                                    </Label>
                                    <PhoneInput
                                        country={process.env.NEXT_PUBLIC_DEFAULT_COUNTRY?.toLowerCase()}
                                        enableAreaCodes
                                        enableSearch
                                        searchPlaceholder={t("search")}
                                        value={formData.phone}
                                        onChange={handlePhoneNumberChange}
                                        containerClass="w-full"
                                        inputClass="!h-14 !w-full !rounded-r-xl !border-slate-200 !bg-slate-50 !pl-14 !text-base !text-slate-900"
                                        buttonClass="!h-14 !rounded-l-xl !border-slate-200 !bg-slate-50"
                                        disabled={profileData?.logintype == "1"}
                                        inputProps={{ name: "phone", id: "phone", required: true, maxLength: phoneConfig.maxLength }}
                                        enableLongNumbers={phoneConfig.enableLongNumbers}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label className="text-sm font-bold text-slate-700">
                                        {t("location")} <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="flex items-end gap-2">
                                        <CustomLocationAutocomplete
                                            value={formData.location}
                                            onChange={handleInputChange}
                                            onPlaceSelect={handlePlaceSelect}
                                            placeholder={t("searchLocation")}
                                            className="h-14 rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900 focus:outline-none focus:primaryBorderColor"
                                            debounceMs={1000}
                                            maxResults={10}
                                            inputProps={{ name: "location" }}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            aria-label={t("selectLocation")}
                                            className="primaryBgLight12 primaryColor h-14 w-14 shrink-0 rounded-xl border-0"
                                            onClick={() => setIsLocationModalOpen(true)}
                                        >
                                            <HiOutlineMapPin className="h-6 w-6" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 lg:col-span-2">
                                    <Label className="text-sm font-bold text-slate-700">
                                        {t("address")} <span className="text-red-500">*</span>
                                    </Label>
                                    <Textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder={t("enterYourAddress")}
                                        className="min-h-32 resize-none rounded-xl border-slate-200 bg-slate-50 px-4 py-4 text-base text-slate-900 shadow-none focus-visible:primaryBorderColor focus-visible:ring-0"
                                        required
                                    />
                                </div>
                            </div>
                        </section>

                        <div className="flex justify-end rounded-[22px] border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
                            <Button
                                type="submit"
                                className="primaryBg h-12 w-full rounded-xl px-8 text-base font-extrabold text-white transition-all hover:brightness-95 sm:w-auto"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <ButtonLoader />
                                        {t("updating")}
                                    </span>
                                ) : (
                                    t("updateProfile")
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>

            <LocationPickerModal
                isOpen={isLocationModalOpen}
                onClose={() => setIsLocationModalOpen(false)}
                onLocationSelect={handleLocationFromModal}
                initialLocation={{
                    location: formData.location,
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                    city: formData.city,
                    state: formData.state,
                    country: formData.country,
                }}
            />
        </div>
    );
};

export default UserProfile;
