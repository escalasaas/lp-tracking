// The attribution spine: one stable, first-party id per browser that travels
// from the first pageview to the lead, and from there to the CRM. Without it a
// won deal cannot be traced back to the landing-page variant that produced it.
//
// Not a tracking identifier for third parties: it is random, first-party only,
// and never leaves our own stack.

const VISITOR_ID_KEY = "escalasaas-visitor-id";

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  // Safari < 15.4 and non-secure contexts.
  return `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Returns this browser's visitor id, creating and persisting one on first call.
 * Falls back to a per-session id when storage is blocked (private browsing), so
 * the caller always gets a usable value.
 */
export function getVisitorId(): string {
  try {
    const stored = localStorage.getItem(VISITOR_ID_KEY);
    if (stored) {
      return stored;
    }

    const created = randomId();
    localStorage.setItem(VISITOR_ID_KEY, created);
    return created;
  } catch {
    return memoryFallbackId();
  }
}

let memoryId = "";

function memoryFallbackId(): string {
  if (!memoryId) {
    memoryId = randomId();
  }
  return memoryId;
}
