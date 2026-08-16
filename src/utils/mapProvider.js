import { store } from "@/redux/store";

export const MAP_SERVICE_PROVIDERS = {
  GOOGLE_MAPS: "google_maps",
  OPEN_STREET_MAPS: "open_street_maps",
};

export const getMapServiceProvider = (webSettings) => {
  return webSettings?.map_service_provider || MAP_SERVICE_PROVIDERS.GOOGLE_MAPS;
};

export const getActiveMapServiceProvider = () => {
  return getMapServiceProvider(store.getState()?.WebSetting?.data);
};

export const isOpenStreetMapProvider = (webSettings) => {
  return getMapServiceProvider(webSettings) === MAP_SERVICE_PROVIDERS.OPEN_STREET_MAPS;
};

export const isGoogleMapsProvider = (webSettings) => {
  return getMapServiceProvider(webSettings) === MAP_SERVICE_PROVIDERS.GOOGLE_MAPS;
};
