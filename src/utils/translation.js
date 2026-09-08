"use client";
import enTranslation from "./en.json";
import deTranslation from "./de.json";
export const getTranslationByLocale = (locale) => {
  switch (locale) {
    case "de":
      return { ...enTranslation, ...deTranslation };
    case "en":
      return enTranslation;
    default:
      return enTranslation;
  }
};
