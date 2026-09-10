"use client";

import { useSelector } from "react-redux";
import { FaFacebookF, FaPhoneAlt, FaYoutube } from "react-icons/fa";
import { AiFillInstagram } from "react-icons/ai";
import { FaXTwitter } from "react-icons/fa6";
import { PiMapPinFill } from "react-icons/pi";
import { BiSolidEnvelope } from "react-icons/bi";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "../context/TranslationContext";
import CustomLink from "../context/CustomLink";
import ImageWithPlaceholder from "../image-with-placeholder/ImageWithPlaceholder";
import playStore from "@/assets/playStore.svg";
import AppleStore from "@/assets/Apple.svg";
import Logo from "@/assets/whitelogo.png";
import { getProjectFilters } from "@/utils/helperFunction";

const RenderIf = ({ condition, children }) => condition ? children : null;

const Footer = () => {
  const t = useTranslation();
  const webSettings = useSelector((state) => state.WebSetting?.data);
  const cacheData = useSelector((state) => state.cacheData);
  const currentYear = new Date().getFullYear();

  const propertyLinks = [
    ["/properties", t("allProperties")],
    [`/projects/featured-projects${getProjectFilters("", { flags: { promoted: 1 } })}`, t("featuredProjects")],
    ["/properties/featured-properties", t("featuredProperties")],
    ["/properties-on-map", t("propertiesOnMap")],
    ["/properties/most-viewed-properties", t("mostViewedProperties")],
    ["/properties/most-favourite-properties", t("mostFavouriteProperties")],
    ["/properties/properties-nearby-city", t("propertiesNearbyCity")],
    ["/projects", t("upcomingProjects")],
  ].map(([href, label]) => ({ href, label }));

  const quickLinks = [
    ["/", t("home")], ["/faqs", t("faqs")], ["/about-us", t("aboutUs")],
    ["/terms-and-conditions", t("termsAndConditions")],
    ["/subscription-plan", t("subscriptionPlan")],
    ["/privacy-policy", t("privacyPolicy")], ["/all/articles", t("articles")],
    ["/contact-us", t("contactUs")],
  ].map(([href, label]) => ({ href, label })).concat(
    cacheData?.customPages?.map((page) => ({ href: `/more-pages/${page?.slug_id}`, label: page?.title })) || [],
  );

  const appLinks = [
    { href: webSettings?.appstore_id, label: t("appStore"), icon: "apple" },
    { href: webSettings?.playstore_id, label: t("googlePlay"), icon: "google" },
  ].filter(({ href }) => Boolean(href));

  const companyName = webSettings?.company_name;
  const companyDescription = webSettings?.translated_company_description || webSettings?.company_description;
  const address = webSettings?.company_address;
  const email = webSettings?.company_email;
  const phoneNumbers = [webSettings?.company_tel1, webSettings?.company_tel2].filter(Boolean);

  const socialItems = [
    [webSettings?.facebook_id, "Facebook", FaFacebookF],
    [webSettings?.twitter_id, "Twitter", FaXTwitter],
    [webSettings?.instagram_id, "Instagram", AiFillInstagram],
    [webSettings?.youtube_id, "YouTube", FaYoutube],
  ].filter(([href]) => Boolean(href));

  const contactItems = [
    address && { key: "address", icon: PiMapPinFill, content: address },
    email && { key: "email", icon: BiSolidEnvelope, content: email, href: `mailto:${email}`, label: `${t("emailUs")}: ${email}` },
    ...phoneNumbers.map((number, index) => ({ key: `phone-${index}`, icon: FaPhoneAlt, content: number, href: `tel:${number}`, label: `${t("phoneNumber")}: ${number}`, ltr: true })),
  ].filter(Boolean);

  const FooterLinks = ({ links }) => (
+    <ul className="grid gap-1.5">
      {links.map((link) => (
+        <li key={`${link.href}-${link.label}`}>
          <CustomLink href={link.href} className="group flex min-h-10 items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-medium text-white/65 transition hover:bg-white/[.06] hover:text-white" aria-label={link.label}>
            <span className="min-w-0 truncate">{link.label}</span>
            <span className="primaryColor text-base opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" aria-hidden="true">↗</span>
          </CustomLink>
        </li>
      ))}
    </ul>
  );

  return (
    <footer className="relative overflow-hidden bg-[#06101d] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,color-mix(in_srgb,var(--primary-color)_18%,transparent),transparent_30%),radial-gradient(circle_at_92%_90%,color-mix(in_srgb,var(--primary-color)_10%,transparent),transparent_28%)]" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--primary-color),transparent)]" aria-hidden="true" />
      <div className="container relative mx-auto px-4 pb-8 pt-12 sm:pt-16 lg:pt-20">
        <div className="grid gap-10 border-b border-white/10 pb-12 lg:grid-cols-[1.05fr_1.95fr] lg:items-start lg:gap-14 lg:pb-16">
          <div>
            <CustomLink href="/" className="inline-flex max-w-[210px] items-center" aria-label={companyName || t("home")}>
              <ImageWithPlaceholder src={webSettings?.web_footer_logo || Logo} alt={companyName || "logo"} width={210} height={68} className="h-auto max-h-[68px] w-auto max-w-full object-contain" loading="lazy" />
            </CustomLink>
            <p className="mt-6 max-w-md text-sm font-medium leading-7 text-white/60 sm:text-base">{companyDescription || t("companyFooterDescription")}</p>
            <RenderIf condition={socialItems.length}>
              <div className="mt-7">
                <p className="mb-3 text-[11px] font-black uppercase tracking-[.18em] text-white/40">{t("followUs")}</p>
                <ul className="flex flex-wrap gap-2.5">
                  {socialItems.map(([href, label, Icon]) => (
                    <li key={label}><Link href={href} target="_blank" rel="noopener noreferrer" className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[.05] text-white/75 transition hover:-translate-y-1 hover:border-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-white" aria-label={`${t("followUs")} ${t("on")} ${label}`}><Icon size={18} /></Link></li>
                  ))}
                </ul>
              </div>
            </RenderIf>
          </div>

          <RenderIf condition={contactItems.length}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {contactItems.map(({ key, icon: Icon, content, href, label, ltr }) => {
                const inner = <><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[var(--primary-color)] [background-color:color-mix(in_srgb,var(--primary-color)_13%,transparent)]"><Icon size={19} /></span><span className={`min-w-0 break-words text-sm font-semibold leading-6 text-white/80 ${ltr ? "ltr-number" : ""}`}>{content}</span></>;
                const classes = "flex min-h-[76px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[.045] p-4 transition hover:-translate-y-1 hover:border-[var(--primary-color)] hover:bg-white/[.075]";
                return href ? <Link key={key} href={href} aria-label={label} className={classes}>{inner}</Link> : <div key={key} className={classes}>{inner}</div>;
              })}
            </div>
          </RenderIf>
        </div>

        <div className={`grid gap-10 py-12 sm:grid-cols-2 lg:py-16 ${appLinks.length ? "xl:grid-cols-[1fr_1fr_.9fr]" : "xl:grid-cols-2"}`}>
          <section>
            <div className="mb-5 flex items-center gap-3"><span className="h-2 w-2 rounded-full primaryBg" /><h2 className="text-lg font-bold tracking-tight">{t("propertyListing")}</h2></div>
            <FooterLinks links={propertyLinks} />
          </section>
          <section>
            <div className="mb-5 flex items-center gap-3"><span className="h-2 w-2 rounded-full primaryBg" /><h2 className="text-lg font-bold tracking-tight">{t("quickLinks")}</h2></div>
            <FooterLinks links={quickLinks} />
          </section>
          <RenderIf condition={appLinks.length}>
            <section className="sm:col-span-2 xl:col-span-1">
              <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[.055] p-6 sm:p-7">
                <div className="absolute -right-14 -top-14 h-36 w-36 rounded-full [background-color:color-mix(in_srgb,var(--primary-color)_12%,transparent)]" aria-hidden="true" />
                <div className="relative">
                  <p className="primaryColor text-[11px] font-black uppercase tracking-[.18em]">Ximmo24 Mobile</p>
                  <h2 className="mt-3 text-xl font-bold">{t("downloadOurApp")}</h2>
                  <p className="mt-3 text-sm leading-6 text-white/55">{t("downloadApp1")} {companyName} {t("downloadApp2")}</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    {appLinks.map((app) => (
                      <Link key={app.href} href={app.href} target="_blank" rel="noopener noreferrer" className="flex min-h-[62px] items-center gap-3 rounded-2xl border border-white/10 bg-white px-4 py-2.5 text-[#07111f] shadow-lg transition hover:-translate-y-1 hover:border-[var(--primary-color)]" aria-label={`${t("downloadOn")} ${app.label}`}>
                        <span className="relative h-9 w-9 shrink-0"><Image src={app.icon === "google" ? playStore : AppleStore} alt="" fill className="object-contain" sizes="36px" /></span>
                        <span className="flex min-w-0 flex-col text-left"><span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{t("downloadOn")}</span><span className="truncate text-base font-black">{app.label}</span></span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </RenderIf>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 pt-7 text-center text-xs font-medium text-white/45 sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p>{t("copyright")} &copy; {currentYear} {companyName}. {t("allRightsReserved")}</p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 sm:justify-end">
            <CustomLink href="/privacy-policy" className="transition hover:text-white">{t("privacyPolicy")}</CustomLink>
            <CustomLink href="/terms-and-conditions" className="transition hover:text-white">{t("termsAndConditions")}</CustomLink>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
