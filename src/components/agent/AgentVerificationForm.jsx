"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
	applyAgentVerificationApi,
	getUserProfileApi,
	getVerificationFormFieldsApi,
	getVerificationFormValuesApi,
} from "@/api/apiRoutes";
import DynamicFormStep from "@/components/become-agent/DynamicFormStep";
import { FiCheck, FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { useTranslation } from "../context/TranslationContext";
import { updateUserProfile } from "@/redux/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
import NoDataFound from "../no-data-found/NoDataFound";

const AgentVerificationForm = () => {
	const t = useTranslation();
	const router = useRouter();
	const dispatch = useDispatch();
	const { lang } = router?.query;
	const userData = useSelector((state) => state.User?.data);
	const verificationStatus = String(userData?.agent_verification_status || "").toLowerCase();
	const isAgentVerificationApproved = userData?.is_agent_verified === true || verificationStatus === "approved";
	const isAgentVerificationPending = verificationStatus === "pending";

	const [formData, setFormData] = useState({});
	const [errors, setErrors] = useState({});
	const [stepIndex, setStepIndex] = useState(0);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDataLoaded, setIsDataLoaded] = useState(false);
	const [isRedirecting, setIsRedirecting] = useState(false);
	// Skips the stale-status toast/redirect below when the redux user data
	// refreshes as a direct result of just submitting this form, avoiding a
	// race where both the submit-result toast and the status-effect toast
	// fire together for the same status transition.
	const justSubmittedRef = useRef(false);

	// Fetch form field sections
	const formQuery = useQuery({
		queryKey: ["agentVerificationForm", "verify_agent"],
		queryFn: async () => {
			const response = await getVerificationFormFieldsApi({
				form_type: "verify_agent",
			});
			return response?.data || [];
		},
	});

	// Fetch pre-filled values
	const formValuesQuery = useQuery({
		queryKey: ["agentVerificationFormValues", "verify_agent"],
		queryFn: async () => {
			const response = await getVerificationFormValuesApi({
				form_type: "verify_agent",
			});
			return response?.data || {};
		},
	});

	useEffect(() => {
		if (!router.isReady) return;
		if (justSubmittedRef.current) return;

		if (isAgentVerificationApproved) {
			setIsRedirecting(true);
			toast.success(t("agentVerificationApprovedMessage"));
			router.replace(`/agent/dashboard?lang=${lang || "en"}`);
			return;
		}

		if (isAgentVerificationPending) {
			setIsRedirecting(true);
			toast.error(t("agentVerificationPendingMessage"));
			router.replace(`/agent/dashboard?lang=${lang || "en"}`);
		}
	}, [isAgentVerificationApproved, isAgentVerificationPending, lang, router, t]);

	// Pre-fill formData when values arrive
	useEffect(() => {
		if (!isDataLoaded && formValuesQuery.data) {
			const values =
				formValuesQuery.data?.verify_customer_values ||
				formValuesQuery.data?.values ||
				[];

			// Build a flat lookup: field_id -> field object from sections
			const sections = formQuery.data || [];
			const fieldById = {};
			sections.forEach((section) => {
				(section.agent_verification_forms || []).forEach((field) => {
					fieldById[field.id] = field;
				});
			});

			const initialData = {};
			values.forEach((item) => {
				// Support both key shapes used by the two query shapes
				const fieldId =
					item.verify_customer_form_id ||
					item.agent_verification_form_id ||
					item.verify_form?.id;
				const field = fieldById[fieldId];
				const name = field?.name || item.verify_form?.name;
				if (name && item.value != null) {
					initialData[name] = item.value;
				}
			});

			if (Object.keys(initialData).length > 0) {
				setFormData(initialData);
				setIsDataLoaded(true);
			} else if (!formValuesQuery.isLoading) {
				// No values to pre-fill — still mark as loaded so we don't loop
				setIsDataLoaded(true);
			}
		}
	}, [
		formValuesQuery.data,
		formValuesQuery.isLoading,
		formQuery.data,
		isDataLoaded,
	]);

	// Transform API sections into steps
	const steps = useMemo(() => {
		if (!formQuery.data || !Array.isArray(formQuery.data)) return [];

		return formQuery.data.map((section, idx) => {
			const fields = Array.isArray(section.agent_verification_forms)
				? section.agent_verification_forms.map((field) => ({
					id: field.id,
					name: field.name,
					label: field.translated_name || field.name,
					type: field.field_type || "text",
					placeholder:
						field.placeholder ||
						`Enter ${field.translated_name || field.name}`,
					required:
						field.required === 1 || field.required === true,
					form_fields_values: (
						field.form_fields_values || []
					).map((opt) => ({
						...opt,
						translated_value: opt.translated_value ?? opt.value,
					})),
				}))
				: [];

			return {
				id: `step${section.id || idx + 1}`,
				title:
					section.translated_name ||
					section.name ||
					`Step ${idx + 1}`,
				fields,
			};
		});
	}, [formQuery.data]);

	const isLastStep = stepIndex === steps.length - 1;

	if (isRedirecting) {
		return null;
	}

	// ── Field value helpers ──────────────────────────────────────────────────
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

	// ── Validation ───────────────────────────────────────────────────────────
	const buildErrors = (fields = []) => {
		const newErrors = {};

		for (const field of fields) {
			if (field.type === "toggle") continue;

			if (field.type === "checkbox") {
				const raw = formData[field.name];
				if (!Array.isArray(raw) || raw.length === 0) {
					newErrors[field.name] = `${field.label} ${t("isRequired")}`;
				}
				continue;
			}

			const value = getFieldValue(field);
			if (value === undefined || value === null || value === "") {
				newErrors[field.name] = `${field.label} ${t("isRequired")}`;
			}
		}

		return newErrors;
	};

	const validateCurrentStep = () => {
		const stepErrors = buildErrors(steps[stepIndex]?.fields || []);
		setErrors(stepErrors);
		if (Object.keys(stepErrors).length > 0) {
			toast.error(t("allFieldsRequired"));
			return false;
		}
		return true;
	};

	const validateAllSteps = () => {
		const allErrors = {};
		steps.forEach((step) => {
			Object.assign(allErrors, buildErrors(step.fields));
		});
		setErrors(allErrors);
		if (Object.keys(allErrors).length > 0) {
			toast.error(t("allFieldsRequired"));
			return false;
		}
		return true;
	};

	// Fetch User Data
	const fetchUserData = async () => {
		try {
			const res = await getUserProfileApi();
			if (res.data) {
				// Update Redux store with the fetched user data
				dispatch(
					updateUserProfile({
						data: res?.data,
					}),
				);
			}
		} catch (error) {
			console.error("Error fetching user data:", error);
		}
	};

	// ── Submit ───────────────────────────────────────────────────────────────
	const handleSubmit = async () => {
		if (!validateAllSteps()) return;

		const formFields = steps.flatMap((step) =>
			step.fields.map((field) => ({
				id: field.id,
				value: getFieldValue(field),
			})),
		);

		// Only send fields that have a value
		const filteredFields = formFields.filter(
			(f) => f.value !== null && f.value !== undefined && f.value !== "",
		);

		setIsSubmitting(true);
		try {
			const response = await applyAgentVerificationApi({
				form_type: "verify_agent",
				form_fields: filteredFields,
			});

			if (!response?.error) {
				justSubmittedRef.current = true;
				toast.success(t(response?.message || "success"));
				await fetchUserData();
				router.push(`/agent/dashboard?lang=${lang}`);
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

	// ── Change handlers (matching DynamicFormStep's expectations) ────────────
	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		setErrors((prev) => {
			if (!prev[name]) return prev;
			const next = { ...prev };
			delete next[name];
			return next;
		});
	};

	const handlePhoneChange = (name, value) => {
		setFormData((prev) => ({ ...prev, [name]: value }));
		setErrors((prev) => {
			if (!prev[name]) return prev;
			const next = { ...prev };
			delete next[name];
			return next;
		});
	};

	const handleFileChange = (e) => {
		const { name, files } = e.target;
		if (files && files.length > 0) {
			setFormData((prev) => ({ ...prev, [name]: files[0] }));
			setErrors((prev) => {
				if (!prev[name]) return prev;
				const next = { ...prev };
				delete next[name];
				return next;
			});
		} else if (files && files.length === 0) {
			setFormData((prev) => ({ ...prev, [name]: null }));
		}
	};

	const handleToggleChange = (e) => {
		const { name, checked, type, value } = e.target;
		if (type === "checkbox" && value) {
			setFormData((prevData) => {
				const existing = prevData[name] || [];
				if (checked) {
					return { ...prevData, [name]: [...existing, value] };
				} else {
					return {
						...prevData,
						[name]: existing.filter((v) => v !== value),
					};
				}
			});
		} else {
			setFormData((prev) => ({ ...prev, [name]: checked }));
		}
		setErrors((prev) => {
			if (!prev[name]) return prev;
			const next = { ...prev };
			delete next[name];
			return next;
		});
	};

	// ── Navigation ───────────────────────────────────────────────────────────
	const handleNext = () => {
		if (!validateCurrentStep()) return;
		if (!isLastStep) {
			setStepIndex((prev) => prev + 1);
		} else {
			handleSubmit();
		}
	};

	const handlePrev = () => {
		if (stepIndex > 0) setStepIndex((prev) => prev - 1);
	};

	// ── Loading state ────────────────────────────────────────────────────────
	if (formQuery.isLoading) {
		return (
			<div className="mx-auto bg-white">
				<div className="py-8 px-4 md:px-0">
					<div className="flex items-center justify-between w-full pb-10 relative">
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

	// ── Error state ──────────────────────────────────────────────────────────
	if (formQuery.isError) {
		return (
			<div className="mx-auto bg-white">
				<div className="py-8 px-4 md:px-0">
					<div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
						<p className="text-red-600 font-medium">
							{t("failedToLoadForm")}
						</p>
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

	// ── Empty state ──────────────────────────────────────────────────────────
	if (steps.length === 0) {
		return (
			<div className="mx-auto bg-white newBorder rounded-xl">
				<NoDataFound title={t("noAgentFormFieldsAvailable")} description={t("noAgentFormFieldsAvailableDescription")} />
			</div>
		);
	}

	if (isRedirecting) {
		return null;
	}

	// ── Main render ──────────────────────────────────────────────────────────
	return (
		<div className="mx-auto bg-white newBorder rounded-xl">
			<div className="py-8 px-4 md:px-0">
				{/* Stepper Header */}
				<div className="flex flex-col gap-4 md:flex-row items-center justify-between w-full pb-10 relative">
					<div className="flex-grow h-0.5 bg-[#E7E7E7] mx-2 md:mx-4" />
					{steps.map((step, idx) => (
						<React.Fragment key={step.id}>
							<div className="flex items-center gap-2 px-1 md:px-4">
								<div
									className={`w-6 h-6 rounded-full flex items-center justify-center text-md font-bold transition-colors ${stepIndex === idx
										? "primaryColor"
										: stepIndex > idx
											? "primaryBg text-white"
											: "leadColor"
										}`}
								>
									{stepIndex > idx ? (
										<FiCheck className="w-4 h-4" />
									) : (
										`0${idx + 1}.`
									)}
								</div>
								<div>
									<span
										className={`text-md font-bold ${stepIndex >= idx
											? "primaryColor"
											: "text-gray-400"
											}`}
									>
										{step.title}
									</span>
								</div>
							</div>
							{idx < steps.length - 1 && (
								<div className="flex-grow h-0.5 bg-[#E7E7E7] mx-4" />
							)}
						</React.Fragment>
					))}
					<div className="flex-grow h-0.5 bg-[#E7E7E7] mx-4" />
				</div>

				{/* Form Wrapper */}

				<DynamicFormStep
					stepData={steps[stepIndex]}
					formData={formData}
					errors={errors}
					handleInputChange={handleInputChange}
					handlePhoneChange={handlePhoneChange}
					handleFileChange={handleFileChange}
					handleToggleChange={handleToggleChange}
				/>

				{/* Navigation Buttons */}
				<div className="mt-8 flex flex-row justify-center md:justify-end gap-4 md:me-4">
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
						disabled={isSubmitting}
						className={`flex items-center gap-2 px-3 py-2 md:px-6 md:py-3 h-12 rounded-lg brandBg text-white font-bold text-sm transition-colors ${isSubmitting
							? "opacity-50 cursor-not-allowed"
							: "hover:bg-black"
							}`}
					>
						{isSubmitting
							? t("processing")
							: isLastStep
								? t("submit")
								: t("next")}
						{!isLastStep && <FiArrowRight className="w-4 h-4" />}
					</button>
				</div>
			</div>
		</div>
	);
};

export default AgentVerificationForm;
