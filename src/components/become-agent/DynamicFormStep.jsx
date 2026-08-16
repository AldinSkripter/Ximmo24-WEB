import { useState, useEffect } from "react";
import PhoneInput from "react-phone-input-2";
import { BiCloudUpload } from "react-icons/bi";
import { FiCheck } from "react-icons/fi";
import { FaTimes } from 'react-icons/fa';
import { useDropzone } from 'react-dropzone';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { truncate } from '@/utils/helperFunction';
import { getPhoneInputConfig } from '@/utils/phoneUtils';
import { useTranslation } from '../context/TranslationContext';
import toast from "react-hot-toast";
import ImageWithPlaceholder from "../image-with-placeholder/ImageWithPlaceholder";

const DropzoneField = ({ field, value, onChange, t }) => {
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (!value) {
            setPreviewUrl(null);
            return;
        }

        if (typeof value === 'string') {
            setPreviewUrl(value); // It's an existing URL from API
        } else if (value instanceof File) {
            const objectUrl = URL.createObjectURL(value);
            setPreviewUrl(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        }
    }, [value]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'image/webp': ['.webp'],
            'image/avif': ['.avif'],
            'image/jpeg': ['.jpeg', '.jpg'],
            'image/png': ['.png'],
            'application/pdf': ['.pdf']
        },
        multiple: false,
        onDrop: (acceptedFiles) => {
            if (acceptedFiles?.length > 0) {
                onChange({
                    target: {
                        name: field.name,
                        files: acceptedFiles
                    }
                });
            }
        },
        onDropRejected: () => {
            toast.error(t("becomeAgentFileInputError"));
        }
    });

    const isPdf = previewUrl?.toLowerCase().endsWith('.pdf') || (value instanceof File && value.type === 'application/pdf');

    return (
        <div className="flex flex-col gap-2 w-full " key={field.name}>
            <label className="text-md font-medium leadColor">
                {field.label} <span className="text-red-500">*</span>
            </label>
            <div
                {...getRootProps()}
                className={`w-full min-h-36 gap-2 primaryBackgroundBg border border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 relative overflow-hidden ${isDragActive ? 'border-primary bg-primary/5 border-2' : 'border-gray-300 hover:bg-gray-50'}`}
            >
                <input {...getInputProps()} required={field.required && !value} />
                {previewUrl ? (
                    isPdf ? (
                        <div className="relative flex flex-col items-center justify-center p-4 h-full w-full">
                            <div className='bg-white primaryColor p-3.5 rounded-xl border border-gray-200 shadow-sm'>
                                <BiCloudUpload className="w-7 h-7" />
                            </div>
                            <span className="text-sm font-medium text-gray-900 mt-2 truncate w-full text-center px-4">{value?.name || "Existing PDF File"}</span>
                            <span className="text-xs primaryColor font-medium mt-1 underline">{t("clickOrDragToChange")}</span>
                            <button
                                className="absolute top-2 right-2 bg-black rounded-full p-1 text-white hover:bg-gray-800 z-10"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onChange({ target: { name: field.name, files: [] } });
                                }}
                            >
                                <FaTimes size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="relative">
                            <ImageWithPlaceholder src={previewUrl} alt="Preview" className="w-full h-36 object-contain p-2" />
                            <button
                                className="absolute top-2 right-2 bg-black rounded-full p-1 text-white hover:bg-gray-800 z-10"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onChange({ target: { name: field.name, files: [] } });
                                }}
                            >
                                <FaTimes size={14} />
                            </button>
                        </div>
                    )
                ) : (
                    <div className="py-6 flex flex-col items-center justify-center w-full">
                        <div className='bg-white primaryColor p-3.5 rounded-xl border border-gray-200 shadow-sm mb-3'>
                            <BiCloudUpload className="w-7 h-7" />
                        </div>
                        <div className="text-center text-gray-900 text-sm font-medium">
                            {isDragActive ? (
                                <span>{t("dropFiles")}</span>
                            ) : (
                                <span>
                                    {t("dragDrop")}{" "}
                                    <span className="underline primaryColor">{t("browse")}</span>
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-gray-500 text-center px-4 max-w-[300px] mt-1">{field.placeholder}</span>
                    </div>
                )}
            </div>
            {value && !previewUrl && (
                <span className="text-xs primaryColor mt-1 truncate">{t("fileSelected")}: {value?.name || "Existing file"}</span>
            )}
        </div>
    );
};

const ErrorMessage = ({ error }) =>
    error ? <p className="text-red-500 text-xs mt-1">{error}</p> : null;

const DynamicFormStep = ({ stepData, formData, errors = {}, handleInputChange, handlePhoneChange, handleFileChange, handleToggleChange }) => {

    const t = useTranslation();
    const [phoneCountries, setPhoneCountries] = useState({});

    const renderField = (field) => {
        switch (field.type) {
            case 'text':
            case 'email':
                return (
                    <div className="flex flex-col gap-2 w-full" key={field.name}>
                        <label className="text-md font-medium leadColor">
                            {field.label} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type={field.type}
                            name={field.name}
                            value={formData[field.name] || ''}
                            onChange={handleInputChange}
                            placeholder={field.placeholder}
                            className={`w-full primaryBackgroundBg outline-none rounded-lg px-4 text-md h-14 ${errors[field.name] ? 'border-2 border-red-500' : 'newBorder'}`}
                        />
                        <ErrorMessage error={errors[field.name]} />
                    </div>
                );
            case 'number':
                return (
                    <div className="flex flex-col gap-2 w-full" key={field.name}>
                        <label className="text-md font-medium leadColor">
                            {field.label} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name={field.name}
                            value={formData[field.name] || ''}
                            onChange={handleInputChange}
                            onKeyDown={(e) => {
                                if (['e', 'E', '+', '-'].includes(e.key)) {
                                    e.preventDefault();
                                }
                            }}
                            onWheel={(e) => e.target.blur()}
                            placeholder={field.placeholder}
                            className={`w-full primaryBackgroundBg outline-none rounded-lg px-4 text-md h-[56px] ${errors[field.name] ? 'border-2 border-red-500' : 'newBorder'}`}
                        />
                        <ErrorMessage error={errors[field.name]} />
                    </div>
                );
            case 'textarea':
                return (
                    <div className="flex flex-col gap-2 w-full" key={field.name}>
                        <label className="text-md font-medium leadColor">
                            {field.label} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            name={field.name}
                            value={formData[field.name] || ''}
                            onChange={handleInputChange}
                            placeholder={field.placeholder}
                            rows={4}
                            className={`w-full primaryBackgroundBg outline-none rounded-lg p-4 text-md resize-none h-32 ${errors[field.name] ? 'border-2 border-red-500' : 'newBorder'}`}
                        />
                        <ErrorMessage error={errors[field.name]} />
                    </div>
                );
            case 'phone': {
                const phoneConfig = getPhoneInputConfig(phoneCountries[field.name] || process.env.NEXT_PUBLIC_DEFAULT_COUNTRY?.toLowerCase());
                return (
                    <div className="flex flex-col gap-2 w-full" key={field.name}>
                        <label className="text-md font-medium leadColor">
                            {field.label} <span className="text-red-500">*</span>
                        </label>
                        <PhoneInput
                            country={process.env.NEXT_PUBLIC_DEFAULT_COUNTRY?.toLowerCase()}
                            enableAreaCodes={true}
                            inputProps={{ name: field.name, maxLength: phoneConfig.maxLength }}
                            enableSearch={true}
                            enableLongNumbers={phoneConfig.enableLongNumbers}
                            searchPlaceholder={t("search")}
                            value={formData[field.name]}
                            onChange={(val, data) => {
                                handlePhoneChange(field.name, val);
                                if (data?.countryCode) setPhoneCountries(prev => ({ ...prev, [field.name]: data.countryCode }));
                            }}
                            containerClass="w-full"
                            inputClass={`!primaryBackgroundBg !w-full !rounded-lg !h-14 !border-2 !outline-none !pl-14 !pr-4 !text-sm ${errors[field.name] ? '!border-red-500' : '!newBorderColor'}`}
                            dropdownClass="!bg-white"
                            buttonClass="!bg-transparent !w-12 !h-14 !rounded-tl-lg !rounded-bl-lg !border-none"
                        />
                        <ErrorMessage error={errors[field.name]} />
                    </div>
                );
            }
            case 'location':
                return (
                    <div className="flex flex-col gap-2 w-full" key={field.name}>
                        <label className="text-md font-medium leadColor">
                            {field.label} <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2 w-full">
                            <input
                                type="text"
                                name={field.name}
                                value={formData[field.name] || ''}
                                onChange={handleInputChange}
                                placeholder={field.placeholder}
                                className={`flex-1 primaryBackgroundBg outline-none rounded-lg px-4 text-md h-14 ${errors[field.name] ? 'border-2 border-red-500' : 'newBorder'}`}
                            />
                            <button type="button" className="w-14 h-14 flex items-center justify-center rounded-lg newBorder primaryBackgroundBg hover:bg-gray-100 transition">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-500">
                                    <path d="M12 21C16 16.8 19 12.8 19 9C19 5.13401 15.866 2 12 2C8.13401 2 5 5.13401 5 9C5 12.8 8 16.8 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M12 12C13.6569 12 15 10.6569 15 9C15 7.34315 13.6569 6 12 6C10.3431 6 9 7.34315 9 9C9 10.6569 10.3431 12 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                        <ErrorMessage error={errors[field.name]} />
                    </div>
                );
            case 'dropdown':
                return (
                    <div className="flex flex-col gap-2 w-full" key={field.name}>
                        <label className="text-md font-medium leadColor">
                            {field.label} <span className="text-red-500">*</span>
                        </label>
                        <Select
                            value={field.form_fields_values?.find((opt) => opt.value == formData[field.name])?.translated_value || ""}
                            onValueChange={(value) => {
                                const syntheticEvent = {
                                    target: {
                                        name: field.name,
                                        value: field.form_fields_values?.find((opt) => opt.translated_value == value)?.value,
                                        type: 'select'
                                    }
                                };
                                handleInputChange(syntheticEvent);
                            }}
                        >
                            <SelectTrigger className={`w-full primaryBackgroundBg outline-none rounded-lg px-4 text-md h-14 focus:outline-0 focus:ring-0 ${errors[field.name] ? 'border-2 border-red-500' : 'newBorder'}`}>
                                <SelectValue
                                    placeholder={
                                        <span className="max-w-md overflow-hidden text-ellipsis whitespace-nowrap">
                                            {field.placeholder || `Select ${field.label}`}
                                        </span>
                                    }
                                >
                                    {formData[field.name] ? (
                                        <span className="max-w-md overflow-hidden text-ellipsis whitespace-nowrap">
                                            {truncate(field.form_fields_values?.find((opt) => opt.value == formData[field.name])?.translated_value || "", 30)}
                                        </span>
                                    ) : null}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="max-w-md focus:outline-none bg-white">
                                {field.form_fields_values &&
                                    field.form_fields_values.map((option) => (
                                        <SelectItem
                                            key={option.id}
                                            value={field.form_fields_values?.find((opt) => opt.id == option.id)?.translated_value || ""}
                                            className="max-w-md overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer hover:bg-gray-100"
                                            title={option.value}
                                        >
                                            <span className="max-w-md overflow-hidden text-ellipsis whitespace-nowrap text-sm">
                                                {truncate(option.translated_value, 30)}
                                            </span>
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                        <ErrorMessage error={errors[field.name]} />
                    </div>
                );
            case 'radio':
                return (
                    <div className="flex flex-col gap-2 w-full" key={field.name}>
                        <label className="text-md font-medium leadColor">
                            {field.label} <span className="text-red-500">*</span>
                        </label>
                        <div className={`flex flex-row flex-wrap gap-4 ${errors[field.name] ? 'p-2 border-2 border-red-500 rounded-lg' : ''}`}>
                            {field.form_fields_values &&
                                field.form_fields_values.map((option, optionIndex) => {
                                    const isChecked = formData[field.name] === option.value;
                                    return (
                                        <div key={`radio_${option?.id}_${optionIndex}`} className='flex items-center max-w-full'>
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
                                                className={`flex items-center gap-3 w-fit max-w-full min-h-14 px-4 primaryBackgroundBg newBorder rounded-lg cursor-pointer transition-colors`}
                                            >
                                                <div className={`flex flex-shrink-0 items-center justify-center w-7 h-7 rounded-full border-2 ${isChecked ? 'border-gray-900' : 'border-gray-600 bg-white'}`}>
                                                    {isChecked && <div className="w-5 h-5 rounded-full primaryBg" />}
                                                </div>
                                                <span className="flex-1 text-sm font-medium leadColor whitespace-normal break-all min-w-0">{option.translated_value}</span>
                                            </label>
                                        </div>
                                    );
                                })}
                        </div>
                        <ErrorMessage error={errors[field.name]} />
                    </div>
                );
            case 'checkbox':
                return (
                    <div className="flex flex-col gap-2 w-full mt-2" key={field.name}>
                        <label className="text-md font-medium leadColor">
                            {field.label} <span className="text-red-500">*</span>
                        </label>
                        <div className={`flex flex-row flex-wrap gap-4 ${errors[field.name] ? 'p-2 border-2 border-red-500 rounded-lg' : ''}`}>
                            {field.form_fields_values &&
                                field.form_fields_values.map((option, optionIndex) => {
                                    const isChecked = (formData[field.name] || []).includes(option.value);
                                    return (
                                        <div key={`checkbox_${option?.id}_${optionIndex}`} className='flex items-center max-w-full'>
                                            <input
                                                type="checkbox"
                                                id={`checkbox_${option?.id}_${optionIndex}`}
                                                name={field.name}
                                                className="hidden"
                                                value={option.value}
                                                checked={isChecked}
                                                onChange={(e) => {
                                                    const syntheticEvent = {
                                                        target: {
                                                            name: field.name,
                                                            type: 'checkbox',
                                                            checked: e.target.checked,
                                                            value: option.value
                                                        }
                                                    };
                                                    handleToggleChange(syntheticEvent);
                                                }}
                                            />
                                            <label
                                                htmlFor={`checkbox_${option?.id}_${optionIndex}`}
                                                className={`flex items-center gap-3 w-fit max-w-full min-h-14 px-4 primaryBackgroundBg newBorder rounded-lg cursor-pointer transition-colors`}
                                            >
                                                <div className={`flex flex-shrink-0 items-center justify-center w-5 h-5 rounded border-[1.5px] ${isChecked ? 'border-gray-900' : 'border-gray-600 bg-white'}`}>
                                                    {isChecked && <FiCheck className="w-[19px] h-[18px] rounded-[3px] text-white primaryBg" strokeWidth={3} />}
                                                </div>
                                                <span className="flex-1 text-sm font-medium leadColor whitespace-normal break-all min-w-0">{option.translated_value}</span>
                                            </label>
                                        </div>
                                    );
                                })}
                        </div>
                        <ErrorMessage error={errors[field.name]} />
                    </div>
                );
            case 'file':
                return (
                    <DropzoneField
                        key={field.name}
                        field={field}
                        value={formData[field.name]}
                        onChange={handleFileChange}
                        t={t}
                    />
                );
            case 'toggle':
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
                                    required
                                />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:primaryBg"></div>
                            </label>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 w-full p-3 md:p-6">
            {stepData.fields.map((field) => (
                <div
                    key={field.name}
                    className={`${field.type === 'toggle' || field.type === 'textarea' ? 'col-span-1 md:col-span-2' : ''} ${field.type === 'radio' || field.type === 'checkbox' ? 'col-span-1 ' : ''}`}
                >
                    {renderField(field)}
                </div>
            ))}

            {/* Conditional Rendering for nested data structures (like social media links when toggled) */}
            {stepData.socialMedia && formData['socialLinksToggle'] && (
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                    {stepData.socialMedia.map(renderField)}
                </div>
            )}
        </div>
    );
};

export default DynamicFormStep;
