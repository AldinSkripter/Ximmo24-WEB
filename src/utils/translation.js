"use client";
import enTranslation from "./en.json";
export const getTranslationByLocale = (locale) => {
  switch (locale) {
    case "en":
      return enTranslation;
    default:
      return enTranslation;
  }
};
