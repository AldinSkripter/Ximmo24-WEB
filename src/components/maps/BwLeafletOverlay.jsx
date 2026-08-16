"use client";

import { useEffect, useState } from 'react';
import { Polygon, useMap } from 'react-leaflet';
import {
  loadBwLeafletRings,
  WORLD_RING_LEAFLET,
  BW_BORDER_COLOR,
  BW_MASK_COLOR,
  BW_MASK_OPACITY,
  BW_MAX_BOUNDS,
  BW_RESTRICTION_MAX_BOUNDS,
  BW_MIN_ZOOM,
  BW_FIT_PADDING_LEAFLET,
} from '@/utils/bwRegion';

/**
 * Premium Baden-Württemberg focus overlay for Leaflet maps.
 * - Dark semi-transparent mask covering everything outside BW.
 * - Clear colored BW border outline.
 * - Optionally locks panning/zooming to BW and fits the view to BW on load.
 * Rendered as a child of <MapContainer>.
 */
const BwLeafletOverlay = ({ fitToBw = false, restrictToBw = true }) => {
  const map = useMap();
  const [rings, setRings] = useState([]);

  useEffect(() => {
    let mounted = true;
    loadBwLeafletRings().then((r) => {
      if (mounted) setRings(r);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!map) return;
    if (restrictToBw) {
      map.setMinZoom(BW_MIN_ZOOM);
      map.options.maxBoundsViscosity = 1.0;
      map.setMaxBounds(BW_RESTRICTION_MAX_BOUNDS);
    }
    if (fitToBw) {
      map.fitBounds(BW_MAX_BOUNDS, { padding: BW_FIT_PADDING_LEAFLET });
    }
  }, [map, fitToBw, restrictToBw]);

  if (!rings.length) return null;

  return (
    <>
      {/* Dark mask: world ring (outer) + BW rings as holes */}
      <Polygon
        positions={[WORLD_RING_LEAFLET, ...rings]}
        pathOptions={{
          color: 'transparent',
          weight: 0,
          fillColor: BW_MASK_COLOR,
          fillOpacity: BW_MASK_OPACITY,
          interactive: false,
        }}
      />
      {/* BW border outline */}
      {rings.map((ring, i) => (
        <Polygon
          key={i}
          positions={ring}
          pathOptions={{
            color: BW_BORDER_COLOR,
            weight: 3,
            fill: false,
            interactive: false,
          }}
        />
      ))}
    </>
  );
};

export default BwLeafletOverlay;
