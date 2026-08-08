const UTM_KEYS = [
  "utm_medium",
  "utm_source",
  "utm_id",
  "utm_content",
  "utm_term",
  "utm_campaign",
] as const;

export type UtmParams = Record<(typeof UTM_KEYS)[number], string>;

const STORAGE_KEY = "escalasaas-utm";
const AD_ID_STORAGE_KEY = "escalasaas-ad-id";

function emptyUtmParams(): UtmParams {
  return {
    utm_medium: "",
    utm_source: "",
    utm_id: "",
    utm_content: "",
    utm_term: "",
    utm_campaign: "",
  };
}

function readFromSearchParams(params: URLSearchParams): UtmParams {
  return {
    utm_medium: params.get("utm_medium") ?? "",
    utm_source: params.get("utm_source") ?? "",
    utm_id: params.get("utm_id") ?? "",
    utm_content: params.get("utm_content") ?? "",
    utm_term: params.get("utm_term") ?? "",
    utm_campaign: params.get("utm_campaign") ?? "",
  };
}

function readStored(): UtmParams {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...emptyUtmParams(), ...JSON.parse(stored) };
    }
  } catch {
    // ignore invalid session storage
  }
  return emptyUtmParams();
}

/**
 * Merge URL UTMs into the session store without wiping a known value with "".
 * First non-empty touch wins per key for the life of the tab session unless a
 * later URL brings a new non-empty value for that key (last non-empty wins).
 */
export function getUtmParams(): UtmParams {
  const fromUrl = readFromSearchParams(
    new URLSearchParams(window.location.search),
  );
  const stored = readStored();
  const merged = emptyUtmParams();
  let changed = false;

  for (const key of UTM_KEYS) {
    if (fromUrl[key]) {
      merged[key] = fromUrl[key];
      if (fromUrl[key] !== stored[key]) {
        changed = true;
      }
    } else {
      merged[key] = stored[key];
    }
  }

  if (changed || UTM_KEYS.some((key) => merged[key].length > 0 && !stored[key])) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // storage blocked — still return the merged view for this call
    }
  }

  return merged;
}

/**
 * Explicit campaign ad id from the URL (`ad_id=…`). Never inferred from
 * utm_content. Persists for the tab; blank URL does not clear a stored value.
 */
export function getAdId(): string {
  let fromUrl = "";
  try {
    fromUrl = new URLSearchParams(window.location.search).get("ad_id")?.trim() ?? "";
  } catch {
    fromUrl = "";
  }

  if (fromUrl) {
    try {
      sessionStorage.setItem(AD_ID_STORAGE_KEY, fromUrl);
    } catch {
      // ignore
    }
    return fromUrl;
  }

  try {
    return sessionStorage.getItem(AD_ID_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}
