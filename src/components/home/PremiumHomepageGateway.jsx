import { useRouter } from "next/router";

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

const choices = [
    {
        title: "Immobilien entdecken",
        description: "Häuser und Wohnungen zum Kaufen oder Mieten.",
        href: "/properties",
        type: "property",
        accent: "from-sky-500 to-cyan-400",
    },
    {
        title: "Neubauprojekte",
        description: "Moderne Projekte und attraktive Neubauangebote.",
        href: "/projects",
        type: "project",
        accent: "from-slate-900 to-slate-700",
    },
    {
        title: "Auf der Karte",
        description: "Immobilien direkt in Ihrer Wunschlage erkunden.",
        href: "/properties-on-map",
        type: "map",
        accent: "from-cyan-500 to-blue-500",
    },
    {
        title: "Makler finden",
        description: "Verifizierte Immobilienprofis in Ihrer Nähe.",
        href: "/all/agents",
        type: "agent",
        accent: "from-neutral-900 to-black",
    },
];

const PremiumHomepageGateway = () => {
    const router = useRouter();

    return (
        <section className="relative overflow-hidden border-y border-slate-200/70 bg-white py-12 sm:py-16 lg:py-20">
            <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-sky-100/70 blur-3xl" />
            <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-cyan-100/60 blur-3xl" />

            <div className="container relative mx-auto px-4">
                <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-11">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
                        <span className="h-2 w-2 rounded-full bg-sky-500" />
                        Einfach. Direkt. Immobilien.
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                        Ihr nächster Schritt beginnt hier
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                        Wählen Sie, was Sie suchen. Ximmo24 bringt Sie ohne Umwege zum passenden Bereich.
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
                                Jetzt entdecken
                                <span className="transition-transform duration-300 group-hover:translate-x-1"><ArrowIcon /></span>
                            </span>
                        </button>
                    ))}
                </div>

                <div className="mx-auto mt-14 grid max-w-6xl gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="rounded-3xl bg-slate-950 p-7 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:p-9">
                        <span className="text-sm font-bold uppercase tracking-[0.18em] text-sky-400">So funktioniert Ximmo24</span>
                        <h3 className="mt-3 text-2xl font-bold sm:text-3xl">Schneller zur passenden Immobilie</h3>
                        <div className="mt-7 grid gap-5 sm:grid-cols-3">
                            {[
                                ["01", "Wunsch beschreiben", "Ort, PLZ oder Immobilientyp eingeben."],
                                ["02", "Angebote vergleichen", "Passende Ergebnisse übersichtlich prüfen."],
                                ["03", "Direkt kontaktieren", "Ohne Umwege mit dem Anbieter sprechen."],
                            ].map(([number, title, text]) => (
                                <div key={number}>
                                    <span className="text-2xl font-black text-sky-400">{number}</span>
                                    <span className="mt-2 block font-bold">{title}</span>
                                    <span className="mt-1 block text-sm leading-6 text-slate-300">{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col justify-between rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-7 shadow-[0_18px_55px_rgba(14,165,233,0.10)] sm:p-9">
                        <div>
                            <span className="text-sm font-bold uppercase tracking-[0.18em] text-sky-600">Für Eigentümer & Makler</span>
                            <h3 className="mt-3 text-2xl font-bold text-slate-950">Ihre Immobilie sichtbar machen</h3>
                            <p className="mt-3 text-base leading-7 text-slate-600">
                                Präsentieren Sie Ihr Angebot professionell und erreichen Sie Interessenten in Ihrer Region.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.push("/become-agent")}
                            className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-sky-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                        >
                            Angebot veröffentlichen <ArrowIcon />
                        </button>
                    </div>
                </div>

                <div className="mx-auto mt-8 flex max-w-5xl flex-wrap items-center justify-center gap-x-7 gap-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-5 py-4 text-sm font-medium text-slate-600">
                    <span>KI-gestützte Suche</span>
                    <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
                    <span>Verifizierte Anbieter</span>
                    <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
                    <span>Direkter Kontakt</span>
                    <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
                    <span>Für Baden-Württemberg</span>
                </div>
            </div>
        </section>
    );
};

export default PremiumHomepageGateway;
