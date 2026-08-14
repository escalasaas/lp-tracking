// Tab-scoped session id for page-event attribution. A new browser tab (empty
// sessionStorage) starts a new session; reload in the same tab keeps it.
const SESSION_ID_KEY = "escalasaas-session-id";
function randomId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
export function getSessionId() {
    try {
        const stored = sessionStorage.getItem(SESSION_ID_KEY);
        if (stored) {
            return stored;
        }
        const created = randomId();
        sessionStorage.setItem(SESSION_ID_KEY, created);
        return created;
    }
    catch {
        return memoryFallbackId();
    }
}
let memoryId = "";
function memoryFallbackId() {
    if (!memoryId) {
        memoryId = randomId();
    }
    return memoryId;
}
