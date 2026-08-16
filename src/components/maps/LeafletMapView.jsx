"use client";

import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import BwLeafletOverlay from "./BwLeafletOverlay";

const DEFAULT_ZOOM = 14;

const ChangeView = ({ center, zoom = DEFAULT_ZOOM }) => {
  const map = useMap();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!Number.isFinite(center?.lat) || !Number.isFinite(center?.lng)) return;

    if (!initializedRef.current) {
      // First render — set both center AND zoom
      map.setView(center, zoom);
      initializedRef.current = true;
    } else {
      // Subsequent center changes (e.g. location update) — only pan,
      // never touch zoom so user-initiated zooming is preserved.
      map.panTo(center);
    }
  }, [center, map, zoom]);

  return null;
};

const MapEvents = ({ onClick }) => {
  useMapEvents({
    click: (event) => {
      // Don't fire the map-level onClick when a marker was clicked.
      // Marker clicks stop DOM propagation but Leaflet still fires a map
      // click — guard against it by checking the original target element.
      const target = event.originalEvent?.target;
      if (target && (
        target.closest?.(".leaflet-interactive") ||
        target.classList?.contains("leaflet-interactive")
      )) {
        return;
      }
      onClick?.({
        latLng: {
          lat: () => event.latlng.lat,
          lng: () => event.latlng.lng,
        },
      });
    },
  });

  return null;
};

// Inline SVG divIcon used as the default marker.
// This avoids the classic Next.js/webpack "createIcon" crash where
// L.Icon.Default.prototype._getIconUrl gets stripped and Leaflet cannot
// resolve the bundled marker PNG paths at runtime.
const createDefaultIcon = ({ color = "#087c7c" }) =>
  L.divIcon({
    className: "",
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40" style="overflow: visible; filter:drop-shadow(0 2px 3px rgba(0,0,0,0.4))">
      <path fill="${color}" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle fill="#ffffff" cx="12" cy="9" r="2.8"/>
    </svg>`,
    iconSize: [40, 40],
    iconAnchor: [20, 37],
    popupAnchor: [0, -37],
  });

const LeafletMapView = ({
  center,
  zoom = DEFAULT_ZOOM,
  containerStyle,
  markerIcon,
  markerDraggable = true,
  showMarker = true,
  radiusKm = 1,
  circleColor = "#0f766e",
  onMarkerDragEnd,
  onClick,
  children,
  className = "",
  bwOverlay = false,
  fitToBw = false,
  restrictToBw = false,
}) => {
  const webSettings = useSelector(state => state.WebSetting?.data);
  const icon = useMemo(() => {
    if (typeof L === 'undefined') return undefined;

    if (markerIcon?.url) {
      return L.icon({
        iconUrl: markerIcon.url,
        iconSize: [markerIcon.width || 33, markerIcon.height || 48],
        iconAnchor: [(markerIcon.width || 33) / 2, markerIcon.height || 48],
        popupAnchor: [0, -(markerIcon.height || 48)],
      });
    }
    return createDefaultIcon({ color: webSettings?.system_color });
  }, [markerIcon]);

  const safeCenter = useMemo(() => ({
    lat: Number(center?.lat) || 23.253,
    lng: Number(center?.lng) || 69.6699,
  }), [center?.lat, center?.lng]);

  return (
    <MapContainer
      center={safeCenter}
      zoom={zoom}
      scrollWheelZoom
      style={containerStyle}
      className={className}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ChangeView center={safeCenter} zoom={zoom} />
      <MapEvents onClick={onClick} />
      {bwOverlay ? (
        <BwLeafletOverlay fitToBw={fitToBw} restrictToBw={restrictToBw} />
      ) : null}
      {radiusKm ? (
        <Circle
          center={safeCenter}
          radius={Number(radiusKm) * 1000}
          pathOptions={{
            color: circleColor,
            fillColor: circleColor,
            fillOpacity: 0.2,
            weight: 2,
          }}
        />
      ) : null}
      {showMarker ? (
        <Marker
          position={safeCenter}
          icon={icon}
          draggable={markerDraggable}
          eventHandlers={{
            dragend: (event) => {
              const next = event.target.getLatLng();
              onMarkerDragEnd?.({
                latLng: {
                  lat: () => next.lat,
                  lng: () => next.lng,
                },
              });
            },
          }}
        />
      ) : null}
      {children}
    </MapContainer>
  );
};

export default LeafletMapView;
