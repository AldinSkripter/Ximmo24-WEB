import { useEffect, useState } from 'react';
import { Polygon } from '@react-google-maps/api';
import {
  loadBwLatLngRings,
  WORLD_RING_LATLNG,
  BW_BORDER_COLOR,
  BW_MASK_COLOR,
  BW_MASK_OPACITY,
} from '@/utils/bwRegion';

/**
 * Premium Baden-Württemberg focus overlay for Google Maps.
 * - Dark semi-transparent mask covering everything outside BW (world ring with
 *   BW rings punched out as holes).
 * - Clear colored BW border outline.
 * Rendered as a child of <GoogleMap>.
 */
const BwGoogleOverlay = () => {
  const [rings, setRings] = useState([]);

  useEffect(() => {
    let mounted = true;
    loadBwLatLngRings().then((r) => {
      if (mounted) setRings(r);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!rings.length) return null;

  return (
    <>
      {/* Dark mask: world ring (outer) + BW rings as holes */}
      <Polygon
        paths={[WORLD_RING_LATLNG, ...rings]}
        options={{
          fillColor: BW_MASK_COLOR,
          fillOpacity: BW_MASK_OPACITY,
          strokeWeight: 0,
          clickable: false,
          zIndex: 1,
        }}
      />
      {/* BW border outline */}
      {rings.map((ring, i) => (
        <Polygon
          key={i}
          paths={ring}
          options={{
            fillOpacity: 0,
            strokeColor: BW_BORDER_COLOR,
            strokeOpacity: 1,
            strokeWeight: 3,
            clickable: false,
            zIndex: 2,
          }}
        />
      ))}
    </>
  );
};

export default BwGoogleOverlay;
