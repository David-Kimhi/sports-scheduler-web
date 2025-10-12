// Browser-side TypeScript utilities to get location + reverse geocode to city/country/etc.

export type GeoPoint = { lat: number; lng: number };
type Cached = { ts: number; profile: any };
const KEY = "loc_profile_v1";
const MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 hours cache

export interface LocationProfile {
  point: GeoPoint;                          // { lat, lng }
  city?: string;                            // e.g., "Tel Aviv-Yafo"
  country?: string;                         // e.g., "Israel"
  countryCode?: string;                     // ISO-2, e.g., "IL"
  region?: string;                          // principal subdivision, e.g., "Tel Aviv District"
  postcode?: string | number;               // e.g., "61000"
  formatted?: string;                       // e.g., "Tel Aviv-Yafo, Tel Aviv District, Israel"
  raw: any;                                 // full reverse-geocode payload
}

export interface GeoJSONPoint {
  type: "Point";
  coordinates: [number, number];            // [lng, lat]
}

const GEO_TIMEOUT_MS = 8000;

/** Get precise coordinates from the browser (promisified). */
export function getBrowserCoords(): Promise<GeoPoint> {
  if (!("geolocation" in navigator)) {
    return Promise.reject(new Error("Geolocation not supported"));
  }
  return new Promise<GeoPoint>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        resolve({ lat: latitude, lng: longitude });
      },
      (err) => {
        reject(new Error(`Geolocation failed: ${err.message}`));
      },
      { enableHighAccuracy: true, timeout: GEO_TIMEOUT_MS, maximumAge: 60_000 }
    );
  });
}

/**
 * Reverse-geocode using BigDataCloud's client-facing endpoint (no key).
 * Docs: https://www.bigdatacloud.com/geocoding-apis/free-reverse-geocode-to-city-api
 */
export async function reverseGeocode(
  point: GeoPoint,
  lang: string = "en"
): Promise<LocationProfile> {
  const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
  url.searchParams.set("latitude", String(point.lat));
  url.searchParams.set("longitude", String(point.lng));
  url.searchParams.set("localityLanguage", lang);

  const res = await fetch(url.toString(), { method: "GET" });
  if (!res.ok) throw new Error(`Reverse geocode HTTP ${res.status}`);
  const data = await res.json();

  // Common fields returned by BDC:
  // city, locality, principalSubdivision, countryName, countryCode, postcode
  const city = data.city || data.locality || data.localityInfo?.locality?.name;
  const region = data.principalSubdivision || data.localityInfo?.administrative?.[0]?.name;
  const country = data.countryName;
  const countryCode = data.countryCode;
  const postcode = data.postcode;

  const parts = [city, region, country].filter(Boolean);
  const formatted = parts.join(", ");

  return {
    point,
    city,
    region,
    country,
    countryCode,
    postcode,
    formatted,
    raw: data
  };
}

/** Convenience: end-to-end helper that returns full location profile. */
export async function getLocationProfile(lang: string = "en"): Promise<LocationProfile> {
  const point = await getBrowserCoords();
  return reverseGeocode(point, lang);
}

/** Convert to Mongo-friendly GeoJSON Point. */
export function toGeoJSONPoint(p: GeoPoint): GeoJSONPoint {
  return { type: "Point", coordinates: [p.lng, p.lat] };
}

/** Example: normalize to your SearchEvent fields */
export async function buildSearchEventLocation(lang: string = "en") {
  const profile = await getLocationProfileCached(lang);
  return {
    loc: toGeoJSONPoint(profile.point), // { type: 'Point', coordinates: [lng, lat] }
    city: profile.city,
    country: profile.country,
    countryCode: profile.countryCode,
    region: profile.region,
    postcode: profile.postcode
  };
}


async function permissionState(): Promise<PermissionState | "unsupported"> {
  if (!("permissions" in navigator) || !("geolocation" in navigator)) return "unsupported";
  try {
    const res = await (navigator as any).permissions.query({ name: "geolocation" as PermissionName });
    return res.state; // "granted" | "prompt" | "denied"
  } catch { return "unsupported"; }
}

export async function getLocationProfileCached(lang = "en") {
  // 1) Use cached if fresh
  const cachedRaw = sessionStorage.getItem(KEY);
  if (cachedRaw) {
    const cached: Cached = JSON.parse(cachedRaw);
    if (Date.now() - cached.ts < MAX_AGE_MS) return cached.profile;
  }

  // 2) Check permission
  const state = await permissionState();

  // If denied, don't prompt again — caller should fall back to IP on the server.
  if (state === "denied") throw new Error("geolocation denied");

  // If granted (or permissions API unsupported), proceed to read without extra prompt.
  // If "prompt", the browser may show a prompt — but this code only runs on an explicit user action (Search click).
  const coords = await getBrowserCoords();               // may prompt once
  const profile = await reverseGeocode(coords, lang);

  // 3) Cache
  sessionStorage.setItem(KEY, JSON.stringify({ ts: Date.now(), profile }));
  return profile;
}



