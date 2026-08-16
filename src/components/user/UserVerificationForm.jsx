"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { FiCheck } from "react-icons/fi";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "../context/TranslationContext";
import {
    getUserProfileApi,
    getUserVerificationFieldsApi,
    getUserVerificationValuesApi,
    submitUserVerificationApi,
} from "@/api/apiRoutes";
import { updateUserProfile } from "@/redux/slices/authSlice";

const UserVerificationForm = () => {
    const t = useTranslation();
    const router = useRouter();
    const dispatch = useDispatch();
    const { lang } = router?.query;
    const userData = useSelector((state) => state.User?.data);
    const verificationStatus = String(userData?.user_verification_status || "").toLowerCase();
    const isVerified = userData?.is_user_verified === true || verificationStatus === "approved";
    const isVerificationPending = verificationStatus === "pending";

    const [formData, setFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

    const normalizeFields = (data) => {
        if (!Array.isArray(data)) return [];

        const isFlatArray = data.some((item) => item?.field_type) && !data.some((item) => item?.user_verification_forms);

        if (isFlatArray) {
            return data.map((field) => ({
                id: field.id,
                name: field.name,
                label: field.translated_name || field.name,
                type: field.field_type || "text",
                placeholder: field.placeholder || `Enter ${field.translated_name || field.name}`,
                required: field.required === 1 || field.required === true,
                form_fields_values: (field.form_fields_values || []).map((option) => ({
                    ...option,
                    translated_value: option.translated_value ?? option.value,
                })),
            }));
        }

        return data.flatMap((section) =>
            (section.user_verification_forms || section.agent_verification_forms || []).map((field) => ({
                id: field.id,
                name: field.name,
                label: field.translated_name || field.name,
                type: field.field_type || "text",
                placeholder: field.placeholder || `Enter ${field.translated_name || field.name}`,
                required: field.required === 1 || field.required === true,
                form_fields_values: (field.form_fields_values || []).map((option) => ({
                    ...option,
                    translated_value: option.translated_value ?? option.value,
                })),
            })),
        );
    };

    const formQuery = useQuery({
        queryKey: ["userVerificationForm"],
        queryFn: async () => {
            const response = await getUserVerificationFieldsApi({});
            return response?.data || [];
        },
    });

    const formValuesQuery = useQuery({
        queryKey: ["userVerificationFormValues"],
        queryFn: async () => {
            const response = await getUserVerificationValuesApi({});
            return response?.data || {};
        },
    });

    const fields = useMemo(() => normalizeFields(formQuery.data), [formQuery.data]);

    useEffect(() => {
        if (!router.isReady) return;

        if (isVerified) {
            setIsRedirecting(true);
            toast.success(t("userVerificationApprovedMessage"));
            router.replace(`/user/profile?lang=${lang || "en"}`);
            return;
        }

        if (isVerificationPending) {
            setIsRedirecting(true);
            toast.error(t("userVerificationPendingMessage"));
            router.replace(`/user/profile?lang=${lang || "en"}`);
        }
    }, [isVerified, isVerificationPending, lang, router, t]);

    useEffect(() => {
        if (!isDataLoaded && formValuesQuery.data) {
            const values =
                formValuesQuery.data?.verify_customer_values ||
                formValuesQuery.data?.user_verification_values ||
                formValuesQuery.data?.values ||
                [];

            const fieldById = {};
            fields.forEach((field) => {
                fieldById[field.id] = field;
            });

            const initialData = {};
            values.forEach((item) => {
                const fieldId =
                    item.verify_customer_form_id ||
                    item.user_verification_form_id ||
                    item.agent_verification_form_id ||
                    item.verify_form?.id ||
                    item.user_form?.id;
                const field = fieldById[fieldId];
                const name = field?.name || item.verify_form?.name || item.user_form?.name;

                if (name && item.value != null) {
                    initialData[name] = item.value;
                }
            });

            if (Object.keys(initialData).length > 0) {
                setFormData(initialData);
                setIsDataLoaded(true);
            } else if (!formValuesQuery.isLoading) {
                setIsDataLoaded(true);
            }
        }
    }, [formValuesQuery.data, formValuesQuery.isLoading, fields, isDataLoaded]);

    if (isRedirecting) {
        return null;
    }

    const getFieldValue = (field) => {
        const value = formData[field.name];

        if (field.type === "checkbox") {
            return Array.isArray(value) ? value.join(",") : "";
        }

        if (field.type === "file") {
            return value instanceof File ? value : value || "";
        }

        return value ?? "";
    };

    const validateFields = () => {
        for (const field of fields) {
            if (!field.required) continue;

            if (field.type === "checkbox") {
                const raw = formData[field.name];
                if (!Array.isArray(raw) || raw.length === 0) {
                    toast.error(`${field.label} ${t("isRequired")}`);
                    return false;
                }
                continue;
            }

            if (field.type === "file") {
                if (!formData[field.name]) {
                    toast.error(`${field.label} ${t("isRequired")}`);
                    return false;
                }
                continue;
            }

            const value = formData[field.name];
            if (value === undefined || value === null || value === "") {
                toast.error(`${field.label} ${t("isRequired")}`);
                return false;
            }
        }

        return true;
    };

    const fetchUserData = async () => {
        try {
            const response = await getUserProfileApi();
            if (response?.data) {
                dispatch(updateUserProfile({ data: response.data }));
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    const handleSubmit = async () => {
        const formFields = fields.map((field) => ({
            id: field.id,
            value: getFieldValue(field),
        }));

        const filteredFields = formFields.filter(
            (field) => field.value !== null && field.value !== undefined && field.value !== "",
        );

        setIsSubmitting(true);

        try {
            const response = await submitUserVerificationApi({
                form_fields: filteredFields,
            });

            if (!response?.error) {
                toast.success(t(response?.message || "success"));
                await fetchUserData();
                router.push(`/user/profile?lang=${lang || "en"}`);
                return;
            }

            toast.error(t(response?.message || "errorOccurred"));
        } catch (error) {
            console.error("Submission error:", error);
            toast.error(t(error?.message || "errorOccurred"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData((previous) => ({ ...previous, [name]: value }));
    };

    const handleFileChange = (event) => {
        const { name, files } = event.target;

        if (files && files.length > 0) {
            setFormData((previous) => ({ ...previous, [name]: files[0] }));
        } else if (files && files.length === 0) {
            setFormData((previous) => ({ ...previous, [name]: null }));
        }
    };

    const handleToggleChange = (event) => {
        const { name, checked, type, value } = event.target;

        if (type === "checkbox" && value) {
            setFormData((previous) => {
                const existing = previous[name] || [];

                if (checked) {
                    return { ...previous, [name]: [...existing, value] };
                }

                return { ...previous, [name]: existing.filter((item) => item !== value) };
            });
            return;
        }

        setFormData((previous) => ({ ...previous, [name]: checked }));
    };

    const renderField = (field) => {
        switch (field.type) {
            case "number":
            case "text":
                return (
                    <div className="flex flex-col gap-2 w-full" key={field.name}>
                        <label className="text-md font-medium leadColor">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <input
                            type={field.type}
                            name={field.name}
                            value={formData[field.name] || ""}
                            onChange={handleInputChange}
                            placeholder={field.placeholder}
                            required={field.required}
                            className="w-full primaryBackgroundBg newBorder outline-none rounded-lg px-4 text-md h-14"
                        />
                    </div>
                );
            case "textarea":
                return (
                    <div className="flex flex-col gap-2 w-full" key={field.name}>
                        <label className="text-md font-medium leadColor">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <textarea
                            name={field.name}
                            value={formData[field.name] || ""}
                            onChange={handleInputChange}
                            placeholder={field.placeholder}
                            required={field.required}
                            rows={4}
                            className="w-full primaryBackgroundBg newBorder outline-none rounded-lg p-4 text-md resize-none h-32"
                        />
                    </div>
                );
            case "phone":
                return (
                    <div className="flex flex-col gap-2 w-full" key={field.name}>
                        <label className="text-md font-medium leadColor">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <input
                            type="tel"
                            name={field.name}
                            value={formData[field.name] || ""}
                            onChange={handleInputChange}
                            placeholder={field.placeholder}
                            required={field.required}
                            className="w-full primaryBackgroundBg newBorder outline-none rounded-lg px-4 text-md h-14"
                        />
                    </div>
                );
            case "radio":
                return (
                    <div className="flex flex-col gap-2 w-full" key={field.name}>
                        <label className="text-md font-medium leadColor">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <div className="flex flex-row flex-wrap gap-4">
                            {field.form_fields_values?.map((option, optionIndex) => {
                                const optionValue = option.translated_value || option.value;
                                const isChecked = formData[field.name] === option.value;

                                return (
                                    <div key={`radio_${option?.id}_${optionIndex}`} className="flex items-center max-w-full">
                                        <input
                                            type="radio"
                                            id={`radio_${option?.id}_${optionIndex}`}
                                            name={field.name}
                                            className="hidden"
                                            value={option.value}
                                            checked={isChecked}
                                            onChange={handleInputChange}
                                        />
                                        <label
                                            htmlFor={`radio_${option?.id}_${optionIndex}`}
                                            className="flex items-center gap-3 w-fit max-w-full min-h-14 px-4 primaryBackgroundBg newBorder rounded-lg cursor-pointer transition-colors"
                                        >
                                            <div className={`flex flex-shrink-0 items-center justify-center w-7 h-7 rounded-full border-2 ${isChecked ? "border-gray-900" : "border-gray-600 bg-white"}`}>
                                                {isChecked && <div className="w-5 h-5 rounded-full primaryBg" />}
                                            </div>
                                            <span className="flex-1 text-sm font-medium leadColor whitespace-normal break-all min-w-0">{optionValue}</span>
                                        </label>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            case "checkbox":
                return (
                    <div className="flex flex-col gap-2 w-full mt-2" key={field.name}>
                        <label className="text-md font-medium leadColor">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <div className="flex flex-row flex-wrap gap-4">
                            {field.form_fields_values?.map((option, optionIndex) => {
                                const optionValue = option.translated_value || option.value;
                                const isChecked = (formData[field.name] || []).includes(option.value);

                                return (
                                    <div key={`checkbox_${option?.id}_${optionIndex}`} className="flex items-center max-w-full">
                                        <input
                                            type="checkbox"
                                            id={`checkbox_${option?.id}_${optionIndex}`}
                                            name={field.name}
                                            className="hidden"
                                            value={option.value}
                                            checked={isChecked}
                                            onChange={(event) => {
                                                const syntheticEvent = {
                                                    target: {
                                                        name: field.name,
                                                        type: "checkbox",
                                                        checked: event.target.checked,
                                                        value: option.value,
                                                    },
                                                };
                                                handleToggleChange(syntheticEvent);
                                            }}
                                        />
                                        <label
                                            htmlFor={`checkbox_${option?.id}_${optionIndex}`}
                                            className="flex items-center gap-3 w-fit max-w-full min-h-14 px-4 primaryBackgroundBg newBorder rounded-lg cursor-pointer transition-colors"
                                        >
                                            <div className={`flex flex-shrink-0 items-center justify-center w-5 h-5 rounded border-[1.5px] ${isChecked ? "border-gray-900" : "border-gray-600 bg-white"}`}>
                                                {isChecked && <FiCheck className="w-[19px] h-[18px] rounded-[3px] text-white primaryBg" strokeWidth={3} />}
                                            </div>
                                            <span className="flex-1 text-sm font-medium leadColor whitespace-normal break-all min-w-0">{optionValue}</span>
                                        </label>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            case "toggle":
                return (
                    <div className="flex flex-col w-full" key={field.name}>
                        <div className="flex items-center justify-between w-full h-16 primaryBackgroundBg rounded-lg px-4 border border-gray-200">
                            <span className="text-md font-medium leadColor">{field.label}</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name={field.name}
                                    checked={formData[field.name] || false}
                                    onChange={handleToggleChange}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:primaryBg" />
                            </label>
                        </div>
                    </div>
                );
            case "file":
                return (
                    <div className="flex flex-col gap-2 w-full" key={field.name}>
                        <label className="text-md font-medium leadColor">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        <input
                            type="file"
                            name={field.name}
                            onChange={handleFileChange}
                            required={field.required && !formData[field.name]}
                            className="w-full rounded-lg border newBorder bg-white px-4 py-3 text-sm"
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    if (isVerified) {
        return (
            <div className="mx-auto bg-white">
                <div className="container py-8 px-4 md:px-0">
                    <div className="flex flex-col gap-4 rounded-2xl border newBorderColor primaryBg p-6 text-white">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-col gap-2">
                                <h1 className="text-xl font-bold md:text-2xl">{t("verifyUserSuccessTitle")}</h1>
                                <p className="text-sm leading-6 opacity-90 md:text-base">{t("verifyUserSuccessDesc")}</p>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold uppercase primaryColor">
                                <span>{t("verified")}</span>
                            </div>
                        </div>
                        <div className="flex justify-start">
                            <button
                                type="button"
                                onClick={() => router.push(`/user/profile?lang=${lang || "en"}`)}
                                className="rounded-lg bg-white px-4 py-2.5 text-sm font-bold primaryColor transition-colors hover:bg-gray-50 md:text-base"
                            >
                                {t("myProfile")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (formQuery.isLoading) {
        return (
            <div className="mx-auto bg-white">
                <div className="container py-8 px-4 md:px-0">
                    <div className="flex items-center justify-between w-full pb-10">
                        <Skeleton className="h-8 w-40" />
                        <Skeleton className="h-0.5 flex-grow mx-4" />
                        <Skeleton className="h-8 w-40" />
                        <Skeleton className="h-0.5 flex-grow mx-4" />
                        <Skeleton className="h-8 w-40" />
                    </div>
                    <div className="bg-white border newBorderColor rounded-xl">
                        <Skeleton className="h-16 rounded-t-xl" />
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Skeleton className="h-14 rounded-lg" />
                            <Skeleton className="h-14 rounded-lg" />
                            <Skeleton className="h-14 rounded-lg" />
                            <Skeleton className="h-14 rounded-lg" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (formQuery.isError) {
        return (
            <div className="mx-auto bg-white">
                <div className="container py-8 px-4 md:px-0">
                    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
                        <p className="font-medium text-red-600">{t("failedToLoadForm")}</p>
                        <button
                            type="button"
                            onClick={() => formQuery.refetch()}
                            className="mt-4 rounded-lg brandBg px-6 py-2 text-white transition-colors hover:bg-black"
                        >
                            {t("retry")}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (fields.length === 0) {
        return (
            <div className="mx-auto bg-white">
                <div className="container py-8 px-4 md:px-0">
                    <div className="rounded-xl border newBorderColor bg-gray-50 p-6 text-center">
                        <p className="font-medium leadColor">{t("noFormFieldsAvailable")}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto bg-white rounded-xl newBorder">
            <div className="rounded-t-xl border-b newBorderColor bg-white p-6">
                <h2 className="text-lg font-bold brandColor">{t("userVerificationFormTitle")}</h2>
                <p className="mt-1 text-sm leadColor">{t("userVerificationFormDescription")}</p>
            </div>
            <div className="container py-8 px-4 md:px-0">

                <div className="grid grid-cols-1 gap-4 p-4 sm:p-6 lg:grid-cols-2">
                    {fields.map((field) => (
                        <div key={field.name} className={field.type === "radio" || field.type === "checkbox" ? "lg:col-span-2" : ""}>
                            {renderField(field)}
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex flex-row justify-center md:justify-end md:me-4 gap-4">
                    <button
                        type="button"
                        onClick={() => router.push(`/user/profile?lang=${lang || "en"}`)}
                        className="flex h-12 items-center gap-2 rounded-lg newBorder px-6 py-3 text-sm font-bold brandColor transition-colors hover:bg-gray-50"
                    >
                        {t("cancel")}
                    </button>

                    <button
                        type="button"
                        onClick={async () => {
                            if (!validateFields()) return;
                            await handleSubmit();
                        }}
                        disabled={isSubmitting}
                        className={`flex h-12 items-center gap-2 rounded-lg brandBg px-3 py-2 text-sm font-bold text-white transition-colors md:px-6 md:py-3 ${isSubmitting ? "cursor-not-allowed opacity-50" : "hover:bg-black"}`}
                    >
                        {isSubmitting ? t("processing") : t("submit")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserVerificationForm;