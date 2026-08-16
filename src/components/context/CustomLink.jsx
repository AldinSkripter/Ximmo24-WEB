"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";

/**
 * CustomLink Component
 *
 * A wrapper around Next.js Link component that preserves the current locale
 * in navigation. This ensures that all internal links maintain the currently
 * selected language.
 */
export default function CustomLink({
  href,
  passLocale = true,
  children,
  ...props
}) {
  const router = useRouter();
  const { lang } = router?.query;

  // Get language settings from Redux
  const activeLanguage = useSelector((state) => state.LanguageSettings?.active_language);
  const defaultLanguage = useSelector((state) => state.LanguageSettings?.default_language);

  // Helper to extract language code if it is an object
  const getLanguageCode = (val) => {
    if (!val) return "";
    if (typeof val === "object") return val.code || "";
    return val;
  };

  const activeLangCode = getLanguageCode(lang) || getLanguageCode(activeLanguage) || getLanguageCode(defaultLanguage) || "en";

  return (
    <Link
      href={`${href || "#"}${passLocale ? `${(href && href.includes("?")) ? "&" : "?"}lang=${activeLangCode}` : ""}`}
      locale={activeLangCode}
      {...props}
    >
      {children}
    </Link>
  );
}
