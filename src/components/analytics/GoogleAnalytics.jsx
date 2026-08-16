import Script from "next/script";
import { GA_MEASUREMENT_ID } from "@/utils/analytics";

const GoogleAnalytics = () => {
  if (!GA_MEASUREMENT_ID) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[GoogleAnalytics] NEXT_PUBLIC_GA_MEASUREMENT_ID is not set — GA4 will not load."
      );
    }
    return null;
  }

  return (
    <>
      <Script
        id="ga4-src"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
};

export default GoogleAnalytics;
