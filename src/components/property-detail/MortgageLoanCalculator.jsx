import Script from "next/script";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";

const HYPOFRIEND_SCRIPT_URL = "https://hypofriend.de/widgets/js/app.js";

const getNumericPrice = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0
    ? Math.round(numericValue)
    : 400000;
};

const getGermanPostcode = (propertyDetails) => {
  const candidates = [
    propertyDetails?.zip_code,
    propertyDetails?.postcode,
    propertyDetails?.postal_code,
    propertyDetails?.address,
  ];

  for (const candidate of candidates) {
    const match = String(candidate ?? "").match(/\b\d{5}\b/);
    if (match) {
      return match[0];
    }
  }

  return undefined;
};

const MortgageLoanCalculator = ({ propertyDetails }) => {
  const router = useRouter();
  const [widgetReady, setWidgetReady] = useState(false);
  const [widgetFailed, setWidgetFailed] = useState(false);

  const locale = router.query?.lang === "en" ? "en" : "de";
  const propertyPrice = getNumericPrice(propertyDetails?.price);
  const postcode = getGermanPostcode(propertyDetails);
  const propertyReference =
    propertyDetails?.id || propertyDetails?.slug_id || router.query?.slug || "detail";
  const trackingId = `ximmo24-property-${propertyReference}`;
  const isTesting = process.env.NEXT_PUBLIC_HYPOFRIEND_TESTING !== "false";

  const widgetKey = useMemo(
    () => [locale, propertyPrice, postcode, trackingId, isTesting].join("-"),
    [locale, propertyPrice, postcode, trackingId, isTesting],
  );

  const copy =
    locale === "en"
      ? {
          title: "Check financing",
          description:
            "Calculate financing options for this property with our partner Hypofriend.",
          loading: "Loading financing calculator…",
          error: "The financing calculator is currently unavailable.",
          link: "Open Hypofriend",
          test: "Test mode – no enquiry will be submitted.",
        }
      : {
          title: "Finanzierung prüfen",
          description:
            "Berechnen Sie Finanzierungsmöglichkeiten für diese Immobilie mit unserem Partner Hypofriend.",
          loading: "Finanzierungsrechner wird geladen…",
          error: "Der Finanzierungsrechner ist derzeit nicht verfügbar.",
          link: "Hypofriend öffnen",
          test: "Testmodus – es wird keine Anfrage übermittelt.",
        };

  return (
    <div className="cardBg newBorder overflow-hidden rounded-2xl border">
      <Script
        id="hypofriend-calculator-script"
        src={HYPOFRIEND_SCRIPT_URL}
        strategy="afterInteractive"
        onLoad={() => {
          setWidgetReady(true);
          setWidgetFailed(false);
        }}
        onReady={() => {
          setWidgetReady(true);
          setWidgetFailed(false);
        }}
        onError={() => {
          setWidgetReady(false);
          setWidgetFailed(true);
        }}
      />

      <div className="border-b p-5">
        <h2 className="blackTextColor text-base font-bold md:text-lg">
          {copy.title}
        </h2>
        <p className="textColor mt-1 text-sm leading-5">{copy.description}</p>
      </div>

      <div className="min-w-0 p-3 sm:p-5">
        {!widgetReady && !widgetFailed && (
          <div
            className="textColor flex min-h-48 items-center justify-center text-sm"
            role="status"
          >
            {copy.loading}
          </div>
        )}

        {widgetFailed && (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
            <p className="textColor text-sm">{copy.error}</p>
            <a
              href="https://hypofriend.de/de"
              target="_blank"
              rel="noopener noreferrer"
              className="brandBg primaryTextColor rounded-lg px-5 py-3 text-sm font-medium"
            >
              {copy.link}
            </a>
          </div>
        )}

        {widgetReady && (
          <div className="mx-auto w-full max-w-full overflow-hidden">
            <hypofriend-calculator
              key={widgetKey}
              locale={locale}
              financial-type="purchase"
              property-price={String(propertyPrice)}
              postcode={postcode}
              commission="0.00"
              tracking-id={trackingId}
              {...(isTesting ? { testing: "" } : {})}
            ></hypofriend-calculator>
          </div>
        )}

        {isTesting && (
          <p className="textColor mt-3 text-center text-xs">{copy.test}</p>
        )}
      </div>
    </div>
  );
};

export default MortgageLoanCalculator;
