import Script from "next/script";
import { useEffect } from "react";

const GoogleMapsScript = ({ enabled = true, onReady }) => {
  useEffect(() => {
    if (enabled && window.google?.maps) onReady?.();
  }, [enabled, onReady]);

  if (!enabled || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API) return null;

  return (
    <Script
      id="google-maps-api"
      src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API}&libraries=places&loading=async`}
      strategy="afterInteractive"
      onLoad={onReady}
      onReady={onReady}
    />
  );
};

export default GoogleMapsScript;
