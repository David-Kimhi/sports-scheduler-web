export type SearchLogPayload = {
    ts?: string;
    query: string;
    filters?: Array<{ type: string; id: string; label?: string }>;
    filtersByType?: Record<string, string[]>;
    stage: "submit" | "typeahead";
    clientLoc?: {
      city?: string;
      country?: string;
      countryCode?: string;
      region?: string;
      postcode?: string | number;
      geo?: { type: "Point"; coordinates: [number, number] }; // [lng, lat]
    };
    numOfRecords: number;
    elapsedMS: number;
    sessionId?: string;
    userId?: string;
  };
  
  export async function logSearchEvent(apiBase: string, payload: SearchLogPayload) {
    const url = `${apiBase}/analytics/searchEvent`;
    const body = JSON.stringify({ ...payload, ts: payload.ts ?? new Date().toISOString() });
  
    // Prefer sendBeacon (won’t block UI/navigation)
    if ("sendBeacon" in navigator) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(url, blob);
      return;
    }
  
    // Fallback: non-blocking fetch
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true, // helps on page unload
    }).catch(() => {});
  }
  