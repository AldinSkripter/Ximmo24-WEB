import Script from "next/script";
import { useEffect } from "react";

export const isGoogleMapsReady = () =>
  typeof window !== "undefined" &&
  typeof window.google?.maps?.Map === "function" &&
  typeof window.google?.maps?.Size === "function";

const GoogleMapsScript = ({ enabled = true, onReady }) => {
  useEffect(() => {
    if (!enabled) return;

    let timer;
    const waitUntilReady = () => {
      if (isGoogleMapsReady()) {
        onReady?.();
        return;
      }
      timer = window.setTimeout(waitUntilReady, 50);
    };

    waitUntilReady();
    return () => window.clearTimeout(timer);
  }, [enabled, onReady]);

  if (!enabled || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API) return null;

  return (
    <Script
      id="google-maps-api"
      src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API}&libraries=places&loading=async`}
      strategy="afterInteractive"
    />
  );
};

export default GoogleMapsScript;
