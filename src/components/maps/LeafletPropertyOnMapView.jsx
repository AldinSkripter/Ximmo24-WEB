"use client";

import { Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import LeafletMapView from "./LeafletMapView";
import MapPropertyCard from "../cards/MapPropertyCard";

const InteractionLock = ({ isInteractive }) => {
  const map = useMapEvents({});

  useEffect(() => {
    if (!map) return;

    const actions = [
      map.dragging,
      map.touchZoom,
      map.doubleClickZoom,
      map.scrollWheelZoom,
      map.boxZoom,
      map.keyboard,
    ];

    actions.forEach((action) => {
      if (!action) return;
      isInteractive ? action.enable() : action.disable();
    });
  }, [isInteractive, map]);

  return null;
};

/**
 * Build the property marker icon.
 * Uses an inline SVG divIcon so it works reliably with Next.js/webpack
 * (avoids the L.icon / _getIconUrl crash caused by asset path stripping).
 * The design matches the reference: dark teardrop pin with a house silhouette.
 */
const createPropertyIcon = (color = "#181818") =>
  L.divIcon({
    className: "",
    html: `<svg width="33" height="48" viewBox="0 0 33 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35))">
      <path d="M0.397016 16.3714C0.443422 8.76289 6.18233 2.12459 13.7517 0.796928C22.3884 -0.719668 30.8756 5.06586 32.4431 13.8744C32.9123 16.5093 32.505 19.0216 31.6181 21.5033C30.128 25.6752 28.0448 29.5714 25.8276 33.3961C23.2289 37.8795 20.4084 42.2199 17.4384 46.4684C17.3508 46.591 17.2683 46.7186 17.1703 46.8361C16.7578 47.311 16.268 47.3161 15.8864 46.8208C15.5564 46.3969 15.2522 45.9476 14.948 45.5033C10.9519 39.682 7.16202 33.7433 3.99092 27.4318C2.67608 24.8071 1.47983 22.1314 0.778581 19.2718C0.54655 18.322 0.366078 17.362 0.397016 16.3816V16.3714Z" fill="${color}"/>
      <ellipse cx="16.5" cy="16.6473" rx="11.55" ry="11.4383" fill="white"/>
      <path d="M16.4793 21.7837C15.1541 21.7837 13.829 21.7837 12.5038 21.7837C11.7252 21.7837 11.4519 21.5386 11.4416 20.7625C11.4262 19.5165 11.4313 18.2705 11.4416 17.0297C11.4416 16.6722 11.421 16.4374 10.9415 16.4067C10.3846 16.371 10.1422 15.7735 10.4465 15.3088C10.529 15.1812 10.6424 15.0791 10.7507 14.9718C12.4058 13.3276 14.0662 11.6884 15.7265 10.0493C16.3349 9.45182 16.6804 9.44161 17.2733 10.0288C18.9491 11.6782 20.6146 13.3327 22.2904 14.982C22.5121 15.2016 22.708 15.4314 22.6771 15.7684C22.641 16.182 22.3987 16.4527 21.9965 16.4425C21.5582 16.4271 21.5479 16.6467 21.5479 16.9684C21.5582 18.2144 21.553 19.4603 21.5479 20.7012C21.5479 21.5335 21.2901 21.7837 20.4547 21.7837C19.1296 21.7837 17.8044 21.7837 16.4793 21.7837Z" fill="${color}"/>
    </svg>`,
    iconSize: [33, 48],
    iconAnchor: [16, 48],
    popupAnchor: [0, -50],
  });

// Selected (highlighted) variant — slightly larger with stronger shadow
const createSelectedPropertyIcon = (color = "#181818") =>
  L.divIcon({
    className: "",
    html: `<svg width="40" height="58" viewBox="0 0 33 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 3px 6px rgba(0,0,0,0.5))">
      <path d="M0.397016 16.3714C0.443422 8.76289 6.18233 2.12459 13.7517 0.796928C22.3884 -0.719668 30.8756 5.06586 32.4431 13.8744C32.9123 16.5093 32.505 19.0216 31.6181 21.5033C30.128 25.6752 28.0448 29.5714 25.8276 33.3961C23.2289 37.8795 20.4084 42.2199 17.4384 46.4684C17.3508 46.591 17.2683 46.7186 17.1703 46.8361C16.7578 47.311 16.268 47.3161 15.8864 46.8208C15.5564 46.3969 15.2522 45.9476 14.948 45.5033C10.9519 39.682 7.16202 33.7433 3.99092 27.4318C2.67608 24.8071 1.47983 22.1314 0.778581 19.2718C0.54655 18.322 0.366078 17.362 0.397016 16.3816V16.3714Z" fill="${color}"/>
      <ellipse cx="16.5" cy="16.6473" rx="11.55" ry="11.4383" fill="white"/>
      <path d="M16.4793 21.7837C15.1541 21.7837 13.829 21.7837 12.5038 21.7837C11.7252 21.7837 11.4519 21.5386 11.4416 20.7625C11.4262 19.5165 11.4313 18.2705 11.4416 17.0297C11.4416 16.6722 11.421 16.4374 10.9415 16.4067C10.3846 16.371 10.1422 15.7735 10.4465 15.3088C10.529 15.1812 10.6424 15.0791 10.7507 14.9718C12.4058 13.3276 14.0662 11.6884 15.7265 10.0493C16.3349 9.45182 16.6804 9.44161 17.2733 10.0288C18.9491 11.6782 20.6146 13.3327 22.2904 14.982C22.5121 15.2016 22.708 15.4314 22.6771 15.7684C22.641 16.182 22.3987 16.4527 21.9965 16.4425C21.5582 16.4271 21.5479 16.6467 21.5479 16.9684C21.5582 18.2144 21.553 19.4603 21.5479 20.7012C21.5479 21.5335 21.2901 21.7837 20.4547 21.7837C19.1296 21.7837 17.8044 21.7837 16.4793 21.7837Z" fill="${color}"/>
    </svg>`,
    iconSize: [40, 58],
    iconAnchor: [20, 58],
    popupAnchor: [0, -60],
  });

/**
 * Individual marker that always keeps its Popup mounted.
 *
 * KEY FIX: Previously the <Popup> was conditionally rendered only when
 * isSelected=true. On first click React mounts the Popup, but Leaflet
 * can't open it in the same render cycle — so the popup only appeared on
 * the SECOND click. Now we always mount the Popup and imperatively call
 * markerRef.openPopup() via useEffect when isSelected becomes true.
 */
const PropertyMarker = ({
  property,
  isSelected,
  icon,
  selectedIcon,
  selectedProperty,
  handleMarkerClick,
  handleInfoWindowClose,
}) => {
  const markerRef = useRef(null);

  useEffect(() => {
    if (isSelected && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [isSelected]);

  const position = {
    lat: parseFloat(property.latitude),
    lng: parseFloat(property.longitude),
  };

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={isSelected ? selectedIcon : icon}
      zIndexOffset={isSelected ? 1000 : 0}
      eventHandlers={{
        click: (e) => {
          // Stop the click from bubbling to the map container
          // (which would fire handleInfoWindowClose and close the popup immediately)
          L.DomEvent.stopPropagation(e);
          handleMarkerClick(property);
        },
      }}
      title={property.title}
    >
      {/* Always keep the Popup mounted so openPopup() works on the first click */}
      <Popup
        eventHandlers={{
          remove: handleInfoWindowClose,
        }}
        maxWidth={300}
        minWidth={280}
        closeButton={false}
        autoPan={false}
        className="leaflet-property-popup"
      >
        {isSelected && selectedProperty ? (
          <div style={{ width: 280, margin: 0, padding: 0 }}>
            <MapPropertyCard property={selectedProperty} />
          </div>
        ) : null}
      </Popup>
    </Marker>
  );
};

const LeafletPropertyOnMapView = ({
  containerStyle,
  defaultCenter,
  onLoad,
  onUnmount,
  selectedProperty,
  handleMarkerClick,
  handleInfoWindowClose,
  iconConfig,
  data,
  isInteractive,
  bwOverlay = false,
  fitToBw = false,
  restrictToBw = false,
}) => {
  const validProperties = Array.isArray(data)
    ? data.filter((property) => property.latitude && property.longitude)
    : [];

  const markerColor = iconConfig?.color || "#181818";

  const defaultIcon = useMemo(() => createPropertyIcon(markerColor), [markerColor]);
  const selectedIcon = useMemo(() => createSelectedPropertyIcon(markerColor), [markerColor]);

  useEffect(() => {
    onLoad?.(null);
    return () => onUnmount?.();
  }, [onLoad, onUnmount]);

  return (
    <LeafletMapView
      containerStyle={containerStyle}
      center={defaultCenter}
      zoom={4}
      showMarker={false}
      radiusKm={0}
      onClick={handleInfoWindowClose}
      bwOverlay={bwOverlay}
      fitToBw={fitToBw}
      restrictToBw={restrictToBw}
    >
      <InteractionLock isInteractive={isInteractive} />
      {validProperties.map((property) => (
        <PropertyMarker
          key={property.id}
          property={property}
          isSelected={selectedProperty?.id === property.id}
          icon={defaultIcon}
          selectedIcon={selectedIcon}
          selectedProperty={selectedProperty}
          handleMarkerClick={handleMarkerClick}
          handleInfoWindowClose={handleInfoWindowClose}
        />
      ))}
    </LeafletMapView>
  );
};

export default LeafletPropertyOnMapView;
