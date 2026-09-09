import { getTranslationByLocale } from "@/utils/translation";
import React, { createContext, useContext } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";

const TranslationContext = createContext();

export const useTranslation = () => {
  return useContext(TranslationContext);
};

export const TranslationProvider = ({ children }) => {
  const router = useRouter();
  const backendLanguage = useSelector(
    (state) => state.LanguageSettings?.current_language
  );
  const translations = backendLanguage?.file_name;
  
  // Use active_language as the current locale (user selected or default)
  const activeLocale = useSelector(
    (state) => state.LanguageSettings?.active_language
  );
  
  // Fallback to default_language if active_language is not set
  const defaultLocale = useSelector(
    (state) => state.LanguageSettings?.default_language
  );
  
  const routeLanguage = Array.isArray(router.query?.lang)
    ? router.query.lang[0]
    : router.query?.lang;
  const currentLocale = ["de", "en"].includes(routeLanguage)
    ? routeLanguage
    : (activeLocale || defaultLocale || "de");
  const remoteLanguageMatches =
    backendLanguage?.code === currentLocale || activeLocale === currentLocale;
  
  const t = (label) => {
    // Admin-managed translations remain authoritative once the matching
    // language response arrives. Until then, use the bundled DE/EN copy.
    if (remoteLanguageMatches && translations && translations[label]) {
      return translations[label];
    } 
    
    // Fallback to local translations if Redux translations are missing
    const localTranslations = getTranslationByLocale(currentLocale);
    if (localTranslations && localTranslations[label]) {
      return localTranslations[label];
    }
    
    // Return the label itself as last resort
    return label;
  };
  
  return (
    <TranslationContext.Provider value={t}>
      {children}
    </TranslationContext.Provider>
  );
};
