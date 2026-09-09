import Script from "next/script";
import { useEffect, useRef } from "react";

export const isGoogleMapsReady = () =>
  typeof window !== "undefined" &&
  typeof window.google?.maps?.Map === "function" &&
  typeof window.google?.maps?.Size === "function";

let librariesPromise;

const loadRequiredLibraries = async () => {
  if (isGoogleMapsReady()) return true;
  if (typeof window === "undefined" || typeof window.google?.maps?.importLibrary !== "function") {
    return false;
  }

  librariesPromise ??= Promise.all([
    window.google.maps.importLibrary("maps"),
    window.google.maps.importLibrary("places"),
  ]).catch((error) => {
    librariesPromise = undefined;
    throw error;
  });

  await librariesPromise;
  return isGoogleMapsReady();
};

const GoogleMapsScript = ({ enabled = true, onReady }) => {
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    if (!enabled) return;

    let timer;
    let cancelled = false;
    const waitUntilReady = async () => {
      try {
        if (await loadRequiredLibraries()) {
          if (!cancelled) onReadyRef.current?.();
          return;
        }
      } catch (error) {
        console.error("[GoogleMapsScript] Failed to initialize Maps libraries", error);
      }
      if (!cancelled) timer = window.setTimeout(waitUntilReady, 100);
    };

    waitUntilReady();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [enabled]);

  if (!enabled || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API) return null;

  return (
    <Script
      id="google-maps-api"
      src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API}&libraries=maps,places&loading=async&v=weekly`}
      strategy="afterInteractive"
    />
  );
};

export default GoogleMapsScript;
