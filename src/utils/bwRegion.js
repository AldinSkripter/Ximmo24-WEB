// Baden-Württemberg (BW) region helper — shared by maps + add-property validation.
// Point-in-polygon against /geo/baden-wuerttemberg.geojson (official BW boundary).

export const BW_BBOX = {
  minLat: 47.53610229492199,
  minLng: 7.512126922607649,
  maxLat: 49.78755950927729,
  maxLng: 10.505069732666186,
};

export const BW_CENTER = { lat: 48.66183090209964, lng: 9.008598327636918 };

// Google Maps LatLngBounds-style restriction.
export const BW_BOUNDS = {
  north: BW_BBOX.maxLat,
  south: BW_BBOX.minLat,
  east: BW_BBOX.maxLng,
  west: BW_BBOX.minLng,
};

// Leaflet-style [[south, west], [north, east]].
export const BW_MAX_BOUNDS = [
  [BW_BBOX.minLat, BW_BBOX.minLng],
  [BW_BBOX.maxLat, BW_BBOX.maxLng],
];

// Translation key for the "outside BW" message (falls back to German text).
export const BW_OUTSIDE_KEY = 'onlyAvailableInBadenWurttemberg';
export const BW_OUTSIDE_TEXT_DE = 'Wir sind derzeit nur in Baden-Württemberg verfügbar.';

// --- Premium map styling (ImmoScout24-like BW focus) -----------------------
// BW itself stays bright/untinted; everything OUTSIDE BW gets a dark-gray mask.
export const BW_BORDER_COLOR = '#0f766e';
export const BW_MASK_COLOR = '#374151'; // dark gray overlay applied OUTSIDE BW
export const BW_MASK_OPACITY = 0.6;
export const BW_MIN_ZOOM = 5; // low enough that the whole BW region fits on load

// Padding used when fitting the view to BW so the entire region + a margin is
// visible (Google = px number, Leaflet = [y, x] px).
export const BW_FIT_PADDING = 100;
export const BW_FIT_PADDING_LEAFLET = [100, 100];

// The pan restriction uses a slightly padded box (not the tight BW bbox) so the
// full BW region can be shown on load without the strict bounds forcing a
// zoom-in that would crop BW on wide screens.
const BW_PAD_DEG = 0.75;

export const BW_RESTRICTION_BOUNDS = {
  north: BW_BBOX.maxLat + BW_PAD_DEG,
  south: BW_BBOX.minLat - BW_PAD_DEG,
  east: BW_BBOX.maxLng + BW_PAD_DEG,
  west: BW_BBOX.minLng - BW_PAD_DEG,
};

export const BW_RESTRICTION_MAX_BOUNDS = [
  [BW_BBOX.minLat - BW_PAD_DEG, BW_BBOX.minLng - BW_PAD_DEG],
  [BW_BBOX.maxLat + BW_PAD_DEG, BW_BBOX.maxLng + BW_PAD_DEG],
];

// A large rectangle AROUND BW (deliberately NOT globe-spanning — Google Maps
// silently drops planet-sized rings, which previously left only BW filled).
// This comfortably covers the whole visible viewport given the BW pan
// restriction, so BW is cut out as a hole and everything else is masked.
export const WORLD_RING_LATLNG = [
  { lat: 40, lng: -2 },
  { lat: 40, lng: 20 },
  { lat: 56, lng: 20 },
  { lat: 56, lng: -2 },
];

export const WORLD_RING_LEAFLET = [
  [40, -2],
  [40, 20],
  [56, 20],
  [56, -2],
];

let _polys = null;
let _loading = null;

function extractPolys(geojson) {
  const out = [];
  const features = geojson?.features || [];
  for (const f of features) {
    const g = f.geometry || {};
    if (g.type === 'Polygon') out.push(g.coordinates);
    else if (g.type === 'MultiPolygon') for (const p of g.coordinates) out.push(p);
  }
  return out;
}

export async function loadBwPolygons() {
  if (_polys) return _polys;
  if (_loading) return _loading;
  _loading = fetch('/geo/baden-wuerttemberg.geojson')
    .then((r) => r.json())
    .then((g) => {
      _polys = extractPolys(g);
      return _polys;
    })
    .catch(() => {
      _polys = [];
      return _polys;
    });
  return _loading;
}

// Outer rings only (rings[0] of each polygon) as Google {lat,lng} arrays.
export function toLatLngRings(polys) {
  const rings = [];
  for (const poly of polys || []) {
    if (!poly || !poly.length) continue;
    rings.push(poly[0].map(([lng, lat]) => ({ lat, lng })));
  }
  return rings;
}

// Outer rings only as Leaflet [lat,lng] arrays.
export function toLeafletRings(polys) {
  const rings = [];
  for (const poly of polys || []) {
    if (!poly || !poly.length) continue;
    rings.push(poly[0].map(([lng, lat]) => [lat, lng]));
  }
  return rings;
}

export async function loadBwLatLngRings() {
  const polys = await loadBwPolygons();
  return toLatLngRings(polys);
}

export async function loadBwLeafletRings() {
  const polys = await loadBwPolygons();
  return toLeafletRings(polys);
}

export function isWithinBoundingBox(lat, lng) {
  return (
    lat >= BW_BBOX.minLat &&
    lat <= BW_BBOX.maxLat &&
    lng >= BW_BBOX.minLng &&
    lng <= BW_BBOX.maxLng
  );
}

// ring points are [lng, lat]
function pointInRing(lat, lng, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi || 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function isWithinBwPolys(lat, lng, polys) {
  if (!isWithinBoundingBox(lat, lng)) return false;
  if (!polys || polys.length === 0) return true; // fail-open if boundary missing
  for (const rings of polys) {
    if (!rings || !rings.length) continue;
    if (pointInRing(lat, lng, rings[0])) {
      let inHole = false;
      for (let i = 1; i < rings.length; i++) {
        if (pointInRing(lat, lng, rings[i])) { inHole = true; break; }
      }
      if (!inHole) return true;
    }
  }
  return false;
}

// Async precise check (loads polygon once, then cached).
export async function isWithinBW(lat, lng) {
  if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) return false;
  if (!isWithinBoundingBox(Number(lat), Number(lng))) return false;
  const polys = await loadBwPolygons();
  return isWithinBwPolys(Number(lat), Number(lng), polys);
}
