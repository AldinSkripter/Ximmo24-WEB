import { useMemo } from 'react'
import { useTranslation } from '@/components/context/TranslationContext'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import ProjectTypeRadio from './ProjectTypeRadio'
import Image from 'next/image'
import { useSelector } from 'react-redux'
import { isRTL } from '@/utils/helperFunction'
import { RiSparkling2Fill } from 'react-icons/ri'
import { Skeleton } from '@/components/ui/skeleton'

const ProjectDetailsTab = ({
    selectedCategory,
    handleRemoveCategory,
    handleUpdateProjectForm,
    projectFormData,
    handleCheckRequiredFields,
    isEditing = false,
    disableCategoryChange = false,
    selectedLanguage,
    setSelectedLanguage,
    languages = [],
    translations = [],
    handleMultiLangChange,
    handleGenerateAIDescription,
    isDescriptionGenerating
}) => {
    const t = useTranslation();
    const isRtl = isRTL();
    const activeLanguage = useSelector(state => state.LanguageSettings?.active_language)
    const defaultLanguage = useSelector(state => state.LanguageSettings?.default_language)
    const currentLanguage = useSelector(state => state.LanguageSettings?.current_language) || {}
    const availableLanguages = useSelector(state => state.LanguageSettings?.languages) || []
    const webSettings = useSelector(state => state.WebSetting?.data) || {}

    // Determine the system default language (could be English or any other language)
    const systemDefaultLanguage = useMemo(() => {
        // Try to find the default language object in available languages
        if (defaultLanguage) {
            const defaultLang = availableLanguages.find(lang =>
                lang.code === defaultLanguage || lang.id === defaultLanguage
            )
            if (defaultLang) return defaultLang
        }

        // If current language exists, use it
        if (currentLanguage && currentLanguage.id) {
            return currentLanguage
        }

        // Fallback to English if nothing else is available
        return { id: "English", name: "English", code: "en" }
    }, [defaultLanguage, currentLanguage, availableLanguages])

    // Combine system languages with any additional languages passed as props
    const allLanguages = useMemo(() => {
        // Use Map to ensure uniqueness
        const languageMap = new Map()

        // First add current language from Redux if it exists and has required properties
        if (currentLanguage && currentLanguage.id) {
            languageMap.set(currentLanguage.code || currentLanguage.id, currentLanguage)
        }

        // Add system default language if not already added
        const defaultKey = systemDefaultLanguage.code || systemDefaultLanguage.id
        if (!languageMap.has(defaultKey)) {
            languageMap.set(defaultKey, systemDefaultLanguage)
        }

        // Add languages from Redux state
        availableLanguages.forEach(lang => {
            // Skip if we already have this language
            if (!languageMap.has(lang.code)) {
                languageMap.set(lang.code, lang)
            }
        })

        // Add any additional languages from props that aren't already included
        languages.forEach(lang => {
            const key = typeof lang === 'object' ? (lang.code || lang.id) : lang
            if (key && !languageMap.has(key)) {
                languageMap.set(key, lang)
            }
        })

        return Array.from(languageMap.values())
    }, [currentLanguage, systemDefaultLanguage, availableLanguages, languages])

    // Find the current translation for the selected language
    const findTranslation = (languageId) => {
        return translations.find(item => {
            if (typeof languageId === 'object') {
                return item.language_id === languageId.id;
            }
            return item.language_id === languageId;
        });
    };

    // Get value for a specific field in the selected language
    const getTranslationValue = (languageId, field) => {
        const translation = findTranslation(languageId);
        return translation ? translation[field] || "" : "";
    };

    // Determine if a language is selected
    const isLanguageSelected = (lang) => {
        if (typeof selectedLanguage === 'object' && typeof lang === 'object') {
            return selectedLanguage.id === lang.id;
        }
        if (typeof selectedLanguage === 'string' && typeof lang === 'string') {
            return selectedLanguage === lang;
        }
        return false;
    };

    // Check if a language is the default language
    const isDefaultLanguage = (lang) => {
        // Handle case when lang is undefined
        if (!lang) return false;

        // Handle object comparison
        if (typeof lang === 'object' && typeof systemDefaultLanguage === 'object') {
            // Compare by id, code, or name for flexibility
            return (
                (lang.id && systemDefaultLanguage.id && lang.id === systemDefaultLanguage.id) ||
                (lang.code && systemDefaultLanguage.code && lang.code === systemDefaultLanguage.code) ||
                (lang.name && systemDefaultLanguage.name && lang.name === systemDefaultLanguage.name)
            )
        }

        // Handle string comparison
        if (typeof lang === 'string' && typeof systemDefaultLanguage === 'object') {
            return (
                lang === systemDefaultLanguage.id ||
                lang === systemDefaultLanguage.code ||
                lang === systemDefaultLanguage.name ||
                lang === "English" // For backward compatibility
            )
        }

        // Direct comparison
        return lang === systemDefaultLanguage
    }

    // Check if this is a required language (default or active)
    const isRequiredLanguage = (lang) => {
        return isDefaultLanguage(lang) || lang === activeLanguage;
    }

    // Wrapper for handleUpdateProjectForm to handle default language fields correctly
    const handleFieldChange = (e, fieldName) => {
        // For standard form events (input, textarea)
        if (e && e.target) {
            const { name, value } = e.target;

            // If this is the default language, update the main project fields
            if (isDefaultLanguage(selectedLanguage) || selectedLanguage === activeLanguage) {
                if (name === "title") {
                    // Update both title and generate slug
                    handleUpdateProjectForm({
                        target: {
                            name: "projectTitle",
                            value: value
                        }
                    });
                } else if (name === "description") {
                    // Update description
                    handleUpdateProjectForm({
                        target: {
                            name: "projectDescription",
                            value: value
                        }
                    });
                } else {
                    // Pass through other field changes
                    handleUpdateProjectForm(e);
                }
            } else {
                // For non-default languages, use the translation handler
                handleMultiLangChange(selectedLanguage, fieldName || name, value);
            }
        }
    };

    return (
        <>
            {/* Language Tabs */}
            <div className="flex flex-wrap gap-7 mb-6 overflow-x-auto">
                {/* Default system language is always first */}
                <button
                    key={typeof systemDefaultLanguage === 'object' ? systemDefaultLanguage.id || systemDefaultLanguage.code : systemDefaultLanguage}
                    onClick={() => setSelectedLanguage(systemDefaultLanguage)}
                    className={`px-8 py-3 rounded-lg whitespace-nowrap ${isLanguageSelected(systemDefaultLanguage) ||
                        (selectedLanguage === activeLanguage && isDefaultLanguage(activeLanguage))
                        ? "secondaryTextBg text-white"
                        : "btnBorder secondaryTextColor"
                        }`}
                >
                    {typeof systemDefaultLanguage === 'object' ? systemDefaultLanguage.name : systemDefaultLanguage}
                </button>

                {/* Map through all available languages except the default one */}
                {allLanguages
                    .filter(lang => {
                        // Filter out default language and undefined/null values
                        if (!lang) return false

                        if (typeof lang === 'object' && typeof systemDefaultLanguage === 'object') {
                            return lang.id !== systemDefaultLanguage.id && lang.code !== systemDefaultLanguage.code
                        }
                        return lang !== systemDefaultLanguage
                    })
                    .map(language => (
                        <button
                            key={typeof language === 'object' ? language.id || language.code : language}
                            onClick={() => setSelectedLanguage(language)}
                            className={`px-8 py-3 rounded-lg whitespace-nowrap ${isLanguageSelected(language) ||
                                (typeof selectedLanguage === 'object' &&
                                    typeof language === 'object' &&
                                    selectedLanguage.name === language.name)
                                ? "secondaryTextBg text-white"
                                : "btnBorder secondaryTextColor"
                                }`}
                        >
                            {typeof language === 'object' ? language.name : language}
                        </button>
                    ))
                }
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                {/* Selected Category - Only show for default/active language */}
                <div className='space-y-4'>
                    {(isDefaultLanguage(selectedLanguage) || selectedLanguage === activeLanguage) && selectedCategory && (
                        <>
                            <h3 className="font-medium mb-2">{t("selectedCategory")}</h3>
                            <div className={`flex items-center gap-2 ${(!isEditing && !disableCategoryChange) ? "cursor-pointer" : ""}`} onClick={(!isEditing && !disableCategoryChange && handleRemoveCategory) ? handleRemoveCategory : undefined}>
                                <div className="primaryColor">
                                    <Image
                                        height={0}
                                        width={0}
                                        src={selectedCategory && selectedCategory?.image}
                                        className={"w-10 h-10 bg-white rounded-full"}
                                        alt={selectedCategory && selectedCategory?.category}
                                    />
                                </div>
                                <span>
                                    {selectedCategory && selectedCategory?.category}
                                </span>
                            </div>
                        </>)}
                    {/* Project Type - Only show for default language */}
                    {(isDefaultLanguage(selectedLanguage) || selectedLanguage === activeLanguage) && (
                        <div className=''>
                            <h3 className="font-medium mb-2 text-gray-800">
                                {t("projectType")} <span className="text-red-500">*</span>
                            </h3>
                            <div className="flex flex-col md:flex-row gap-4">
                                <ProjectTypeRadio
                                    value="upcoming"
                                    name="projectType"
                                    checked={projectFormData.projectType === "upcoming"}
                                    onChange={(e) => handleUpdateProjectForm(e)}
                                    label={t("upcoming")}
                                />

                                <ProjectTypeRadio
                                    value="under_construction"
                                    name="projectType"
                                    checked={projectFormData.projectType === "under_construction"}
                                    onChange={(e) => handleUpdateProjectForm(e)}
                                    label={t("underConstruction")}
                                />
                            </div>
                        </div>
                    )}

                    {/* Title */}
                    <div className="flex flex-col md:flex-row gap-3">
                        <div className='w-full'>
                            <Label htmlFor="project-title" className="font-medium mb-2 block text-gray-800">
                                {t("projectTitle")} {isRequiredLanguage(selectedLanguage) && <span className="text-red-500">*</span>}
                            </Label>
                            <Input
                                type="text"
                                id="project-title"
                                value={isDefaultLanguage(selectedLanguage) || selectedLanguage === activeLanguage
                                    ? projectFormData.projectTitle
                                    : getTranslationValue(selectedLanguage, "title")}
                                name="title"
                                onChange={(e) => handleFieldChange(e, "title")}
                                placeholder={t("enterProjectTitle")}
                                className="w-full px-3 py-2 primaryBackgroundBg rounded-md focus:outline-none focus:border-none focus:border-transparent"
                            />
                        </div>
                        {/* Slug - Only show for default language */}
                        {(isDefaultLanguage(selectedLanguage) || selectedLanguage === activeLanguage) && (
                            <div className='w-full'>
                                <Label htmlFor="project-slug" className="font-medium mb-2 block text-gray-800">
                                    {t("projectSlug")}
                                </Label>
                                <Input
                                    type="text"
                                    id="project-slug"
                                    value={projectFormData.projectSlug}
                                    name="projectSlug"
                                    onChange={(e) => handleUpdateProjectForm(e)}
                                    placeholder={t("enterProjectSlug")}
                                    className="w-full px-3 py-2 primaryBackgroundBg rounded-md focus:outline-none focus:border-none focus:border-transparent"
                                />
                            </div>
                        )}
                    </div>
                    {/* Is Premium Project */}
                    {(isDefaultLanguage(selectedLanguage) || selectedLanguage === activeLanguage) && (
                        webSettings?.show_premium_toggle === "1" ? (
                            <div className="flex flex-col w-full lg:flex-1">
                                <p className="text-sm font-medium mb-2 text-gray-800">
                                    {t("isPremiumProject")}
                                </p>
                                <div className="flex items-center">
                                    <Switch
                                        checked={projectFormData.isPremiumProject}
                                        name="isPremiumProject"
                                        onCheckedChange={(checked) => handleUpdateProjectForm(null, "isPremiumProject", checked)}
                                        className={`${projectFormData.isPremiumProject ? "!primaryBg" : ""}  sm:[&>span]:h-3 sm:[&>span]:w-3 ${isRtl ? "sm:[&>span]:data-[state=checked]:-translate-x-4" : "sm:[&>span]:data-[state=checked]:translate-x-4"}`}
                                    />
                                </div>
                            </div>
                        ) : null
                    )}
                </div>
                {/* Project Description */}
                <div>
                    {webSettings?.gemini_ai_enabled === true ? (
                        <div className='flex justify-between items-center mb-2'>
                            <Label htmlFor="project-description" className="font-medium mb-2 block text-gray-800">
                                {t("projectDescription")} {isRequiredLanguage(selectedLanguage) && <span className="text-red-500">*</span>}
                            </Label>

                            <button
                                disabled={isDescriptionGenerating}
                                onClick={handleGenerateAIDescription}
                                className='flex justify-between items-center gap-2 p-1 md:p-2 border primaryBorderColor rounded-md primaryBgLight08 font-medium text-sm primaryColor '
                            >
                                <RiSparkling2Fill className='primaryColor w-5 h-5' /> <span className=''>{isDescriptionGenerating ? t("generating") : t("generateWithAI")}</span>
                            </button>
                        </div>
                    ) : (
                        <Label htmlFor="project-description" className="font-medium mb-2 block text-gray-800">
                            {t("projectDescription")} {isRequiredLanguage(selectedLanguage) && <span className="text-red-500">*</span>}
                        </Label>
                    )}
                    {isDescriptionGenerating ?
                        (
                            <Skeleton className={"h-[250px] flex px-3 py-2 w-full primaryBackgroundBg rounded-md"} >
                                {t("generating")}
                            </Skeleton>
                        ) :
                        (
                            <Textarea
                                id="project-description"
                                value={isDefaultLanguage(selectedLanguage) || selectedLanguage === activeLanguage
                                    ? projectFormData.projectDescription
                                    : getTranslationValue(selectedLanguage, "description")}
                                name="description"
                                onChange={(e) => handleFieldChange(e, "description")}
                                placeholder={t("enterProjectDescription")}
                                className="w-full h-[250px] px-3 py-2 rounded-md focus:outline-none focus:border-none primaryBackgroundBg focus:border-transparent"
                            />
                        )}
                </div>
            </div>

            {/* Next Button */}
            <div className="flex justify-end">
                <Button
                    onClick={() => handleCheckRequiredFields("projectDetails", "imagesVideo")}
                    className="px-10 py-5"
                >
                    {isEditing ? t("save") : t("next")}
                </Button>
            </div>
        </>
    )
}

export default ProjectDetailsTab 