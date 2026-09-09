import dynamic from "next/dynamic";
import { useState } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { useTranslation } from "../context/TranslationContext";
import { handlePackageCheck } from "@/utils/helperFunction";
import { PackageTypes } from "@/utils/checkPackages/packageTypes";

const LoginModal = dynamic(() => import("../modal/LoginModal"), { ssr: false });

const ArrowIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
        <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const HomeIcon = ({ type }) => {
    const paths = {
        property: <><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10.5V20h13v-9.5M9 20v-6h6v6" /></>,
        project: <><path d="M4 20V8l8-4 8 4v12" /><path d="M8 11h2m4 0h2M8 15h2m4 0h2" /></>,
        map: <><path d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2V6Z" /><path d="M9 4v14m6-12v14" /></>,
        agent: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.8-4 3.1-6 7-6s6.2 2 7 6" /></>,
    };

    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7 fill-none stroke-current" strokeWidth="1.65">
            {paths[type]}
        </svg>
    );
};

const homepageCopy = {
    de: {
        badge: "Einfach. Direkt. Immobilien.",
        heading: "Ihr nächster Schritt beginnt hier",
        intro: "Wählen Sie, was Sie suchen. Ximmo24 bringt Sie ohne Umwege zum passenden Bereich.",
        discover: "Jetzt entdecken",
        propertyTitle: "Immobilien entdecken",
        propertyDescription: "Häuser und Wohnungen zum Kaufen oder Mieten.",
        projectTitle: "Neubauprojekte",
        projectDescription: "Moderne Projekte und attraktive Neubauangebote.",
        mapTitle: "Auf der Karte",
        mapDescription: "Immobilien direkt in Ihrer Wunschlage erkunden.",
        agentTitle: "Makler finden",
        agentDescription: "Verifizierte Immobilienprofis in Ihrer Nähe.",
        routeBuy: "Immobilien kaufen",
        routeRent: "Immobilien mieten",
        routeProjects: "Neubau entdecken",
        routeMap: "Lage auf Karte prüfen",
        advantageNaturalTitle: "Natürlich suchen",
        advantageNaturalText: "Schreiben Sie einfach Haus, Wohnung, Ort oder PLZ in die KI-Suche.",
        advantageRegionalTitle: "Regional entdecken",
        advantageRegionalText: "Konzentriert auf Baden-Württemberg und die passenden Angebote vor Ort.",
        advantageSafeTitle: "Sicher entscheiden",
        advantageSafeText: "Klare Exposés, verifizierte Anbieter und direkter Kontakt.",
        howLabel: "So funktioniert Ximmo24",
        howTitle: "Schneller zur passenden Immobilie",
        stepOneTitle: "Wunsch beschreiben",
        stepOneText: "Ort, PLZ oder Immobilientyp eingeben.",
        stepTwoTitle: "Angebote vergleichen",
        stepTwoText: "Passende Ergebnisse übersichtlich prüfen.",
        stepThreeTitle: "Direkt kontaktieren",
        stepThreeText: "Ohne Umwege mit dem Anbieter sprechen.",
        offerLabel: "Immobilie anbieten",
        offerTitle: "Ihre Immobilie sichtbar machen",
        offerText: "Als Eigentümer direkt inserieren oder Ximmo24 professionell als Agentur und Makler nutzen.",
        addProperty: "Immobilie hinzufügen",
        privateOwner: "Für private Eigentümer",
        publishAgent: "Als Agentur / Makler veröffentlichen",
        professionalProfile: "Professionelles Anbieterprofil erstellen",
        regionLabel: "Zuhause in Baden-Württemberg",
        regionTitle: "Vom ersten Wunsch bis zur passenden Adresse",
        regionText: "Starten Sie direkt mit dem Weg, der zu Ihrem Vorhaben passt. Die eigentlichen Angebote laden erst, wenn Sie sie öffnen.",
        featureAi: "KI-gestützte Suche",
        featureVerified: "Verifizierte Anbieter",
        featureContact: "Direkter Kontakt",
        featureRegion: "Für Baden-Württemberg",
    },
    en: {
        badge: "Simple. Direct. Real estate.",
        heading: "Your next step starts here",
        intro: "Choose what you are looking for. Ximmo24 takes you directly to the right place.",
        discover: "Discover now",
        propertyTitle: "Discover properties",
        propertyDescription: "Houses and apartments to buy or rent.",
        projectTitle: "New-build projects",
        projectDescription: "Modern developments and attractive new-build opportunities.",
        mapTitle: "Explore the map",
        mapDescription: "Discover properties directly in your preferred location.",
        agentTitle: "Find an agent",
        agentDescription: "Verified real estate professionals near you.",
        routeBuy: "Buy property",
        routeRent: "Rent property",
        routeProjects: "Discover new builds",
        routeMap: "Explore locations on the map",
        advantageNaturalTitle: "Search naturally",
        advantageNaturalText: "Simply enter a house, apartment, city or postcode in the AI search.",
        advantageRegionalTitle: "Discover locally",
        advantageRegionalText: "Focused on Baden-Württemberg and suitable local listings.",
        advantageSafeTitle: "Decide with confidence",
        advantageSafeText: "Clear listings, verified providers and direct contact.",
        howLabel: "How Ximmo24 works",
        howTitle: "Find the right property faster",
        stepOneTitle: "Describe your needs",
        stepOneText: "Enter a location, postcode or property type.",
        stepTwoTitle: "Compare listings",
        stepTwoText: "Review suitable results at a glance.",
        stepThreeTitle: "Contact directly",
        stepThreeText: "Speak with the provider without detours.",
        offerLabel: "List a property",
        offerTitle: "Make your property visible",
        offerText: "List directly as an owner or use Ximmo24 professionally as an agency or agent.",
        addProperty: "Add property",
        privateOwner: "For private owners",
        publishAgent: "Publish as an agency / agent",
        professionalProfile: "Create a professional provider profile",
        regionLabel: "At home in Baden-Württemberg",
        regionTitle: "From your first idea to the right address",
        regionText: "Choose the path that fits your plans. Property listings load only when you open them.",
        featureAi: "AI-powered search",
        featureVerified: "Verified providers",
        featureContact: "Direct contact",
        featureRegion: "For Baden-Württemberg",
    },
};

const getChoices = (copy) => [
    {
        title: copy.propertyTitle,
        description: copy.propertyDescription,
        href: "/properties",
        type: "property",
        accent: "from-sky-500 to-cyan-400",
    },
    {
        title: copy.projectTitle,
        description: copy.projectDescription,
        href: "/projects",
        type: "project",
        accent: "from-slate-900 to-slate-700",
    },
    {
        title: copy.mapTitle,
        description: copy.mapDescription,
        href: "/properties-on-map",
        type: "map",
        accent: "from-cyan-500 to-blue-500",
    },
    {
        title: copy.agentTitle,
        description: copy.agentDescription,
        href: "/all/agents",
        type: "agent",
        accent: "from-neutral-900 to-black",
    },
];

const getRegionalRoutes = (copy) => [
    { label: copy.routeBuy, href: "/properties" },
    { label: copy.routeRent, href: "/properties" },
    { label: copy.routeProjects, href: "/projects" },
    { label: copy.routeMap, href: "/properties-on-map" },
];

const getAdvantages = (copy) => [
    {
        number: "01",
        title: copy.advantageNaturalTitle,
        text: copy.advantageNaturalText,
    },
    {
        number: "02",
        title: copy.advantageRegionalTitle,
        text: copy.advantageRegionalText,
    },
    {
        number: "03",
        title: copy.advantageSafeTitle,
        text: copy.advantageSafeText,
    },
];

const PremiumHomepageGateway = () => {
    const router = useRouter();
    const t = useTranslation();
    const [showLogin, setShowLogin] = useState(false);
    const userData = useSelector((state) => state.User?.data);
    const activeRole = useSelector((state) => state.Auth?.role);
    const activeLanguage = useSelector((state) => state.LanguageSettings?.current_language?.code);
    const copy = homepageCopy[activeLanguage === "en" ? "en" : "de"];
    const choices = getChoices(copy);
    const regionalRoutes = getRegionalRoutes(copy);
    const advantages = getAdvantages(copy);
    const isUserRole = activeRole !== "agent";

    const handlePublishProperty = async (event) => {
        if (!userData?.id) {
            setShowLogin(true);
            return;
        }

        await handlePackageCheck(
            event,
            PackageTypes.PROPERTY_LIST,
            router,
            null,
            null,
            false,
            false,
            t,
            isUserRole,
        );
    };

    const handlePublishAsAgent = () => {
        if (!userData?.id) {
            setShowLogin(true);
            return;
        }
        router.push("/become-agent");
    };

    return (
        <>
        <section className="relative overflow-hidden border-y border-slate-200/70 bg-white py-12 sm:py-16 lg:py-20">
            <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-sky-100/70 blur-3xl" />
            <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-cyan-100/60 blur-3xl" />

            <div className="container relative mx-auto px-4">
                <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-11">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
                        <span className="h-2 w-2 rounded-full bg-sky-500" />
                        {copy.badge}
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                        {copy.heading}
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                        {copy.intro}
                    </p>
                </div>

                <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {choices.map((choice) => (
                        <button
                            key={choice.href}
                            type="button"
                            onClick={() => router.push(choice.href)}
                            className="group relative min-h-56 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 text-left shadow-[0_18px_55px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:border-sky-300 hover:shadow-[0_24px_70px_rgba(14,165,233,0.16)] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                        >
                            <span className={`mb-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${choice.accent} text-white shadow-lg`}>
                                <HomeIcon type={choice.type} />
                            </span>
                            <span className="block text-xl font-bold text-slate-950">{choice.title}</span>
                            <span className="mt-2 block text-sm leading-6 text-slate-600">{choice.description}</span>
                            <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-sky-600">
                                {copy.discover}
                                <span className="transition-transform duration-300 group-hover:translate-x-1"><ArrowIcon /></span>
                            </span>
                        </button>
                    ))}
                </div>

                <div className="mx-auto mt-14 grid max-w-6xl gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="rounded-3xl bg-slate-950 p-7 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:p-9">
                        <span className="text-sm font-bold uppercase tracking-[0.18em] text-sky-400">{copy.howLabel}</span>
                        <h3 className="mt-3 text-2xl font-bold sm:text-3xl">{copy.howTitle}</h3>
                        <div className="mt-7 grid gap-5 sm:grid-cols-3">
                            {[
                                ["01", copy.stepOneTitle, copy.stepOneText],
                                ["02", copy.stepTwoTitle, copy.stepTwoText],
                                ["03", copy.stepThreeTitle, copy.stepThreeText],
                            ].map(([number, title, text]) => (
                                <div key={number}>
                                    <span className="text-2xl font-black text-sky-400">{number}</span>
                                    <span className="mt-2 block font-bold">{title}</span>
                                    <span className="mt-1 block text-sm leading-6 text-slate-300">{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-7 shadow-[0_18px_55px_rgba(14,165,233,0.10)] sm:p-9">
                        <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-sky-200/35 blur-2xl" />
                        <div className="relative">
                            <span className="text-sm font-bold uppercase tracking-[0.18em] text-sky-600">{copy.offerLabel}</span>
                            <h3 className="mt-3 text-2xl font-bold text-slate-950">{copy.offerTitle}</h3>
                            <p className="mt-3 text-base leading-7 text-slate-600">
                                {copy.offerText}
                            </p>
                        </div>
                        <div className="relative mt-7 grid gap-3">
                            <button
                                type="button"
                                onClick={handlePublishProperty}
                                className="group inline-flex min-h-12 items-center justify-between gap-3 rounded-xl bg-slate-950 px-5 py-3 text-left font-bold text-white transition hover:bg-sky-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                            >
                                <span>
                                    <span className="block">{copy.addProperty}</span>
                                    <span className="mt-0.5 block text-xs font-medium text-slate-300 group-hover:text-sky-50">{copy.privateOwner}</span>
                                </span>
                                <ArrowIcon />
                            </button>
                            <button
                                type="button"
                                onClick={handlePublishAsAgent}
                                className="group inline-flex min-h-12 items-center justify-between gap-3 rounded-xl border border-sky-200 bg-white px-5 py-3 text-left font-bold text-slate-900 transition hover:border-sky-500 hover:text-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                            >
                                <span>
                                    <span className="block">{copy.publishAgent}</span>
                                    <span className="mt-0.5 block text-xs font-medium text-slate-500">{copy.professionalProfile}</span>
                                </span>
                                <ArrowIcon />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mx-auto mt-14 max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.09)]">
                    <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
                        <div className="relative overflow-hidden bg-gradient-to-br from-sky-600 via-sky-500 to-cyan-400 p-7 text-white sm:p-10">
                            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border-[36px] border-white/10" />
                            <span className="relative text-sm font-bold uppercase tracking-[0.18em] text-sky-100">
                                {copy.regionLabel}
                            </span>
                            <h3 className="relative mt-3 max-w-lg text-2xl font-bold leading-tight sm:text-4xl">
                                {copy.regionTitle}
                            </h3>
                            <p className="relative mt-4 max-w-xl text-base leading-7 text-sky-50">
                                {copy.regionText}
                            </p>
                            <div className="relative mt-7 grid gap-3 sm:grid-cols-2">
                                {regionalRoutes.map((item) => (
                                    <button
                                        key={item.label}
                                        type="button"
                                        onClick={() => router.push(item.href)}
                                        className="group inline-flex min-h-12 items-center justify-between rounded-xl border border-white/25 bg-white/12 px-4 py-3 text-left text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white hover:text-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                    >
                                        {item.label}
                                        <span className="transition-transform group-hover:translate-x-1"><ArrowIcon /></span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-0 bg-slate-50/70 sm:grid-cols-3">
                            {advantages.map((item) => (
                                <div key={item.number} className="border-b border-slate-200 p-6 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 lg:p-7">
                                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sm font-black text-sky-700">
                                        {item.number}
                                    </span>
                                    <h4 className="mt-5 text-lg font-bold text-slate-950">{item.title}</h4>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mx-auto mt-8 flex max-w-5xl flex-wrap items-center justify-center gap-x-7 gap-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-5 py-4 text-sm font-medium text-slate-600">
                    <span>{copy.featureAi}</span>
                    <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
                    <span>{copy.featureVerified}</span>
                    <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
                    <span>{copy.featureContact}</span>
                    <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
                    <span>{copy.featureRegion}</span>
                </div>
            </div>
        </section>
        {showLogin ? <LoginModal showLogin={showLogin} setShowLogin={setShowLogin} /> : null}
        </>
    );
};

export default PremiumHomepageGateway;
