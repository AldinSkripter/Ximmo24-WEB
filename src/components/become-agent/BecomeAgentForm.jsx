import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { applyAgentVerificationApi, getAgentVerificationFormApi, getUserProfileApi, getVerificationFormValuesApi } from '@/api/apiRoutes';
import DynamicFormStep from './DynamicFormStep';
import BecomeAgentHeader from './BecomeAgentHeader';
import { FiCheck, FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useTranslation } from '../context/TranslationContext';
import { updateUserProfile } from '@/redux/slices/authSlice';
import { useDispatch, useSelector } from 'react-redux';
import { MdInfo } from 'react-icons/md';
import { trackEvent } from '@/utils/analytics';

const BecomeAgentForm = () => {
    const t = useTranslation();
    const router = useRouter();
    const dispatch = useDispatch();
    const { lang } = router?.query;
    const userData = useSelector((state) => state.User?.data)
    const isAgentFormRejected = userData?.become_agent_status === "rejected";
    const isAgentFormPending = userData?.become_agent_status === "pending";
    const isAgentFormApproved = userData?.become_agent_status === "approved";
    const langParam = typeof lang === 'string' ? `?lang=${lang}` : '';

    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});
    const [stepIndex, setStepIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Skips the stale-status toast/redirect below when the redux user data
    // refreshes as a direct result of just submitting this form, avoiding a
    // race where both the submit-success toast and the status-effect toast
    // fire together for the same status transition.
    const justSubmittedRef = useRef(false);
    const startedTrackedRef = useRef(false);

    // Fetch form fields from the API using TanStack Query
    const formQuery = useQuery({
        queryKey: ['agentVerificationForm', 'become_agent'],
        queryFn: async () => {
            const response = await getAgentVerificationFormApi({ form_type: 'become_agent' });
            return response?.data || [];
        },
    });
    const agentVerificationFormValuesQuery = useQuery({
        queryKey: ['agentVerificationFormValues', 'become_agent'],
        queryFn: async () => {
            const response = await getVerificationFormValuesApi({ form_type: 'become_agent' });
            return response?.data || {};
        },
    });

    const [isDataLoaded, setIsDataLoaded] = useState(false);

    useEffect(() => {
        if (!router?.isReady) return;
        if (justSubmittedRef.current) return;
        if (isAgentFormApproved) {
            toast.success(t("agentFormApprovedMessage"), {
                icon: <MdInfo className='primarycolor size-6 flex-shrink-0' />
            });
            router?.push(`/?lang=${lang}`);
            return;
        } else if (isAgentFormPending) {
            toast.error(t("agentFormPendingMessage"), {
                icon: <MdInfo className='primarycolor size-6 flex-shrink-0' />
            });
            router?.push(`/?lang=${lang}`);
        }
    }, [isAgentFormPending, isAgentFormApproved, lang]);



    useEffect(() => {
        if (agentVerificationFormValuesQuery.data?.values && !isDataLoaded) {
            const initialData = {};
            agentVerificationFormValuesQuery.data.values.forEach(item => {
                const name = item.verify_form?.name;
                if (name) {
                    initialData[name] = item.value;
                }
            });
            setFormData(initialData);
            setIsDataLoaded(true);
        }
    }, [agentVerificationFormValuesQuery.data, isDataLoaded]);

    // Transform API response into steps grouped by sections
    const steps = useMemo(() => {
        if (!formQuery.data || !Array.isArray(formQuery.data)) return [];

        // API already provides sections in the data array
        return formQuery.data.map((section, idx) => {
            const fields = Array.isArray(section.agent_verification_forms)
                ? section.agent_verification_forms.map(field => ({
                    id: field.id,
                    name: field.name,
                    label: field.translated_name || field.name,
                    type: field.field_type || 'text',
                    placeholder: field.placeholder || `Enter ${field.translated_name || field.name}`,
                    required: field.required === 1 || field.required === true,
                    form_fields_values: field.form_fields_values || [],
                }))
                : [];

            return {
                id: `step${section.id || idx + 1}`,
                title: section.translated_name || section.name || `Step ${idx + 1}`,
                fields: fields,
            };
        });
    }, [formQuery.data]);

    useEffect(() => {
        if (steps.length > 0 && !startedTrackedRef.current) {
            startedTrackedRef.current = true;
            trackEvent('become_agent_started');
        }
    }, [steps]);

    const isLastStep = stepIndex === steps.length - 1;

    const getFieldValue = (field) => {
        const value = formData[field.name];

        if (field.type === 'checkbox') {
            return Array.isArray(value) ? value.join(',') : '';
        }

        if (field.type === 'file') {
            return value instanceof File ? value : value || '';
        }

        return value ?? '';
    };

    // Validate a list of fields and return an errors map { fieldName: errorMessage }
    const buildErrors = (fields) => {
        const newErrors = {};
        for (const field of fields) {
            // Treat every field as required
            if (field.type === 'checkbox') {
                const rawValue = formData[field.name];
                if (!Array.isArray(rawValue) || rawValue.length === 0) {
                    newErrors[field.name] = `${field.label} ${t("isRequired")}`;
                }
            } else if (field.type === 'file') {
                const value = getFieldValue(field);
                if (!value) {
                    newErrors[field.name] = `${field.label} ${t("isRequired")}`;
                }
            } else if (field.type === 'toggle') {
                // toggles are boolean – skip required check
            } else {
                const value = getFieldValue(field);
                if (value === '' || value === null || value === undefined) {
                    newErrors[field.name] = `${field.label} ${t("isRequired")}`;
                }
            }
        }
        return newErrors;
    };

    // Validate only the currently visible step; show errors inline + one toast
    const validateCurrentStep = () => {
        const currentFields = steps[stepIndex]?.fields || [];
        const stepErrors = buildErrors(currentFields);
        setErrors(stepErrors);
        if (Object.keys(stepErrors).length > 0) {
            toast.error(t("allFieldsRequired"));
            return false;
        }
        return true;
    };

    // Full validation across all steps (used before final submit)
    const validateAllSteps = () => {
        const allErrors = {};
        for (const step of steps) {
            Object.assign(allErrors, buildErrors(step.fields));
        }
        setErrors(allErrors);
        if (Object.keys(allErrors).length > 0) {
            toast.error(t("allFieldsRequired"));
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {

        if (!validateAllSteps()) {
            return;
        }

        const formFields = steps.flatMap((step) =>
            step.fields.map((field) => ({
                id: field.id,
                value: getFieldValue(field),
            })),
        );

        setIsSubmitting(true);

        try {
            const response = await applyAgentVerificationApi({
                form_type: 'become_agent',
                form_fields: formFields,
            });

            if (!response?.error) {
                justSubmittedRef.current = true;
                toast.success(t(response?.message || "success"));
                trackEvent('become_agent_submitted', {}, { clarity: true });
                fetchUserData()
                router.push(`/agent/dashboard?lang=${lang || 'en'}`);
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

    const fetchUserData = async () => {
        try {
            const res = await getUserProfileApi();
            if (res.data) {
                // Update Redux store with the fetched user data
                dispatch(updateUserProfile({
                    data: res.data
                }));
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };


    // Clear an individual field error once the user starts typing / selecting
    const clearError = (name) => {
        if (errors[name]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        clearError(name);
    };

    const handlePhoneChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        clearError(name);
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files && files.length > 0) {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
            clearError(name);
        } else if (files && files.length === 0) {
            setFormData(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleToggleChange = (e) => {
        const { name, checked, type, value } = e.target;
        if (type === 'checkbox' && value) {
            // Array-based checkbox from API
            setFormData((prevData) => {
                const existingValues = prevData[name] || [];
                const next = checked
                    ? [...existingValues, value]
                    : existingValues.filter((v) => v !== value);
                // Clear error as soon as at least one option is selected
                if (next.length > 0) clearError(name);
                return { ...prevData, [name]: next };
            });
        } else {
            // Simple boolean toggle
            setFormData(prev => ({ ...prev, [name]: checked }));
            clearError(name);
        }
    };

    const handleNext = () => {
        if (!validateCurrentStep()) return;
        if (!isLastStep) {
            setErrors({});
            setStepIndex(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handlePrev = () => {
        if (stepIndex > 0) {
            setErrors({});
            setStepIndex(prev => prev - 1);
        }
    };

    // Loading state
    if (formQuery.isLoading) {
        return (
            <div className=" mx-auto bg-white">
                <BecomeAgentHeader />
                <div className="container py-16 px-4 md:px-0">
                    <div className="flex items-center justify-between w-full pb-16">
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
                            <Skeleton className="h-32 rounded-lg col-span-2" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (formQuery.isError) {
        return (
            <div className=" mx-auto bg-white">
                <BecomeAgentHeader />
                <div className="container py-16 px-4 md:px-0">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <p className="text-red-600 font-medium">{t("failedToLoadForm")}</p>
                        <button
                            onClick={() => formQuery.refetch()}
                            className="mt-4 px-6 py-2 brandBg text-white rounded-lg hover:bg-black transition-colors"
                        >
                            {t("retry")}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // No steps available
    if (steps.length === 0) {
        return (
            <div className=" mx-auto bg-white">
                <BecomeAgentHeader />
                <div className="container py-16 px-4 md:px-0">
                    <div className="bg-gray-50 border newBorderColor rounded-xl p-6 text-center">
                        <p className="leadColor font-medium">{t("noFormFieldsAvailable")}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto bg-white">

            <BecomeAgentHeader />

            <div className="container py-8 xl:py-16 px-4 md:px-0">
                {/* Stepper Header */}
                <div className="flex flex-col gap-2 md:flex-row md:gap-0 items-center justify-between w-full pb-10 md:pb-16 relative">
                    <div className="flex-grow h-0.5 bg-[#E7E7E7] mx-2 md:mx-4" />
                    {steps.map((step, idx) => (
                        <React.Fragment key={step.id}>

                            <div className="flex items-center gap-2 px-1 md:px-4">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-md font-bold transition-colors ${stepIndex === idx
                                    ? ' brandColor'
                                    : stepIndex > idx
                                        ? 'primaryBg text-white'
                                        : 'leadColor'
                                    }`}>
                                    {stepIndex > idx ? <FiCheck className="w-4 h-4" /> : `0${idx + 1}.`}
                                </div>
                                <div>
                                    <span className={`text-md font-bold ${stepIndex >= idx ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {step.title}
                                    </span>
                                </div>
                            </div>
                            {idx < steps.length - 1 && <div className="flex-grow h-0.5 bg-[#E7E7E7] mx-4" />}
                        </React.Fragment>
                    ))}
                    <div className="flex-grow h-0.5 bg-[#E7E7E7] mx-4" />
                </div>

                {/* Form Wrapper */}
                <div className="bg-white border newBorderColor rounded-xl">
                    <div className="p-6 border-b newBorderColor primaryBackgroundBg rounded-t-xl">
                        <h3 className="text-lg font-bold text-gray-900">{steps[stepIndex].title}</h3>
                    </div>

                    <DynamicFormStep
                        stepData={steps[stepIndex]}
                        formData={formData}
                        errors={errors}
                        handleInputChange={handleInputChange}
                        handlePhoneChange={handlePhoneChange}
                        handleFileChange={handleFileChange}
                        handleToggleChange={handleToggleChange}
                    />

                    {isLastStep && (
                        <div className="px-6 pb-6">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="terms_accepted"
                                    name="termsAccepted"
                                    className="hidden"
                                    checked={!!formData.termsAccepted}
                                    onChange={(e) => setFormData(prev => ({ ...prev, termsAccepted: e.target.checked }))}
                                />
                                <label
                                    htmlFor="terms_accepted"
                                    className={`flex items-start md:items-center gap-4 cursor-pointer transition-colors`}
                                >
                                    <div className={`flex flex-shrink-0 items-center justify-center w-6 h-6 rounded border-2 mt-0.5 md:mt-0 ${formData.termsAccepted ? 'newBorderColor' : 'border-gray-600 bg-white'}`}>
                                        {formData.termsAccepted && <FiCheck className="w-6 h-5 rounded-sm text-white primaryBg" strokeWidth={3} />}
                                    </div>
                                    <span className="text-base font-medium brandColor whitespace-normal break-words">
                                        {t("agentVerificationConsent")} {' '}
                                        <Link href={`/terms-and-conditions${langParam}`} className="underline primaryColor underline-offset-2 text-primaryBg">
                                            {t("termsAndConditions")}
                                        </Link>{" "}
                                        {t("and")} {' '}
                                        <Link href={`/privacy-policy${langParam}`} className="underline primaryColor underline-offset-2 text-primaryBg">
                                            {t("privacyPolicy")}
                                        </Link>
                                    </span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>
                <div className="mt-16 flex flex-row items-center justify-end gap-4">
                    {stepIndex > 0 && (
                        <button
                            onClick={handlePrev}
                            className="flex items-center gap-2 px-6 py-3 h-12 rounded-lg newBorder brandColor font-bold text-sm hover:bg-gray-50 transition-colors"
                        >
                            <FiArrowLeft className="w-4 h-4" />
                            {t("previous")}
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        disabled={isSubmitting || (isLastStep && !formData.termsAccepted)}
                        className={`flex items-center gap-2 px-3 py-2 md:px-6 md:py-3 h-12 rounded-lg brandBg text-white font-bold text-sm transition-colors ${isLastStep && !formData.termsAccepted ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black'}`}
                    >
                        {isSubmitting ? t("processing") : isLastStep ? t("applyForAgent") : t("next")}
                        {!isLastStep && <FiArrowRight className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BecomeAgentForm;