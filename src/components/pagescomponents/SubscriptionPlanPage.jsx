import React from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { BiBarChartAlt2, BiCheckCircle, BiShieldQuarter, BiTargetLock } from "react-icons/bi";
import { HiOutlineSparkles } from "react-icons/hi2";
import Layout from "../layout/Layout";
import SubscriptionSwiper from "../subscription-plan/SubscriptionSwiper";

const SubscriptionPlanPage = () => {
  const router = useRouter();
  const activeLanguage = useSelector((state) => state.LanguageSettings?.active_language);
  const isGerman = activeLanguage?.toLowerCase().startsWith("de") || router.query?.lang === "de";
  const copy = isGerman ? {
    eyebrow: "XIMMO24 PREMIUM",
    title: "Mehr Sichtbarkeit für Ihre Immobilien.",
    intro: "Wählen Sie den passenden Zugang, präsentieren Sie Angebote professionell und erreichen Sie Interessenten in Baden-Württemberg.",
    primary: "Pläne ansehen",
    secondary: "Vorteile entdecken",
    trust: ["Transparent aufgebaut", "Sicher bezahlen", "Sofort startklar"],
    plansEyebrow: "EINFACH WÄHLEN",
    plansTitle: "Der passende Plan für Ihren nächsten Schritt",
    plansBody: "Alle verfügbaren Pakete und Leistungen werden aktuell aus Ihrem Ximmo24-System geladen.",
    benefitsEyebrow: "IHR VORTEIL",
    benefitsTitle: "Professionell inserieren. Regional mehr erreichen.",
    benefits: [
      ["Mehr Reichweite", "Bringen Sie Ihre Angebote schneller zu passenden Interessenten in der Region."],
      ["Starker Auftritt", "Präsentieren Sie Immobilien mit einem vertrauenswürdigen, professionellen Profil."],
      ["Effizient verwalten", "Steuern Sie Inserate und Anfragen zentral und behalten Sie den Überblick."],
      ["Sicher entscheiden", "Klare Leistungen und transparente Pakete ohne unnötige Komplexität."],
    ],
    finalEyebrow: "BEREIT FÜR MEHR?",
    finalTitle: "Starten Sie jetzt mit Ximmo24.",
    finalBody: "Wählen Sie oben den Plan, der zu Ihren Zielen passt, und veröffentlichen Sie Ihr nächstes Angebot.",
    finalCta: "Zum passenden Plan",
  } : {
    eyebrow: "XIMMO24 PREMIUM",
    title: "More visibility for your properties.",
    intro: "Choose the right access, present listings professionally and reach interested buyers across Baden-Württemberg.",
    primary: "View plans",
    secondary: "Explore benefits",
    trust: ["Transparent plans", "Secure payment", "Ready right away"],
    plansEyebrow: "CHOOSE WITH CONFIDENCE",
    plansTitle: "The right plan for your next move",
    plansBody: "Every available package and feature is loaded directly from your current Ximmo24 system.",
    benefitsEyebrow: "YOUR ADVANTAGE",
    benefitsTitle: "List professionally. Reach more people locally.",
    benefits: [
      ["More reach", "Connect your listings with the right prospects across the region."],
      ["Premium presence", "Present properties through a trusted, professional profile."],
      ["Efficient management", "Manage listings and enquiries centrally while staying in control."],
      ["Clear decisions", "Transparent packages and benefits without unnecessary complexity."],
    ],
    finalEyebrow: "READY FOR MORE?",
    finalTitle: "Start with Ximmo24 today.",
    finalBody: "Choose the plan above that matches your goals and publish your next listing.",
    finalCta: "Choose your plan",
  };

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const benefitIcons = [BiTargetLock, HiOutlineSparkles, BiBarChartAlt2, BiShieldQuarter];

  return (
    <Layout>
      <main className="overflow-hidden bg-[#f7faff] text-[#07111f]">
        <section className="relative isolate px-4 pb-20 pt-16 sm:pb-24 sm:pt-20 lg:pb-28 lg:pt-24">
          <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_15%_15%,rgba(11,174,234,.16),transparent_28%),radial-gradient(circle_at_85%_25%,rgba(124,58,237,.12),transparent_30%),linear-gradient(180deg,#ffffff_0%,#f3f9ff_100%)]" />
          <div className="absolute left-[8%] top-16 -z-10 h-52 w-52 animate-pulse rounded-full border border-cyan-300/30" aria-hidden="true" />
          <div className="absolute right-[7%] top-24 -z-10 h-72 w-72 rounded-full border border-violet-300/20" aria-hidden="true" />
          <div className="container mx-auto max-w-6xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-4 py-2 text-xs font-black tracking-[.18em] text-cyan-600 shadow-sm backdrop-blur"><HiOutlineSparkles size={17} />{copy.eyebrow}</span>
            <h1 className="mx-auto mt-7 max-w-4xl text-4xl font-black leading-[1.04] tracking-[-.045em] sm:text-5xl lg:text-7xl">{copy.title}</h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">{copy.intro}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button onClick={() => scrollTo("ximmo24-plan-selection")} className="rounded-2xl bg-[#07111f] px-7 py-4 font-bold text-white shadow-[0_16px_38px_rgba(7,17,31,.22)] transition hover:-translate-y-1 hover:bg-cyan-600">{copy.primary}</button>
              <button onClick={() => scrollTo("ximmo24-plan-benefits")} className="rounded-2xl border border-slate-200 bg-white px-7 py-4 font-bold text-slate-800 shadow-sm transition hover:-translate-y-1 hover:border-cyan-300">{copy.secondary}</button>
            </div>
            <div className="mt-9 flex flex-wrap justify-center gap-x-7 gap-y-3 text-sm font-semibold text-slate-600">
              {copy.trust.map((item) => <span key={item} className="inline-flex items-center gap-2"><BiCheckCircle className="text-cyan-500" size={19} />{item}</span>)}
            </div>
          </div>
        </section>

        <section id="ximmo24-plan-selection" className="scroll-mt-24 px-4 pb-16 sm:pb-24">
          <div className="container mx-auto max-w-7xl rounded-[30px] border border-white bg-white/80 px-2 py-8 shadow-[0_30px_90px_rgba(15,36,63,.10)] backdrop-blur-xl sm:px-6 lg:px-10">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-black tracking-[.18em] text-cyan-600">{copy.plansEyebrow}</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-.035em] sm:text-4xl">{copy.plansTitle}</h2>
              <p className="mt-4 text-slate-600">{copy.plansBody}</p>
            </div>
            <SubscriptionSwiper page="subscription-plan" />
          </div>
        </section>

        <section id="ximmo24-plan-benefits" className="scroll-mt-24 bg-[#07111f] px-4 py-20 text-white sm:py-24">
          <div className="container mx-auto max-w-6xl">
            <p className="text-xs font-black tracking-[.18em] text-cyan-300">{copy.benefitsEyebrow}</p>
            <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-[-.035em] sm:text-5xl">{copy.benefitsTitle}</h2>
            <div className="mt-12 grid gap-4 md:grid-cols-2">
              {copy.benefits.map(([title, body], index) => {
                const Icon = benefitIcons[index];
                return <article key={title} className="group rounded-[26px] border border-white/10 bg-white/[.06] p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-white/[.09] sm:p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300 transition group-hover:scale-110"><Icon size={25} /></div>
                  <h3 className="mt-6 text-xl font-bold">{title}</h3><p className="mt-3 leading-7 text-white/65">{body}</p>
                </article>;
              })}
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:py-24">
          <div className="container mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-[linear-gradient(120deg,#08aeea,#4667f4_55%,#7c3aed)] p-[1px] shadow-[0_30px_80px_rgba(34,110,220,.22)]">
            <div className="rounded-[31px] bg-white px-6 py-12 text-center sm:px-12 sm:py-16">
              <p className="text-xs font-black tracking-[.18em] text-cyan-600">{copy.finalEyebrow}</p>
              <h2 className="mt-4 text-3xl font-black tracking-[-.035em] sm:text-5xl">{copy.finalTitle}</h2>
              <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">{copy.finalBody}</p>
              <button onClick={() => scrollTo("ximmo24-plan-selection")} className="mt-8 rounded-2xl bg-[#07111f] px-8 py-4 font-bold text-white transition hover:-translate-y-1 hover:bg-cyan-600">{copy.finalCta}</button>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default SubscriptionPlanPage;
